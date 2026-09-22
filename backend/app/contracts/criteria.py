"""Stage 2, criteria (US-03, DR-07): category and use in, CriteriaSet out."""

from __future__ import annotations

from enum import StrEnum
from typing import Literal

from pydantic import Field, model_validator

from .common import Contract, Score10, Slug

# Words that are too vague to be a criterion on their own (US-03).
VAGUE_CRITERIA = {"quality", "build_quality", "overall", "performance", "good", "value"}


class Direction(StrEnum):
    HIGHER_IS_BETTER = "higher_is_better"
    LOWER_IS_BETTER = "lower_is_better"


class Criterion(Contract):
    key: Slug = Field(description="Stable id, e.g. 'battery_life'")
    label: str = Field(min_length=2, max_length=60)
    definition: str = Field(
        min_length=10,
        max_length=300,
        description="One plain-English line, also used to answer 'what is X?' in the interview",
    )
    direction: Direction = Direction.HIGHER_IS_BETTER
    unit: str | None = Field(default=None, max_length=16)
    default_weight: Score10 = 5.0
    is_value_for_money: bool = False

    @model_validator(mode="after")
    def _not_vague(self) -> Criterion:
        if self.key in VAGUE_CRITERIA and not self.is_value_for_money:
            raise ValueError(f"criterion '{self.key}' is too vague; name what it measures")
        return self


class CriteriaInput(Contract):
    category: Slug
    category_label: str = Field(max_length=60)
    use_case: str | None = Field(default=None, max_length=120)


class CriteriaSet(Contract):
    category: Slug
    use_case: str | None = Field(default=None, max_length=120)
    criteria: list[Criterion] = Field(min_length=6, max_length=10)
    source: Literal["generated", "cached", "fallback"]

    @model_validator(mode="after")
    def _check(self) -> CriteriaSet:
        keys = [c.key for c in self.criteria]
        if len(keys) != len(set(keys)):
            raise ValueError("criterion keys must be unique")
        if sum(c.is_value_for_money for c in self.criteria) != 1:
            raise ValueError("exactly one criterion must be value for money (US-03)")
        return self

    def get(self, key: str) -> Criterion | None:
        return next((c for c in self.criteria if c.key == key), None)
