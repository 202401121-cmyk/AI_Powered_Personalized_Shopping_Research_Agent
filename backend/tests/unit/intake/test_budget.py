"""The budget parser (US-02): code finds the budget, and a spec is never mistaken for one."""

from __future__ import annotations

import pytest

from app.intake.budget import parse_budget, region_for


def _range(text: str) -> tuple[float | None, float | None, str | None]:
    budget = parse_budget(text)
    assert budget is not None, text
    currency = (budget.max or budget.min).currency  # type: ignore[union-attr]
    return (
        budget.min.amount if budget.min else None,
        budget.max.amount if budget.max else None,
        currency,
    )


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        # ceilings, with every currency marker and suffix
        ("gaming laptop under 80k", (None, 80_000, "INR")),
        ("phone below 15,000", (None, 15_000, "INR")),
        ("earbuds under ₹2k", (None, 2_000, "INR")),
        ("tv under 1.5 lakh", (None, 150_000, "INR")),
        ("tv under 1.5L", (None, 150_000, "INR")),
        ("fridge under 2 lac", (None, 200_000, "INR")),
        ("phone less than Rs. 25000", (None, 25_000, "INR")),
        ("phone upto rs 18000", (None, 18_000, "INR")),
        ("laptop up to INR 60,000", (None, 60_000, "INR")),
        ("headphones within 3000 rupees", (None, 3_000, "INR")),
        ("tablet max 40k", (None, 40_000, "INR")),
        ("budget 60000 for a laptop", (None, 60_000, "INR")),
        ("my budget is around 45000 for a phone", (None, 45_000, "INR")),
        ("tv 1,20,000", None),  # a bare number with no marker is not a budget (see the never-a-budget cases)
        ("₹55,000 laptop", (None, 55_000, "INR")),
        ("laptop for 50k", (None, 50_000, "INR")),  # a suffix makes it a budget; no direction word means a ceiling
        # Hindi-English
        ("achha phone 20k tak", (None, 20_000, "INR")),
        ("laptop 50 hazaar tak", (None, 50_000, "INR")),
        ("fridge 25k ke andar", (None, 25_000, "INR")),
        # floors
        ("laptop above 60k", (60_000, None, "INR")),
        ("phone over ₹30,000", (30_000, None, "INR")),
        ("camera more than 50k", (50_000, None, "INR")),
        ("tv at least 40000", (40_000, None, "INR")),
        ("mattress min 15k", (15_000, None, "INR")),
        ("laptops starting 70k", (70_000, None, "INR")),
        ("phone 30k or more", (30_000, None, "INR")),
        # ranges
        ("fridge between 20k and 30k", (20_000, 30_000, "INR")),
        ("phone 20k-30k", (20_000, 30_000, "INR")),
        ("phone 20-30k", (20_000, 30_000, "INR")),
        ("tv 40k to 60k", (40_000, 60_000, "INR")),
        ("tv between 1 and 1.5 lakh", (100_000, 150_000, "INR")),
        ("chair between 8000 and 12000", (8_000, 12_000, "INR")),
        # dollars
        ("laptop under $800", (None, 800, "USD")),
        ("headphones below 200 usd", (None, 200, "USD")),
        ("monitor between 300 and 500 dollars", (300, 500, "USD")),
    ],
)
def test_budget_phrases(text: str, expected: tuple[float | None, float | None, str] | None) -> None:
    if expected is None:
        assert parse_budget(text) is None
    else:
        assert _range(text) == expected


@pytest.mark.parametrize(
    "text",
    [
        "laptop with 16gb ram i7",
        "laptop with 16 GB RAM",
        "i5 12th gen laptop",
        "144Hz monitor",
        "monitor above 120 hz",
        "refresh rate above 120",
        "2 kg laptop",
        "laptop less than 2 kg",
        "5000 mAh phone",
        "phone with at least 5000 mah",
        "mixer grinder 750W",
        "geyser 25 litre",
        "fridge 250L",
        "fridge under 300L",
        "best AC for a 150 sq ft room",
        "1.5 ton ac",
        "laptop with rtx 4060",
        "iphone 15 pro",
        "4k tv",
        "camera that records in 4k",
        "8k video editing laptop",
        "55 inch tv",
        "10 hours battery",
        "phone",
        "something for my mom",
    ],
)
def test_specs_and_model_numbers_are_never_budgets(text: str) -> None:
    assert parse_budget(text) is None


def test_a_spec_next_to_a_budget_does_not_confuse_it() -> None:
    assert _range("geyser 25 litre under 10k") == (None, 10_000, "INR")
    assert _range("4k tv under 50k") == (None, 50_000, "INR")
    assert _range("laptop 16gb ram i7 under 1 lakh") == (None, 100_000, "INR")
    assert _range("1.5 ton inverter ac under 40k") == (None, 40_000, "INR")


def test_one_and_a_half_lakh_is_150000() -> None:
    assert _range("tv under 1.5 lakh")[1] == 150_000


def test_a_floor_and_a_ceiling_in_one_request() -> None:
    assert _range("laptop above 50k but under 80k") == (50_000, 80_000, "INR")


def test_contradictory_floor_is_dropped() -> None:
    assert _range("laptop above 90k under 60k") == (None, 60_000, "INR")


def test_no_budget_means_none() -> None:
    assert parse_budget("a comfortable office chair for long hours") is None
    assert parse_budget("") is None


@pytest.mark.parametrize(
    ("text", "region"),
    [
        ("earbuds under ₹2k", "IN"),
        ("phone under Rs 20000", "IN"),
        ("tv under 1.5 lakh", "IN"),
        ("laptop under 60000 INR", "IN"),
        ("laptop under $800", "US"),
        ("headphones under 200 USD", "US"),
        ("laptop for coding", "IN"),
        ("laptop under 80k", "IN"),
    ],
)
def test_region(text: str, region: str) -> None:
    assert region_for(text) == region
