# Contributing to ShopSense

Everyone builds their own stories, on their own machine, under their own GitHub account.
Commit attribution is checked by the course, so **the person who did the work makes the commit**.

## One-time setup

```bash
git config --global user.name  "Your Full Name"        # the name on your GitHub account
git config --global user.email "you@example.com"       # an email verified on your GitHub account
git clone https://github.com/<org>/shopsense.git
cd shopsense/backend
python -m venv .venv && source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp ../.env.example ../.env                              # fill in only the keys your story needs
pytest -q                                               # should pass before you change anything
```

Check `git config user.email` matches an email on your GitHub account; otherwise your commits won't count as yours.

Windows: use Git Bash or PowerShell. After cloning, run `git config core.autocrlf false`;
`.gitattributes` keeps line endings consistent.

## Building a story, step by step

1. **Pick** your story on the Projects board and move it to *In Progress*. Assign yourself.
2. **Branch** from fresh `main`:
   ```bash
   git switch main && git pull
   git switch -c feature/US-12-research-queries
   ```
3. **Start Claude Code** in the repo root. It reads `CLAUDE.md` automatically. Begin with:
   > Read the GitHub issue for US-12 (pasted below) and `backend/CLAUDE.md`. Propose a plan: files you'll
   > create, contracts you'll use, tests you'll write. Don't write code until I approve the plan.
   Paste the issue text. Review the plan, correct it, then let it build.
4. **Work in small steps.** Ask for tests alongside code. Run `pytest -q`, `ruff check .` and `mypy app` yourself.
   Read every change before you accept it. You must be able to explain your code in a viva.
5. **Commit often**, with the story ID:
   ```bash
   git add -p                         # review what you're committing
   git commit -m "US-12: build queries from the rubric"
   ```
6. **Pull request** when the acceptance criteria are met. Fill in the template checklist. Ask one teammate to review.
7. **Merge** after approval and green CI. Delete the branch. Move the card to *Done*.

## Rules

- One story per branch and pull request. Keep pull requests small; merge within one or two days.
- Pull `main` every day, and rebase your branch if it's behind.
- Never push to `main` directly. Never commit `.env` or any key.
- Don't change a file in `app/contracts/` inside a story. Raise it in `#dev`; contract changes are team decisions.
- Pair work: both people genuinely work on it, one commits, and adds
  `Co-authored-by: Partner Name <partner@example.com>` as the last line of the commit message.
- Stuck for more than an hour? Post in `#dev` with what you tried.

## Reviewing a pull request

Check, in order:

1. Does it meet every acceptance criterion in the issue?
2. Are there tests, including golden tests for any LLM parsing and a fault test for any fallback?
3. Does it break any of the ten build rules in `CLAUDE.md`?
4. Could you explain this code to the instructor?

Approve only if all four are yes. Leave specific comments; "looks good" is not a review.

## Definition of Done

- [ ] Every acceptance criterion met and demonstrated
- [ ] Unit tests and the stage's contract test written and passing
- [ ] Golden tests for any new LLM parser; a fault test for any new fallback
- [ ] Reviewed and approved by another member
- [ ] Merged to `main` with every CI check green
- [ ] No secret or API key in the code
- [ ] Docs or docstrings updated

## Daily standup (Slack `#standup`)

Reply to the day's thread before 10 pm:

```
Yesterday: US-12 query builder done, PR open
Today: US-12 review fixes, start Reddit fetch
Blockers: waiting for Reddit API approval
```
