"""Fit every input to the model's context window before it is sent (US-26).

Nothing here calls a model. The wrapper re-fits for each model it tries, so falling back to a model with a
smaller window trims or chunks again first.
"""

from __future__ import annotations

import math
import re
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Literal, TypeVar

from pydantic import BaseModel

from app.contracts import LLMTask, ModelLimits

BYTES_PER_TOKEN = 3
MESSAGE_OVERHEAD_TOKENS = 8  # role markers and separators each chat message adds
MIN_USER_BYTES = 4  # room for at least one UTF-8 character, so cutting always makes progress
BLOCK_SEPARATOR = "\n\n"

# Tasks whose input can be split and answered piece by piece; every other task is trimmed instead.
CHUNKABLE_TASKS: frozenset[LLMTask] = frozenset({LLMTask.EXTRACT_CLAIMS, LLMTask.ENRICH_EXTRACT})

FitMode = Literal["as_is", "trimmed", "chunked"]
M = TypeVar("M", bound=BaseModel)


@dataclass(frozen=True)
class FitResult:
    mode: FitMode
    texts: tuple[str, ...]  # the user message(s) to send; more than one only when chunked


def estimate_tokens(text: str) -> int:
    """A deliberately pessimistic token count, with no tokenizer library.

    Real tokenizers average about 4 bytes per token for English, so counting one token per 3 UTF-8 bytes
    overestimates English text. Hindi and the ₹ sign take 2-3 bytes per character and tokenise worse than
    English, and bytes/3 still stays on the safe side for them. Overestimating only costs a little trimming;
    underestimating would make the provider reject the call.
    """
    return math.ceil(len(text.encode("utf-8")) / BYTES_PER_TOKEN) + MESSAGE_OVERHEAD_TOKENS


def reserve_output(model: ModelLimits, requested: int) -> int:
    """Output tokens to keep free: what the caller asked for, but never more than the model can write."""
    return max(1, min(requested, model.max_output_tokens))


def input_budget_for(model: ModelLimits, requested_output: int) -> int:
    """Input tokens allowed for one call: window minus the output reserve minus the 10% margin."""
    return model.input_budget(reserve_output=reserve_output(model, requested_output))


def fit(user_text: str, system_text: str, budget: int, chunkable: bool) -> FitResult:
    """Make system + user fit in `budget` tokens. Never returns a text that is over the budget.

    Callers put the most important content first, so trimming drops whole blocks (paragraphs split on blank
    lines) from the end: the lowest-ranked comments go first.
    """
    room = budget - estimate_tokens(system_text)  # tokens left for the user message
    max_bytes = (room - MESSAGE_OVERHEAD_TOKENS) * BYTES_PER_TOKEN
    if max_bytes < MIN_USER_BYTES:
        raise ValueError(f"the system prompt alone uses the whole input budget of {budget} tokens")

    def fits(text: str) -> bool:
        return estimate_tokens(text) <= room

    if fits(user_text):
        return FitResult("as_is", (user_text,))

    blocks = _blocks(user_text)
    if not chunkable:
        kept: list[str] = []
        for block in blocks:
            if not fits(BLOCK_SEPARATOR.join([*kept, block])):
                break
            kept.append(block)
        text = BLOCK_SEPARATOR.join(kept) if kept else _cut(blocks[0], max_bytes)
        return FitResult("trimmed", (text,))

    chunks: list[str] = []
    current: list[str] = []
    for block in blocks:
        for piece in [block] if fits(block) else _split(block, max_bytes):
            if current and not fits(BLOCK_SEPARATOR.join([*current, piece])):
                chunks.append(BLOCK_SEPARATOR.join(current))
                current = []
            current.append(piece)
    if current:
        chunks.append(BLOCK_SEPARATOR.join(current))
    return FitResult("chunked", tuple(chunks))


def merge_chunk_results(results: Sequence[M], schema: type[M]) -> M:
    """Combine the answers for each chunk: lists are joined in order, everything else comes from the first."""
    if not results:
        raise ValueError("no chunk results to merge")
    dumps = [r.model_dump() for r in results]
    merged = dict(dumps[0])
    for name in schema.model_fields:
        if isinstance(merged.get(name), list):
            merged[name] = [item for d in dumps for item in d[name]]
    return schema.model_validate(merged)


def _blocks(text: str) -> list[str]:
    return [b for b in re.split(r"\n\s*\n", text.strip()) if b.strip()] or [text]


def _cut(text: str, max_bytes: int) -> str:
    """The longest prefix of `text` within `max_bytes`, never splitting a UTF-8 character."""
    return text.encode("utf-8")[:max_bytes].decode("utf-8", errors="ignore")


def _split(block: str, max_bytes: int) -> list[str]:
    """Cut one oversized block into consecutive pieces, each within `max_bytes`."""
    pieces: list[str] = []
    rest = block
    while rest:
        piece = _cut(rest, max_bytes)
        pieces.append(piece)
        rest = rest[len(piece) :]
    return pieces
