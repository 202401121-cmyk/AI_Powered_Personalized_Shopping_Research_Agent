"""Stage 5, extract (US-14, US-42): one source in, mentions and claims out."""

from __future__ import annotations

from typing import Literal

from pydantic import Field, model_validator

from .common import AwareDatetime, ClaimId, ClaimType, Contract, Fraction, Score10, Slug, SourceId
from .research import Source


class ExtractInput(Contract):
    source: Source
    criterion_keys: list[Slug] = Field(min_length=1, max_length=10)
    category_label: str = Field(max_length=60)


class ProductMention(Contract):
    raw_name: str = Field(min_length=1, max_length=150)
    is_product: bool = Field(description="False for product types such as 'memory foam' (US-14)")
    brand: str | None = Field(default=None, max_length=60)
    author: str | None = Field(default=None, max_length=80, description="For distinct-recommender counts")
    recommends: bool | None = None


class Claim(Contract):
    """One statement about one product, always with its exact quote (build rule 4)."""

    id: ClaimId
    source_id: SourceId
    product_raw_name: str = Field(min_length=1, max_length=150)
    criterion_key: Slug | None = Field(default=None, description="None = general opinion")
    value: float | bool | str | None = Field(default=None, description="A spec value, e.g. 1.4 for kg")
    unit: str | None = Field(default=None, max_length=16)
    score: Score10 | None = Field(default=None, description="0 to 10 judgement for this criterion")
    quote: str = Field(min_length=3, max_length=600, description="Exact words from the source")
    claim_type: ClaimType
    polarity: Literal["positive", "negative", "neutral"]
    weight: Fraction = Field(default=1.0, description="Lowered by sarcasm, weak complaints (US-42)")
    retrieved_at: AwareDatetime

    @model_validator(mode="after")
    def _check(self) -> Claim:
        if self.value is None and self.score is None:
            raise ValueError("a claim needs a value, a score, or both")
        if self.score is not None and self.criterion_key is None:
            raise ValueError("a scored claim must name its criterion")
        return self


class ExtractionResult(Contract):
    source_id: SourceId
    mentions: list[ProductMention] = Field(default_factory=list, max_length=100)
    claims: list[Claim] = Field(default_factory=list, max_length=200)

    @model_validator(mode="after")
    def _check(self) -> ExtractionResult:
        if any(c.source_id != self.source_id for c in self.claims):
            raise ValueError("every claim must come from this result's source")
        return self
