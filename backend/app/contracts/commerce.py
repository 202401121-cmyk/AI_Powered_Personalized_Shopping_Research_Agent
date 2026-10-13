"""Stage 11, commerce (US-24, DR-01, DR-04): top products in, offers with an as-of time out."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Literal

from pydantic import Field, HttpUrl, model_validator

from .common import AwareDatetime, Contract, Money, ProductId, VariantId
from .entities import Product
from .intake import Budget

PRICE_STALE_AFTER = timedelta(hours=24)


class CommerceInput(Contract):
    products: list[Product] = Field(min_length=1, max_length=10)
    budget: Budget | None = None


class Offer(Contract):
    product_id: ProductId
    variant_id: VariantId | None = None
    store: str = Field(min_length=1, max_length=80)
    url: HttpUrl
    listing_title: str = Field(max_length=300)
    price: Money | None = None
    availability: Literal["in_stock", "out_of_stock", "unknown"] = "unknown"
    as_of: AwareDatetime
    title_matched: bool = Field(description="Listing title contains the model name")
    variant_matched: bool = False
    over_budget: bool = False

    @model_validator(mode="after")
    def _check(self) -> Offer:
        if not self.title_matched:
            raise ValueError("an offer is accepted only if its title matches the model name (US-24)")
        if self.variant_matched and self.variant_id is None:
            raise ValueError("variant_matched needs a variant_id")
        return self

    def is_stale(self, now: datetime | None = None) -> bool:
        return (now or datetime.now(UTC)) - self.as_of > PRICE_STALE_AFTER


class CommerceResult(Contract):
    offers: list[Offer] = Field(default_factory=list)
    no_offer: dict[ProductId, HttpUrl] = Field(
        default_factory=dict, description="Products with no matching listing -> a store search link"
    )
