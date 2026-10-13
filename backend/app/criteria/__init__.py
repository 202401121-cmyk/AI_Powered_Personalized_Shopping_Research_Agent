"""Stage 2, criteria (US-03): category-specific criteria with plain-English definitions."""

from .fallback import fallback_set, family_for
from .stage import CriteriaStage
from .store import CriteriaStore, FileCriteriaStore, InMemoryCriteriaStore

__all__ = [
    "CriteriaStage",
    "CriteriaStore",
    "FileCriteriaStore",
    "InMemoryCriteriaStore",
    "fallback_set",
    "family_for",
]
