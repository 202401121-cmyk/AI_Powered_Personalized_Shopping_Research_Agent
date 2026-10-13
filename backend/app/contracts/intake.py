"""Stage 1, intake (US-01, US-02): request text in, Intent out."""

from __future__ import annotations

from typing import Literal

from pydantic import Field, model_validator

from .common import Contract, Money, Region, Slug

Operator = Literal["<=", ">=", "==", "!=", "in", "not_in", "contains"]


class HardRule(Contract):
    """A must-have. Hard rules only filter products; they never change the order (DR-08)."""

    attribute: Slug = Field(description="Criterion or spec key, e.g. 'weight_kg' or 'has_ois'")
    operator: Operator
    value: float | bool | str | list[str]
    unit: str | None = Field(default=None, max_length=16)
    source_text: str = Field(min_length=1, max_length=200, description="What the user actually said")


class Exclusion(Contract):
    """Something the user never wants to see (FR-10)."""

    kind: Literal["brand", "model", "feature", "seller"]
    value: str = Field(min_length=1, max_length=80)
    always: bool = Field(default=False, description="True = save to memory for future searches")


class Budget(Contract):
    min: Money | None = None
    max: Money | None = None

    @model_validator(mode="after")
    def _check_range(self) -> Budget:
        if self.min is None and self.max is None:
            raise ValueError("a budget needs a min, a max, or both; use budget=None for no budget")
        if self.min and self.max:
            if self.min.currency != self.max.currency:
                raise ValueError("budget min and max must use the same currency")
            if self.min.amount > self.max.amount:
                raise ValueError("budget min is above budget max")
        return self


class IntakeInput(Contract):
    raw_query: str = Field(min_length=1, max_length=1000)
    previous_clarification_reply: str | None = Field(default=None, max_length=500)
    unclear_attempts: int = Field(default=0, ge=0, le=2)


class Intent(Contract):
    """Everything understood from the request. Research never starts without a category."""

    raw_query: str = Field(min_length=1, max_length=1000)
    category: Slug | None = None
    category_label: str | None = Field(default=None, max_length=60)
    use_case: str | None = Field(default=None, max_length=120)
    budget: Budget | None = None
    region: Region = "IN"
    hard_rules: list[HardRule] = Field(default_factory=list, max_length=20)
    exclusions: list[Exclusion] = Field(default_factory=list, max_length=30)
    needs_clarification: bool = False
    clarification_question: str | None = Field(default=None, max_length=300)
    clarification_options: list[str] = Field(default_factory=list, max_length=6)
    show_example_requests: bool = Field(
        default=False, description="US-01: second unclear reply -> show examples, never guess"
    )
    detected_by: Literal["llm", "rules"]

    @model_validator(mode="after")
    def _check_clarification(self) -> Intent:
        if self.category is None and not self.needs_clarification:
            raise ValueError("no category detected, so needs_clarification must be True")
        if self.needs_clarification and not (self.clarification_question or self.show_example_requests):
            raise ValueError("needs_clarification requires a clarification_question or example requests")
        if (self.category is None) != (self.category_label is None):
            raise ValueError("category and category_label must be set together")
        return self

    @property
    def ready_for_research(self) -> bool:
        return self.category is not None and not self.needs_clarification
