## Story

Closes #<issue number> — **US-xx**: <story title>

## What this changes

<!-- Two or three sentences. What does the user or the pipeline do differently now? -->

## How to check it

<!-- Commands or clicks a reviewer can use, e.g. `pytest tests/unit/research -q` or `python -m app.cli "..."` -->

## Definition of Done

- [ ] Every acceptance criterion in the issue is met (list any that are not, and why)
- [ ] Unit tests and the stage's contract test are written and pass
- [ ] Golden tests added for any new LLM parser
- [ ] A fault test added for any new fallback
- [ ] No change to `app/contracts/` (or: the team agreed it in `#dev`, and `shared/contracts/` is regenerated)
- [ ] None of the ten build rules in `CLAUDE.md` is broken
- [ ] No secret or API key in the code
- [ ] I can explain every line of this change

## Reviewer checklist

- [ ] Meets the acceptance criteria
- [ ] Tests are real (they would fail if the code were wrong)
- [ ] Follows the ten build rules
- [ ] Understandable without asking the author
