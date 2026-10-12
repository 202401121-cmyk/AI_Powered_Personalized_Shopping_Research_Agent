"""Find the budget in a shopping request, in plain code (US-02). The LLM never decides the budget.

A number is a budget ONLY if it carries a currency (₹, Rs, INR, rupees, $, USD), a money suffix (k, thousand,
hazaar, lakh), or a budget word next to it ("under", "budget", "at least", "tak" ...). Specs such as "16 GB",
"i5 12th gen", "144Hz", "2 kg", "5000 mAh", "4K TV" and model numbers are never budgets. When there is no budget,
the answer is None: one is never assumed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.contracts import Budget, Money

_NUMBER = r"\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?"
_AMOUNT = re.compile(
    r"(?<![\w.,])"
    r"(?:(?P<pre>₹|rs\.?|inr|usd|\$)\s*)?"
    rf"(?P<num>{_NUMBER})"
    r"(?:\s*(?P<suf>k|thousand|hazaar|hazar|hajar|lakhs?|lacs?|l)(?![a-z0-9]))?"
    r"(?![a-z0-9])"
    r"(?:\s*(?P<post>rupees?|rs\.?|inr|dollars?|usd|bucks)(?![a-z0-9]))?"
)

_MULTIPLIER = {"k": 1_000, "thousand": 1_000, "hazaar": 1_000, "hazar": 1_000, "hajar": 1_000}
_LAKH = 100_000
_MAX_LAKH_FOR_L = 50  # "1.5L" is ₹1.5 lakh; "250L" is a 250-litre fridge
_MIN_BARE_AMOUNT = 500  # a bare number such as "above 120" (refresh rate) is not a price

# Budget words just before an amount. Matched against the text that ends where the amount starts.
_MAX_BEFORE = re.compile(
    r"(?<![a-z])(?:under|below|less than|lesser than|upto|up to|within|max|maximum|not more than|no more than|"
    r"cheaper than|not exceeding|budget\b[^0-9₹$]{0,15}|tak)\s*[:\-]?\s*$"
)
_MIN_BEFORE = re.compile(
    r"(?<![a-z])(?:above|over|more than|greater than|at least|atleast|min|minimum|starting(?: at| from)?)"
    r"\s*[:\-]?\s*$"
)
# Budget words just after an amount ("20k tak", "50k or more"), common in Indian and Hindi-English requests.
_MAX_AFTER = re.compile(
    r"^\s*(?:tak|max|maximum|budget|ke andar|ke under|se kam|ke neeche|or less|or below|and below|or under)(?![a-z])"
)
_MIN_AFTER = re.compile(r"^\s*(?:\+|plus(?![a-z])|or more|and above|or above|onwards|se zyada|se jyada|minimum)")
_BETWEEN_BEFORE = re.compile(r"(?<![a-z])between\s*$")
_RANGE_JOIN = re.compile(r"^\s*(?:-|–|—|to|se)\s*$")
_AND_JOIN = re.compile(r"^\s*and\s*$")

# A suffix-less number followed by one of these is a spec, never a budget ("16 GB", "2 kg", "150 sq ft").
_UNIT_AFTER = re.compile(
    r"^\s*(?:gb|tb|mb|kg|kgs|g|gm|grams?|hz|mah|w|watts?|kw|v|volts?|ltr|litres?|liters?|ml|inch|inches|\"|cm|mm|"
    r"ft|feet|sq|sqft|mp|megapixels?|hrs?|hours?|h|mins?|minutes?|days?|years?|yrs?|months?|gen|x|%|star|stars|"
    r"seater|people|persons?|km|kmph|rpm|db|cores?|nits|fps|ppi|pcs|pieces?)(?![a-z0-9])"
)
# "4K TV", "8K video": a resolution, not ₹4,000.
_RESOLUTION_AFTER = re.compile(
    r"^\s*(?:tv|tvs|monitor|display|screen|video|videos|resolution|uhd|hdr|oled|qled|led|panel|projector|"
    r"camera|recording|streaming|content|ultra)(?![a-z])"
)
_RESOLUTION_BEFORE = re.compile(r"(?<![a-z])(?:in|at|records?|shoots?|supports?)\s*$")
_RESOLUTION_NUMBERS = {"2", "4", "5", "8"}

_USD_MARK = re.compile(r"\$|(?<![a-z])(?:usd|dollars?|bucks)(?![a-z])")
_INR_MARK = re.compile(r"₹|(?<![a-z])(?:rs\.?|inr|rupees?|lakhs?|lacs?)(?![a-z])")


@dataclass
class _Amount:
    start: int
    end: int
    value: float
    has_suffix: bool
    currency: str | None
    unit_after: bool
    resolution: bool
    lakh_l: bool  # suffix was a bare "l", which needs a currency or budget word to mean lakh


def region_for(text: str) -> str:
    """₹/Rs/INR/lakh -> India; $/USD -> US; otherwise India, the contract's default."""
    lowered = text.lower()
    if _INR_MARK.search(lowered):
        return "IN"
    if _USD_MARK.search(lowered):
        return "US"
    return "IN"


