"""The intake stage (US-01, US-02) with a fake LLM client. No real provider is called."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.contracts import IntakeInput, Intent, LLMTask, StageContext
from app.intake import IntakeStage, revise_intent
from app.intake.parsing import RawIntent
from app.intake.rules import NO_CATEGORY_QUESTION
from app.presearch import start_request
from tests.fakes.llm import FakeLLMClient

CTX = StageContext(search_id="srch_test00001")


def _llm(**raw: object) -> FakeLLMClient:
    return FakeLLMClient({LLMTask.DETECT_INTENT: RawIntent.model_validate(raw)})


def _run(stage: IntakeStage, query: str, reply: str | None = None, attempts: int = 0) -> Intent:
    inp = IntakeInput(raw_query=query, previous_clarification_reply=reply, unclear_attempts=attempts)
    return stage.run(inp, CTX)


def test_the_llm_path_reads_use_and_rules() -> None:
    llm = _llm(
        category="laptop",
        use_case="gaming",
        hard_rules=[{"attribute": "ram_gb", "operator": ">=", "value": 16, "unit": "GB", "source_text": "16 GB"}],
        exclusions=[{"kind": "brand", "value": "HP"}],
    )
    intent = _run(IntakeStage(llm), "gaming laptop under 80k with 16 GB RAM, no HP")
    assert intent.detected_by == "llm"
    assert (intent.category, intent.category_label, intent.use_case) == ("laptop", "Laptop", "gaming")
    assert intent.budget is not None and intent.budget.max is not None
    assert (intent.budget.max.amount, intent.budget.max.currency, intent.region) == (80_000, "INR", "IN")
    assert [r.attribute for r in intent.hard_rules] == ["ram_gb"]
    assert [e.value for e in intent.exclusions] == ["HP"]


def test_the_call_uses_detect_intent_and_the_search_id() -> None:
    llm = _llm(category="laptop")
    _run(IntakeStage(llm), "laptop under 50k")
    (call,) = llm.calls
    assert call.task is LLMTask.DETECT_INTENT
    assert call.schema == "RawIntent"
    assert call.search_id == "srch_test00001"
    assert "laptop under 50k" in call.user


def test_the_budget_comes_from_code_even_if_the_llm_says_otherwise() -> None:
    llm = _llm(
        category="laptop",
        budget={"max": 999_999},
        hard_rules=[{"attribute": "price", "operator": "<=", "value": 1, "source_text": "cheap"}],
    )
    intent = _run(IntakeStage(llm), "gaming laptop under 80k")
    assert intent.budget is not None and intent.budget.max is not None
    assert intent.budget.max.amount == 80_000
    assert intent.hard_rules == []


def test_llm_unavailable_falls_back_to_the_rules() -> None:
    intent = _run(IntakeStage(FakeLLMClient()), "fridge between 20k and 30k")  # no canned answer -> unavailable
    assert intent.detected_by == "rules"
    assert intent.category == "refrigerator"
    assert intent.budget is not None and intent.budget.min is not None and intent.budget.min.amount == 20_000


def test_no_llm_configured_uses_the_rules() -> None:
    assert _run(IntakeStage(), "laptop under 50k").detected_by == "rules"


def test_a_request_with_no_product_gets_one_question_with_options() -> None:
    intent = _run(IntakeStage(_llm(category=None)), "something for my mom")
    assert intent.category is None and intent.needs_clarification
    assert intent.clarification_question == NO_CATEGORY_QUESTION
    assert 3 <= len(intent.clarification_options) <= 4
    assert not intent.show_example_requests


def test_an_ambiguous_word_asks_which_kind() -> None:
    intent = _run(IntakeStage(_llm(category="watch", ambiguous=True)), "watch under 5k")
    assert intent.clarification_question == "Which kind of watch do you mean?"
    assert intent.clarification_options == ["Smartwatch", "Fitness band", "Analog watch"]
    assert not intent.ready_for_research


def test_a_second_unclear_reply_shows_example_requests_and_never_guesses() -> None:
    llm = _llm(category="saree")  # an invented category the user never named
    intent = _run(IntakeStage(llm), "something for my mom", reply="idk, anything nice", attempts=1)
    assert intent.show_example_requests
    assert intent.category is None and intent.category_label is None
    assert intent.clarification_question is None
    assert intent.clarification_options == []
    assert not intent.ready_for_research


def test_a_clear_reply_sets_the_category() -> None:
    intent = _run(IntakeStage(FakeLLMClient()), "something for my mom", reply="a mixer grinder", attempts=1)
    assert intent.category == "mixer_grinder"
    assert intent.ready_for_research
    assert intent.raw_query == "something for my mom"


@pytest.mark.parametrize("query", ["???", "!!! ...", "123", "₹"])
def test_text_with_no_letters_asks_without_calling_the_llm(query: str) -> None:
    llm = _llm(category="laptop")
    intent = _run(IntakeStage(llm), query)
    assert llm.calls == []
    assert intent.needs_clarification and intent.category is None
    assert intent.clarification_question == NO_CATEGORY_QUESTION


def test_the_fallback_applies_the_same_us01_rule() -> None:
    inp = IntakeInput(raw_query="something for my mom", previous_clarification_reply="hmm", unclear_attempts=1)
    intent = IntakeStage().fallback(inp, CTX, RuntimeError("boom"))
    assert intent.show_example_requests and intent.category is None


def test_revise_intent_accepts_a_valid_edit() -> None:
    intent = _run(IntakeStage(), "laptop under 50k")
    edited = revise_intent(intent, {"use_case": "video editing", "region": "US"})
    assert (edited.use_case, edited.region, edited.category) == ("video editing", "US", "laptop")


def test_revise_intent_rejects_an_invalid_edit() -> None:
    intent = _run(IntakeStage(), "laptop under 50k")
    with pytest.raises(ValidationError):
        revise_intent(intent, {"category": None})  # no category without a clarification question
    with pytest.raises(ValidationError):
        revise_intent(intent, {"region": "India"})


def test_presearch_uses_the_stage_and_passes_the_reply() -> None:
    first = start_request("watch under 5k")
    assert first.needs_clarification
    second = start_request("watch under 5k", previous_reply="Smartwatch")
    assert second.category == "smartwatch"
    assert second.budget is not None and second.budget.max is not None and second.budget.max.amount == 5_000
