"""Contract test for intake (US-02): the example IntakeInput gives a valid Intent through the real stage."""

from __future__ import annotations

from app.contracts import IntakeInput, Intent, LLMTask, StageContext
from app.contracts import examples as ex
from app.intake import IntakeStage
from app.intake.parsing import RawIntent
from tests.fakes.llm import FakeLLMClient

CTX = StageContext(search_id="srch_contract001")


def _check(intent: Intent) -> None:
    assert Intent.model_validate_json(intent.model_dump_json()) == intent
    assert intent.raw_query == ex.QUERY
    assert (intent.category, intent.category_label, intent.region) == ("laptop", "Laptop", "IN")
    assert intent.budget == ex.intent().budget  # ₹70,000 ceiling, read by code
    assert intent.ready_for_research


def test_the_example_request_through_the_llm_path() -> None:
    expected = ex.intent()
    raw = RawIntent.model_validate(
        {
            "category": "laptop",
            "use_case": "coding",
            "hard_rules": [r.model_dump() for r in expected.hard_rules],
            "exclusions": [e.model_dump() for e in expected.exclusions],
        }
    )
    intent = IntakeStage(FakeLLMClient({LLMTask.DETECT_INTENT: raw})).run(IntakeInput(raw_query=ex.QUERY), CTX)
    _check(intent)
    assert intent.detected_by == "llm"
    assert intent.use_case == expected.use_case
    assert intent.hard_rules == expected.hard_rules
    assert intent.exclusions == expected.exclusions


def test_the_example_request_through_the_rules_path() -> None:
    intent = IntakeStage(FakeLLMClient()).run(IntakeInput(raw_query=ex.QUERY), CTX)
    _check(intent)
    assert intent.detected_by == "rules"
