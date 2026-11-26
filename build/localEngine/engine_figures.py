"""Runs tax-engine once per salary and writes the figures the site build embeds.

Usage: python -I build/localEngine/engine_figures.py <provinces.json> <output.json>

Every figure of an answer comes from tax-engine's own take-home function (`build_take_home`), the
one tax-service serves POST /take-home-calculations:compute with (tax-service #93): the engine decides
what the answer is made of and sums it, including the average and marginal rate. This script only asks
and writes the answer in the API's shape (strings everywhere, a form's name falling back to its
identifier), so the pre-built pages say what the live calculator says (when the two pin the same
tax-engine release). The Node build checks every answer against api/openapi.yml, so a change of shape
fails the build.

The hub-chart sweep takes the engine's own answer for every salary: `total_deductions`, `income_tax`,
`take_home`, and the engine's `average_tax_rate` and `marginal_tax_rate` (income tax of T1 line 43500, CPP both tiers
and EI line 16; credits paid to you when you file are not counted, so tax cuts such as the Ontario LIFT credit count and
the Canada workers benefit does not).

Two more things are written for the notes under the charts, so no figure in them is typed:

  * `edges`: where the marginal rate changes between two neighbouring sweep salaries, found by bisection on the
    engine's own marginal rate, to the cent: [the sweep salary below, the last whole salary at the old rate, the first
    whole salary at the new rate, the rate there]. A band's start is the settled salary and its end is the last
    salary at the old rate;
  * `facts`: by name, 2026 parameters read from the engine's own dataset files (the Ontario surtax thresholds and
    rates, the BC and Newfoundland and Labrador reduction starts, and so on), and the end of the Employment Insurance
    band above $2,000 as found in the engine's answers.

`provisional` is not an engine fact (it is the service's policy), so it is absent here and the Node
build adds it.
Output: for every province, `pages` (the full answer, with the trace, for each page salary) and
`sweep` (the figures only, for every hub-chart salary, with the units once in `sweep_units`). Nothing is read from the network.
"""

from __future__ import annotations

import json
import sys
from decimal import ROUND_CEILING, ROUND_FLOOR, ROUND_HALF_UP, Decimal
from contextlib import contextmanager
from functools import lru_cache
from importlib.metadata import version
from importlib.resources import files
from pathlib import Path

import yaml

from tax_engine import build_take_home
from tax_engine.application.models.take_home import TakeHomeResult, UnitDescription
from tax_engine.adapters.outbound.yaml_support import YamlNode
from tax_engine.application.models.take_home_request import TakeHomeRequest
from tax_engine.domain.jurisdiction_code import JurisdictionCode
from tax_engine.domain.parameters.rounding import RoundTo

_UNROUNDED = [False]


def _install_rate_rounding() -> None:
    """Lets a block of this script ask the engine for its two rates to seven places instead of four (`unrounded_rates`).

    The rule that rounds the take-home average and marginal rates (family `ca/take_home_average_rate_rounding`) is
    the only rounding of 0.0001 in the engine, and the engine documents it as the project's own choice, not a form's.
    Only the hub-chart sweep asks for it; the full answers of the pages stay exactly what the service gives."""
    original = RoundTo.apply

    def apply(self, amount):
        if _UNROUNDED[0] and self.increment == ENGINE_RATE_INCREMENT:
            return RoundTo(RATE, self.mode).apply(amount)
        return original(self, amount)

    RoundTo.apply = apply  # type: ignore[method-assign]


_install_rate_rounding()


@contextmanager
def unrounded_rates():
    """For the block: the engine's average and marginal rates are written to seven places."""
    _UNROUNDED[0] = True
    try:
        yield
    finally:
        _UNROUNDED[0] = False


def _rate_text(value: Decimal) -> str:
    """A rate as text without trailing zeros: 0.3435, 1, 0."""
    return format(value.quantize(RATE).normalize(), "f")

CENTS = Decimal("0.01")
ENGINE_RATE_INCREMENT = Decimal("0.0001")
# The two rates are written to seven places: the engine rounds both to 0.0001 (half up) before it answers, and a
# display of one decimal must round the exact rate once, not that rounded value (0.34347 is 34.3%, not 34.4%).
RATE = Decimal("0.0000001")

EI_FIGURE = "ei"


