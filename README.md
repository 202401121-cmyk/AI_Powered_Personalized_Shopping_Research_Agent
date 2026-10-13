# AI_Powered_Personalized_Shopping_Research_Agent
AI-Powered Personalized Shopping Research Agent that understands user preferences, researches products from multiple sources, verifies evidence, and provides personalized product recommendations with comparisons, explanations, citations, price, and availability information.

---

# ShopSense

ShopSense turns a plain-English shopping request into a ranked, explained, sourced shortlist for one person.
It asks a few smart questions, researches Reddit, YouTube, review sites and search results, and shows
where every claim came from. When it isn't sure, it says so.

IT314 Software Engineering · Group 13 · SCRUM, six two-week sprints, 21 Sep – 13 Dec 2026.
The full plan (requirements, 51 user stories, EPICs, sprints, testing, risks) is the
"ShopSense — Complete Project Plan" document.

## What's in this starter pack

Everything the team needs **before** writing feature code. Nothing here is a feature; the features are the stories.

| Path | What it is |
|---|---|
| `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md` | Rules Claude Code follows in every team member's session: the ten build rules, contracts, tests, style, git |
| `CONTRIBUTING.md` | How each member builds a story: setup, branch, Claude Code workflow, PR, review, Definition of Done |
| `backend/app/contracts/` | **The stage contracts**: typed input and output for all 11 stages, the `Stage` interface, the LLM wrapper interface, time limits |
| `backend/app/contracts/examples.py` | One complete, valid example search (fictional products) with every awkward case: disputed, estimated, tie, filtered, can't tell, failed source, stale price |
| `backend/tests/contract/` | 57 tests proving the contracts accept good data and reject bad data |
| `shared/contracts/` | JSON Schemas and example JSON exported from the contracts, for the frontend |
| `scripts/gen-frontend-types.sh` | Turns the schemas into TypeScript types |
| `backlog/stories.yaml` | All 51 stories: front and back of the card, points, sprint, tier |
| `scripts/create_github_issues.py` | Validates the backlog and creates the GitHub issues, labels and sprint milestones |
| `.github/` | CI (lint, strict types, tests, coverage, contract drift, secret scan), PR template, issue templates |
| `docs/sprint-1-kickoff.md` | Setup checklist, planning agenda, contract review, first week, review checklist |
| `docs/api-setup.md` | Every API key: where to get it, what to verify, results table |
| `docs/elicitation-kit.md` | Survey, interview script, observation and expert templates, and how to write up findings |
| `.env.example`, `.gitignore` | Every environment variable the project uses; what never gets committed |

## Order of use

1. **Om:** create the repo, protect `main`, add all 10 members, commit this pack (see below).
2. **Om:** `python scripts/create_github_issues.py --repo <owner>/shopsense` to create the backlog, then a Projects board.
3. **Everyone:** read `CLAUDE.md` and `CONTRIBUTING.md`; set `git config user.name` and `user.email` to your own GitHub identity.
4. **Sprint 1 planning:** follow `docs/sprint-1-kickoff.md`. The contract review is the most important 30 minutes of the project.
5. **Start in parallel:** survey (`docs/elicitation-kit.md`), API sign-ups (`docs/api-setup.md`), and the Sprint 1 stories.

## Quick start (backend)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest -q                       # 57 contract tests
ruff check . && mypy app        # lint and strict types
```

## Who commits what

The course checks that each person's commits reflect their own work, so each part of this pack should be
reviewed, adapted and committed by the person responsible for it:

| Files | Story | Owner (suggested in the plan) |
|---|---|---|
| `.github/`, `.gitignore`, `.env.example`, `CONTRIBUTING.md`, `CLAUDE.md` | US-25 | Om Pandya |
| `backend/app/contracts/`, `shared/contracts/`, `backend/scripts/`, `scripts/gen-frontend-types.sh` | US-52 | Manu Pardhan, Om Pandya (after the contract review) |
| `backend/tests/contract/`, `docs/api-setup.md` | test scaffolding, API smoke tests | Jhanvi Barot, Jenish Kavad |
| `docs/elicitation-kit.md` | elicitation | Jhanvi Barot and the interviewers |
| `backlog/`, `scripts/create_github_issues.py`, `docs/sprint-1-kickoff.md` | Product Owner | Om Pandya |
| `frontend/CLAUDE.md` | US-01 | Vaishvi Mehta |

These are drafts to start from. Change anything the team disagrees with at the Sprint 1 contract review,
and record who decided what in `#ceremonies`.
