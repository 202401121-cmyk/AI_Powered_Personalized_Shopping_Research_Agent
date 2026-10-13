# API setup (Sprint 1)

Owner: whoever holds the "sign up and smoke-test every API" task in Sprint 1.
Goal: every key works, the real free-tier limits are written down, and the terms are checked
**before** anyone builds on a source.

Free tiers change without notice. The numbers in the plan were correct in August 2026; record
what you actually see in the table at the bottom and post it in `#dev`.

## Rules for keys

- Keys go only in your local `.env` and in GitHub → Settings → Secrets. Never in code, issues or Slack.
- Each member creates their **own** keys for local work, so one person's usage doesn't exhaust everyone's quota.
- CI never uses real keys: tests run on recorded responses.

## Services

| # | Service | Env var(s) | Where to get it | Check during the smoke test |
|---|---|---|---|---|
| 1 | Groq | `GROQ_API_KEY` | console.groq.com → API Keys | Requests/min, requests/day, **tokens/day** (the tight one); the models available free |
| 2 | Google Gemini | `GEMINI_API_KEY` | aistudio.google.com → Get API key | Your actual limits in AI Studio; the free-tier data-use terms. **Public web text only** |
| 3 | OpenRouter | `OPENROUTER_API_KEY` | openrouter.ai → Keys | Current `:free` models and daily cap |
| 4 | Cerebras | `CEREBRAS_API_KEY` | cloud.cerebras.ai | Requests/min, tokens/day, **context window on the free tier** |
| 5 | Serper | `SERPER_API_KEY` | serper.dev | Free queries: monthly or one-off? Shopping results available for India? |
| 6 | Reddit | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT` | reddit.com/prefs/apps → create a "script" app | **Read the current Data API terms**: is non-commercial read-only access for a student project allowed? Rate limit |
| 7 | YouTube Data API | `YOUTUBE_API_KEY` | console.cloud.google.com → enable "YouTube Data API v3" → Credentials | Daily units (search costs ~100). **Terms for transcripts**: if a transcript library isn't allowed, US-38 uses titles, descriptions and comments only |
| 8 | Jina Reader | `JINA_API_KEY` (optional) | jina.ai/reader | Rate limit with and without a key |
| 9 | Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` | supabase.com → New project (region: Mumbai) | pgvector extension can be enabled; Google sign-in provider configured; free project pause rules |
| 10 | Hugging Face | none needed to download public models | huggingface.co | Models download on a laptop: MiniLM / bge-small, an NLI model |
| 11 | Google Colab | none | colab.research.google.com | A GPU runtime starts; checkpoints save to Drive |

Supabase is one shared project owned by the team (Om as admin), not one per person.
Only the backend ever sees the service-role key.

## Smoke test

For each LLM provider: one tiny call returning JSON, then read the rate-limit response headers.
For each data source: one real request, saved to `backend/tests/fixtures/<source>/` as the first
recorded response (remove anything personal first). These recordings are what the tests use.

## Results table (fill in, then post in `#dev`)

| Service | Works? | Limits seen | Context window (LLMs) | Terms OK? | Notes |
|---|---|---|---|---|---|
| Groq | | | | | |
| Gemini | | | | | |
| OpenRouter | | | | | |
| Cerebras | | | | | |
| Serper | | | — | | |
| Reddit | | | — | | |
| YouTube | | | — | | |
| Jina Reader | | | — | | |
| Supabase | | | — | | |

The LLM rows become `backend/config/models.yaml` (US-26): one entry per model with its context window,
output limit, and whether the free tier trains on prompts.
