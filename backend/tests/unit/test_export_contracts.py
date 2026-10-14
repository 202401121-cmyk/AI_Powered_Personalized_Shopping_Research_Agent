"""The contract exporter (US-25): UTF-8 with LF on every OS, and no drift from shared/contracts."""

from __future__ import annotations

import json
from pathlib import Path

import app.contracts as C
from app.contracts import examples
from scripts.export_contracts import OUT, main


def _contract_names() -> set[str]:
    """Every Contract subclass exported by app.contracts, found the same way the script finds them."""
    return {
        v.__name__
        for v in vars(C).values()
        if isinstance(v, type) and issubclass(v, C.Contract) and v is not C.Contract
    }


def _files(root: Path) -> dict[str, bytes]:
    return {p.relative_to(root).as_posix(): p.read_bytes() for p in sorted(root.rglob("*")) if p.is_file()}


def test_export_writes_utf8_lf_json(tmp_path: Path) -> None:
    assert main(tmp_path) == 0

    schemas = {p.stem for p in (tmp_path / "schema").glob("*.json")}
    assert schemas == _contract_names()
    assert {p.stem for p in (tmp_path / "examples").glob("*.json")} == set(examples.ALL_EXAMPLES)

    for path in [*tmp_path.glob("schema/*.json"), *tmp_path.glob("examples/*.json")]:
        raw = path.read_bytes()
        assert b"\r\n" not in raw, path.name
        json.loads(raw.decode("utf-8"))

    assert "₹".encode() in (tmp_path / "examples" / "search_result.json").read_bytes()
    version = (tmp_path / "VERSION").read_bytes()
    assert b"\r\n" not in version
    assert version.decode("utf-8") == C.SCHEMA_VERSION + "\n"


def test_export_matches_committed_shared_contracts(tmp_path: Path) -> None:
    """The CI drift check as a test: a fresh export is byte-identical to shared/contracts/."""
    main(tmp_path)
    fresh, committed = _files(tmp_path), _files(OUT)
    assert fresh.keys() == committed.keys()
    changed = sorted(name for name in fresh if fresh[name] != committed[name])
    assert not changed, f"shared/contracts is out of date: {changed}"
