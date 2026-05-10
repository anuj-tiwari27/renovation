# Why "Configure Supabase to generate AI summaries…" appears

The Summary card you saw is the fallback the app renders when **Supabase isn't connected yet**. The real Summary feature is already coded — it just needs:

1. A Supabase project to read your saved answers from
2. (Optional) An OpenAI API key for the LLM-refined version

When neither is configured, the page renders the stub instead of crashing. As soon as you connect Supabase, you'll see the full client summary, pain-points, design direction, scope draft, suggested materials, and missing-information badges — all generated from the answers you collected in the wizard.

## What to add — minimum viable setup

### 1. Create a Supabase project (3 minutes)

- Go to https://app.supabase.com → **New project**.
- Note the project URL (looks like `https://xxxxxxxxxxxx.supabase.co`) and the **anon / public key** under Project Settings → API.

### 2. Run the SQL migration

In the Supabase SQL editor:

- Paste [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) → **Run**. This creates 19 tables, all enums, RLS policies, helpers, and the storage buckets.
- (Optional) Paste [`supabase/seed/seed.sql`](../supabase/seed/seed.sql) for sample vendors, materials, and a demo project.

### 3. Add env vars

Create a `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional — turns the deterministic summarizer into an LLM-refined one
OPENAI_API_KEY=sk-...
```

If you're deploying to Vercel: set the same vars under **Project → Settings → Environment Variables** (for both Production and Preview).

### 4. Promote yourself to admin

After signing up at `/signup`, run this in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Without this you'll see only client-scoped views (RLS at work).

### 5. Restart the dev server

The env validator (`src/lib/env.ts`) reads vars at boot, so restart `npm run dev`.

## What you'll see after the setup

- `/dashboard` → real KPIs, recent pipeline, pulls projects from Supabase
- `/leads` → kanban populated with rows from `public.projects`
- `/intake/[projectId]` → answers persist into `public.answers` (and bound columns on `public.projects` / `public.clients` / `public.rooms`)
- `/projects/[id]/summary` → the full generated summary (no more stub)
- `/projects/[id]/media` → uploads write to the `project-media` storage bucket
- `/api/pdf/[projectId]` → printable HTML report you can save as PDF

## How the Summary is generated

Two paths in [`src/lib/ai/summarize.ts`](../src/lib/ai/summarize.ts):

- **Local summarizer (always available).** Pure-TS, deterministic. Reads your answers, infers style/palette/scope from kitchen, bath, and full-home modules, flags missing fields. No external calls.
- **LLM refiner (when `OPENAI_API_KEY` is set).** Takes the local summary as a draft, asks gpt-4.1-mini to polish wording while keeping the JSON shape and not inventing facts. Falls back to the local summary on any error.

Either way, the same component renders: client_summary, pain_points, design_direction, scope_draft, suggested_materials, missing_information.

## Common questions

**Q: Can I deploy without Supabase first?**
Yes — the app renders preview shells everywhere, you just won't see real data. Helpful for design review, not for running an actual project.

**Q: Will the wizard's autosave work without Supabase?**
Yes — answers go straight to IndexedDB via the offline outbox. Once Supabase is connected and you reload, the outbox flushes. (Caveat: a draft created against `new:<uuid>` only flushes once the project has a real id; that happens when you create the project from `/intake/new` while Supabase is configured.)

**Q: Can I generate the report PDF without Supabase?**
No — `/api/pdf/[id]` reads project + answers from the database. Connect Supabase first.

**Q: I want richer AI — can I swap providers?**
Yes. `aiSummarize()` is a single function in `src/lib/ai/summarize.ts`. Replace the OpenAI fetch with Anthropic, Google, or any provider that returns JSON; keep the same return shape and the UI doesn't change.
