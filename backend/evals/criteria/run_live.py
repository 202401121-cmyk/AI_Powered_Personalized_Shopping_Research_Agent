"""Live check of criteria generation (US-03). Calls real LLM providers: never run it in CI or pytest.

Run from backend/:  python -m evals.criteria.run_live

For 6 briefs it generates criteria with the real LLM client (and an empty in-memory store, so nothing is read
from or written to the saved-criteria cache), prints them, and checks: generated (not the fallback), 7 to 10
criteria, exactly one value for money, no vague key, a definition on each, and that a gaming laptop and a travel
laptop differ in at least 2 criteria (DR-07). It is a report, not a gate: it exits 0 either way, and skips
cleanly when no LLM key is set. Keys are read only from the environment and never printed.
"""

from __future__ import annotations

import io
import sys
from dataclasses import dataclass

from app.contracts import CriteriaInput, CriteriaSet, StageContext
from app.criteria import CriteriaStage, InMemoryCriteriaStore
from app.criteria.parsing import MIN_DEFINITION_WORDS, is_vague
from app.llm import build_llm_client

BRIEFS = [
    ("laptop gaming", CriteriaInput(category="laptop", category_label="Laptop", use_case="gaming")),
    ("laptop travel", CriteriaInput(category="laptop", category_label="Laptop", use_case="travel")),
    ("phone camera", CriteriaInput(category="smartphone", category_label="Smartphone", use_case="camera")),
    ("earbuds gym", CriteriaInput(category="earbuds", category_label="Earbuds", use_case="gym")),
    ("mixer grinder", CriteriaInput(category="mixer_grinder", category_label="Mixer grinder")),
    (
        "standing desk",
        CriteriaInput(category="standing_desk", category_label="Standing desk", use_case="work from home"),
    ),
]
MIN_DIFFERENT_KEYS = 2


@dataclass
class Row:
    brief: str
    source: str
    count: int
    problems: list[str]

    @property
    def passed(self) -> bool:
        return not self.problems


def check(name: str, result: CriteriaSet) -> Row:
    problems: list[str] = []
    if result.source != "generated":
        problems.append(f"fell back ({result.source})")
    if not 7 <= len(result.criteria) <= 10:
        problems.append(f"{len(result.criteria)} criteria, want 7-10")
    value_for_money = sum(c.is_value_for_money for c in result.criteria)
    if value_for_money != 1:
        problems.append(f"{value_for_money} value-for-money criteria")
    vague = [c.key for c in result.criteria if not c.is_value_for_money and is_vague(c.key)]
    if vague:
        problems.append(f"vague: {', '.join(vague)}")
    thin = [c.key for c in result.criteria if len(c.definition.split()) < MIN_DEFINITION_WORDS]
    if thin:
        problems.append(f"thin definitions: {', '.join(thin)}")
    return Row(name, result.source, len(result.criteria), problems)


def main() -> int:
    if isinstance(sys.stdout, io.TextIOWrapper):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    llm = build_llm_client()
    if not llm.adapters:
        print("Skipped: no LLM key is set (GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY or CEREBRAS_API_KEY).")
        return 0

    stage = CriteriaStage(llm, InMemoryCriteriaStore())
    ctx = StageContext(search_id="srch_evalcriteria1", time_limit_s=120)
    results: dict[str, CriteriaSet] = {}
    rows: list[Row] = []
    for name, inp in BRIEFS:
        result = stage.run(inp, ctx)
        results[name] = result
        rows.append(check(name, result))
        print(f"\n{name} ({result.source}):")
        for c in result.criteria:
            vfm = " [value for money]" if c.is_value_for_money else ""
            print(f"  - {c.key} ({c.direction.value}, weight {c.default_weight:g}){vfm}: {c.definition}")

    gaming = {c.key for c in results["laptop gaming"].criteria}
    travel = {c.key for c in results["laptop travel"].criteria}
    different = max(len(gaming - travel), len(travel - gaming))  # criteria one use has and the other lacks
    use_row = Row("gaming vs travel", "-", different, [])
    if different < MIN_DIFFERENT_KEYS:
        use_row.problems.append(f"only {different} different criteria, want at least {MIN_DIFFERENT_KEYS}")

    print(f"\n{'brief':<18} {'source':<10} {'count':>5}  result")
    for row in [*rows, use_row]:
        verdict = "pass" if row.passed else "FAIL: " + "; ".join(row.problems)
        print(f"{row.brief:<18} {row.source:<10} {row.count:>5}  {verdict}")
    passed = sum(r.passed for r in [*rows, use_row])
    print(f"\n{passed} of {len(rows) + 1} checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
