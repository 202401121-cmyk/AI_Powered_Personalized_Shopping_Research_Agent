"""The command-line search (US-52)."""

from __future__ import annotations

import pytest

from app.cli import main


def test_cli_prints_a_ranked_list_with_sources(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["best laptop for coding under 70k"]) == 0
    out = capsys.readouterr().out
    assert "Nova Book 14" in out
    assert "Vela Pro 14" in out  # the can't-tell product and its reason
    assert "1. Nova Book 14" in out
    assert "source: https://" in out
    assert "Filtered out:" in out and "Aurora Air 13" in out
    assert "Coverage note: YouTube timed out." in out
