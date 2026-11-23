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

The hub-chart sweep also carries three figures of its own, all on one basis (income tax of T1 line 43500,
plus CPP and EI, less the credits paid to you on filing, T1 line 48200 ("total_credits" in the engine's
T1 trace)): `net_total`, `net_average_rate` (net_total / salary) and `net_marginal_rate` (the change in
net_total over the next $100 of salary, or over the next $10 where the two readings differ by more than
half a point, so a narrow band such as the Ontario health premium steps shows). They are the hub chart
definitions, not the service's T4127 rates; tax-engine #1947 is to publish them, after which this
derivation goes and the engine's figures are compared with the independent sweep.

`provisional` is not an engine fact (it is the service's policy), so it is absent here and the Node
build adds it. The credits of T1 line 48200 are not written: the pinned engine release does not have
them yet.

Output: for every province, `pages` (the full answer, with the trace, for each page salary) and
`sweep` (the figures only, for every hub-chart salary, with the units once in `sweep_units`). Nothing is read from the network.
"""

from __future__ import annotations

import json
import sys
from decimal import Decimal
from importlib.metadata import version
from pathlib import Path

from tax_engine import build_tax_computation
from tax_engine.adapters.inbound.trace_english import EnglishTraceRenderer
from tax_engine.adapters.inbound.trace_english.unit_text import EnglishUnitTextRegistry
from tax_engine.domain.artifact import Artifact
from tax_engine.domain.jurisdiction_code import JurisdictionCode
from tax_engine.jurisdictions.ca.catalog.income import EMPLOYMENT_INCOME
from tax_engine.registrations import artifact_kinds

CENTS = Decimal("0.01")
RATE = Decimal("0.0001")
# The forward steps of the net marginal rate, and how far two readings may differ before the finer one is used.
MARGINAL_STEP = 100
FINE_MARGINAL_STEP = 10
MARGINAL_DISAGREEMENT = Decimal("0.005")

# The deduction items in the service's order (SupportedJurisdiction.deduction_items), each with the
# engine's (form, kind) that holds its figure.
FIGURES = {
    "cpp_base": ("ca/schedule_8", "ca/schedule_8_cpp_base_contributions_on_return"),
    "cpp_enhanced": ("ca/schedule_8", "ca/cpp_part_3_line_12"),
    "cpp2": ("ca/schedule_8", "ca/cpp_part_3_line_22"),
    "ei": ("ca/t2204", "ca/t2204_premiums_deducted"),
    "income_tax": ("ca/t1_tax_and_credits", "ca/total_payable"),
}


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

    def net_total(self, code: str, year: int, salary: int) -> Decimal:
        """Income tax, CPP and EI, less the credits paid on filing (T1 line 48200), unrounded."""
        sheets = self._engine.compute(
            JurisdictionCode(code), year, Artifact(EMPLOYMENT_INCOME, Decimal(salary))
        )
        total = Decimal(0)
        for form, kind in (FIGURES[item] for item in FIGURES):
            (sheet,) = sheets[form]
            value = sheet.get(self._kinds.kind(kind)).value
            if not isinstance(value, Decimal):
                raise TypeError(f"{kind} is not a decimal")
            total += value
        (t1,) = sheets["ca/t1_tax_and_credits"]
        paid = [line.amount for line in t1.trace if line.label == "total_credits"]
        if len(paid) != 1:
            raise ValueError(f"{code} {year}: expected one total_credits line, found {len(paid)}")
        return total - paid[0]

    def net_marginal_rate(self, code: str, year: int, salary: int, net: Decimal) -> Decimal:
        """The change in net_total per extra dollar of salary, read forward."""
        coarse = (self.net_total(code, year, salary + MARGINAL_STEP) - net) / MARGINAL_STEP
        fine = (self.net_total(code, year, salary + FINE_MARGINAL_STEP) - net) / FINE_MARGINAL_STEP
        return fine if abs(coarse - fine) > MARGINAL_DISAGREEMENT else coarse

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
            }
            if units is None:
                units = point_units
            elif units != point_units:
                raise ValueError(f"{code} {year}: units change along the sweep")
            net = figures.net_total(code, year, salary)
            points.append(
                {
                    "salary": answer["salary"],
                    "total_deductions": answer["total_deductions"],
                    "income_tax": answer["income_tax"],
                    "take_home": answer["take_home"],
                    "average_income_tax_rate": answer["average_income_tax_rate"]["amount"],
                    "net_total": str(net.quantize(CENTS)),
                    "net_average_rate": str((net / salary).quantize(RATE)),
                    "net_marginal_rate": str(
                        figures.net_marginal_rate(code, year, salary, net).quantize(RATE)
                    ),
                }
            )
        provinces[code] = {"year": year, "pages": pages, "sweep": points, "sweep_units": units}
    Path(output_file).write_text(
        json.dumps({"engine": version("tax-engine"), "provinces": provinces}), encoding="utf-8"
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
