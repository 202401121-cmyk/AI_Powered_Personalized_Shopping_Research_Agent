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
    assert "₹70,000" in out  # the rupee sign survives, not "?"
    assert "Coverage note: YouTube timed out." in out


def test_cli_shows_what_it_understood(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["best laptop for coding under 70k"]) == 0
    assert "Understood: Laptop · budget up to ₹70,000 · region IN" in capsys.readouterr().out


def test_cli_asks_instead_of_searching_when_the_product_is_unclear(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["watch under 5k"]) == 1
    out = capsys.readouterr().out
    assert "Which kind of watch do you mean?" in out
    assert "1. Smartwatch" in out
    assert "Results for" not in out  # no research until the category is known
