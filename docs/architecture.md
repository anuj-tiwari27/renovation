# Architecture

## High-level

```
┌─────────────────────────────────────────────────────────────────────┐
│ Browser / installed PWA                                             │
│  ├─ Next.js 15 App Router (RSC + client islands)                    │
│  ├─ Service worker (sw.js): app shell + offline page + push         │
│  ├─ IndexedDB (Dexie): outbox + media blob cache + intake drafts    │
│  └─ Zustand persist: in-progress wizard state                       │
└──────────────────┬──────────────────────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Next.js server                                                      │
│  ├─ Middleware (refreshes Supabase session, gates routes)           │
│  ├─ Server components fetch via @supabase/ssr                       │
│  ├─ Route handlers: /api/health, /api/pdf/[projectId]               │
│  └─ Optional OpenAI summary call (server-side, key never exposed)   │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Supabase                                                            │
│  ├─ Auth (email, magic link, OAuth)                                 │
│  ├─ Postgres (15 tables, RLS + helper fns)                          │
│  └─ Storage (project-media, estimates, avatars)                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data model relationships

```
profiles ─┐
          ├─ owns ──▶ clients
          ├─ assigned ▶ projects (consultant_id, designer_id, estimator_id, pm_id)
          └─ uploads ▶ media

clients ──▶ projects ──▶ rooms
                  ├──▶ answers (per question, per set, per room)
                  ├──▶ measurements (annotated)
                  ├──▶ media + inspiration_items
                  ├──▶ estimates ──▶ scope_items
                  ├──▶ notes / signatures
                  └──▶ activities (audit-style timeline)
```

`answers` is the universal store; `bind`-ed fields also write to canonical columns on `projects` / `clients` / `rooms` so dashboards can SELECT them without JSON traversal.

## Form schema engine

Question sets live in `src/lib/intake/schemas/*.ts`. Each set is a tree:

```
QuestionSet
├─ slug: "kitchen_v1"
├─ appliesTo: [project_type]
├─ perRoom: true, roomKinds: ["kitchen"]
└─ sections[]
   ├─ id, title, description, showWhen (optional)
   └─ fields[]
      ├─ id, kind (text|select|multiselect|slider|image_cards|...)
      ├─ label, helper, placeholder
      ├─ required, min/max/step/unit
      ├─ options[] (for select/multiselect/image_cards/...)
      ├─ showWhen — Condition (equals|in|truthy|gte|lte|any|all|not)
      └─ bind — { table: "projects" | "clients" | "rooms", column }
```

`planForProject(type, rooms)` returns the ordered list of `(set, roomKind?)` pairs the wizard renders.

## Conditional logic

Conditions are pure data, so they serialize cleanly and can be admin-edited (the `question_sets` table already has a `schema jsonb` column for this). Examples in the shipped schemas:

- Steam shower selected → asks for waterproofing method + generator location.
- Luxury level ≥ 50 → unlocks wine fridge.
- Modern / minimalist style + kitchen → unlocks hidden / messy pantry.
- `accessibility_needs` or `aging_in_place` truthy → entire bathroom Accessibility section.

Add new conditions by editing the schema files; no DB migration required.

## Offline-first dataflow

```
User typing in field
   ▼
Zustand draft store (in-memory)
   ▼  (debounced auto-save would slot here)
patchDraft → localStorage (zustand/middleware/persist)
   ▼
enqueue("answer.upsert", payload) → IndexedDB outbox row
   ▼
OfflineWatcher (every 15s, on focus, on online)
   ▼
flush(): for each row:
   - read row from outbox
   - if media: upload Blob → Storage, then insert media row
   - else: upsert to Postgres via supabase-js
   - on success: delete outbox row
   - on failure: increment attempts + lastError
```

Idempotency: `answers` has a unique key on `(project_id, room_id, question_set_slug, question_id)`. Re-flushes are safe.

## RLS philosophy

Two helpers carry most of the weight:
- `is_staff()` — true for any non-`client` role.
- `can_read_project(p_id)` — staff OR client whose `profile_id` matches the project's client row.

Project-child tables (rooms, answers, measurements, media, inspiration_items, estimates, notes, signatures, appointments, activities, change_orders, daily_logs) all use the same predicate. Add a new project-child table → add it to the loop in `0001_init.sql` and you get RLS for free.

Clients can `SELECT` their own projects/answers (read-only). Staff get full CRUD.

## Why no `react-pdf` server render

The build target intentionally avoids native deps so it deploys to Vercel/Cloudflare/Bun without dragging Chromium. The HTML report is print-ready (Letter, .75in margins, `@media print` rules). Swap in `@sparticuz/chromium` or `playwright` if you want server-side PDF binaries — see `docs/deployment.md`.

## Extending: AI room analysis

Architecture is ready for it:
- `media.ai_labels jsonb` already exists — fill it from a Replicate / Vision API call.
- `answers` can ingest auto-extracted fields the same way a human types them.
- `inspiration_items.style_tags` and `color_palette` are arrays for downstream classification.

Add a server action `analyzeMedia(mediaId)` that fetches the file from storage, sends it to your model, and writes back. Wire a "Re-analyze" button on the project detail page.
