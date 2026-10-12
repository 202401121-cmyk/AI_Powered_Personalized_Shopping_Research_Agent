"""The keyword rules layer (US-02): category and budget with no LLM, and a question instead of a guess."""

from __future__ import annotations

import pytest

from app.intake.rules import NO_CATEGORY_QUESTION, detect_by_rules

# (query, category, budget min, budget max)
CASES: list[tuple[str, str, float | None, float | None]] = [
    ("gaming laptop under 80k", "laptop", None, 80_000),
    ("phone below 15,000", "smartphone", None, 15_000),
    ("earbuds under ₹2k", "earbuds", None, 2_000),
    ("tv under 1.5 lakh", "television", None, 150_000),
    ("fridge between 20k and 30k", "refrigerator", 20_000, 30_000),
    ("laptop with 16gb ram i7", "laptop", None, None),
    ("smart watch for running", "smartwatch", None, None),
    ("pram for a newborn", "pram", None, None),
    ("best AC for a 150 sq ft room", "air_conditioner", None, None),
    ("geyser 25 litre under 10k", "geyser", None, 10_000),
    ("mixer grinder 750W", "mixer_grinder", None, None),
    ("achha phone 20k tak", "smartphone", None, 20_000),
    ("washing machine for a family of 4 under 25000", "washing_machine", None, 25_000),
    ("noise cancelling headphones above 10k", "headphones", 10_000, None),
    ("air purifier for delhi pollution", "air_purifier", None, None),
    ("TWS for the gym under 3k", "earbuds", None, 3_000),
    ("office chair for back pain 8k-12k", "office_chair", 8_000, 12_000),
    ("baby monitor with night vision", "baby_monitor", None, None),
    ("robot vacuum cleaner for pet hair", "vacuum_cleaner", None, None),
    ("running shoes for flat feet under 5000", "running_shoes", None, 5_000),
]


@pytest.mark.parametrize(("query", "category", "low", "high"), CASES, ids=[c[0] for c in CASES])
def test_category_and_budget(query: str, category: str, low: float | None, high: float | None) -> None:
    intent = detect_by_rules(query)
    assert intent.detected_by == "rules"
    assert intent.category == category
    assert intent.category_label
    assert intent.ready_for_research
    assert (intent.budget.min.amount if intent.budget and intent.budget.min else None) == low
    assert (intent.budget.max.amount if intent.budget and intent.budget.max else None) == high
    # The rules layer only promises category and budget.
    assert intent.use_case is None
    assert intent.hard_rules == []
    assert intent.exclusions == []


def test_region_follows_the_currency() -> None:
    assert detect_by_rules("laptop under $800").region == "US"
    assert detect_by_rules("laptop under ₹80,000").region == "IN"


def test_an_ambiguous_word_asks_which_kind_and_keeps_the_budget() -> None:
    intent = detect_by_rules("watch under 5k")
    assert intent.category is None
    assert intent.needs_clarification
    assert intent.clarification_question == "Which kind of watch do you mean?"
    assert intent.clarification_options == ["Smartwatch", "Fitness band", "Analog watch"]
    assert intent.budget is not None and intent.budget.max is not None
    assert intent.budget.max.amount == 5_000  # already given, so not asked again
    assert not intent.ready_for_research


def test_no_product_asks_what_kind_with_a_few_options() -> None:
    intent = detect_by_rules("something for my mom")
    assert intent.category is None
    assert intent.needs_clarification
    assert intent.clarification_question == NO_CATEGORY_QUESTION
    assert 3 <= len(intent.clarification_options) <= 4


def test_the_raw_query_is_what_the_user_typed() -> None:
    intent = detect_by_rules("something for my mom. a mixer grinder", raw_query="something for my mom")
    assert intent.raw_query == "something for my mom"
    assert intent.category == "mixer_grinder"
