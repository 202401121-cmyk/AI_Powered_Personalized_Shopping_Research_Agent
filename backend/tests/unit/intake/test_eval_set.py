"""The intake eval set as a test (US-02): the keyword rules alone must keep these accuracy floors."""

from __future__ import annotations

from evals.intake.run_rules_eval import evaluate, load_cases


def test_the_eval_set_has_40_labelled_queries() -> None:
    cases = load_cases()
    assert len(cases) >= 40
    assert len({c.query for c in cases}) == len(cases)
    assert any(c.needs_clarification for c in cases)


def test_rules_only_accuracy_floors() -> None:
    report = evaluate()
    misses = "\n".join(report.misses)
    assert report.accuracy(report.budget) == 1.0, misses
    assert report.accuracy(report.clarification) == 1.0, misses
    assert report.accuracy(report.category) >= 0.9, misses
