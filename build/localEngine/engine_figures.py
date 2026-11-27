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


# A premium slope row narrower than this much salary is a short spike.
_OHP_SPIKE_MAX_WIDTH = Decimal(1000)


def _exact_salary_of_taxable(year: int, taxable: Decimal, d: dict[str, Decimal] | None = None) -> Decimal:
    """The salary at which taxable income (which is also net income) reaches `taxable`, exactly (it may have cents).

    Taxable income is the salary less the pension deduction, which has three regimes: a share of the pay above the
    exemption up to the limit, then the first tier's maximum plus a share of the pay up to the second limit, then
    the two maximums together."""
    d = d or _pension_deduction(year)
    first = max(Decimal(0), (taxable - d["constant"]) / d["factor"])
    if first <= d["limit"]:
        return first
    second = (taxable - d["constant_2"]) / d["factor_2"]
    if second <= d["second_limit"]:
        return second
    return taxable + d["cut"]


def _salary_of_taxable(year: int, taxable: Decimal, d: dict[str, Decimal] | None = None) -> Decimal:
    """The first whole salary at or above the one where taxable income reaches `taxable`: where a band that starts at
    that threshold starts in salary ("from")."""
    return _exact_salary_of_taxable(year, taxable, d).to_integral_value(rounding=ROUND_CEILING)


def _salary_to_taxable(year: int, taxable: Decimal) -> Decimal:
    """The last whole salary before the band that starts at `taxable` ("from" is the first whole salary at or above the
    exact one, as the engine's edges read it, so "up to" is the whole salary before it)."""
    return _salary_of_taxable(year, taxable) - 1


def _bracket_facts(
    year: int, prefix: str, brackets: list[dict], salary_of=None
) -> dict[str, str]:
    """For each bracket (numbered from 1): its taxable income, its rate, and the salary at that taxable income: the first
    whole salary at or above it, or the whole salary `salary_of` gives."""
    salary_of = salary_of or _salary_of_taxable
    facts: dict[str, str] = {}
    for number, bracket in enumerate(brackets, start=1):
        taxable = Decimal(bracket["from"])
        facts[f"{prefix}_bracket_{number}_ti"] = str(taxable)
        facts[f"{prefix}_bracket_{number}_rate"] = bracket["rate"]
        facts[f"{prefix}_bracket_{number}_salary"] = str(salary_of(year, taxable))
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


def _ontario_rates_page_facts(year: int) -> dict[str, str]:
    """Ontario's figures: the common ones and its own: its brackets, basic amount, LIFT Credit, surtax and health premium."""
    facts = _common_rates_page_facts(year)
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
    # The premium's slope rows: one that rises over less than $1,000 of salary is a short spike, the rest are broader
    # steps. The page's lead writes their counts in words.
    rows = _params(year, "ca_on", "health_premium_rows")["rows"]
    spikes = steps = 0
    for at, row in enumerate(rows[:-1]):
        if "amount" in row:
            continue
        width = _exact_salary_of_taxable(year, Decimal(rows[at + 1]["over"])) - _exact_salary_of_taxable(
            year, Decimal(row["over"])
        )
        if width < _OHP_SPIKE_MAX_WIDTH:
            spikes += 1
        else:
            steps += 1
    ontario["ohp_spike_count"] = str(spikes)
    ontario["ohp_step_count"] = str(steps)
    ontario["shift_ohp_1"] = str(Decimal(ontario["ohp_2_salary"]) - Decimal(ontario["ohp_2_ti"]))
    ontario["shift_ont_bracket_2"] = _shift(ontario, "ont_bracket_2")
    return {**facts, **ontario}