def parse_budget(text: str) -> Budget | None:
    """The budget stated in `text`, or None. Ranges give a min and a max; "under X" a max; "above X" a min."""
    lowered = text.lower()
    default_currency = "USD" if region_for(text) == "US" else "INR"
    amounts = [_read(m, lowered) for m in _AMOUNT.finditer(lowered)]
    mins: list[Money] = []
    maxes: list[Money] = []

    i = 0
    while i < len(amounts):
        a = amounts[i]
        b = amounts[i + 1] if i + 1 < len(amounts) else None
        if b is not None and _is_range(lowered, a, b):
            low, high = _range_values(a, b)
            currency = a.currency or b.currency or default_currency
            mins.append(Money(amount=min(low, high), currency=currency))
            maxes.append(Money(amount=max(low, high), currency=currency))
            i += 2
            continue
        direction = _direction(lowered, a)
        if direction is not None:
            money = Money(amount=a.value, currency=a.currency or default_currency)
            (mins if direction == "min" else maxes).append(money)
        i += 1

    low_money = mins[0] if mins else None
    high_money = maxes[0] if maxes else None
    if low_money and high_money and (low_money.currency != high_money.currency or low_money.amount > high_money.amount):
        low_money = None  # contradictory ("above 50k, under 30k"): keep the ceiling only
    if low_money is None and high_money is None:
        return None
    return Budget(min=low_money, max=high_money)


def _read(match: re.Match[str], text: str) -> _Amount:
    number = float(match["num"].replace(",", ""))
    suffix = match["suf"] or ""
    currency = _currency(match["pre"]) or _currency(match["post"])
    lakh_l = suffix == "l"
    in_lakh = lakh_l or suffix.startswith(("lakh", "lac"))
    value = number * (_LAKH if in_lakh else _MULTIPLIER.get(suffix, 1))
    after = text[match.end() :]
    return _Amount(
        start=match.start(),
        end=match.end(),
        value=value,
        has_suffix=bool(suffix) and not lakh_l,
        currency=currency,
        unit_after=not suffix and currency is None and _UNIT_AFTER.match(after) is not None,
        resolution=suffix == "k" and currency is None and _looks_like_resolution(match["num"], text, match),
        lakh_l=lakh_l,
    )


def _looks_like_resolution(number: str, text: str, match: re.Match[str]) -> bool:
    """ "4K TV" or "records in 4K" is a screen resolution, not ₹4,000."""
    if number not in _RESOLUTION_NUMBERS:
        return False
    if _RESOLUTION_AFTER.match(text[match.end() :]):
        return True
    return number in {"4", "8"} and _RESOLUTION_BEFORE.search(text[: match.start()]) is not None


def _currency(mark: str | None) -> str | None:
    if not mark:
        return None
    return "USD" if mark in {"$", "usd", "dollar", "dollars", "bucks"} else "INR"


def _budget_word_before(text: str, amount: _Amount) -> bool:
    before = text[: amount.start]
    return bool(_MAX_BEFORE.search(before) or _MIN_BEFORE.search(before))


def _budget_word_after(text: str, amount: _Amount) -> bool:
    after = text[amount.end :]
    return bool(_MAX_AFTER.match(after) or _MIN_AFTER.match(after))


def _is_budget(amount: _Amount, budget_word: bool) -> bool:
    if amount.unit_after or (amount.resolution and not budget_word):
        return False
    if amount.lakh_l:  # "1.5L" only with a currency or a budget word, and never "250L"
        return (amount.currency is not None or budget_word) and amount.value <= _MAX_LAKH_FOR_L * _LAKH
    if amount.currency or amount.has_suffix:
        return True
    return budget_word and amount.value >= _MIN_BARE_AMOUNT


def _direction(text: str, amount: _Amount) -> str | None:
    """ "min", "max" or None (not a budget). A budget with no direction word is a ceiling."""
    word = _budget_word_before(text, amount) or _budget_word_after(text, amount)
    if not _is_budget(amount, word):
        return None
    before, after = text[: amount.start], text[amount.end :]
    if _MIN_BEFORE.search(before) or _MIN_AFTER.match(after):
        return "min"
    return "max"


def _is_range(text: str, a: _Amount, b: _Amount) -> bool:
    joiner = text[a.end : b.start]
    between = _BETWEEN_BEFORE.search(text[: a.start]) is not None
    if not (_RANGE_JOIN.match(joiner) or (between and _AND_JOIN.match(joiner))):
        return False
    if a.unit_after or b.unit_after or a.resolution or b.resolution:
        return False
    marked = any(x.currency or x.has_suffix or x.lakh_l for x in (a, b))
    return marked or between


def _range_values(a: _Amount, b: _Amount) -> tuple[float, float]:
    """ "20-30k" means 20k to 30k: a bare first number borrows the second one's multiplier."""
    low, high = a.value, b.value
    if not (a.has_suffix or a.lakh_l or a.currency) and (b.has_suffix or b.lakh_l) and low < high:
        multiplier = _LAKH if b.lakh_l or b.value >= _LAKH else 1_000
        if low * multiplier <= high:
            low *= multiplier
    return low, high
