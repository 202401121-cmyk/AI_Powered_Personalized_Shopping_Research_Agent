#!/usr/bin/env bash
# Generate TypeScript types for the frontend from the backend's exported JSON Schemas.
# Run from the repo root or from frontend/. Needs Node 18+.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMAS="$ROOT/shared/contracts/schema"
OUT="$ROOT/frontend/src/types/contracts"

mkdir -p "$OUT"
for schema in "$SCHEMAS"/*.json; do
  name="$(basename "$schema" .json)"
  npx --yes json-schema-to-typescript@15 \
    -i "$schema" -o "$OUT/$name.d.ts" \
    --no-additionalProperties --maxItems=-1 --bannerComment "// Generated from shared/contracts/schema/$name.json. Do not edit."
done
echo "Generated $(ls "$OUT" | wc -l) type files in $OUT"
