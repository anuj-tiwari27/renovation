# Remodel Studio

Premium remodeling discovery, intake, and estimation PWA — kitchen, bath, and full-home — designed for sales consultants, designers, estimators, and project managers running high-ticket residential remodels.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 · shadcn-style components · Supabase (Auth, Postgres, Storage, RLS) · Zustand · React Hook Form + Zod · Dexie/IndexedDB outbox · Service-worker PWA · OpenAI optional.

---

## Highlights

- **Dynamic intake wizard** — questionnaires adapt to project type and selected rooms, with conditional logic (e.g. steam shower → ask for waterproofing + generator location), real-time progress, and required-field validation.
- **Offline-first** — every answer hits an IndexedDB outbox first, then syncs to Supabase when the network returns. Photos, videos, voice notes, and PDFs queue the same way. Tablet-friendly (44px tap targets, large slider thumbs, no hover-only UI).
- **Premium UI** — Notion/Linear-grade layout, dark mode, motion-aware, with image-card style pickers and color swatches.
- **Role-based access** — admin, sales, designer, estimator, project_manager, client — enforced by Postgres RLS, not just by UI.
- **AI summary** — deterministic local summarizer ships out of the box; if `OPENAI_API_KEY` is set, the API is asked to refine the same JSON shape.
- **PDF report** — printable HTML route at `/api/pdf/[projectId]` (use browser "Save as PDF"; pluggable for headless Chrome later).
- **Audit-friendly schema** — separate `activities` log + immutable `audit_log` table.

## Modules in this build

| Module | Status |
| --- | --- |
| Auth (email/password, magic link, Google OAuth) | shipped |
| Dashboard (KPIs + recent pipeline) | shipped |
| Leads (kanban, all statuses) | shipped |
| Projects list + detail | shipped |
| Intake wizard (Client info, Project overview, Kitchen, Bathroom, Full home, Budget, Timeline) | shipped |
| Conditional logic engine | shipped |
| Per-room repetition (kitchen, primary/guest bath, powder) | shipped |
| Sliders for luxury / boldness / budget flex / timeline urgency | shipped |
| Style cards + color swatches | shipped |
| Media upload (offline-queued via IndexedDB) | shipped |
| AI summary + scope draft + missing-info | shipped |
| Printable report (`/api/pdf/[projectId]`) | shipped |
| Estimate scaffold + scope items table | shipped |
| Admin: users + analytics | shipped |
| Calendar (read-only) | shipped |
| PWA (manifest, SW, offline page, push) | shipped |
| Docker + GitHub Actions CI | shipped |

Stretch areas the architecture is wired for but not implemented yet: floorplan annotation canvas, e-signature pad capture into `signatures`, full daily-log UI, change-order UI, vendor catalog browser, push notification triggers.

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local
#    Fill in NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
#    (the rest are optional)

# 3. Run database migration in Supabase SQL editor
#    Paste supabase/migrations/0001_init.sql, then supabase/seed/seed.sql

# 4. Dev server
npm run dev
# open http://localhost:3000

# 5. Sign up at /signup, then in Supabase SQL editor:
#    update public.profiles set role = 'admin' where email = 'you@example.com';
```

The app gracefully renders a **preview mode** without Supabase configured (mocked admin user, no data) so you can demo the UI before provisioning the backend.

## Environment variables

| Var | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL from Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | For server-side admin tasks (cron jobs, etc.) |
| `OPENAI_API_KEY` | optional | Enables LLM-refined summaries; falls back to local summarizer |
| `NEXT_PUBLIC_APP_URL` | optional | e.g. `https://app.example.com` |
| `NEXT_PUBLIC_APP_NAME` | optional | Display name in the header / PDF |
| `NEXT_PUBLIC_COMPANY_NAME` | optional | Company name in the PDF report |
| `RESEND_API_KEY`, `TWILIO_*` | optional | Email / SMS notification placeholders |

## Database

