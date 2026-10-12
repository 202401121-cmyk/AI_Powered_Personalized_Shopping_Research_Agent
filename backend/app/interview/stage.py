"""Interview stub (US-52). US-04 to US-08 replace run() with the real interview; this becomes the fallback."""

from __future__ import annotations

from app.contracts import (
    InterviewQuestion,
    InterviewState,
    InterviewStep,
    InterviewTurn,
    Rubric,
    StageContext,
    StageName,
    WeightedCriterion,
    examples,
    normalize,
)

QUICK_REPLIES = ["low", "medium", "high"]
DONE_MESSAGE = "Thanks, that's everything I need."


class InterviewStage:
    """Asks one question about the first criterion, then finishes with the example rubric."""

    name = StageName.INTERVIEW

    def run(self, inp: InterviewTurn, ctx: StageContext) -> InterviewStep:
        if inp.reply_text is None:
            question = first_question(inp.state)
            return InterviewStep(
                kind="question", message=question.text, question=question, state=inp.state, questions_asked=1
            )
        return InterviewStep(
            kind="finished", message=DONE_MESSAGE, rubric=examples.rubric(), state=inp.state, questions_asked=1
        )

    def fallback(self, inp: InterviewTurn, ctx: StageContext, error: Exception) -> InterviewStep:
        # Stop asking and use the criteria's default weights, so the user can still search.
        return InterviewStep(
            kind="finished",
            message=DONE_MESSAGE,
            rubric=default_rubric(inp.state),
            state=inp.state,
            questions_asked=0,
        )


def first_question(state: InterviewState) -> InterviewQuestion:
    """A plain question about the first criterion in the set."""
    criterion = state.criteria.criteria[0]
    question_id = "q_" + criterion.key.replace("-", "_")[:40]
    return InterviewQuestion(
        id=question_id,
        criterion_key=criterion.key,
        text=f"How much does {criterion.label.lower()} matter to you?",
        quick_replies=QUICK_REPLIES,
        why_asking=criterion.definition[:200],
    )


def default_rubric(state: InterviewState) -> Rubric:
    """A rubric from each criterion's default weight plus the rules the user already gave."""
    criteria = state.criteria.criteria[:10]
    shares = normalize({c.key: c.default_weight for c in criteria})
    intent = state.intent
    return Rubric(
        category=state.criteria.category,
        use_case=intent.use_case,
        region=intent.region,
        budget=intent.budget,
        hard_rules=intent.hard_rules,
        exclusions=intent.exclusions,
        weights=[
            WeightedCriterion(key=c.key, weight=c.default_weight, normalized=shares[c.key], origin="default")
            for c in criteria
        ],
    )