# Parameters of the engine's datasets the notes quote: name -> (jurisdiction package, parameter family, path
# inside the dataset file). A path part that is a number indexes a list.
FACTS = {
    "CA-ON": {
        "surtax_first": ("ca_on", "surtax_line_66", "tiers.0.threshold"),
        "surtax_first_rate": ("ca_on", "surtax_line_66", "tiers.0.rate"),
        "surtax_second": ("ca_on", "surtax_line_67", "tiers.0.threshold"),
        "surtax_second_rate": ("ca_on", "surtax_line_67", "tiers.0.rate"),
        "lift_threshold": ("ca_on", "lift_individual_income_threshold", "amount"),
    },
    "CA-BC": {
        "reduction_start": ("ca_bc", "tax_reduction_base_amount", "amount"),
        "reduction_rate": ("ca_bc", "tax_reduction_rate", "rate"),
    },
    "CA-MB": {
        "benefit_rate": ("ca_mb", "family_tax_benefit_rate", "rate"),
    },
    "CA-NL": {
        "reduction_start": ("ca_nl", "low_income_threshold", "amount"),
        "reduction_rate": ("ca_nl", "low_income_reduction_rate", "rate"),
    },
}
# The same for every province: the Employment Insurance premium rate and its maximum insurable earnings.
COMMON_FACTS = {
    "ei_rate": ("ca", "ei_premium", "rate"),
    "ei_stop": ("ca", "ei_maximum_insurable_earnings", "amount"),
    "federal_second_rate": ("ca", "brackets", "brackets.1.rate"),
}
# The edges of the marginal rate are found by bisection to the whole dollar.


def _fact(year: int, package: str, family: str, path: str) -> str:
    text = (
        files(f"tax_engine.jurisdictions.{package}")
        .joinpath("parameters", family, f"{year}.yaml")
        .read_text(encoding="utf-8")
    )
    node = yaml.safe_load(text)
    for part in path.split("."):
        node = node[int(part)] if part.isdigit() else node[part]
    return str(node)


def _params(year: int, package: str, family: str) -> dict:
    text = (
        files(f"tax_engine.jurisdictions.{package}")
        .joinpath("parameters", family, f"{year}.yaml")
        .read_text(encoding="utf-8")
    )
    return yaml.safe_load(text)


def _pension_deduction(year: int) -> dict[str, Decimal]:
    """The enhanced Canada Pension Plan deducted from salary before it is taxable income (T4127: 1% of earnings
    above the basic exemption up to the earnings limit, plus the second tier): taxable income is `factor` x
    salary + `constant` up to the earnings limit, and salary less `cut` from the second tier's limit up."""
    exemption = Decimal(_params(year, "ca", "cpp_basic_exemption")["amounts"]["12"])
    limit = Decimal(_params(year, "ca", "cpp_maximum_pensionable_earnings")["amounts"]["12"])
    second_limit = Decimal(_params(year, "ca", "cpp_additional_maximum_pensionable_earnings")["amounts"]["12"])
    enhanced = Decimal(_params(year, "ca", "cpp_line_12_first_additional_contribution")["rate"])
    first_max = Decimal(_params(year, "ca", "cpp_line_12_first_additional_contribution")["maximum"])
    second_max = Decimal(_params(year, "ca", "cpp_line_22_second_additional_contribution")["maximum"])
    second_rate = Decimal(_params(year, "ca", "cpp_line_22_second_additional_contribution")["rate"])
    return {
        "exemption": exemption,
        "limit": limit,
        "second_limit": second_limit,
        "factor": 1 - enhanced,
        "constant": enhanced * exemption,
        "cut": first_max + second_max,
        "factor_2": 1 - second_rate,
        "constant_2": second_rate * limit - first_max,
    }


def _exact_salary_of_taxable(year: int, taxable: Decimal) -> Decimal:
    """The salary at which taxable income (which is also net income) reaches `taxable`, exactly (it may have cents).

    Taxable income is the salary less the pension deduction, which has three regimes: a share of the pay above the
    exemption up to the limit, then the first tier's maximum plus a share of the pay up to the second limit, then
    the two maximums together."""
    d = _pension_deduction(year)
    first = max(Decimal(0), (taxable - d["constant"]) / d["factor"])
    if first <= d["limit"]:
        return first
    second = (taxable - d["constant_2"]) / d["factor_2"]
    if second <= d["second_limit"]:
        return second
    return taxable + d["cut"]


