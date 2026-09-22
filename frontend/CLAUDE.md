# Frontend — extra instructions for Claude Code

Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui. The app itself is created by US-01.

## Types come from the backend, never by hand

The backend's contracts are exported to `shared/contracts/schema/*.json`. Generate TypeScript from them:

```bash
bash ../scripts/gen-frontend-types.sh     # writes src/types/contracts/*.d.ts
```

Never edit the generated files and never redefine these shapes by hand. If a type is wrong, the contract
must change in the backend first (team decision), then regenerate.

## Mock data

`shared/contracts/examples/*.json` holds one complete, valid search. Build and test every screen against it
before the backend endpoint exists. `search_result.json` deliberately includes the awkward cases below.

## Every screen must render every state

A component with no design for one of these is not done:

- **Disputed** value: both values, each with its source
- **Unknown** value: "Not verified", never blank, never 0
- **Estimated** value: labelled "estimated", with the data-coverage percentage
- **Tie**: "Too close to call" and the criterion that separates them
- **Filtered out**: the reason, e.g. "₹94,990 is above your ₹80,000 budget"
- **Can't tell**: its own labelled group, with a link to research it
- **Partial or degraded result**: show `coverage_note` prominently
- **Stale price**: older than 24 h → "may have changed"; no offer → store search link
- **Not saved**: `saved: false` → banner "results won't be saved"
- **Interview**: question, answer-then-repeat, rephrase with buttons, redirect, skipped

## Rules

- No business logic in the browser except the instant re-rank (US-23): score = Σ(score × weight) / Σ weight,
  computed from data already loaded, with no server call.
- Live progress uses Server-Sent Events carrying `ProgressEvent`.
- Accessibility: keyboard-only use works, WCAG AA contrast, every slider has a number box (US-33).
- Plain English at about Grade 8 in all user-facing text.
