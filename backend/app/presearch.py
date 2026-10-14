"""The pre-search flow (US-52): intake -> criteria -> interview, one call per turn, ending in a Rubric.

Unlike the search pipeline, these run turn by turn while the user chats, so they are plain functions.
Each still goes through `run_stage`, so it gets its time limit and falls back instead of crashing.
"""

from __future__ import annotations

from typing import TypeVar

from app.contracts import (
    STAGE_TIME_LIMITS_S,
    CriteriaInput,
    CriteriaSet,
    IntakeInput,
    Intent,
    InterviewStep,
    InterviewTurn,
    Stage,
    StageContext,
)
from app.criteria import CriteriaStage
from app.intake import IntakeStage
from app.interview import InterviewStage
from app.pipeline import run_stage

In = TypeVar("In")
Out = TypeVar("Out")


def start_request(query: str) -> Intent:
    """Understand the user's first message."""
    return _run(IntakeStage(), IntakeInput(raw_query=query))


def make_criteria(intent: Intent) -> CriteriaSet:
    """Criteria for the detected category. Only call once the intent is ready for research."""
    if intent.category is None or intent.category_label is None:
        raise ValueError("the request has no product category yet; ask the clarification question first")
    inp = CriteriaInput(category=intent.category, category_label=intent.category_label, use_case=intent.use_case)
    return _run(CriteriaStage(), inp)


def interview_turn(turn: InterviewTurn) -> InterviewStep:
    """One interview turn: the user's reply (None on the first turn) in, the next step out."""
    return _run(InterviewStage(), turn)


def _run(stage: Stage[In, Out], inp: In) -> Out:
    ctx = StageContext(search_id="presearch", time_limit_s=STAGE_TIME_LIMITS_S[stage.name])
    out, report = run_stage(stage, inp, ctx, STAGE_TIME_LIMITS_S[stage.name])
    if out is None:
        raise RuntimeError(f"{stage.name} failed and so did its fallback: {report.fallback_reason}")
    return out