def _salary_of_taxable(year: int, taxable: Decimal) -> Decimal:
    """The first whole salary at or above the one where taxable income reaches `taxable`: where a band that starts at
    that threshold starts in salary ("from")."""
    return _exact_salary_of_taxable(year, taxable).to_integral_value(rounding=ROUND_CEILING)


def _salary_to_taxable(year: int, taxable: Decimal) -> Decimal:
    """The last whole salary before the band that starts at `taxable` ("from" is the first whole salary at or above the
    exact one, as the engine's edges read it, so "up to" is the whole salary before it)."""
    return _salary_of_taxable(year, taxable) - 1


def _bracket_facts(year: int, prefix: str, brackets: list[dict]) -> dict[str, str]:
    """For each bracket (numbered from 1): its taxable income, its rate, and the first whole salary at that taxable income."""
    facts: dict[str, str] = {}
    for number, bracket in enumerate(brackets, start=1):
        taxable = Decimal(bracket["from"])
        facts[f"{prefix}_bracket_{number}_ti"] = str(taxable)
        facts[f"{prefix}_bracket_{number}_rate"] = bracket["rate"]
        facts[f"{prefix}_bracket_{number}_salary"] = str(_salary_of_taxable(year, taxable))
    return facts


def _common_rates_page_facts(year: int) -> dict[str, str]:
    """The figures every province's rates page quotes besides the sweep: the pension deduction, the federal brackets
    and basic amount, and the Canada Pension Plan and Employment Insurance limits. Every one is read from the engine's
    own 2026 dataset files; the salary of a taxable-income threshold is worked out from the pension deduction (see
    `_pension_deduction`)."""
    d = _pension_deduction(year)
    facts: dict[str, str] = {
        "cpp_start": str(d["exemption"]),
        "cpp_ympe": str(d["limit"]),
        "yampe": str(d["second_limit"]),
        "taxable_factor": str(d["factor"]),
        "taxable_constant": str(d["constant"]),
        "taxable_cut": str(d["cut"]),
        "taxable_factor_2": str(d["factor_2"]),
        "taxable_constant_2": str(d["constant_2"]),
        **_bracket_facts(year, "fed", _params(year, "ca", "brackets")["brackets"]),
    }
    bpa = _params(year, "ca", "basic_personal_amount")
    facts["fed_bpa_min"] = bpa["base"]
    facts["fed_bpa"] = str(Decimal(bpa["base"]) + Decimal(bpa["supplement"]))
    facts["fed_bpa_taper_start"] = bpa["threshold"]
    facts["fed_bpa_taper_end"] = str(Decimal(bpa["threshold"]) + Decimal(bpa["range"]))
    facts["cea"] = _params(year, "ca", "canada_employment_amount")["amount"]
    facts["fed_lowest_rate"] = facts["fed_bracket_1_rate"]
    # The first bracket's rate in the year before (a mid-year cut made it a blend that year).
    facts["fed_lowest_rate_prior"] = _params(year - 1, "ca", "brackets")["brackets"][0]["rate"]
    # What the shrinking basic personal amount adds to the marginal rate, in percentage points, to one decimal.
    facts["fed_bpa_taper_points"] = str(
        (
            Decimal(bpa["supplement"]) / Decimal(bpa["range"]) * Decimal(facts["fed_bracket_1_rate"]) * 100
        ).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
    )
    facts["ei_exemption"] = _params(year, "ca", "t2204_exemption")["amount"]
    facts["ei_max_premium"] = _params(year, "ca", "ei_premium")["maximum"]
    base = _params(year, "ca", "cpp_line_11_base_contribution")
    enhanced = _params(year, "ca", "cpp_line_12_first_additional_contribution")
    second = _params(year, "ca", "cpp_line_22_second_additional_contribution")
    facts["cpp_base_rate"] = base["rate"]
    facts["cpp_enhanced_rate"] = enhanced["rate"]
    facts["cpp_rate"] = str(Decimal(base["rate"]) + Decimal(enhanced["rate"]))
    facts["cpp_max"] = str(Decimal(base["maximum"]) + Decimal(enhanced["maximum"]))
    facts["cpp2_rate"] = second["rate"]
    facts["cpp2_max"] = second["maximum"]
    return facts


