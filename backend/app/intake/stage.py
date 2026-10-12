"""Intake stub (US-52). US-01/US-02 replace run() with real intent detection; this becomes the fallback."""

from __future__ import annotations

from app.contracts import IntakeInput, Intent, StageContext, StageName, examples


class IntakeStage:
    """Returns the example laptop intent, carrying the user's own words."""

    name = StageName.INTAKE

    def run(self, inp: IntakeInput, ctx: StageContext) -> Intent:
        return Intent.model_validate({**examples.intent().model_dump(), "raw_query": inp.raw_query})

    def fallback(self, inp: IntakeInput, ctx: StageContext, error: Exception) -> Intent:
        # Same fixed intent, but marked as rule-based so nobody mistakes it for a model's reading.
        return Intent.model_validate(
            {**examples.intent().model_dump(), "raw_query": inp.raw_query, "detected_by": "rules"}
        )