def _alberta_rates_page_facts(year: int) -> dict[str, str]:
    """Alberta's figures: the common ones and its own: its six brackets (the form keeps them in two files, lines 2 to 8 and lines 9 to 15),
    its basic amount and the rate of its credits."""
    facts = _common_rates_page_facts(year)
    brackets = [
        *_params(year, "ca_ab", "brackets_lines_2_to_8")["brackets"],
        *_params(year, "ca_ab", "brackets_lines_9_to_15")["brackets"],
    ]
    alberta = _bracket_facts(year, "ab", brackets)
    alberta["ab_bpa"] = _params(year, "ca_ab", "basic_personal_amount")["amount"]
    alberta["ab_credit_rate"] = _params(year, "ca_ab", "credit_rate")["rate"]
    alberta["shift_fed_bracket_2"] = _shift(facts, "fed_bracket_2")
    alberta["shift_ab_bracket_2"] = _shift(alberta, "ab_bracket_2")
    return {**facts, **alberta}


def _newfoundland_rates_page_facts(year: int) -> dict[str, str]:
    """Newfoundland and Labrador's figures: the common ones and its own: its eight brackets (two dataset files), basic
    amount and credit rate, and the low-income tax reduction. A single filer takes the basic amount (NL428 line 95) and
    loses the rate (line 102) of the income above the threshold (line 100); the reduction is gone where the income
    reaches the threshold plus the basic amount over the rate."""
    facts = _common_rates_page_facts(year)
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
    return {**facts, **newfoundland}


def _new_brunswick_rates_page_facts(year: int) -> dict[str, str]:
    """New Brunswick's figures: the common ones and its own: its four brackets, basic amount and credit rate, and the
    low-income tax reduction. A single filer takes the basic reduction (NB428 line 77) and loses the rate (line 84) of
    the income above the base amount (line 82); the form gives it only to a net income under the single limit printed
    above line 70. The reduction's two ends and the second bracket are converted from taxable income to salary exactly
    (to the cent), so a shift is the exact gap the page says "about" of."""
    facts = _common_rates_page_facts(year)
    new_brunswick = _bracket_facts(year, "nb", _params(year, "ca_nb", "brackets")["brackets"])
    new_brunswick["nb_bpa"] = _params(year, "ca_nb", "basic_personal_amount")["amount"]
    new_brunswick["nb_credit_rate"] = _params(year, "ca_nb", "credit_rate")["rate"]
    base = Decimal(_params(year, "ca_nb", "low_income_reduction_base_amount")["amount"])
    exact_start = _exact_salary_of_taxable(year, base)
    new_brunswick["reduction_max"] = _params(year, "ca_nb", "low_income_reduction_basic")["amount"]
    new_brunswick["reduction_start"] = str(base)
    new_brunswick["reduction_rate"] = _params(year, "ca_nb", "low_income_reduction_rate")["rate"]
    new_brunswick["reduction_end_ni"] = _params(year, "ca_nb", "low_income_reduction_single_income_limit")["amount"]
    new_brunswick["reduction_start_salary"] = str(exact_start.quantize(Decimal(1), rounding=ROUND_HALF_UP))
    new_brunswick["shift_reduction"] = str(exact_start - base)
    new_brunswick["shift_nb_bracket_2"] = str(
        _exact_salary_of_taxable(year, Decimal(new_brunswick["nb_bracket_2_ti"]))
        - Decimal(new_brunswick["nb_bracket_2_ti"])
    )
    return {**facts, **new_brunswick}