See [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Highlights:

- Postgres enums: `user_role`, `project_type`, `project_status`, `media_kind`, etc.
- Generated columns: `scope_items.total = qty * unit_price` (stored).
- RLS helpers: `public.has_role`, `public.is_staff`, `public.is_admin`, `public.can_read_project`, `public.can_write_project`.
- Auth trigger: every new `auth.users` row creates a `profiles` row.
- Storage buckets: `project-media` (private), `estimates` (private), `avatars` (public).

To regenerate TypeScript types from your live Supabase project (recommended once linked):

```bash
npx supabase login
npx supabase link --project-ref YOUR_REF
npm run db:types
```

Then re-add the generic to `src/lib/supabase/{client,server,middleware}.ts`:

```ts
createBrowserClient<Database>(...)
```

## Project layout

```
src/
  app/
    (app)/                  # authenticated layout: sidebar + topbar
      dashboard/            # KPI dashboard
      leads/                # kanban
      projects/             # list, detail, /media, /summary, /estimate
      intake/new/           # type/rooms picker + create
      intake/[projectId]/   # the dynamic wizard
      calendar/, estimates/, inspiration/
      admin/analytics/, admin/settings/
    api/                    # health, /pdf/[projectId]
    auth/callback/          # OAuth + magic link exchange
    login/, signup/, offline/
  components/
    ui/                     # shadcn-style primitives (button, card, slider, ...)
    layout/                 # sidebar, topbar
    intake/                 # wizard + field renderer
    media/                  # dropzone w/ offline queue
    providers.tsx           # theme, react-query, sonner, offline watcher
  lib/
    intake/                 # types, conditional-logic engine, schemas
    supabase/               # client, server, middleware, types
    offline/                # Dexie outbox + flush
    ai/                     # summary builder (local + OpenAI)
    utils/                  # cn, formatters
    env.ts                  # zod-validated env
  store/                    # Zustand (intake drafts, last-step memory)
public/
  manifest.webmanifest, sw.js, robots.txt
supabase/
  migrations/0001_init.sql
  seed/seed.sql
```

## Architecture notes

- **Form schema engine.** Every intake form is a `QuestionSet` (`src/lib/intake/types.ts`) declared in TS. Sections + fields support `showWhen` conditions: `equals`, `in`, `truthy`, `gte/lte`, `any/all/not`. The engine in `src/lib/intake/logic.ts` evaluates them, handles progress, and surfaces missing required fields.
- **Per-room sets.** A set with `perRoom: true` and `roomKinds: [...]` is rendered once for each matching room the user picks (e.g. kitchen, primary bath). The plan is computed by `planForProject(type, rooms)`.
- **Field bindings.** Fields can declare `bind: { table: "projects" | "clients" | "rooms", column }`. The data layer routes those answers to canonical columns (used directly by the dashboard, leads, summary). Unbound answers go to the `answers` table for full freeform support.
- **Autosave + outbox.** Every keystroke updates the Zustand draft store (persisted to localStorage) and enqueues an `answer.upsert` operation to the IndexedDB outbox (`src/lib/offline/outbox.ts`). The offline watcher flushes the outbox every 15s, when the window regains focus, and when the browser comes online. Mutations are idempotent (composite-key upserts).
- **Media uploads.** Files are stored as `Blob`s in `mediaCache` and matched 1:1 to outbox rows. Reconnect → blob is uploaded to `project-media`, then a `media` row is inserted. Failed attempts increment `attempts` and store `lastError` for future retry/backoff.

## Production build

```bash
npm run build
npm start
```

Outputs ~22 routes, server-rendered or static as appropriate. Middleware refreshes Supabase sessions and protects `/dashboard`, `/admin`, `/intake`, `/leads`, `/projects`.

## Docker

```bash
docker build -t remodel-studio .
docker run --rm -p 3000:3000 --env-file .env.local remodel-studio
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs install → typecheck → lint → build on every push.

## Security checklist

- RLS enabled on every public table; client role only sees linked projects.
- Storage policies require staff role for writes; clients can only read media linked to their projects.
- Strict headers set in `next.config.ts` (XFO, Referrer-Policy, Permissions-Policy).
- Service worker explicitly opts out of caching mutations — those queue via the in-app outbox so we never replay stale POSTs.
- Env vars validated by Zod — the app refuses to leak missing-config bugs into runtime.

## License

UNLICENSED — internal tooling. Adapt the license before distributing.