def _shift(facts: dict[str, str], bracket: str) -> str:
    """How much higher the salary is than the taxable income at a bracket's threshold (what a form's figure is off by)."""
    return str(Decimal(facts[f"{bracket}_salary"]) - Decimal(facts[f"{bracket}_ti"]))


def _ontario_rates_page_facts(year: int, facts: dict[str, str]) -> dict[str, str]:
    """Ontario's own figures: its brackets, basic amount, LIFT Credit, surtax and health premium."""
    ontario = _bracket_facts(year, "ont", _params(year, "ca_on", "brackets")["brackets"])
    ontario["ont_bpa"] = _params(year, "ca_on", "basic_personal_amount")["amount"]
    ontario["lift_max"] = _params(year, "ca_on", "lift_maximum")["amount"]
    ontario["lift_end_ani"] = str(
        Decimal(_params(year, "ca_on", "lift_individual_income_threshold")["amount"])
        + Decimal(ontario["lift_max"]) / Decimal(_params(year, "ca_on", "lift_single_rate")["rate"])
    )
    ontario["surtax_total_rate"] = str(
        Decimal(_params(year, "ca_on", "surtax_line_66")["tiers"][0]["rate"])
        + Decimal(_params(year, "ca_on", "surtax_line_67")["tiers"][0]["rate"])
    )
    for number, row in enumerate(_params(year, "ca_on", "health_premium_rows")["rows"], start=1):
        over = Decimal(row["over"])
        ontario[f"ohp_{number}_ti"] = str(over)
        ontario[f"ohp_{number}_salary"] = str(_salary_of_taxable(year, over))
        ontario[f"ohp_{number}_salary_to"] = str(_salary_to_taxable(year, over))
        ontario[f"ohp_{number}_salary_end"] = str(
            _exact_salary_of_taxable(year, over).to_integral_value(rounding=ROUND_FLOOR)
        )
        if "amount" in row:
            ontario[f"ohp_{number}_amount"] = row["amount"]
        else:
            ontario[f"ohp_{number}_rate"] = row["rate"]
            ontario[f"ohp_{number}_plus"] = row["plus"]
    ontario["shift_ohp_1"] = str(Decimal(ontario["ohp_2_salary"]) - Decimal(ontario["ohp_2_ti"]))
    ontario["shift_ont_bracket_2"] = _shift(ontario, "ont_bracket_2")
    return ontario


def _alberta_rates_page_facts(year: int, facts: dict[str, str]) -> dict[str, str]:
    """Alberta's own figures: its six brackets (the form keeps them in two files, lines 2 to 8 and lines 9 to 15),
    its basic amount and the rate of its credits."""
    brackets = [
        *_params(year, "ca_ab", "brackets_lines_2_to_8")["brackets"],
        *_params(year, "ca_ab", "brackets_lines_9_to_15")["brackets"],
    ]
    alberta = _bracket_facts(year, "ab", brackets)
    alberta["ab_bpa"] = _params(year, "ca_ab", "basic_personal_amount")["amount"]
    alberta["ab_credit_rate"] = _params(year, "ca_ab", "credit_rate")["rate"]
    alberta["shift_fed_bracket_2"] = _shift(facts, "fed_bracket_2")
    alberta["shift_ab_bracket_2"] = _shift(alberta, "ab_bracket_2")
    return alberta


def _newfoundland_rates_page_facts(year: int, facts: dict[str, str]) -> dict[str, str]:
    """Newfoundland and Labrador's own figures: its eight brackets (two dataset files), basic amount and credit rate,
    and the low-income tax reduction. A single filer takes the basic amount (NL428 line 95) and loses the rate (line
    102) of the income above the threshold (line 100); the reduction is gone where the income reaches the threshold
    plus the basic amount over the rate."""
    brackets = [
        *_params(year, "ca_nl", "brackets_lines_2_to_8")["brackets"],
        *_params(year, "ca_nl", "brackets_lines_9_to_15")["brackets"],
    ]
    newfoundland = _bracket_facts(year, "nl", brackets)
    newfoundland["nl_bpa"] = _params(year, "ca_nl", "basic_personal_amount")["amount"]
    newfoundland["nl_credit_rate"] = _params(year, "ca_nl", "credit_rate")["rate"]
    maximum = _params(year, "ca_nl", "low_income_reduction_basic")["amount"]
    threshold = _params(year, "ca_nl", "low_income_threshold")["amount"]
    rate = _params(year, "ca_nl", "low_income_reduction_rate")["rate"]
    newfoundland["reduction_max"] = maximum
    newfoundland["reduction_start_salary"] = str(_salary_of_taxable(year, Decimal(threshold)))
    newfoundland["reduction_end_ni"] = str(Decimal(threshold) + Decimal(maximum) / Decimal(rate))
    newfoundland["shift_reduction"] = str(Decimal(newfoundland["reduction_start_salary"]) - Decimal(threshold))
    newfoundland["shift_nl_bracket_2"] = _shift(newfoundland, "nl_bracket_2")
    return newfoundland


