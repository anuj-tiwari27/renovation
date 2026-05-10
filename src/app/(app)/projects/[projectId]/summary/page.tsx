import { notFound } from "next/navigation";
import Link from "next/link";
import { Sparkles, FileDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { aiSummarize, buildLocalSummary } from "@/lib/ai/summarize";
import type { Project, Client, Answer } from "@/lib/supabase/database.types";

interface Props {
  params: Promise<{ projectId: string }>;
}

export const dynamic = "force-dynamic";
export const metadata = { title: "Summary" };

export default async function SummaryPage({ params }: Props) {
  const { projectId } = await params;
  if (!isSupabaseConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Configure Supabase to generate AI summaries from saved answers.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const supa = await createClient();
  const { data: project } = await supa.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) notFound();
  const p = project as Project;
  const { data: client } = await supa.from("clients").select("*").eq("id", p.client_id).maybeSingle();
  const { data: answersRows } = await supa.from("answers").select("*").eq("project_id", projectId);

  const answersBySet: Record<string, Record<string, unknown>> = {};
  for (const a of (answersRows ?? []) as Answer[]) {
    const key = a.room_id ? `${a.question_set_slug}::${a.room_id}` : a.question_set_slug;
    answersBySet[key] = { ...(answersBySet[key] ?? {}), [a.question_id]: a.value };
  }

  const summary =
    (await aiSummarize({ project: p, client: client as Client | null, answersBySet })) ??
    buildLocalSummary({ project: p, client: client as Client | null, answersBySet });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Generated summary
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{p.title}</h1>
        </div>
        <Button asChild>
          <Link href={`/api/pdf/${projectId}`} target="_blank">
            <FileDown className="h-4 w-4" /> Download PDF
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Client summary</CardTitle></CardHeader>
        <CardContent className="leading-relaxed">{summary.client_summary}</CardContent>
      </Card>

      {summary.pain_points.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pain points</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {summary.pain_points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Design direction</CardTitle></CardHeader>
        <CardContent>{summary.design_direction}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scope draft</CardTitle>
          <CardDescription>Starting point — refine in the estimate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.scope_draft.map((s) => (
            <div key={s.category}>
              <div className="mb-1 font-medium">{s.category}</div>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {s.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Suggested materials</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {summary.suggested_materials.map((m) => (
            <div key={m.category} className="rounded-lg border p-3">
              <div className="text-sm font-medium">{m.category}</div>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {m.suggestions.map((s, i) => <li key={i}>· {s}</li>)}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {summary.missing_information.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Missing information</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.missing_information.map((m, i) => (
                <Badge key={i} variant="warning">{m}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