def _british_columbia_rates_page_facts(year: int) -> dict[str, str]:
    """British Columbia's figures: the common ones and its own: its seven brackets (the form keeps them in two files, lines 2 to 8
    and lines 9 to 15; the rates are kept to the four digits the form prints, 5.60% not 5.6%), basic amount, credit rate and tax
    reduction. The reduction is worked out on net income, which for a salary only is taxable income, so its two ends are
    converted to salary the same way as a bracket's threshold."""
    facts = _common_rates_page_facts(year)
    rate_places = Decimal("0.0001")
    brackets = [
        *_params(year, "ca_bc", "brackets_lines_2_to_8")["brackets"],
        *_params(year, "ca_bc", "brackets_lines_9_to_15")["brackets"],
    ]
    bc = _bracket_facts(year, "bc", brackets)
    for number in range(1, len(brackets) + 1):
        bc[f"bc_bracket_{number}_rate"] = str(Decimal(bc[f"bc_bracket_{number}_rate"]).quantize(rate_places))
    bc["bc_bpa"] = _params(year, "ca_bc", "basic_personal_amount")["amount"]
    bc["bc_credit_rate"] = str(Decimal(_params(year, "ca_bc", "credit_rate")["rate"]).quantize(rate_places))
    reduction_max = Decimal(_params(year, "ca_bc", "tax_reduction_basic")["amount"])
    reduction_base = Decimal(_params(year, "ca_bc", "tax_reduction_base_amount")["amount"])
    reduction_rate = Decimal(_params(year, "ca_bc", "tax_reduction_rate")["rate"])
    bc["red_max"] = str(reduction_max)
    bc["red_end"] = str((reduction_base + reduction_max / reduction_rate).quantize(Decimal("0.01")))
    bc["red_base_salary"] = str(_salary_of_taxable(year, reduction_base))
    # What the reduction takes per dollar of salary rather than of net income, in cents to one decimal, rounded once.
    bc["red_rate_salary"] = str(
        (reduction_rate * Decimal(_pension_deduction(year)["factor"])).quantize(
            Decimal("0.001"), rounding=ROUND_HALF_UP
        )
    )
    bc["shift_red_base"] = str(Decimal(bc["red_base_salary"]) - reduction_base)
    bc["shift_bc_bracket_2"] = _shift(bc, "bc_bracket_2")
    return {**facts, **bc}


def _quebec_shift(exact_salary: Decimal, taxable: Decimal | str) -> str:
    """How much higher the salary is than the income at a form's threshold, to the cent."""
    return str((exact_salary - Decimal(taxable)).quantize(CENTS))


def _qpp_deduction(year: int) -> dict[str, Decimal]:
    """Québec's version of `_pension_deduction`: the enhanced Québec Pension Plan taken off federal net income (Schedule U:
    1% of earnings from the personal exemption up to the first limit, line 15, then 4% up to the second limit, line 21).
    The maximum of the first tier is that rate on the earnings between the two (nothing prints it), and the second
    tier's maximum is the one TP-1 line 98.2 prints."""
    exemption = Decimal(_params(year, "ca_qc", "schedule_u_line_13_personal_qpp_exemption")["amount"])
    limit = Decimal(_params(year, "ca_qc", "schedule_u_line_14_1_maximum_pensionable_earnings")["amount"])
    second_limit = Decimal(_params(year, "ca_qc", "schedule_u_line_18_8_additional_maximum_pensionable_earnings")["amount"])
    enhanced = Decimal(_params(year, "ca_qc", "schedule_u_line_15_rate")["rate"])
    second_rate = Decimal(_params(year, "ca_qc", "schedule_u_line_21_rate")["rate"])
    first_max = enhanced * (limit - exemption)
    second_max = Decimal(_params(year, "ca_qc", "tp1_line_98_2_additional_qpp_contribution")["maximum"])
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


def _exact_salary_of_quebec_taxable(year: int, taxable: Decimal) -> Decimal:
    """The salary at which Québec taxable income (also the net income of Schedule K) reaches `taxable`, exactly.

    Québec taxable income is the salary less the enhanced Québec Pension Plan (as for federal taxable income) and less the
    deduction for workers (Work Chart 201: a share of the pay, up to a most). It is a line that bends where the deduction
    for workers stops growing and where each pension tier starts or stops, so it is solved between those salaries."""
    d = _qpp_deduction(year)
    rate = Decimal(_params(year, "ca_qc", "work_chart_201_rate")["rate"])
    most = Decimal(_params(year, "ca_qc", "work_chart_201_maximum")["amount"])
    stops = most / rate

    def income(salary: Decimal) -> Decimal:
        pension = (
            max(Decimal(0), min(salary, d["limit"]) - d["exemption"]) * (1 - d["factor"])
            + max(Decimal(0), min(salary, d["second_limit"]) - d["limit"]) * (1 - d["factor_2"])
        )
        return salary - min(salary * rate, most) - pension

    bends = sorted({Decimal(0), d["exemption"], stops, d["limit"], d["second_limit"]})
    for below, above in zip(bends, bends[1:]):
        if income(below) <= taxable <= income(above):
            slope = (income(above) - income(below)) / (above - below)
            return below + (taxable - income(below)) / slope
    last = bends[-1]
    return last + (taxable - income(last))


