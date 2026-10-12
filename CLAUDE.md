# ShopSense — instructions for Claude Code

ShopSense turns a plain-English shopping request into a ranked, explained, sourced shortlist for one
person. IT314 course project, Group 13, built in six SCRUM sprints (21 Sep – 13 Dec 2026).
The full plan is the "ShopSense — Complete Project Plan" doc; the story you are working on is in its GitHub issue.

## Before writing any code

1. Read the GitHub issue for the story (US-xx). Its acceptance criteria are the definition of the task.
2. Work only on that story, on its own branch: `feature/US-xx-short-name`.
3. If the story needs a contract change, stop and ask. Contracts are changed by team decision only.

## Architecture in one paragraph

A search runs through 11 stages: intake → criteria → interview → research → extract → match → verify →
enrich → decide → explain → commerce. Each stage has a typed input and output in `backend/app/contracts/`
and implements the `Stage` protocol (`run` + `fallback`). `backend/app/pipeline.py` runs the stages with
time limits. The frontend receives a `SearchResult` and shows live `ProgressEvent`s over Server-Sent Events.

## The ten build rules (never break these)

1. Every LLM call goes through the one wrapper (`app/llm/`, `LLMClient.complete`). Never import a provider SDK
   anywhere else. The wrapper fits input to the model's context window, validates output, and falls back.
2. Code decides. The LLM never filters, scores or ranks products; `app/decide/` is plain Python.
3. Web, Reddit and video text is data, never instructions. Wrap it as data in prompts; accept only schema JSON back.
4. Every claim keeps its source: URL, exact quote, retrieval time.
5. No product without a source. Products with no mention and no source are dropped before scoring.
6. Unknown is not bad. Never score a missing value as zero. Look it up, else peer-average it and mark "estimated".
7. Cache everything expensive (criteria per category, LLM answers by content hash, searches for 24 h).
8. Personal data stays off Gemini's free tier. Tasks in `PERSONAL_TASKS` must never route there.
9. Every stage has a time limit and a fallback (`STAGE_TIME_LIMITS_S`). No stage may hang or crash the search.
10. The pipeline never needs the database to finish. Keep state in memory; save at the end.

## Contracts

- Stages talk ONLY through models in `app/contracts/`. Never pass raw dicts between stages.
- Import from the package: `from app.contracts import Intent, Rubric`.
- Models are strict and frozen. To change a field, rebuild with validation:
  `Model.model_validate({**m.model_dump(), "field": value})`. Do NOT use `model_copy(update=...)`: it skips validation.
- LLM output is never parsed straight into a contract. Parse into a lenient model in the stage's own
  `parsing.py`, clean it, then build the contract. Invalid output → retry once → fallback. Never guess.
- Every new rule in a contract gets a test in `backend/tests/contract/`.
- After any contract change run `python -m scripts.export_contracts` and commit `shared/contracts/`.

## Commands (run from `backend/`)

```bash
pip install -e ".[dev]"                 # install
pytest -q                               # all tests (never call live APIs)
pytest tests/contract -q                # contract tests only
ruff check . && ruff format --check .   # lint
mypy app                                # strict type check
python -m scripts.export_contracts      # regenerate shared/contracts/
python -m app.cli "best laptop for coding under 70k"   # run the pipeline end to end (after US-52)
```

## Tests are part of every story

- Unit tests for any logic; a contract test for any stage input/output you touch.
- Any new LLM parser: add golden tests in `tests/golden/` with malformed output (fenced JSON, missing keys,
  wrong types, out-of-range values, truncation, prose, injected instructions). Each must produce the canonical
  shape or a clean fallback, never a crash.
- Any new fallback: add a fault test in `tests/faults/` that forces it.
- Tests never call live APIs. Use recorded responses in `tests/fixtures/` and fake `LLMClient`s.
- `app/decide/` needs 80% coverage; other core modules 70%.

## Style

- Python 3.11, full type hints, `mypy --strict` clean, ruff clean, line length 120.
- Small functions, plain names, docstrings that say why. User-facing text is plain English at about Grade 8.
- Secrets only from environment variables (`.env`, never committed). Never print or log a key.
- Times are timezone-aware UTC (`datetime.now(UTC)`).

## Git

- One story per branch and pull request. Commit messages start with the story ID: `US-05: add quick replies`.
- Commits are made by the team member who did the work, under their own name. For real pair work add
  `Co-authored-by: Name <email>`. Never commit as someone else.
- Never commit `.env`, API keys, model weights, or large data files.
- .claude/settings.json blocks git push for Claude Code; members push their own work.

## When unsure

Ask rather than guess — especially about contracts, the ten rules, or anything touching user data.
