"""The criteria store (US-03): saved generated sets, normalised keys, and broken files ignored."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import pytest

from app.contracts import CriteriaSet
from app.contracts import examples as ex
from app.criteria.store import FileCriteriaStore, InMemoryCriteriaStore, normalise_use_case


def _set(use_case: str | None = "gaming", source: str = "generated", category: str = "laptop") -> CriteriaSet:
    return CriteriaSet.model_validate(
        {**ex.criteria().model_dump(), "category": category, "use_case": use_case, "source": source}
    )


@pytest.mark.parametrize(
    ("raw", "normal"),
    [("gaming", "gaming"), ("Gaming ", "gaming"), ("  Video   Editing ", "video editing"), ("   ", None), (None, None)],
)
def test_use_case_normalisation(raw: str | None, normal: str | None) -> None:
    assert normalise_use_case(raw) == normal


@pytest.mark.parametrize("store_type", ["file", "memory"])
def test_put_get_round_trip_and_normalised_keys(store_type: str, tmp_path: Path) -> None:
    store = FileCriteriaStore(tmp_path) if store_type == "file" else InMemoryCriteriaStore()
    saved = _set("Gaming ")
    store.put(saved)
    assert store.get("laptop", "gaming") == saved
    assert store.get("laptop", "  GAMING") == saved
    assert store.get("laptop", "travel") is None
    assert store.get("laptop", None) is None
    assert store.get("tablet", "gaming") is None


@pytest.mark.parametrize("store_type", ["file", "memory"])
def test_no_use_case_is_its_own_key(store_type: str, tmp_path: Path) -> None:
    store = FileCriteriaStore(tmp_path) if store_type == "file" else InMemoryCriteriaStore()
    store.put(_set(None))
    assert store.get("laptop", None) is not None
    assert store.get("laptop", "") is not None
    assert store.get("laptop", "gaming") is None


@pytest.mark.parametrize("source", ["fallback", "cached"])
@pytest.mark.parametrize("store_type", ["file", "memory"])
def test_only_generated_sets_are_stored(source: str, store_type: str, tmp_path: Path) -> None:
    store = FileCriteriaStore(tmp_path) if store_type == "file" else InMemoryCriteriaStore()
    store.put(_set(source=source))
    assert store.get("laptop", "gaming") is None
    if store_type == "file":
        assert list(tmp_path.iterdir()) == []


def test_files_are_utf8_with_no_crlf(tmp_path: Path) -> None:
    store = FileCriteriaStore(tmp_path)
    store.put(_set("gaming under ₹80,000"))
    (path,) = tmp_path.glob("*.json")
    raw = path.read_bytes()
    assert b"\r\n" not in raw
    assert "₹".encode() in raw
    json.loads(raw.decode("utf-8"))
    assert path.name.startswith("laptop--gaming-under-80-000-")
    assert not list(tmp_path.glob("*.tmp"))


@pytest.mark.parametrize(
    "content",
    [
        b"{ not json",
        b"[]",
        b'{"format": 1, "key": ["laptop", "gaming"], "criteria_set": {"category": "laptop"}}',
        b'{"format": 1, "key": ["tablet", "gaming"], "criteria_set": {}}',
        b"\xff\xfe broken bytes",
    ],
    ids=["not json", "a list", "invalid set", "wrong key", "not utf8"],
)
def test_a_corrupt_file_is_ignored_and_logged(content: bytes, tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.WARNING, logger="app.criteria.store")
    store = FileCriteriaStore(tmp_path)
    store.path_for("laptop", "gaming").write_bytes(content)
    assert store.get("laptop", "gaming") is None
    assert "ignoring" in caplog.text


def test_a_stored_fallback_set_is_ignored(tmp_path: Path) -> None:
    store = FileCriteriaStore(tmp_path)
    store.put(_set())
    path = store.path_for("laptop", "gaming")
    data = json.loads(path.read_text(encoding="utf-8"))
    data["criteria_set"]["source"] = "fallback"
    path.write_text(json.dumps(data), encoding="utf-8")
    assert store.get("laptop", "gaming") is None


def test_a_failed_write_is_logged_not_raised(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    blocker = tmp_path / "not-a-folder"
    blocker.write_text("x", encoding="utf-8")
    store = FileCriteriaStore(blocker / "criteria")  # the parent is a file, so mkdir fails
    store.put(_set())
    assert "could not save" in caplog.text
    assert store.get("laptop", "gaming") is None


def test_different_use_cases_get_different_files(tmp_path: Path) -> None:
    store = FileCriteriaStore(tmp_path)
    assert store.path_for("laptop", "gaming") != store.path_for("laptop", "gaming!")
    assert store.path_for("laptop", "Gaming ") == store.path_for("laptop", "gaming")
    assert store.path_for("laptop", None).name == "laptop.json"