# The province-only part of the rates page's figures, by province code; a province with no entry has no rates page.
RATES_PAGE_FACTS = {
    "CA-ON": _ontario_rates_page_facts,
    "CA-AB": _alberta_rates_page_facts,
    "CA-NL": _newfoundland_rates_page_facts,
}


def _rates_page_facts(year: int, code: str) -> dict[str, str]:
    """The figures the rates page quotes besides the sweep: the common ones, and the province's own."""
    province = RATES_PAGE_FACTS.get(code)
    if province is None:
        return {}
    common = _common_rates_page_facts(year)
    return {**common, **province(year, common)}


@contextmanager
def prior_year_parameters(year: int, package: str, families: list[str]):
    """For the block: the engine reads the listed parameter families of `package` for `year` with the amount of the
    year before. Used where a form's amounts for the year are not printed and were raised by an index rate (the
    Newfoundland and Labrador low-income tax reduction): the page says where its edges would be if they were not
    raised, and that is the engine's own answer with the earlier amounts. Build the engine inside the block."""
    original = YamlNode.load.__func__  # type: ignore[attr-defined]

    def load(cls, path: Path, label: str) -> YamlNode:
        node = original(cls, path, label)
        if path.name == f"{year}.yaml" and path.parent.name in families and package in path.parts:
            prior = original(cls, path.with_name(f"{year - 1}.yaml"), label)
            value = dict(node.value)  # type: ignore[call-overload]
            value["amount"] = prior.value["amount"]  # type: ignore[index]
            return cls.root(value, label)
        return node

    YamlNode.load = classmethod(load)  # type: ignore[method-assign,assignment]
    try:
        yield
    finally:
        YamlNode.load = classmethod(original)  # type: ignore[method-assign,assignment]


def _newfoundland_engine_facts(figures: "Figures", year: int, facts: dict[str, str]) -> dict[str, str]:
    """What only the engine can say for Newfoundland and Labrador: the marginal rate just after each of the last two
    brackets, which start past the sweep's last salary, and the two edges of the reduction band if the 2026
    reduction amounts were the 2025 form's (not raised by the index rate)."""
    found: dict[str, str] = {}
    for number in (7, 8):
        above = int(facts[f"nl_bracket_{number}_salary"]) + 1000
        found[f"nl_bracket_{number}_marginal"] = _rate_text(figures._marginal("CA-NL", year, above))
    with prior_year_parameters(
        year, "ca_nl", ["low_income_reduction_basic", "low_income_threshold"]
    ):
        earlier = Figures()
        salaries = list(range(20000, 35001, 1000))
        edges = earlier.edges(
            "CA-NL", year, salaries, [earlier._marginal("CA-NL", year, salary) for salary in salaries]
        )
    if len(edges) != 2:
        raise ValueError(f"CA-NL {year}: expected two edges of the reduction band, found {edges}")
    found["alt_reduction_tax_shows"] = edges[0][2]
    found["alt_reduction_end"] = edges[1][2]
    return found


# The facts of a rates page only the engine can give, by province: (figures, year, the dataset facts) -> facts.
RATES_PAGE_ENGINE_FACTS = {"CA-NL": _newfoundland_engine_facts}


def _unit(unit: UnitDescription) -> dict:
    return {
        "name": unit.name,
        "placement": unit.placement,
        "singular": unit.singular,
        "plural": unit.plural,
        "spaced": unit.spaced,
        "as_percentage": unit.as_percentage,
    }


def _present(text):
    return text or None


def _salaries(province: dict) -> list[int]:
    return list(range(province["from"], province["to"] + 1, province["step"]))


