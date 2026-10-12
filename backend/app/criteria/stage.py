"""Criteria stub (US-52). US-03 replaces run() with generated, cached criteria; this becomes the fallback."""

from __future__ import annotations

from app.contracts import CriteriaInput, CriteriaSet, StageContext, StageName, examples


class CriteriaStage:
    """Returns the example laptop criteria for whatever category was asked, until US-03.

    The category is set to the one requested, because the interview checks that the intent and the
    criteria agree; that keeps the walking skeleton running for every category intake can detect.
    """

    name = StageName.CRITERIA

    def run(self, inp: CriteriaInput, ctx: StageContext) -> CriteriaSet:
        return _for_request(inp, "generated")

    def fallback(self, inp: CriteriaInput, ctx: StageContext, error: Exception) -> CriteriaSet:
        return _for_request(inp, "fallback")


def _for_request(inp: CriteriaInput, source: str) -> CriteriaSet:
    return CriteriaSet.model_validate(
        {**examples.criteria().model_dump(), "category": inp.category, "use_case": inp.use_case, "source": source}
    )
