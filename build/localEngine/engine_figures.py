"""Runs tax-engine once per salary and writes the figures the site build embeds.

Usage: python -I build/localEngine/engine_figures.py <provinces.json> <output.json>

This is the one place in the frontend that knows the engine's kinds. It mirrors, line for line, what
tax-service does for POST /take-home-calculations:compute, so the pre-built pages say what the live
calculator says (when the two pin the same tax-engine release):

  * app/adapters/outbound/tax_engine/engine.py  FIGURES, AVERAGE_RATES, MARGINAL_RATES, the unit and
    trace mapping, and the rule that all figures share one unit;
  * app/domain/take_home.py  TakeHomeResult.of: total = sum of the figures in the order of the
    service's deduction items, quantized to cents; income_tax = the income tax figure alone, quantized; take_home = salary minus that total, quantized;
  * app/adapters/inbound/take_home_calculations_adapter.py  the response shape (strings everywhere,
    a form's name falls back to its identifier).

Until tax-engine publishes this mapping itself, a change in the service's copy must be copied here;
the Node build checks every answer against api/openapi.yml, so a change of shape fails the build.

The one difference from the service's copy is Employment Insurance: here it is the EI form's own figure, T2204
line 16 (the premium after the refund at $2,000 or less, which goes to T1 line 31200), where the service still
uses the premiums deducted from pay (`ca/t2204_premiums_deducted`). The two differ only below $2,034 of salary. Until
tax-service moves to line 16 as well (Umar, 23 Nov 22:35Z), a live calculation under $2,034 differs from the
pre-built figures by up to $33.

The hub-chart sweep carries four figures of its own, which are the hub chart definitions, not the service's T4127
rates:

  * `average_rate`: (income tax of T1 line 43500 + CPP base + CPP enhanced + CPP2 + EI line 16) / salary, never
    below 0. Credits paid to you when you file (T1 lines 45000, 45300 and 47900) are not counted, so tax cuts such as
    the Ontario LIFT credit count and the Canada workers benefit does not;
  * `marginal_rate`: the change in that same total over the next $100 of salary, or over the next $10 where the two
    readings differ by more than half a point, so a narrow band such as the Ontario health premium steps shows,
    never below 0;
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

from tax_engine import build_tax_computation
from tax_engine.adapters.inbound.trace_english import EnglishTraceRenderer
from tax_engine.adapters.inbound.trace_english.unit_text import EnglishUnitTextRegistry
from tax_engine.domain.artifact import Artifact
from tax_engine.domain.jurisdiction_code import JurisdictionCode
from tax_engine.jurisdictions.ca.catalog.income import EMPLOYMENT_INCOME
from tax_engine.registrations import artifact_kinds

CENTS = Decimal("0.01")
RATE = Decimal("0.0001")
# The forward steps of the marginal rate, and how far two readings may differ before the finer one is used.
MARGINAL_STEP = 100
FINE_MARGINAL_STEP = 10
MARGINAL_DISAGREEMENT = Decimal("0.005")

# The deduction items in the service's order (SupportedJurisdiction.deduction_items), each with the
# engine's (form, kind) that holds its figure.
FIGURES = {
    "cpp_base": ("ca/schedule_8", "ca/schedule_8_cpp_base_contributions_on_return"),
    "cpp_enhanced": ("ca/schedule_8", "ca/cpp_part_3_line_12"),
    "cpp2": ("ca/schedule_8", "ca/cpp_part_3_line_22"),
    "ei": ("ca/t2204", "ca/t2204_line_16"),
    "income_tax": ("ca/t1_tax_and_credits", "ca/total_payable"),
}


# Employment Insurance as deducted from pay: the year-total chart keeps it, net of the credits paid on filing.
EI_DEDUCTED = ("ca/t2204", "ca/t2204_premiums_deducted")


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


def _rate_kinds(code: str, kind: str) -> tuple[str, str]:
    prefix = code.lower()
    return (f"{prefix}/return", f"{prefix}/{kind}")


def _unit(unit):
    text = EnglishUnitTextRegistry.shared().for_unit(unit)
    return {
        "name": unit.identifier,
        "placement": text.placement.value,
        "singular": text.singular,
        "plural": text.plural,
        "spaced": text.spaced,
        "as_percentage": text.as_percentage,
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
        self._engine = build_tax_computation()
        self._kinds = artifact_kinds()
        self._renderer = EnglishTraceRenderer()

    def _read(self, sheets, form: str, kind: str) -> Decimal:
        (sheet,) = sheets[form]
        value = sheet.get(self._kinds.kind(kind)).value
        if not isinstance(value, Decimal):
            raise TypeError(f"{kind} is not a decimal")
        return value

    @lru_cache(maxsize=None)
    def _totals(self, code: str, year: int, salary: int) -> tuple[Decimal, Decimal]:
        """(basis total, year total) for one salary, unrounded."""
        sheets = self._engine.compute(
            JurisdictionCode(code), year, Artifact(EMPLOYMENT_INCOME, Decimal(salary))
        )
        total = sum((self._read(sheets, *FIGURES[item]) for item in FIGURES), Decimal(0))
        (t1,) = sheets["ca/t1_tax_and_credits"]
        paid = [line.amount for line in t1.trace if line.label == "total_credits"]
        if len(paid) != 1:
            raise ValueError(f"{code} {year}: expected one total_credits line, found {len(paid)}")
        deducted = total - self._read(sheets, *FIGURES["ei"]) + self._read(sheets, *EI_DEDUCTED)
        return total, deducted - paid[0]

    def basis_total(self, code: str, year: int, salary: int) -> Decimal:
        """Income tax, CPP (all three parts) and EI line 16: what the average and marginal rate charts count."""
        return self._totals(code, year, salary)[0]

    def year_total(self, code: str, year: int, salary: int) -> Decimal:
        """Income tax, CPP and EI as deducted, less the credits paid on filing (T1 line 48200), unrounded."""
        return self._totals(code, year, salary)[1]

    def marginal_rate(self, code: str, year: int, salary: int) -> Decimal:
        """The change in the basis total per extra dollar of salary, read forward, never below 0."""
        here = self.basis_total(code, year, salary)
        coarse = (self.basis_total(code, year, salary + MARGINAL_STEP) - here) / MARGINAL_STEP
        fine = (
            self.basis_total(code, year, salary + FINE_MARGINAL_STEP) - here
        ) / FINE_MARGINAL_STEP
        rate = fine if abs(coarse - fine) > MARGINAL_DISAGREEMENT else coarse
        return max(rate, Decimal(0))

    def ei_band(self, code: str, year: int) -> dict[str, str]:
        """The Employment Insurance band just above $2,000, whole dollars: where each extra dollar of salary still
        adds a whole dollar of EI (T2204 line 16 is the salary over $2,000 there), and the EI at that last dollar."""
        ei = {salary: self._ei(code, year, salary) for salary in range(2000, 2101)}
        last = max(
            salary for salary in range(2001, 2101) if ei[salary] - ei[salary - 1] > Decimal("0.99")
        )
        return {"ei_band_end": str(last), "ei_band_top": str(ei[last].quantize(CENTS))}

    @lru_cache(maxsize=None)
    def _ei(self, code: str, year: int, salary: int) -> Decimal:
        sheets = self._engine.compute(
            JurisdictionCode(code), year, Artifact(EMPLOYMENT_INCOME, Decimal(salary))
        )
        return self._read(sheets, *FIGURES["ei"])

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
        sheets = self._engine.compute(
            JurisdictionCode(code), year, Artifact(EMPLOYMENT_INCOME, Decimal(salary))
        )

        def read(form: str, kind: str):
            (sheet,) = sheets[form]
            artifact = sheet.get(self._kinds.kind(kind))
            if not isinstance(artifact.value, Decimal):
                raise TypeError(f"{kind} is not a decimal")
            return artifact.value, artifact.unit

        amounts = []
        units = []
        for item in FIGURES:
            value, unit = read(*FIGURES[item])
            amounts.append(value)
            units.append(unit)
        unit = units[0]
        if unit is None or any(other != unit for other in units):
            raise ValueError(f"{code} {year}: the figures do not share one unit")

        def rate(kind: str) -> dict:
            value, rate_unit = read(*_rate_kinds(code, kind))
            if rate_unit is None:
                raise ValueError(f"{code} {year}: {kind} has no unit")
            return {"amount": str(value), "unit": _unit(rate_unit)}

        total = sum(amounts, Decimal(0))
        # The income tax part on its own (the service's TakeHomeResult.income_tax): the total
        # payable before the credits, contributions not in it.
        income_tax = amounts[list(FIGURES).index("income_tax")]
        answer = {
            "salary": str(Decimal(salary).quantize(CENTS)),
            "total_deductions": str(total.quantize(CENTS)),
            "income_tax": str(income_tax.quantize(CENTS)),
            "take_home": str((Decimal(salary) - total).quantize(CENTS)),
            "unit": _unit(unit),
            "average_income_tax_rate": rate("average_income_tax_rate"),
            "marginal_income_tax_rate": rate("marginal_tax_rate"),
        }
        if with_trace:
            trace = []
            for form, form_sheets in sheets.items():
                for sheet in form_sheets:
                    lines = []
                    for line in sheet.trace:
                        label = line.label
                        line_unit = None if label is None else sheet.unit(label)
                        lines.append(
                            {
                                "label": label,
                                "name": _present(None if label is None else sheet.title(label)),
                                "reference": _present(
                                    None if label is None else sheet.reference(label)
                                ),
                                "amount": str(line.amount),
                                "text": self._renderer.render(line, sheet),
                                "unit": None if line_unit is None else _unit(line_unit),
                            }
                        )
                    trace.append(
                        {
                            "form": form,
                            "name": _present(sheet.form_title) or form,
                            "lines": lines,
                        }
                    )
            answer["trace"] = trace
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
            average = max(figures.basis_total(code, year, salary) / salary, Decimal(0))
            points.append(
                {
                    "salary": answer["salary"],
                    "total_deductions": answer["total_deductions"],
                    "income_tax": answer["income_tax"],
                    "take_home": answer["take_home"],
                    "average_rate": str(average.quantize(RATE)),
                    "marginal_rate": str(figures.marginal_rate(code, year, salary).quantize(RATE)),
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