def _sweep_salaries(sweep: dict, province: dict) -> list[int]:
    """The regular salaries, the extra ones every province gets, and the province's own `extra` (the edges of its own
    rates, so its lines show each step at its true place; only that province's block carries them)."""
    fine = range(sweep["first"], sweep["fineTo"] + 1, sweep["fineStep"])
    coarse = range(sweep["fineTo"] + sweep["coarseStep"], sweep["to"] + 1, sweep["coarseStep"])
    return sorted({*fine, *coarse, *sweep["extra"], *province.get("extra", [])})


class Figures:
    def __init__(self) -> None:
        self._engine = build_take_home()

    def _ask(self, code: str, year: int, salary: int, *, trace: bool) -> TakeHomeResult:
        return self._engine.compute(
            TakeHomeRequest(
                JurisdictionCode(code),
                year,
                Decimal(salary),
                include_rates=True,
                include_trace=trace,
            )
        )

    @lru_cache(maxsize=None)
    def _result(self, code: str, year: int, salary: int) -> TakeHomeResult:
        """The engine's answer without trace, cached: the edge search asks the same salaries again."""
        return self._ask(code, year, salary, trace=False)

    def _figure(self, result: TakeHomeResult, name: str) -> Decimal:
        (amount,) = (figure.amount for figure in result.figures if figure.name == name)
        return amount

    def basis_total(self, code: str, year: int, salary: int) -> Decimal:
        """What the engine takes off the salary: income tax, CPP (all three parts) and EI line 16."""
        return self._result(code, year, salary).total_deductions

    def ei_band(self, code: str, year: int) -> dict[str, str]:
        """The Employment Insurance band just above $2,000, whole dollars: where each extra dollar of salary still
        adds a whole dollar of EI (T2204 line 16 is the salary over $2,000 there), and the EI at that last dollar."""
        ei = {salary: self._ei(code, year, salary) for salary in range(2000, 2101)}
        last = max(
            salary for salary in range(2001, 2101) if ei[salary] - ei[salary - 1] > Decimal("0.99")
        )
        top = ei[last]
        if code != "CA-QC":
            # The band runs until the salary over the exemption is the whole premium at the rate (T2204): the
            # premium p satisfies p = rate x (exemption + p), so p = rate x exemption / (1 - rate); the salary
            # is exemption + p, which falls between whole dollars, so the engine's last whole dollar is below it.
            rate = Decimal(_params(year, "ca", "ei_premium")["rate"])
            exemption = Decimal(_params(year, "ca", "t2204_exemption")["amount"])
            top = rate * exemption / (1 - rate)
        return {"ei_band_end": str(last), "ei_band_top": str(top.quantize(CENTS))}

    def _ei(self, code: str, year: int, salary: int) -> Decimal:
        return self._figure(self._result(code, year, salary), EI_FIGURE)

    def _marginal(self, code: str, year: int, salary: Decimal | int) -> Decimal:
        """The engine's own marginal rate at a salary (an exact fraction rounded as the engine rounds it)."""
        rate = self._result(code, year, Decimal(salary)).marginal_tax_rate
        if rate is None:
            raise ValueError(f"{code} {year}: the engine declares no rates")
        return rate.value

    def edges(
        self, code: str, year: int, salaries: list[int], rates: list[Decimal]
    ) -> list[list[str]]:
        """Where the marginal rate changes between neighbouring sweep salaries: [the sweep salary below, the
        salary above which the new rate applies, the whole-dollar salary it has settled at its new value, the rate
        there].

        Found by bisection on the engine's own marginal rate, to the cent. At a threshold the engine still reads
        the lower rate, so the first cent with the new rate is one cent past the threshold `t`. The old rate holds
        up to `moves` = floor(t), the last whole salary below or at the threshold (74,600 for the Canada Pension Plan
        limit, 38,853 for a taxable income of 38,500), and the new rate applies above `t`, from `settled` = ceil(t)
        (74,600 again where the threshold is a whole salary; 20,167 where a taxable income of 20,000 falls). A rate
        that lasts only a dollar or so settles later, where two whole dollars agree."""
        cents = Decimal("0.01")
        found: list[list[str]] = []
        for low, high in zip(salaries, salaries[1:]):
            start = low * 100
            reference = self._marginal(code, year, low)
            target = self._marginal(code, year, high)
            while reference != target:
                # the first cent in (start, high] at which the rate is no longer the reference
                near, far = start, high * 100
                while far - near > 1:
                    middle = (near + far) // 2
                    if self._marginal(code, year, Decimal(middle) * cents) != reference:
                        far = middle
                    else:
                        near = middle
                moves = (far - 1) // 100
                ceiling = (far - 1 + 99) // 100
                settled = moves + 1
                while self._marginal(code, year, settled) != self._marginal(
                    code, year, settled + 1
                ):
                    settled += 1
                rate = _rate_text(self._marginal(code, year, settled))
                if settled == moves + 1:
                    settled = ceiling
                found.append([str(low), str(moves), str(settled), rate])
                if settled >= high:
                    break
                start = settled * 100
                reference = self._marginal(code, year, settled + 1)
        return found

    def answer(self, code: str, year: int, salary: int, with_trace: bool) -> dict:
        """The engine's take-home answer in the API's shape."""
        result = self._ask(code, year, salary, trace=with_trace)

        def rate(value) -> dict:
            if value is None:
                raise ValueError(f"{code} {year}: the engine declares no rates")
            return {"amount": str(value.value), "unit": _unit(value.unit)}

        answer = {
            "salary": str(result.salary),
            "total_deductions": str(result.total_deductions.quantize(CENTS)),
            "income_tax": str(result.income_tax.quantize(CENTS)),
            "take_home": str(result.take_home.quantize(CENTS)),
            "unit": _unit(result.unit),
            "average_income_tax_rate": rate(result.average_tax_rate),
            "marginal_income_tax_rate": rate(result.marginal_tax_rate),
        }
        if with_trace:
            answer["trace"] = [
                {
                    "form": form.form,
                    "name": _present(form.name) or form.form,
                    "lines": [
                        {
                            "label": line.label,
                            "name": _present(line.name),
                            "reference": _present(line.reference),
                            "amount": None if line.amount is None else str(line.amount),
                            "text": line.text,
                            "unit": None if line.unit is None else _unit(line.unit),
                        }
                        for line in form.lines
                    ],
                }
                for form in result.trace or ()
            ]
        return answer


