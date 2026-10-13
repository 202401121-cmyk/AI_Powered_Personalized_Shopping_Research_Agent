"""Fixed criteria sets, one per product family (US-03), from config/criteria_fallback.yaml.

Used when the LLM cannot produce at least 6 usable criteria, or no LLM is available, so the interview always
has criteria to ask about. Each category in categories.yaml names its family; a new category uses "generic".
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import yaml  # type: ignore[import-untyped]  # PyYAML ships no type stubs
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from app.contracts import CriteriaInput, CriteriaSet, Criterion
from app.intake.lexicon import load_lexicon

DEFAULT_FALLBACK_PATH = Path(__file__).resolve().parents[2] / "config" / "criteria_fallback.yaml"
GENERIC_FAMILY = "generic"


class CriteriaConfigError(ValueError):
    """config/criteria_fallback.yaml is missing, unreadable or breaks a rule."""


class FamilySet(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    criteria: list[Criterion] = Field(min_length=7, max_length=8)

    @model_validator(mode="after")
    def _check(self) -> FamilySet:
        keys = [c.key for c in self.criteria]
        if len(keys) != len(set(keys)):
            raise ValueError("criterion keys must be unique within a family")
        if sum(c.is_value_for_money for c in self.criteria) != 1:
            raise ValueError("each family needs exactly one value-for-money criterion")
        return self

    @property
    def value_for_money(self) -> Criterion:
        return next(c for c in self.criteria if c.is_value_for_money)


class FallbackFile(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    families: dict[str, FamilySet]


def load_fallback_sets(path: Path | str | None = None) -> dict[str, FamilySet]:
    """Every family's criteria. Checks that each lexicon family and "generic" exist; raises CriteriaConfigError."""
    return _load(str(path) if path is not None else str(DEFAULT_FALLBACK_PATH))


@lru_cache(maxsize=4)
def _load(path: str) -> dict[str, FamilySet]:
    try:
        raw = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        raise CriteriaConfigError(f"cannot read fallback criteria {path}: {exc}") from exc
    try:
        families = FallbackFile.model_validate(raw).families
    except ValidationError as exc:
        raise CriteriaConfigError(f"invalid fallback criteria {path}:\n{exc}") from exc

    needed = {entry.family for entry in load_lexicon().data.categories} | {GENERIC_FAMILY}
    missing = sorted(needed - set(families))
    if missing:
        raise CriteriaConfigError(f"categories.yaml names families with no fallback set in {path}: {missing}")
    return families


def family_for(category: str) -> str:
    """The family a category belongs to; "generic" for a category the lexicon does not know."""
    family = load_lexicon().family_of(category)
    return family if family in load_fallback_sets() else GENERIC_FAMILY


def family_set(category: str) -> FamilySet:
    return load_fallback_sets()[family_for(category)]


def fallback_set(inp: CriteriaInput) -> CriteriaSet:
    """The fixed criteria for the request's family, marked source="fallback"."""
    return CriteriaSet(
        category=inp.category,
        use_case=inp.use_case,
        criteria=family_set(inp.category).criteria,
        source="fallback",
    )
