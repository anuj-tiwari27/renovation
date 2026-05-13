import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MediaDropzone } from "@/components/media/dropzone";
import { Thumbnail } from "@/components/media/thumbnail";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Media, Project } from "@/lib/supabase/database.types";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ projectId: string }>;
}

export const dynamic = "force-dynamic";
export const metadata = { title: "Media" };

export default async function MediaPage({ params }: Props) {
  const { projectId } = await params;

  let project: Project | null = null;
  let media: (Media & { url: string })[] = [];

  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data: p } = await supa.from("projects").select("*").eq("id", projectId).maybeSingle();
    project = (p as Project | null) ?? null;
    const { data: rows } = await supa
      .from("media")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    const list = (rows as Media[] | null) ?? [];
    if (list.length > 0) {
      const paths = list.map((m) => m.storage_path);
      const { data: signed } = await supa.storage
        .from("project-media")
        .createSignedUrls(paths, 60 * 60);
      const urlByPath = Object.fromEntries(
        (signed ?? []).map((s) => [s.path ?? "", s.signedUrl]),
      );
      media = list.map((m) => ({ ...m, url: urlByPath[m.storage_path] ?? "#" }));
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to project{project ? `: ${project.title}` : ""}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Project media</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Upload existing-condition photos, inspiration, voice notes, and floorplans. Works offline.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription>Files are queued and synced automatically when you have a connection.</CardDescription>
        </CardHeader>
        <CardContent>
          <MediaDropzone projectId={projectId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded ({media.length})</CardTitle>
          <CardDescription>Tap a thumbnail to open the file.</CardDescription>
        </CardHeader>
        <CardContent>
          {media.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No media yet. Drop files into the uploader above.
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {media.map((m) => {
                const url = m.url;
                const isImage = m.kind === "photo" || m.kind === "inspiration" || m.mime_type?.startsWith("image/");
                const isVideo = m.kind === "video" || m.mime_type?.startsWith("video/");
                return (
                  <li key={m.id}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block overflow-hidden rounded-lg border bg-card transition hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="relative aspect-square bg-muted">
                        {isImage ? (
                          <Thumbnail
                            src={url}
                            alt={m.caption ?? m.storage_path}
                            loading="lazy"
                            fallbackLabel={m.kind}
                            className="h-full w-full object-cover"
                          />
                        ) : isVideo ? (
                          <video src={url} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs uppercase tracking-wide text-muted-foreground">
                            {m.kind}
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-[10px]">{m.category.replace("_", " ")}</Badge>
                          <span className="text-muted-foreground">{formatDate(m.created_at)}</span>
                        </div>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
