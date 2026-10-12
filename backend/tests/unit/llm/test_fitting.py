"""Context fitting (US-26): nothing sent is ever over the model's budget."""

from __future__ import annotations

import random
import re

import pytest
from pydantic import BaseModel

from app.contracts import LLMTask, ModelLimits, Provider
from app.llm.fitting import (
    CHUNKABLE_TASKS,
    estimate_tokens,
    fit,
    input_budget_for,
    merge_chunk_results,
    reserve_output,
)

SYSTEM = "You extract claims about products. Reply with JSON."


def _total(text: str) -> int:
    return estimate_tokens(SYSTEM) + estimate_tokens(text)


def _no_space(text: str) -> str:
    return re.sub(r"\s", "", text)


def test_estimate_is_conservative_for_english_and_rupees() -> None:
    assert estimate_tokens("") == 8
    assert estimate_tokens("abc") == 9
    assert estimate_tokens("₹") == 9  # 3 bytes -> one token, plus the message overhead
    english = "The keyboard is comfortable for long coding sessions. " * 20
    assert estimate_tokens(english) > len(english) / 4  # more than a typical tokenizer would count


def test_budget_reserves_the_smaller_of_requested_and_model_output() -> None:
    model = ModelLimits(
        provider=Provider.CEREBRAS,
        model="small",
        context_window_tokens=8192,
        max_output_tokens=2048,
        trains_on_free_tier=False,
    )
    assert reserve_output(model, 1024) == 1024
    assert reserve_output(model, 9999) == 2048
    assert input_budget_for(model, 1024) == int(8192 * 0.9) - 1024


def test_text_that_fits_is_sent_as_is() -> None:
    result = fit("short text", SYSTEM, budget=500, chunkable=False)
    assert result.mode == "as_is"
    assert result.texts == ("short text",)


def test_trimming_drops_trailing_blocks_and_keeps_the_first() -> None:
    blocks = [f"comment {i}: " + "x" * 90 for i in range(10)]
    budget = _total("\n\n".join(blocks[:3])) + 1
    result = fit("\n\n".join(blocks), SYSTEM, budget=budget, chunkable=False)
    assert result.mode == "trimmed"
    assert result.texts == ("\n\n".join(blocks[:3]),)
    assert _total(result.texts[0]) <= budget


def test_a_single_huge_block_is_cut_at_the_budget() -> None:
    huge = "₹" * 5000 + " end"
    result = fit(huge, SYSTEM, budget=200, chunkable=False)
    assert result.mode == "trimmed"
    (text,) = result.texts
    assert huge.startswith(text)
    assert 0 < len(text) < len(huge)
    assert _total(text) <= 200


def test_chunking_returns_several_chunks_each_under_budget() -> None:
    blocks = [f"review {i}: " + "word " * 40 for i in range(30)]
    text = "\n\n".join(blocks)
    result = fit(text, SYSTEM, budget=300, chunkable=True)
    assert result.mode == "chunked"
    assert len(result.texts) > 2
    assert all(_total(chunk) <= 300 for chunk in result.texts)
    assert _no_space("".join(result.texts)) == _no_space(text)  # nothing lost, order kept


def test_an_oversized_block_is_split_across_chunks() -> None:
    text = "short first\n\n" + "y" * 3000 + "\n\nshort last"
    result = fit(text, SYSTEM, budget=200, chunkable=True)
    assert all(_total(chunk) <= 200 for chunk in result.texts)
    assert _no_space("".join(result.texts)) == _no_space(text)


@pytest.mark.parametrize("seed", range(50))
def test_nothing_returned_is_ever_over_budget(seed: int) -> None:
    rng = random.Random(seed)
    alphabet = ["a", "b", " ", "₹", "क", "é", ".", "\n"]
    blocks = ["".join(rng.choices(alphabet, k=rng.randint(1, 900))) for _ in range(rng.randint(1, 25))]
    text = "\n\n".join(blocks)
    budget = rng.randint(estimate_tokens(SYSTEM) + 12, 1500)
    for chunkable in (False, True):
        result = fit(text, SYSTEM, budget=budget, chunkable=chunkable)
        assert result.texts
        assert all(_total(t) <= budget for t in result.texts), (seed, chunkable)
        if chunkable:
            assert _no_space("".join(result.texts)) == _no_space(text)


def test_system_prompt_over_budget_raises() -> None:
    with pytest.raises(ValueError, match="system prompt alone"):
        fit("hello", "s" * 3000, budget=100, chunkable=False)


def test_only_extraction_tasks_are_chunked() -> None:
    assert {LLMTask.EXTRACT_CLAIMS, LLMTask.ENRICH_EXTRACT} == CHUNKABLE_TASKS


class _Answer(BaseModel):
    source: str
    claims: list[str]
    mentions: list[int] = []


def test_merge_joins_lists_and_keeps_the_first_scalar() -> None:
    merged = merge_chunk_results(
        [
            _Answer(source="first", claims=["a", "b"], mentions=[1]),
            _Answer(source="second", claims=["c"], mentions=[2, 3]),
        ],
        _Answer,
    )
    assert merged == _Answer(source="first", claims=["a", "b", "c"], mentions=[1, 2, 3])


def test_merge_needs_at_least_one_result() -> None:
    with pytest.raises(ValueError, match="no chunk results"):
        merge_chunk_results([], _Answer)
