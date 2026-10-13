"""Contract test for criteria (US-03): the example CriteriaInput gives a valid CriteriaSet through the stage."""

from __future__ import annotations

from app.contracts import CriteriaInput, CriteriaSet, LLMTask, StageContext
from app.contracts import examples as ex
from app.criteria import CriteriaStage, InMemoryCriteriaStore
from app.criteria.parsing import RawCriteria
from tests.fakes.llm import FakeLLMClient

INP = CriteriaInput(category=ex.intent().category or "laptop", category_label="Laptop", use_case="coding")
CTX = StageContext(search_id="srch_contract001")


def _valid(result: CriteriaSet) -> None:
    assert CriteriaSet.model_validate_json(result.model_dump_json()) == result
    assert (result.category, result.use_case) == ("laptop", "coding")
    assert 6 <= len(result.criteria) <= 10
    assert sum(c.is_value_for_money for c in result.criteria) == 1


def test_the_example_criteria_through_the_llm_path() -> None:
    raw = RawCriteria.model_validate({"criteria": [c.model_dump(mode="json") for c in ex.criteria().criteria]})
    result = CriteriaStage(FakeLLMClient({LLMTask.GENERATE_CRITERIA: raw}), InMemoryCriteriaStore()).run(INP, CTX)
    _valid(result)
    assert result.source == "generated"
    assert result.criteria == ex.criteria().criteria


def test_the_example_input_through_the_fallback_path() -> None:
    result = CriteriaStage(FakeLLMClient(), InMemoryCriteriaStore()).run(INP, CTX)
    _valid(result)
    assert result.source == "fallback"
