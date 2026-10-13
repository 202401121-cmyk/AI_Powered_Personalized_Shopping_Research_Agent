"""Criteria stub (US-52). US-03 replaces run() with generated, cached criteria; this becomes the fallback."""

from __future__ import annotations

from app.contracts import CriteriaInput, CriteriaSet, StageContext, StageName, examples


class CriteriaStage:
    """Returns the example laptop criteria whatever the category, until US-03."""

    name = StageName.CRITERIA

    def run(self, inp: CriteriaInput, ctx: StageContext) -> CriteriaSet:
        return examples.criteria()

    def fallback(self, inp: CriteriaInput, ctx: StageContext, error: Exception) -> CriteriaSet:
        return CriteriaSet.model_validate({**examples.criteria().model_dump(), "source": "fallback"})
