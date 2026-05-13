import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SignaturePad } from "@/components/signatures/signature-pad";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/utils";
import { env } from "@/lib/env";
import type { Project, Client, Answer } from "@/lib/supabase/database.types";

interface Props {
  params: Promise<{ projectId: string }>;
}

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirm requirements" };

export default async function ConfirmPage({ params }: Props) {
  const { projectId } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirm requirements</CardTitle>
          <CardDescription>Configure Supabase to capture signatures.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const supa = await createClient();
  const { data: project } = await supa.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (!project) notFound();
  const p = project as Project;

  const { data: client } = await supa.from("clients").select("*").eq("id", p.client_id).maybeSingle();
  const c = client as Client | null;

  // Already signed?
  const { data: existingSig } = await supa
    .from("signatures")
    .select("*")
    .eq("project_id", projectId)
    .is("estimate_id", null)
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const signed = existingSig as
    | { id: string; signer_name: string; signed_at: string; signature_svg: string }
    | null;

  // Answer count for the summary
  const { data: answerRows } = await supa.from("answers").select("question_id").eq("project_id", projectId);
  const answerCount = ((answerRows as Answer[] | null) ?? []).length;

  const consent = `I, the homeowner, confirm that the project requirements summarized below — scope, rooms, design preferences, budget, and timeline — accurately reflect what we discussed with ${env.NEXT_PUBLIC_COMPANY_NAME}. I authorize the team to use this scope as the basis for the formal estimate.`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to project: {p.title}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Confirm requirements
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Review the summary, sign below, and the project advances to the estimate stage.
        </p>
      </div>

      {/* Summary of what they're confirming */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{p.title}</CardTitle>
          <CardDescription>
            {c?.full_name ?? "—"}
            {c?.address_city ? ` · ${c.address_city}, ${c.address_state ?? ""}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Project type</div>
            <div className="mt-0.5 font-medium capitalize">{p.type.replace("_", " ")}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Rooms</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {p.rooms.length === 0 ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                p.rooms.map((r) => (
                  <Badge key={r} variant="secondary" className="capitalize">
                    {r.replace("_", " ")}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Budget (ideal)</div>
            <div className="mt-0.5 font-medium">{formatCurrency(p.budget_ideal)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Desired completion</div>
            <div className="mt-0.5 font-medium">{formatDate(p.desired_completion)}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Discovery captured</div>
            <div className="mt-0.5 text-muted-foreground">
              {answerCount} answers recorded
              {" · "}
              <Link href={`/intake/${projectId}`} className="text-primary hover:underline">
                view/edit
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {signed ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Already confirmed
            </CardTitle>
            <CardDescription>
              Signed by <strong>{signed.signer_name}</strong> on {formatDate(signed.signed_at)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card p-4">
              <div
                className="mx-auto max-h-48 max-w-md"
                // signature_svg is trusted internal content
                dangerouslySetInnerHTML={{ __html: signed.signature_svg }}
              />
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              To re-sign (e.g. scope changed), the previous signature is kept in the audit log;
              a new signature row supersedes it.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{signed ? "Re-sign requirements" : "Sign to confirm"}</CardTitle>
          <CardDescription>
            Sign with finger, stylus, or trackpad. The timestamp, IP, and device are recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignaturePad
            projectId={projectId}
            redirectTo={`/projects/${projectId}`}
            defaultSignerName={c?.full_name ?? ""}
            defaultSignerEmail={c?.email ?? ""}
            consentText={consent}
          />
        </CardContent>
      </Card>
    </div>
  );
}
