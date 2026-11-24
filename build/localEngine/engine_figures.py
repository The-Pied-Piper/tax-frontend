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
the Canada workers benefit does not). One figure is the script's own:

  * `year_total`: for the "Tax and contributions for the year" chart only: income tax, CPP and EI as deducted from
    pay, less the credits paid on filing (T1 line 48200, "total_credits" in the engine's T1 trace). It is the one
    figure that stays net of credits.

Two more things are written for the notes under the charts, so no figure in them is typed:

  * `edges`: where the marginal rate changes between two neighbouring sweep salaries, found on a $10 grid (the rate
    read over the next $10): [the sweep salary below, the salary the rate first moves, the salary it has settled at its
    new value, the rate there over the next $100]. A band's start is the settled salary and its end is the salary the rate first moves;
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
from decimal import Decimal
from functools import lru_cache
from importlib.metadata import version
from importlib.resources import files
from pathlib import Path

import yaml

from tax_engine import build_take_home
from tax_engine.application.models.take_home import TakeHomeResult, UnitDescription
from tax_engine.application.models.take_home_request import TakeHomeRequest
from tax_engine.domain.jurisdiction_code import JurisdictionCode

CENTS = Decimal("0.01")
RATE = Decimal("0.0001")
# How far the engine's marginal rate and a $10 step reading may differ before they count as two rates, and the step the edges settle over.
MARGINAL_STEP = 100
MARGINAL_DISAGREEMENT = Decimal("0.005")

# Employment Insurance as deducted from pay (T2204 `t2204_premiums_deducted`): the year-total chart keeps it, net of the
# credits paid on filing. The engine's own EI figure is T2204 line 16 (after the refund at $2,000 or less).
EI_DEDUCTED_LABEL = "t2204_premiums_deducted"
EI_FIGURE = "ei"
INCOME_TAX_FIGURE = "income_tax"
CREDITS_LABEL = "total_credits"


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
# The edges of the marginal rate are found on a $10 grid.
EDGE_STEP = 10


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


def _sweep_salaries(sweep: dict) -> list[int]:
    fine = range(sweep["first"], sweep["fineTo"] + 1, sweep["fineStep"])
    coarse = range(sweep["fineTo"] + sweep["coarseStep"], sweep["to"] + 1, sweep["coarseStep"])
    return sorted({*fine, *coarse, *sweep["extra"]})


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

    def year_total(self, code: str, year: int, salary: int) -> Decimal:
        """Income tax, CPP and EI as deducted, less the credits paid on filing (T1 line 48200), unrounded."""
        result = self._ask(code, year, salary, trace=True)
        lines = [
            line
            for form in result.trace or ()
            for line in form.lines
            if line.label in (CREDITS_LABEL, EI_DEDUCTED_LABEL)
        ]
        paid = [line.amount for line in lines if line.label == CREDITS_LABEL]
        deducted = [line.amount for line in lines if line.label == EI_DEDUCTED_LABEL]
        if len(paid) != 1 or len(deducted) != 1 or paid[0] is None or deducted[0] is None:
            raise ValueError(f"{code} {year}: expected one credits line and one EI deducted line")
        ei_line_16 = self._figure(result, EI_FIGURE)
        return result.total_deductions - ei_line_16 + deducted[0] - paid[0]

    def ei_band(self, code: str, year: int) -> dict[str, str]:
        """The Employment Insurance band just above $2,000, whole dollars: where each extra dollar of salary still
        adds a whole dollar of EI (T2204 line 16 is the salary over $2,000 there), and the EI at that last dollar."""
        ei = {salary: self._ei(code, year, salary) for salary in range(2000, 2101)}
        last = max(
            salary for salary in range(2001, 2101) if ei[salary] - ei[salary - 1] > Decimal("0.99")
        )
        return {"ei_band_end": str(last), "ei_band_top": str(ei[last].quantize(CENTS))}

    def _ei(self, code: str, year: int, salary: int) -> Decimal:
        return self._figure(self._result(code, year, salary), EI_FIGURE)

    def _step_rate(self, code: str, year: int, salary: int) -> Decimal:
        """The rate read over the next $10 of salary."""
        here = self.basis_total(code, year, salary)
        return (self.basis_total(code, year, salary + EDGE_STEP) - here) / EDGE_STEP

    def _differs(self, first: Decimal, second: Decimal) -> bool:
        return abs(first - second) > MARGINAL_DISAGREEMENT

    def edges(
        self, code: str, year: int, salaries: list[int], rates: list[Decimal]
    ) -> list[list[str]]:
        """Where the marginal rate changes between neighbouring sweep salaries: [the sweep salary below, the
        salary the rate first moves, the salary it has settled at its new value, the rate there], on the $10 grid."""
        found: list[list[str]] = []
        for low, high, rate_high in zip(salaries, salaries[1:], rates[1:]):
            start = low
            reference = self._step_rate(code, year, low)
            while self._differs(reference, rate_high) and self._differs(
                reference, self._step_rate(code, year, high)
            ):
                # the first grid salary in (start, high] at which the rate differs from the reference
                near, far = start, high
                while far - near > EDGE_STEP:
                    middle = max(near + EDGE_STEP, (near + far) // (2 * EDGE_STEP) * EDGE_STEP)
                    if self._differs(reference, self._step_rate(code, year, middle)):
                        far = middle
                    else:
                        near = middle
                moves = far
                settled = moves
                while self._differs(
                    self._step_rate(code, year, settled),
                    self._step_rate(code, year, settled + EDGE_STEP),
                ):
                    settled += EDGE_STEP
                # the rate once it has settled, read over the next $100 (or up to the next sweep salary) so a
                # cent of rounding does not move it
                end = min(settled + MARGINAL_STEP, high)
                if end == settled:
                    end = settled + EDGE_STEP
                settled_rate = (
                    (self.basis_total(code, year, end) - self.basis_total(code, year, settled))
                    / (end - settled)
                ).quantize(RATE)
                found.append([str(low), str(moves), str(settled), str(settled_rate)])
                start = settled
                reference = self._step_rate(code, year, settled)
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
                            "amount": str(line.amount),
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
    sweep = _sweep_salaries(config["sweep"])
    figures = Figures()
    provinces = {}
    for province in config["provinces"]:
        code = province["code"]
        pages = {}
        for salary in _salaries(province):
            pages[str(salary)] = figures.answer(code, year, salary, with_trace=True)
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
                    "average_rate": str(
                        Decimal(answer["average_income_tax_rate"]["amount"]).quantize(RATE)
                    ),
                    "marginal_rate": str(
                        Decimal(answer["marginal_income_tax_rate"]["amount"]).quantize(RATE)
                    ),
                    "year_total": str(figures.year_total(code, year, salary).quantize(CENTS)),
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
        }
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