def _quebec_rates_page_facts(year: int) -> dict[str, str]:
    """The figures the Québec rates page quotes besides the sweep (see `_ontario_rates_page_facts` for Ontario's): the federal and
    Québec brackets, the basic amounts, the deduction for workers, the Québec Pension Plan, Employment Insurance and Québec
    Parental Insurance Plan limits, the drug insurance premium, and where each threshold falls in salary. Every figure is
    read from the engine's own 2026 dataset files; the salary of a taxable-income threshold is worked out from the two
    deductions (Québec taxable income also loses the deduction for workers)."""
    d = _qpp_deduction(year)
    facts: dict[str, str] = {
        "qpp_start": str(d["exemption"]),
        "qpp_ympe": str(d["limit"]),
        "yampe": str(d["second_limit"]),
        "taxable_factor": str(d["factor"]),
        "taxable_constant": str(d["constant"]),
        "taxable_cut": str(d["cut"]),
        "taxable_factor_2": str(d["factor_2"]),
        "taxable_constant_2": str(d["constant_2"]),
    }
    # Federal brackets: the printed rates, the taxable income each starts at, and the salary where it starts.
    for number, bracket in enumerate(_params(year, "ca", "brackets")["brackets"], start=1):
        taxable = Decimal(bracket["from"])
        facts[f"fed_bracket_{number}_ti"] = str(taxable)
        facts[f"fed_bracket_{number}_rate"] = bracket["rate"]
        facts[f"fed_bracket_{number}_salary"] = str(_salary_of_taxable(year, taxable, d))
    abatement = Decimal(_params(year, "ca_qc", "quebec_abatement_rate")["rate"])
    facts["abatement_rate"] = str(abatement)
    # The federal rate that is left once Québec takes its abatement off the federal tax, to one decimal of a percent.
    for number, bracket in enumerate(_params(year, "ca", "brackets")["brackets"], start=1):
        facts[f"fed_bracket_{number}_effective"] = str(
            (Decimal(bracket["rate"]) * (1 - abatement)).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)
        )
    bpa = _params(year, "ca", "basic_personal_amount")
    facts["fed_bpa_min"] = bpa["base"]
    facts["fed_bpa"] = str(Decimal(bpa["base"]) + Decimal(bpa["supplement"]))
    facts["fed_bpa_taper_start"] = bpa["threshold"]
    facts["fed_bpa_taper_end"] = str(Decimal(bpa["threshold"]) + Decimal(bpa["range"]))
    facts["cea"] = _params(year, "ca", "canada_employment_amount")["amount"]
    facts["fed_lowest_rate"] = facts["fed_bracket_1_rate"]
    facts["fed_lowest_rate_prior"] = _params(year - 1, "ca", "brackets")["brackets"][0]["rate"]
    # What the shrinking federal basic amount adds to the marginal rate after the abatement, in points, to two decimals.
    facts["fed_bpa_taper_points"] = str(
        (
            Decimal(bpa["supplement"]) / Decimal(bpa["range"]) * Decimal(facts["fed_bracket_1_rate"]) * (1 - abatement) * 100
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    )
    # Québec brackets (Work Chart 401), the basic amount and the deduction for workers (Work Chart 201).
    for number, bracket in enumerate(_params(year, "ca_qc", "brackets_work_chart_401")["brackets"], start=1):
        taxable = Decimal(bracket["from"])
        facts[f"qc_bracket_{number}_ti"] = str(taxable)
        facts[f"qc_bracket_{number}_rate"] = bracket["rate"]
        exact = _exact_salary_of_quebec_taxable(year, taxable)
        facts[f"qc_bracket_{number}_salary"] = str(exact.to_integral_value(rounding=ROUND_CEILING))
    facts["qc_bpa"] = _params(year, "ca_qc", "tp1_basic_personal_amount_line_350")["amount"]
    facts["qc_credit_rate"] = _params(year, "ca_qc", "tp1_line_377_1_rate")["rate"]
    workers_rate = Decimal(_params(year, "ca_qc", "work_chart_201_rate")["rate"])
    workers_max = Decimal(_params(year, "ca_qc", "work_chart_201_maximum")["amount"])
    facts["workers_rate"] = str(workers_rate)
    facts["workers_max"] = str(workers_max)
    facts["workers_max_salary"] = str((workers_max / workers_rate).quantize(CENTS))
    # Québec taxable income as a line in salary, in four stretches (the same bends as `_exact_salary_of_quebec_taxable`).
    enhanced = 1 - d["factor"]
    facts["qc_factor_0"] = str(1 - workers_rate - enhanced)
    facts["qc_constant_0"] = str(d["constant"])
    facts["qc_factor"] = str(d["factor"])
    facts["qc_constant"] = str(workers_max - d["constant"])
    facts["qc_factor_2"] = str(d["factor_2"])
    facts["qc_constant_2"] = str(d["constant_2"] - workers_max)
    facts["qc_cut"] = str(d["cut"] + workers_max)
    # Each threshold's shift: how much higher the salary is than the income at the form's threshold (to the whole dollar).
    facts["shift_fed_bracket_2"] = _quebec_shift(
        _exact_salary_of_taxable(year, Decimal(facts["fed_bracket_2_ti"]), d), facts["fed_bracket_2_ti"]
    )
    for number in (2, 3):
        taxable = Decimal(facts[f"qc_bracket_{number}_ti"])
        facts[f"shift_qc_bracket_{number}"] = _quebec_shift(_exact_salary_of_quebec_taxable(year, taxable), taxable)
    # Employment Insurance at Québec's own rate (T2204 line 11), the $2,000 rule, and the parental insurance premium.
    ei = _params(year, "ca_qc", "ei_premium")
    facts["ei_exemption"] = _params(year, "ca", "t2204_exemption")["amount"]
    facts["ei_max_premium"] = ei["maximum"]
    facts["ei_rate"] = f"{Decimal(ei['rate']):.4f}"
    facts["ei_stop"] = ei["upper"]
    facts["ei_full_amount"] = str(
        (Decimal(ei["rate"]) * Decimal(facts["ei_exemption"]) / (1 - Decimal(ei["rate"]))).quantize(CENTS)
    )
    qpip = _params(year, "ca_qc", "ppip_premium")
    facts["qpip_rate"] = f"{Decimal(qpip['rate']):.4f}"
    facts["qpip_stop"] = qpip["upper"]
    facts["qpip_max"] = qpip["maximum"]
    # A premium below the $2,000 rule is not payable, and from it the whole premium at the rate is due at once.
    facts["qpip_first"] = str((Decimal(qpip["rate"]) * Decimal(facts["ei_exemption"])).quantize(CENTS))
    base = _params(year, "ca_qc", "qpp_line_11_base_contribution")
    second = _params(year, "ca_qc", "tp1_line_98_2_additional_qpp_contribution")
    facts["qpp_base_rate"] = f"{Decimal(base['rate']):.4f}"
    facts["qpp_enhanced_rate"] = f"{enhanced:.4f}"
    facts["qpp_rate"] = f"{Decimal(base['rate']) + enhanced:.4f}"
    facts["qpp_max"] = _params(year, "ca_qc", "schedule_u_line_10_maximum")["amount"]
    facts["qpp2_rate"] = second["rate"]
    facts["qpp2_max"] = second["maximum"]
    # The drug insurance premium (Schedule K): the net income it starts at, where the rate steps up, where it reaches
    # its yearly most, and the salary at each. Net income here is the Québec taxable income.
    start = Decimal(_params(year, "ca_qc", "schedule_k_line_41_amount")["amount"])
    rows = _params(year, "ca_qc", "schedule_k_brackets")["brackets"]
    first_rate, second_rate_k = Decimal(rows[0]["rate"]), Decimal(rows[1]["rate"])
    step_at, step_tax = Decimal(rows[1]["from"]), Decimal(rows[1]["tax_at_start"])
    most = Decimal(_params(year, "ca_qc", "schedule_k_line_87_maximum")["amount"])
    reaches = start + step_at + (most - step_tax) / second_rate_k
    for name, income in (("start", start), ("step", start + step_at), ("max", reaches)):
        facts[f"drug_{name}_salary"] = str(
            _exact_salary_of_quebec_taxable(year, income).to_integral_value(rounding=ROUND_CEILING)
        )
        facts[f"drug_{name}_ni"] = str(income.quantize(CENTS))
    facts["shift_drug"] = _quebec_shift(_exact_salary_of_quebec_taxable(year, start), start)
    facts["drug_rate_1"] = rows[0]["rate"]
    facts["drug_rate_2"] = rows[1]["rate"]
    facts["drug_step_amount"] = rows[1]["tax_at_start"]
    facts["drug_max"] = str(most)
    # What each extra dollar of salary adds to the premium: the rate times the share of salary that is net income.
    facts["drug_cents_1"] = str((first_rate * Decimal(facts["qc_factor_0"])).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP))
    facts["drug_cents_2"] = str((second_rate_k * Decimal(facts["qc_factor"])).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP))
    return facts


