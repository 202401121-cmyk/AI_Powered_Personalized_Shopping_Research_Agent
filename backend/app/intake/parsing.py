"""Turn the LLM's reading of a request into a validated Intent (US-02).

The LLM's answer is parsed into the lenient RawIntent first (never straight into the contract), cleaned, then
built into an Intent. Code keeps the final say:
- the budget and region always come from code, never from the LLM;
- a category is kept only if it is grounded in the user's own words, so the LLM cannot invent one;
- each hard rule and exclusion is validated on its own, and a bad one is dropped and logged, not guessed at.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from app.contracts import Exclusion, HardRule, Intent

from .budget import parse_budget, region_for
from .lexicon import SLUG_PATTERN, AmbiguousEntry, Lexicon, load_lexicon, phrase_key, words
from .rules import MAX_OPTIONS, NO_CATEGORY_QUESTION, clarifying_intent

log = logging.getLogger(__name__)

MAX_HARD_RULES = 20  # Intent.hard_rules limit
MAX_EXCLUSIONS = 30  # Intent.exclusions limit
MAX_USE_CASE = 120
MAX_LABEL = 60
MAX_OPTION = 60
LLM_OPTIONS_QUESTION = "Which of these do you mean?"
_BUDGET_ATTRIBUTES = {"price", "budget", "cost", "mrp", "amount", "max_price", "min_price"}
_STOPWORDS = {"a", "an", "the", "for", "of", "and", "with", "to", "in", "my"}


class RawIntent(BaseModel):
    """What the LLM returns. Lenient on purpose: a wrong type becomes an empty value instead of an error."""

    model_config = ConfigDict(extra="ignore")

    category: str | None = None
    use_case: str | None = None
    hard_rules: list[dict[str, Any]] = Field(default_factory=list)
    exclusions: list[dict[str, Any]] = Field(default_factory=list)
    ambiguous: bool = False
    options: list[str] = Field(default_factory=list)

    @field_validator("category", "use_case", mode="before")
    @classmethod
    def _text_or_none(cls, value: object) -> str | None:
        return " ".join(value.split()) or None if isinstance(value, str) else None

    @field_validator("hard_rules", "exclusions", mode="before")
    @classmethod
    def _objects(cls, value: object) -> list[dict[str, Any]]:
        return [item for item in value if isinstance(item, dict)] if isinstance(value, list) else []

    @field_validator("ambiguous", mode="before")
    @classmethod
    def _flag(cls, value: object) -> bool:
        return value is True or (isinstance(value, str) and value.strip().lower() in {"true", "yes"})

    @field_validator("options", mode="before")
    @classmethod
    def _texts(cls, value: object) -> list[str]:
        return (
            [" ".join(v.split()) for v in value if isinstance(v, str) and v.strip()] if isinstance(value, list) else []
        )


def to_intent(raw: RawIntent, text: str, raw_query: str, lexicon: Lexicon | None = None) -> Intent:
    """The validated Intent for `text`. `raw_query` is what the user typed first (Intent.raw_query)."""
    lexicon = lexicon or load_lexicon()
    budget, region = parse_budget(text), region_for(text)
    use_case = _use_case(raw.use_case)
    hard_rules = _hard_rules(raw.hard_rules)
    exclusions = _exclusions(raw.exclusions)

    scan = lexicon.scan(text)
    word = lexicon.ambiguous_entry(raw.category) if raw.category else None
    category = None if word else _grounded_category(raw.category, text, lexicon)
    if category is None and word is None and scan.category:
        category = (scan.category, lexicon.label(scan.category))  # the LLM missed a product word code can see

    if raw.ambiguous or category is None:
        question, options = _question(raw, word or scan.ambiguous, lexicon)
        asking = clarifying_intent(raw_query, question, options, budget, region, "llm")
        return Intent.model_validate(
            {**asking.model_dump(), "use_case": use_case, "hard_rules": hard_rules, "exclusions": exclusions}
        )
    slug, label = category
    return Intent(
        raw_query=raw_query,
        category=slug,
        category_label=label,
        use_case=use_case,
        budget=budget,
        region=region,
        hard_rules=hard_rules,
        exclusions=exclusions,
        detected_by="llm",
    )


def _grounded_category(name: str | None, text: str, lexicon: Lexicon) -> tuple[str, str] | None:
    """(slug, label) for the LLM's category, but only if the user's own words name it."""
    if not name:
        return None
    text_stems = {_stem(w) for w in words(text)}
    slug = lexicon.lookup(name)
    if slug is not None:
        names = [name, *lexicon.synonyms_of(slug)]
        return (slug, lexicon.label(slug)) if any(_mentioned(n, text_stems) for n in names) else None
    if not _mentioned(name, text_stems):
        return None
    new_slug = re.sub(r"[^a-z0-9]+", "_", phrase_key(name))[:64].strip("_")
    if not re.match(SLUG_PATTERN, new_slug):
        return None
    label = name[:MAX_LABEL].strip()
    return new_slug, label[:1].upper() + label[1:]  # a category the lexicon does not know yet (US-03 handles it)


def _mentioned(name: str, text_stems: set[str]) -> bool:
    content = [_stem(w) for w in words(name) if w not in _STOPWORDS]
    return bool(content) and all(w in text_stems for w in content)


def _stem(word: str) -> str:
    """A crude singular, enough to match "mats" with "mat" and "watches" with "watch"."""
    for ending in ("es", "s"):
        if word.endswith(ending) and len(word) > len(ending) + 2:
            return word[: -len(ending)]
    return word


def _question(raw: RawIntent, entry: AmbiguousEntry | None, lexicon: Lexicon) -> tuple[str, list[str]]:
    if entry is not None:
        return entry.question, lexicon.labels(entry.options)
    options = [o for o in raw.options if len(o) <= MAX_OPTION][:MAX_OPTIONS]
    if raw.ambiguous and len(options) >= 2:
        return LLM_OPTIONS_QUESTION, options
    return NO_CATEGORY_QUESTION, lexicon.labels(lexicon.data.suggestions)


def _use_case(value: str | None) -> str | None:
    return value[:MAX_USE_CASE].rstrip() or None if value else None


def _hard_rules(items: list[dict[str, Any]]) -> list[HardRule]:
    kept: list[HardRule] = []
    for item in items:
        fields = {k: item[k] for k in ("attribute", "operator", "value", "unit", "source_text") if k in item}
        if isinstance(fields.get("attribute"), str):
            fields["attribute"] = "_".join(words(fields["attribute"]))
        try:
            rule = HardRule.model_validate(fields)
        except ValidationError as exc:
            log.info("intake: dropped a hard rule that failed validation (%d errors)", exc.error_count())
            continue
        if rule.attribute in _BUDGET_ATTRIBUTES:
            log.info("intake: dropped a %s hard rule; the budget is read by code", rule.attribute)
            continue
        if len(kept) == MAX_HARD_RULES:
            log.info("intake: kept the first %d hard rules and dropped the rest", MAX_HARD_RULES)
            break
        kept.append(rule)
    return kept


def _exclusions(items: list[dict[str, Any]]) -> list[Exclusion]:
    kept: list[Exclusion] = []
    for item in items:
        fields = {k: item[k] for k in ("kind", "value") if k in item}
        try:
            # "always" (remember for future searches) is US-10; never taken from the LLM here.
            exclusion = Exclusion.model_validate({**fields, "always": False})
        except ValidationError as exc:
            log.info("intake: dropped an exclusion that failed validation (%d errors)", exc.error_count())
            continue
        if len(kept) == MAX_EXCLUSIONS:
            log.info("intake: kept the first %d exclusions and dropped the rest", MAX_EXCLUSIONS)
            break
        kept.append(exclusion)
    return kept
