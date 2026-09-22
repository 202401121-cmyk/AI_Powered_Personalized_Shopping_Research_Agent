"""The one LLM wrapper (US-26, US-46). Every stage calls it through this interface, never a provider SDK directly."""

from __future__ import annotations

from enum import StrEnum
from typing import Literal, Protocol, TypeVar

from pydantic import BaseModel, Field

from .common import AwareDatetime, Contract

T = TypeVar("T", bound=BaseModel)


class Provider(StrEnum):
    GROQ = "groq"
    GEMINI = "gemini"
    OPENROUTER = "openrouter"
    CEREBRAS = "cerebras"


class LLMTask(StrEnum):
    """Every kind of call. Routing, token budgets and logging are keyed on this."""

    DETECT_INTENT = "detect_intent"
    GENERATE_CRITERIA = "generate_criteria"
    CLASSIFY_REPLY = "classify_reply"
    ANSWER_USER_QUESTION = "answer_user_question"
    WRITE_QUESTION = "write_question"
    EXTRACT_CLAIMS = "extract_claims"
    DISCOVER_ALIASES = "discover_aliases"
    ENRICH_EXTRACT = "enrich_extract"
    WRITE_EXPLANATION = "write_explanation"


# Tasks that may carry a user's own words or preferences. Never routed to the Gemini free tier (build rule 8).
PERSONAL_TASKS: frozenset[LLMTask] = frozenset(
    {
        LLMTask.DETECT_INTENT,
        LLMTask.CLASSIFY_REPLY,
        LLMTask.ANSWER_USER_QUESTION,
        LLMTask.WRITE_QUESTION,
        LLMTask.WRITE_EXPLANATION,
    }
)


class ModelLimits(Contract):
    """One row of config/models.yaml. The wrapper fits every input to these limits (US-26)."""

    provider: Provider
    model: str = Field(min_length=1, max_length=120)
    context_window_tokens: int = Field(gt=0)
    max_output_tokens: int = Field(gt=0)
    trains_on_free_tier: bool = Field(description="True = never send personal tasks here")

    def input_budget(self, reserve_output: int, margin: float = 0.10) -> int:
        """Largest input allowed: window minus the answer, minus a safety margin."""
        usable = int(self.context_window_tokens * (1 - margin)) - reserve_output
        if usable <= 0:
            raise ValueError("model window too small for the requested output")
        return usable


class LLMCallRecord(Contract):
    """One row of the llm_calls table. Written for every call, success or not."""

    search_id: str | None = None
    task: LLMTask
    provider: Provider
    model: str
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    duration_ms: int = Field(ge=0)
    outcome: Literal["ok", "invalid_output", "rate_limited", "timeout", "error", "skipped_budget"]
    fitted: Literal["as_is", "trimmed", "chunked"] = "as_is"
    at: AwareDatetime


class LLMUnavailable(Exception):
    """Raised when every allowed provider failed. The calling stage must use its fallback."""


class LLMClient(Protocol):
    """What every stage depends on. Tests pass a fake that returns canned models."""

    def complete(
        self,
        task: LLMTask,
        system: str,
        user: str,
        schema: type[T],
        *,
        search_id: str | None = None,
        max_output_tokens: int = 1024,
    ) -> T:
        """Return a validated instance of `schema`, or raise LLMUnavailable.

        The wrapper, not the caller, handles: context-window fitting, provider order,
        circuit breaking, personal-task routing, one retry on invalid output, and logging.
        """
        ...
