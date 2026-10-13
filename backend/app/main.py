"""The HTTP API (US-52): a health check and one search endpoint. No auth and no database yet.

Run: uvicorn app.main:app --reload
"""

from __future__ import annotations

from fastapi import FastAPI

from app.contracts import SCHEMA_VERSION, SearchRequest, SearchResult
from app.pipeline import InMemoryResultStore, PipelineRunner, default_search_stages

app = FastAPI(title="ShopSense", version=SCHEMA_VERSION)
store = InMemoryResultStore()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "schema_version": SCHEMA_VERSION}


@app.post("/api/search", response_model=SearchResult)
def search(request: SearchRequest) -> SearchResult:
    # A plain `def`, so FastAPI runs the (blocking) pipeline in its thread pool, not on the event loop.
    return PipelineRunner(default_search_stages(), store).run(request)
