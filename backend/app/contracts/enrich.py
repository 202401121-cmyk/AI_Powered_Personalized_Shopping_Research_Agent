"""Stage 8, enrich (US-41, FR-24): look up missing high-weight facts for the top products."""

from __future__ import annotations

from pydantic import Field

from .claims import Claim
from .common import Contract, ProductId, Slug

MAX_ENRICH_SEARCHES = 6
MAX_ENRICH_LLM_CALLS = 1
ENRICH_TOP_N = 5


class EnrichTarget(Contract):
    product_id: ProductId
    product_name: str = Field(max_length=150)
    criterion_key: Slug


class EnrichInput(Contract):
    targets: list[EnrichTarget] = Field(max_length=ENRICH_TOP_N * 3)


class EnrichResult(Contract):
    new_claims: list[Claim] = Field(default_factory=list, description="Only values a page actually supports")
    attempted: list[EnrichTarget] = Field(default_factory=list)
    searches_used: int = Field(default=0, ge=0, le=MAX_ENRICH_SEARCHES)
    llm_calls_used: int = Field(default=0, ge=0, le=MAX_ENRICH_LLM_CALLS)
