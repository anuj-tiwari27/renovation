# Deployment

This guide covers Vercel (recommended) and self-hosted Docker deployments. Either path requires a Supabase project for auth + Postgres + storage.

## 1. Provision Supabase

1. Create a new project at https://app.supabase.com.
2. SQL editor → paste `supabase/migrations/0001_init.sql` → Run.
3. (Optional) Paste `supabase/seed/seed.sql` for vendor + material catalog and a demo project. Update the email comment first if you want to promote yourself to admin.
4. Auth → URL configuration: add your production origin to **Site URL** and **Redirect URLs** (`https://yourdomain.com/auth/callback`).
5. (Optional) Auth → Providers → Google: enable and paste OAuth client id/secret. Set redirect URL to `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.

## 2. Vercel deployment

1. Push the repo to GitHub.
2. Vercel → New Project → import the repo.
3. Environment variables — paste from `.env.example`. At minimum:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` = your Vercel URL
4. Deploy. The PWA service worker will register automatically on first visit.

## 3. Docker deployment

```bash
docker build -t remodel-studio .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e NEXT_PUBLIC_APP_URL=https://yourdomain.com \
  remodel-studio
```

Front the container with a TLS terminator (Caddy, Cloudflare, ELB). Service workers require HTTPS in production.

## 4. Post-deploy checks

- `/api/health` → `{ "status": "ok", "supabase_configured": true }`
- Sign up at `/signup`, then promote yourself: `update public.profiles set role='admin' where email='you@example.com';`
- `/admin/settings` should now show users.
- `/intake/new` → start a discovery → step through wizard → check that answers appear in `public.answers`.
- Open DevTools → Application → Service Workers → confirm `sw.js` is active.
- Toggle Network → Offline → continue editing → switch back online → confirm the toast "Synced N changes".

## 5. Optional: typed Supabase client

```bash
npx supabase login
npx supabase link --project-ref YOUR_REF
npm run db:types
```

Edit `src/lib/supabase/{client,server,middleware}.ts` and add `<Database>` back to each `createBrowserClient` / `createServerClient` call for full type inference.

## 6. Optional: real PDF rendering

The current `/api/pdf/[projectId]` returns print-ready HTML. To produce real PDFs server-side, swap in:

- [`@sparticuz/chromium`](https://github.com/Sparticuz/chromium) + `puppeteer-core` on Vercel/Lambda
- [`playwright`](https://playwright.dev) in a long-running container
- [`@react-pdf/renderer`](https://react-pdf.org/) for fully programmatic PDFs

The HTML the route already generates is the printable input.

## 7. Backups

- Supabase has automated backups on the Pro tier — verify retention matches your needs.
- For self-hosted Postgres, schedule `pg_dump`s to off-region storage.
- Storage bucket `project-media` is private; consider lifecycle rules to move >1y media to cold storage.

## 8. Observability

Wire up:
- Vercel Analytics or Plausible (privacy-friendly).
- Supabase log drains → your APM (Datadog/New Relic).
- Add Sentry by installing `@sentry/nextjs` and a `sentry.client.config.ts` / `sentry.server.config.ts`.
