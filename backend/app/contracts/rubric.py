"""The rubric (US-09, DR-08): hard rules filter, weights order. Built at the end of the interview."""

from __future__ import annotations

import math
from typing import Literal

from pydantic import Field, model_validator

from .common import Contract, Fraction, Region, Score10, Slug
from .intake import Budget, Exclusion, HardRule

WeightOrigin = Literal["answered", "remembered", "default", "skipped", "manual"]


class WeightedCriterion(Contract):
    key: Slug
    weight: Score10 = Field(description="0 to 10, as the user sees it")
    normalized: Fraction = Field(description="Share of the total; all normalized values add up to 1")
    origin: WeightOrigin
    uncertainty: Fraction = Field(
        default=0.5, description="How unsure we are of this weight; used by the interview and simulations"
    )


class Rubric(Contract):
    category: Slug
    use_case: str | None = Field(default=None, max_length=120)
    region: Region = "IN"
    budget: Budget | None = None
    hard_rules: list[HardRule] = Field(default_factory=list, max_length=20)
    exclusions: list[Exclusion] = Field(default_factory=list, max_length=30)
    weights: list[WeightedCriterion] = Field(min_length=1, max_length=10)

    @model_validator(mode="after")
    def _check(self) -> Rubric:
        keys = [w.key for w in self.weights]
        if len(keys) != len(set(keys)):
            raise ValueError("each criterion may appear only once in the rubric")
        total = sum(w.normalized for w in self.weights)
        if not math.isclose(total, 1.0, abs_tol=1e-6):
            raise ValueError(f"normalized weights must add up to 1, got {total:.6f}")
        return self

    def weight_of(self, key: str) -> float:
        return next((w.normalized for w in self.weights if w.key == key), 0.0)

    def fingerprint(self) -> str:
        """Stable text used in the cache key (FR-28): same request + same rubric = same result."""
        parts = [self.category, self.use_case or "", self.region]
        parts += [f"{w.key}={w.normalized:.4f}" for w in sorted(self.weights, key=lambda w: w.key)]
        parts += sorted(r.model_dump_json() for r in self.hard_rules)
        parts += sorted(e.model_dump_json() for e in self.exclusions)
        parts.append(self.budget.model_dump_json() if self.budget else "")
        return "|".join(parts)


def normalize(weights: dict[str, float]) -> dict[str, float]:
    """Turn 0 to 10 weights into shares that add up to 1. All zero -> equal shares."""
    if not weights:
        raise ValueError("no weights to normalize")
    if any(w < 0 for w in weights.values()):
        raise ValueError("weights cannot be negative")
    total = sum(weights.values())
    if total == 0:
        return {k: 1 / len(weights) for k in weights}
    return {k: w / total for k, w in weights.items()}