def _saskatchewan_rates_page_facts(year: int) -> dict[str, str]:
    """Saskatchewan's figures: the common ones and its own: its brackets, basic amount and the rate of its credits."""
    facts = _common_rates_page_facts(year)
    saskatchewan = _bracket_facts(year, "sk", _params(year, "ca_sk", "brackets")["brackets"])
    saskatchewan["sk_bpa"] = _params(year, "ca_sk", "basic_personal_amount")["amount"]
    saskatchewan["sk_credit_rate"] = _params(year, "ca_sk", "credit_rate")["rate"]
    saskatchewan["shift_fed_bracket_2"] = _shift(facts, "fed_bracket_2")
    saskatchewan["shift_sk_bracket_2"] = _shift(saskatchewan, "sk_bracket_2")
    return {**facts, **saskatchewan}


def _nearest_salary_of_taxable(year: int, taxable: Decimal) -> Decimal:
    """The whole salary nearest the one where taxable income reaches `taxable` (half up), for the wording "from about".
    The engine's own edge lies between the whole salary below and the one above, so this is one of the two."""
    return _exact_salary_of_taxable(year, taxable).quantize(Decimal(1), rounding=ROUND_HALF_UP)


def _manitoba_rates_page_facts(year: int) -> dict[str, str]:
    """Manitoba's figures: the common ones and its own: its three brackets (each with the salary where it starts), the
    basic personal amount that shrinks above a net income of $200,000, and the Family Tax Benefit."""
    facts = _common_rates_page_facts(year)
    manitoba = _bracket_facts(
        year,
        "mb",
        _params(year, "ca_mb", "brackets_lines_2_to_8")["brackets"],
        _nearest_salary_of_taxable,
    )
    credit_rate = Decimal(_params(year, "ca_mb", "credit_rate")["rate"])
    manitoba["mb_credit_rate"] = str(credit_rate)
    bpa = Decimal(_params(year, "ca_mb", "basic_personal_amount")["amount"])
    start = Decimal(_params(year, "ca_mb", "basic_personal_amount_threshold")["amount"])
    manitoba["mb_bpa_max"] = str(bpa)
    manitoba["mb_bpa_start_ni"] = str(start)
    manitoba["mb_bpa_start_salary"] = str(_nearest_salary_of_taxable(year, start))
    # The amount reaches nothing at a net income of $400,000, which Worksheet MB428 and T4127 print; the engine holds it
    # in the worksheet's range, so the page declares that one figure (`d:`) and the salary where it falls is derived.
    end = Decimal(400000)
    manitoba["mb_bpa_end_salary"] = str(_nearest_salary_of_taxable(year, end))
    # What the shrinking amount adds to the marginal rate, in points to two decimals: the amount lost per dollar of net
    # income (the maximum over the range) at the credit rate.
    manitoba["mb_bpa_taper_points"] = str(
        (bpa / (end - start) * credit_rate * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    )
    benefit = Decimal(_params(year, "ca_mb", "family_tax_benefit_basic_amount")["amount"])
    benefit_rate = Decimal(_params(year, "ca_mb", "family_tax_benefit_rate")["rate"])
    manitoba["ftb_max"] = str(benefit)
    gone = benefit / benefit_rate
    manitoba["ftb_end_ni"] = str(gone)
    manitoba["ftb_end_salary"] = str(_nearest_salary_of_taxable(year, gone))
    manitoba["shift_ftb"] = str(
        Decimal(manitoba["ftb_end_salary"]) - gone.quantize(Decimal(1), rounding=ROUND_HALF_UP)
    )
    manitoba["shift_mb_bracket_2"] = _shift(manitoba, "mb_bracket_2")
    # Manitoba tax lost per extra dollar of net income while the benefit shrinks, as a rate to a whole cent.
    manitoba["ftb_tax_effect"] = str((credit_rate * benefit_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    return {**facts, **manitoba}


# The rates page's figures by province code: each builder makes the whole set for its province; a province with no entry has no rates page.
RATES_PAGE_FACTS = {
    "CA-ON": _ontario_rates_page_facts,
    "CA-AB": _alberta_rates_page_facts,
    "CA-SK": _saskatchewan_rates_page_facts,
    "CA-BC": _british_columbia_rates_page_facts,
    "CA-MB": _manitoba_rates_page_facts,
    "CA-NL": _newfoundland_rates_page_facts,
    "CA-NB": _new_brunswick_rates_page_facts,
    # Québec has its own pension plan, so it does not start from the common (Canada Pension Plan) figures.
    "CA-QC": _quebec_rates_page_facts,
}


def _rates_page_facts(year: int, code: str) -> dict[str, str]:
    """The figures the rates page quotes besides the sweep: what the province's builder makes, or none for a province with no page."""
    builder = RATES_PAGE_FACTS.get(code)
    return {} if builder is None else builder(year)


def _newfoundland_engine_facts(figures: "Figures", year: int, facts: dict[str, str]) -> dict[str, str]:
    """What only the engine can say for Newfoundland and Labrador: the marginal rate just after each of the last two
    brackets, which start past the sweep's last salary."""
    found: dict[str, str] = {}
    for number in (7, 8):
        above = int(facts[f"nl_bracket_{number}_salary"]) + 1000
        found[f"nl_bracket_{number}_marginal"] = _rate_text(figures._marginal("CA-NL", year, above))
    return found


def _new_brunswick_engine_facts(figures: "Figures", year: int, facts: dict[str, str]) -> dict[str, str]:
    """What only the engine can say for New Brunswick: how much of the marginal rate between the first federal stretch
    (at $20,000, before provincial tax shows) and the stretch where the provincial tax shows and the reduction shrinks
    (at $30,000) is provincial tax. The rise is that tax plus the reduction lost (its rate times the share of salary
    that is net income), so the tax part is the rise less the reduction lost, as a fraction of a dollar."""
    rise = figures._marginal("CA-NB", year, 30000) - figures._marginal("CA-NB", year, 20000)
    lost = Decimal(facts["reduction_rate"]) * Decimal(facts["taxable_factor"])
    return {"nb_tax_part": _rate_text(rise - lost)}


# Facts a rates page needs that no dataset file holds and the sweep does not reach, so they are asked of the engine:
# (figures, year, the dataset facts of `RATES_PAGE_FACTS`) -> facts. Dataset figures belong in `RATES_PAGE_FACTS`.
RATES_PAGE_ENGINE_FACTS = {
    "CA-NL": _newfoundland_engine_facts,
    "CA-NB": _new_brunswick_engine_facts,
}


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
        # The band runs until the salary over the exemption is the whole premium at the rate (T2204): the premium p
        # satisfies p = rate x (exemption + p), so p = rate x exemption / (1 - rate); the salary is exemption + p, which
        # falls between whole dollars, so the engine's last whole dollar is below it. Québec's rate is its own.
        rate = Decimal(_params(year, "ca_qc" if code == "CA-QC" else "ca", "ei_premium")["rate"])
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
