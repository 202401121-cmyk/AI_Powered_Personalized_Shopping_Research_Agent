"""The product categories intake recognises without an LLM (US-02), loaded from config/categories.yaml.

Matching works on lowercase words, so "Smart-Watch" and "smart watch" are the same. A synonym must match whole
words ("pram" is not found inside "program"); its last word may carry a plural ending ("laptops", "watches").
When synonyms overlap, the longest wins ("smart watch" beats "watch"). Of several categories, the one mentioned
first wins, because people usually name what they want first ("earbuds for my phone").
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import yaml  # type: ignore[import-untyped]  # PyYAML ships no type stubs
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

DEFAULT_LEXICON_PATH = Path(__file__).resolve().parents[2] / "config" / "categories.yaml"
SLUG_PATTERN = r"^[a-z0-9]+(?:[_-][a-z0-9]+)*$"  # the same rule as app.contracts Slug

_WORD = re.compile(r"[a-z0-9]+")
_PLURAL_ENDINGS = ("", "s", "es")


class LexiconError(ValueError):
    """config/categories.yaml is missing, unreadable or breaks a rule."""


def words(text: str) -> list[str]:
    """Lowercase words and numbers, with punctuation and hyphens dropped."""
    return _WORD.findall(text.lower())


def phrase_key(text: str) -> str:
    return " ".join(words(text))


class CategoryEntry(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    slug: str = Field(pattern=SLUG_PATTERN, max_length=64)
    label: str = Field(min_length=2, max_length=60)
    family: str = Field(pattern=SLUG_PATTERN, max_length=64, description="Fallback criteria set to use (US-03)")
    synonyms: list[str] = Field(min_length=1)


class AmbiguousEntry(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    word: str = Field(min_length=2)
    question: str = Field(min_length=5, max_length=300)
    options: list[str] = Field(min_length=2, max_length=4, description="Category slugs offered as answers")


class LexiconFile(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    categories: list[CategoryEntry] = Field(min_length=1)
    ambiguous: list[AmbiguousEntry] = Field(default_factory=list)
    suggestions: list[str] = Field(min_length=3, max_length=4)

    @model_validator(mode="after")
    def _check(self) -> LexiconFile:
        slugs = [c.slug for c in self.categories]
        repeated = sorted({s for s in slugs if slugs.count(s) > 1})
        if repeated:
            raise ValueError(f"category slugs must be unique: {repeated}")

        owner: dict[str, str] = {}
        for category in self.categories:
            for synonym in category.synonyms:
                key = phrase_key(synonym)
                if not key:
                    raise ValueError(f"{category.slug}: empty synonym {synonym!r}")
                if key in owner and owner[key] != category.slug:
                    raise ValueError(f"synonym {key!r} is used by both {owner[key]} and {category.slug}")
                owner[key] = category.slug

        known = set(slugs)
        for entry in self.ambiguous:
            if phrase_key(entry.word) in owner:
                raise ValueError(f"ambiguous word {entry.word!r} is also a synonym of {owner[phrase_key(entry.word)]}")
            unknown = sorted(set(entry.options) - known)
            if unknown:
                raise ValueError(f"ambiguous word {entry.word!r} offers unknown categories: {unknown}")
        unknown = sorted(set(self.suggestions) - known)
        if unknown:
            raise ValueError(f"suggestions name unknown categories: {unknown}")
        return self


@dataclass(frozen=True)
class Scan:
    """What the lexicon found in a text: a category, or else an ambiguous word that needs a question."""

    category: str | None
    ambiguous: AmbiguousEntry | None


@dataclass(frozen=True)
class _Phrase:
    tokens: tuple[str, ...]
    category: str | None  # None for an ambiguous word
    word: str | None


class Lexicon:
    def __init__(self, data: LexiconFile) -> None:
        self.data = data
        self.categories = {c.slug: c for c in data.categories}
        self.ambiguous = {phrase_key(a.word): a for a in data.ambiguous}
        self._by_key: dict[str, str] = {}
        phrases: list[_Phrase] = []
        for category in data.categories:
            for name in [*category.synonyms, category.label, category.slug.replace("_", " ")]:
                self._by_key.setdefault(phrase_key(name), category.slug)
            phrases += [_Phrase(tuple(words(s)), category.slug, None) for s in category.synonyms]
        phrases += [_Phrase(tuple(words(a.word)), None, phrase_key(a.word)) for a in data.ambiguous]
        # Longest first, so "smart watch" claims its words before "watch" can.
        self._phrases = sorted(phrases, key=lambda p: (len(p.tokens), len(" ".join(p.tokens))), reverse=True)

    def label(self, slug: str) -> str:
        return self.categories[slug].label

    def family_of(self, slug: str) -> str | None:
        """The product family a known category belongs to; None for a category the lexicon does not know."""
        entry = self.categories.get(slug)
        return entry.family if entry else None

    def labels(self, slugs: list[str]) -> list[str]:
        return [self.label(s) for s in slugs]

    def scan(self, text: str) -> Scan:
        """The category the text names (first mentioned), or else its ambiguous word, or else nothing."""
        tokens = words(text)
        taken = [False] * len(tokens)
        found: list[tuple[int, _Phrase]] = []
        for phrase in self._phrases:
            size = len(phrase.tokens)
            for start in range(len(tokens) - size + 1):
                if any(taken[start : start + size]) or not _matches(tokens, start, phrase.tokens):
                    continue
                found.append((start, phrase))
                for i in range(start, start + size):
                    taken[i] = True
        found.sort(key=lambda item: item[0])
        category = next((p.category for _, p in found if p.category), None)
        if category:
            return Scan(category, None)
        word = next((p.word for _, p in found if p.word), None)
        return Scan(None, self.ambiguous[word] if word else None)

    def lookup(self, name: str) -> str | None:
        """The category slug for a name such as "Fridge" or "air conditioners", if the lexicon knows it."""
        return next((self._by_key[k] for k in _singular_forms(phrase_key(name)) if k in self._by_key), None)

    def ambiguous_entry(self, name: str) -> AmbiguousEntry | None:
        """The ambiguous-word entry if `name` is exactly such a word ("watch", "watches")."""
        return next((self.ambiguous[k] for k in _singular_forms(phrase_key(name)) if k in self.ambiguous), None)

    def synonyms_of(self, slug: str) -> list[str]:
        entry = self.categories[slug]
        return [*entry.synonyms, entry.label]


def _singular_forms(key: str) -> list[str]:
    """The key itself, then the key without a plural ending ("watches" -> "watch", "laptops" -> "laptop")."""
    return [key] + [key[: -len(e)] for e in _PLURAL_ENDINGS if e and key.endswith(e) and len(key) > len(e) + 1]


def _matches(tokens: list[str], start: int, phrase: tuple[str, ...]) -> bool:
    *head, last = phrase
    if list(tokens[start : start + len(head)]) != head:
        return False
    return tokens[start + len(head)] in {last + ending for ending in _PLURAL_ENDINGS}


def load_lexicon(path: Path | str | None = None) -> Lexicon:
    """Read and check config/categories.yaml (or `path`). Raises LexiconError with the reason."""
    return _load(str(path) if path is not None else str(DEFAULT_LEXICON_PATH))


@lru_cache(maxsize=4)
def _load(path: str) -> Lexicon:
    try:
        raw = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    except (OSError, yaml.YAMLError) as exc:
        raise LexiconError(f"cannot read category lexicon {path}: {exc}") from exc
    try:
        return Lexicon(LexiconFile.model_validate(raw))
    except ValidationError as exc:
        raise LexiconError(f"invalid category lexicon {path}:\n{exc}") from exc
