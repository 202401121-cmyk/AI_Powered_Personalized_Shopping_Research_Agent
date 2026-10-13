"""Stage 10, explain (US-20, US-22, FR-21): ranking and evidence in, checked explanations out."""

from __future__ import annotations

from typing import Literal

from pydantic import Field, model_validator

from .claims import Claim
from .common import ClaimId, Contract, ProductId, Slug
from .decide import RankedProduct


class ExplainInput(Contract):
    ranked: list[RankedProduct] = Field(max_length=10, description="Explain the top products only")
    claims: list[Claim] = Field(description="The evidence the sentences may cite")
    user_priorities: list[Slug] = Field(max_length=10)


class ExplanationSentence(Contract):
    text: str = Field(min_length=3, max_length=400)
    claim_ids: list[ClaimId] = Field(default_factory=list)
    supported: bool | None = Field(default=None, description="NLI verdict; None when not checked")


class Explanation(Contract):
    product_id: ProductId
    sentences: list[ExplanationSentence] = Field(min_length=1, max_length=8)
    trade_off: str | None = Field(default=None, max_length=300)
    unverified: list[Slug] = Field(default_factory=list, description="Criteria we could not verify, named")
    method: Literal["llm_checked", "llm_unchecked", "template"]

    @model_validator(mode="after")
    def _check(self) -> Explanation:
        if self.method == "llm_checked" and any(s.supported is False for s in self.sentences):
            raise ValueError("unsupported sentences must be removed or replaced before output (US-22)")
        if self.method != "template" and any(not s.claim_ids for s in self.sentences):
            raise ValueError("every generated sentence must cite at least one claim")
        return self


class ExplainResult(Contract):
    explanations: list[Explanation]
