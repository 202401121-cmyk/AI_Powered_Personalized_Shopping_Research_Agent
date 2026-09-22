"""Write every contract's JSON Schema and the example search to shared/contracts/.

Run from backend/:  python -m scripts.export_contracts

The frontend turns the schemas into TypeScript types (see frontend/CLAUDE.md) and uses the
examples as mock data, so both sides always agree on the same shapes. CI re-runs this script
and fails if the committed files are out of date.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from pydantic import BaseModel

import app.contracts as C
from app.contracts import examples

OUT = Path(__file__).resolve().parents[2] / "shared" / "contracts"


def _dump(obj: object) -> object:
    if isinstance(obj, BaseModel):
        return obj.model_dump(mode="json")
    if isinstance(obj, list):
        return [_dump(o) for o in obj]
    raise TypeError(f"cannot export {type(obj)!r}")


def main() -> int:
    (OUT / "schema").mkdir(parents=True, exist_ok=True)
    (OUT / "examples").mkdir(parents=True, exist_ok=True)

    models = sorted(
        (v for v in vars(C).values() if isinstance(v, type) and issubclass(v, C.Contract) and v is not C.Contract),
        key=lambda m: m.__name__,
    )
    for model in models:
        schema = model.model_json_schema(mode="serialization")
        (OUT / "schema" / f"{model.__name__}.json").write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n")

    for name, build in examples.ALL_EXAMPLES.items():
        data = _dump(build())
        (OUT / "examples" / f"{name}.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

    (OUT / "VERSION").write_text(C.SCHEMA_VERSION + "\n")
    print(f"wrote {len(models)} schemas and {len(examples.ALL_EXAMPLES)} examples to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
