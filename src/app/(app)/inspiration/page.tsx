import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thumbnail } from "@/components/media/thumbnail";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import type { Media, Project } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inspiration" };

interface InspirationRow extends Media {
  projects: { id: string; title: string } | null;
  url: string;
}

export default async function InspirationPage() {
  if (!isSupabaseConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspiration</CardTitle>
          <CardDescription>Configure Supabase to view inspiration uploads.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const supa = await createClient();
  // Pull every photo / inspiration-kind item across all projects this user
  // can see. RLS scopes this to staff or linked clients automatically.
  const { data: mediaRows } = await supa
    .from("media")
    .select("*, projects(id,title)")
    .or("category.eq.inspiration,kind.eq.inspiration")
    .order("created_at", { ascending: false })
    .limit(200);

  const list = (mediaRows as unknown as InspirationRow[] | null) ?? [];

  let items: InspirationRow[] = [];
  if (list.length > 0) {
    const { data: signed } = await supa.storage
      .from("project-media")
      .createSignedUrls(list.map((m) => m.storage_path), 60 * 60);
    const urlByPath = Object.fromEntries((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
    items = list.map((m) => ({ ...m, url: urlByPath[m.storage_path] ?? "" }));
  }

  // Group by project for a saner browsing experience
  const byProject = items.reduce<Record<string, { project: { id: string; title: string } | null; items: InspirationRow[] }>>(
    (acc, m) => {
      const key = m.projects?.id ?? "_unlinked";
      if (!acc[key]) acc[key] = { project: m.projects, items: [] };
      acc[key].items.push(m);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inspiration</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Everything uploaded under the <em>Inspiration</em> category across all your projects.
          Each project also has its own gallery on its Media page.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                <ImageIcon className="h-6 w-6" />
              </span>
              <h3 className="mt-3 text-base font-semibold">Nothing here yet</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Open any project → <strong>Upload media</strong> → choose category{" "}
                <strong>Inspiration</strong>. Pinterest screenshots, Instagram saves, magazine clippings —
                all show up here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(byProject).map(([key, group]) => (
            <section key={key}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {group.project ? (
                    <Link href={`/projects/${group.project.id}`} className="hover:underline">
                      {group.project.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Unlinked</span>
                  )}
                </h2>
                <span className="text-xs text-muted-foreground">{group.items.length} items</span>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {group.items.map((m) => {
                  const isImage = m.mime_type?.startsWith("image/") ?? true;
                  return (
                    <li key={m.id}>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group block overflow-hidden rounded-lg border bg-card transition hover:border-primary/50 hover:shadow-md"
                      >
                        <div className="aspect-square bg-muted">
                          {isImage ? (
                            <Thumbnail
                              src={m.url}
                              alt={m.caption ?? "Inspiration"}
                              loading="lazy"
                              fallbackLabel="Preview unavailable"
                              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xs uppercase tracking-wide text-muted-foreground">
                              {m.kind}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-2 text-xs">
                          <Badge variant="secondary" className="text-[10px]">
                            {m.category.replace("_", " ")}
                          </Badge>
                          <span className="text-muted-foreground">{formatDate(m.created_at)}</span>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
