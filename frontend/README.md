# ShopSense Frontend — US-01 Foundation

Next.js (App Router), TypeScript strict, Tailwind CSS, and the **THEME "PROOF"** design system.

---

## 1. Architecture Overview

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout: Schibsted Grotesk, Public Sans, JetBrains Mono
│   │   ├── globals.css        # THEME "PROOF" tokens (light/dark), focus rings, reduced motion
│   │   ├── page.tsx           # Intake request page (720px column layout)
│   │   ├── results/page.tsx   # Results page (1120px layout, all evidence states)
│   │   ├── interview/page.tsx # Interview placeholder for Teammate #11 (US-05)
│   │   ├── design/page.tsx    # Design system showroom & atom showcase
│   │   └── api/mock/          # Mock endpoints serving shared/contracts/examples/*.json
│   ├── components/
│   │   ├── ui/                # Design atoms: Button, Input, Textarea, Card, Badge, Wordmark, etc.
│   │   └── intake/            # US-01 Intake: RequestBox, ClarificationPrompt, ExampleRequests, IntentSummary
│   ├── lib/
│   │   ├── api/               # Typed API client with MockApiAdapter and LiveApiAdapter
│   │   ├── session/           # Global session store and React context
│   │   └── mock-intake.ts     # Offline intake simulator matching Intent contracts
│   └── types/contracts/       # Generated from shared/contracts/schema/*.json (do not edit)
```

---

## 2. THEME "PROOF"

Documented verbatim in [`docs/design/THEME.md`](file:///c:/Users/rakes/OneDrive/Desktop/AI_Powered_Personalized_Shopping_Research_Agent/docs/design/THEME.md):

* **Typography**:
  * Headings / Display: `Schibsted Grotesk 600–800`, tracking -0.02em at 32px and up.
  * Body: `Public Sans 400–600`, 16px, line-height 1.6.
  * Prices & Chips: `JetBrains Mono 400–500`.
  * *Strictly banned*: Inter, Roboto, Arial, gradients, glassmorphism, emojis, stock illustrations.
* **Colors**:
  * Canvas: `#F6F7F9` (light) / `#0B1016` (dark).
  * Brand (Verdigris): `#0B6B60` (light) / `#4FC4AF` (dark).
  * Evidence States:
    * **Known** = Brand
    * **Disputed** = `#B12345` on `#FBE7EC` (light) / `#F3809B` on `#3A1622` (dark)
    * **Estimated** = `#9A5806` on `#FCF0DB` (light) / `#E8B15F` on `#33260F` (dark)
    * **Not verified** = Muted on `#EDF0F4` (light) / `#1C2632` (dark)
    * **Tie / info** = `#2350AE` on `#E6EDFA` (light) / `#8DB0F6` on `#15233D` (dark)
* **Depth & Radii**:
  * Radius 14 for cards, 10 for inputs and buttons, full pill for badges.
  * Composer shadow: `0 12px 32px -18px rgba(14,23,38,.35)`.

---

## 3. Contracts & Type Generation

Types come strictly from the backend via exported JSON Schemas in `shared/contracts/schema/`:

```bash
npm run gen:types       # executes scripts/gen-frontend-types.sh
```

Never edit files in `src/types/contracts/*.d.ts` by hand.

---

## 4. Typed API Client (Mock & Live Adapters)

The frontend features a unified API interface (`src/lib/api/client.ts`):
* **MockApiAdapter**: Reads from `shared/contracts/examples/` (`search_result.json`, `intent.json`, `intent_unclear.json`) and emulates SSE progress events.
* **LiveApiAdapter**: Connects to the real backend REST endpoints and `/api/search/stream` Server-Sent Events.
* **Switching Mode**: Default is `"mock"`. Set `NEXT_PUBLIC_API_MODE="live"` and `NEXT_PUBLIC_API_URL="http://localhost:8000"` to connect to the live backend.

---

## 5. Teammate Ownership & Extension Points

* **Teammate #9 (Request Screen & Intake Experience)**:
  * Owns the user intake screen flow (`src/components/intake/RequestBox.tsx`).
* **Teammate #11 (Interview Chat Window — US-05)**:
  * Owns the interview page (`src/app/interview/page.tsx`).
* **US-01 (Foundation)**:
  * Provides app shell, design tokens, typed API client, session store, results screen demonstration, and design showroom.

---

## 6. Verification Commands

Run from `frontend/`:

```bash
npm run lint            # ESLint (strict Next.js Core Web Vitals)
npx tsc --noEmit        # Strict TypeScript check
npm test                # Vitest unit and component tests
npm run build           # Next.js optimized production build
```