def main(provinces_file: str, output_file: str) -> None:
    config = json.loads(Path(provinces_file).read_text(encoding="utf-8"))
    year = config["year"]
    figures = Figures()
    provinces = {}
    for province in config["provinces"]:
        code = province["code"]
        sweep = _sweep_salaries(config["sweep"], province)
        pages = {}
        for salary in _salaries(province):
            pages[str(salary)] = figures.answer(code, year, salary, with_trace=True)
        with unrounded_rates():
            points = []
            units = None
            for salary in sweep:
                answer = figures.answer(code, year, salary, with_trace=False)
                point_units = {
                    "unit": answer["unit"],
                    "average_income_tax_rate": answer["average_income_tax_rate"]["unit"],
                }  # the two rates share the service's rate unit
                if units is None:
                    units = point_units
                elif units != point_units:
                    raise ValueError(f"{code} {year}: units change along the sweep")
                points.append(
                    {
                        "salary": answer["salary"],
                        "total_deductions": answer["total_deductions"],
                        "income_tax": answer["income_tax"],
                        "take_home": answer["take_home"],
                        "average_rate": _rate_text(Decimal(answer["average_income_tax_rate"]["amount"])),
                        "marginal_rate": _rate_text(Decimal(answer["marginal_income_tax_rate"]["amount"])),
                    }
                )
            edges = figures.edges(
                code,
                year,
                [int(Decimal(point["salary"])) for point in points],
                [Decimal(point["marginal_rate"]) for point in points],
            )
        facts = {
            **figures.ei_band(code, year),
            **{
                name: _fact(year, *place)
                for name, place in {**COMMON_FACTS, **FACTS.get(code, {})}.items()
            },
            **_rates_page_facts(year, code),
        }
        engine_facts = RATES_PAGE_ENGINE_FACTS.get(code)
        if engine_facts:
            with unrounded_rates():
                facts.update(engine_facts(figures, year, facts))
        provinces[code] = {
            "year": year,
            "pages": pages,
            "sweep": points,
            "sweep_units": units,
            "edges": edges,
            "facts": facts,
        }
    Path(output_file).write_text(
        json.dumps({"engine": version("tax-engine"), "provinces": provinces}),
        encoding="utf-8",
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
