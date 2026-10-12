"""Rules-only accuracy of the intake stage on evals/intake/queries.yaml (US-02).

Run from backend/:  python -m evals.intake.run_rules_eval

It runs the intake stage with no LLM (exactly what happens when every provider is down) and prints how often
the category, the budget and the decision to ask a question match the labels. No network, no keys.
"""

from __future__ import annotations

import io
import sys
from dataclasses import dataclass, field
from pathlib import Path

import yaml  # type: ignore[import-untyped]
from pydantic import BaseModel, ConfigDict

from app.contracts import Budget, IntakeInput, Intent, StageContext
from app.intake import IntakeStage

QUERIES_PATH = Path(__file__).with_name("queries.yaml")


class Case(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    query: str
    category: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    currency: str = "INR"
    needs_clarification: bool = False


@dataclass
class Report:
    total: int = 0
    category: int = 0
    budget: int = 0
    clarification: int = 0
    misses: list[str] = field(default_factory=list)

    def accuracy(self, correct: int) -> float:
        return correct / self.total if self.total else 0.0


def load_cases(path: Path = QUERIES_PATH) -> list[Case]:
    return [Case.model_validate(row) for row in yaml.safe_load(path.read_text(encoding="utf-8"))]


def budget_of(budget: Budget | None) -> tuple[float | None, float | None, str | None]:
    if budget is None:
        return (None, None, None)
    currency = (budget.max or budget.min).currency if (budget.max or budget.min) else None
    return (
        budget.min.amount if budget.min else None,
        budget.max.amount if budget.max else None,
        currency,
    )


def expected_budget(case: Case) -> tuple[float | None, float | None, str | None]:
    if case.budget_min is None and case.budget_max is None:
        return (None, None, None)
    return (case.budget_min, case.budget_max, case.currency)


def evaluate(cases: list[Case] | None = None) -> Report:
    stage = IntakeStage()  # no LLM: the keyword rules layer
    ctx = StageContext(search_id="srch_evalrules01")
    report = Report()
    for case in cases if cases is not None else load_cases():
        intent: Intent = stage.run(IntakeInput(raw_query=case.query), ctx)
        report.total += 1
        got_budget, want_budget = budget_of(intent.budget), expected_budget(case)
        checks = {
            "category": (intent.category, case.category),
            "budget": (got_budget, want_budget),
            "clarification": (intent.needs_clarification, case.needs_clarification),
        }
        for name, (got, want) in checks.items():
            if got == want:
                setattr(report, name, getattr(report, name) + 1)
            else:
                report.misses.append(f"{case.query!r}: {name} expected {want}, got {got}")
    return report


def main() -> int:
    if isinstance(sys.stdout, io.TextIOWrapper):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    report = evaluate()
    print(f"Intake eval, rules only (no LLM): {report.total} labelled queries\n")
    print(f"{'metric':<15} {'correct':>7} {'total':>6} {'accuracy':>9}")
    for name in ("category", "budget", "clarification"):
        correct = getattr(report, name)
        print(f"{name:<15} {correct:>7} {report.total:>6} {report.accuracy(correct):>9.1%}")
    print("\nMisses:" if report.misses else "\nMisses: none")
    for miss in report.misses:
        print(f"  - {miss}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
