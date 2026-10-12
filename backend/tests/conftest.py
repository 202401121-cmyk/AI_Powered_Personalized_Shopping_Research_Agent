"""Shared test setup.

No test may ever reach a real LLM provider, even on a machine whose .env holds real keys: the pre-search flow's
LLM client is replaced by a fake that is always unavailable, so intake answers with its keyword rules.
Tests that need LLM answers build an IntakeStage with their own FakeLLMClient.
"""

from __future__ import annotations

import pytest

from tests.fakes.llm import FakeLLMClient


@pytest.fixture(autouse=True)
def _no_live_llm(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.presearch.default_llm", lambda: FakeLLMClient())
