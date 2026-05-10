"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FieldRenderer } from "./field-renderer";
import { evaluate, missingRequired, progressOf, visibleFields, visibleSections } from "@/lib/intake/logic";
import { planForProject } from "@/lib/intake/schemas";
import type { Answers, QuestionSet } from "@/lib/intake/types";
import { useIntakeStore, draftKey } from "@/store/intake-store";
import { enqueue } from "@/lib/offline/outbox";
import type { ProjectType } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

interface WizardProps {
  projectId: string; // may be `new:<uuid>` if not yet persisted
  projectType: ProjectType;
  selectedRooms: string[];
  /** Optional: hydrate from server-loaded answers (when editing) */
  initialAnswers?: Record<string, Answers>;
}

export function IntakeWizard({ projectId, projectType, selectedRooms, initialAnswers }: WizardProps) {
  const router = useRouter();
  const plan = React.useMemo(
    () => planForProject(projectType, selectedRooms),
    [projectType, selectedRooms],
  );
  const { drafts, patchDraft, setDraft, lastStep, setLastStep } = useIntakeStore();
  const [stepIdx, setStepIdx] = React.useState(lastStep[projectId] ?? 0);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!initialAnswers) return;
    for (const [key, value] of Object.entries(initialAnswers)) {
      const k = `${projectId}::${key}`;
      if (!drafts[k]) setDraft(k, value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = plan[stepIdx];
  const set: QuestionSet | undefined = current?.set;
  const key = set ? draftKey(projectId, set.slug, current.roomKind ?? null) : "";
  const answers: Answers = (key && drafts[key]) || {};

  const setAnswer = (qid: string, value: unknown) => {
    if (!set) return;
    patchDraft(key, { [qid]: value });
    void enqueue("answer.upsert", {
      project_id: projectId.startsWith("new:") ? null : projectId,
      room_id: null, // resolved server-side after room is created
      question_set_slug: set.slug,
      question_id: qid,
      value,
    });
  };

  if (!set) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Discovery complete</CardTitle>
          <CardDescription>
            Every section is filled in. Generate a summary, scope draft, and PDF report next.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={() => router.push(`/projects/${projectId}/summary`)}>
            <CheckCircle2 className="h-4 w-4" /> Generate summary
          </Button>
          <Button variant="outline" onClick={() => setStepIdx(0)}>Review answers</Button>
        </CardContent>
      </Card>
    );
  }

  const sections = visibleSections(set, answers);
  const { answered, total } = progressOf(set, answers);
  const pct = total ? Math.round((answered / total) * 100) : 0;

  const next = async () => {
    const missing = missingRequired(set, answers);
    if (missing.length) {
      toast.warning(`${missing.length} required field${missing.length === 1 ? "" : "s"} missing`);
      return;
    }
    setSaving(true);
    setLastStep(projectId, stepIdx + 1);
    setStepIdx((i) => Math.min(plan.length, i + 1));
    setSaving(false);
  };

  const prev = () => {
    setLastStep(projectId, Math.max(0, stepIdx - 1));
    setStepIdx((i) => Math.max(0, i - 1));
  };

  return (
    <div className="space-y-6">
      <StepIndicator plan={plan} current={stepIdx} answers={drafts} projectId={projectId} />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Step {stepIdx + 1} of {plan.length}
              {current.roomKind ? ` · ${current.roomKind.replace("_", " ")}` : ""}
            </div>
            <CardTitle className="mt-1">{set.name}</CardTitle>
            {set.description && <CardDescription>{set.description}</CardDescription>}
          </div>
          <Badge variant="secondary" className="gap-1">
            <Save className="h-3 w-3" /> autosaving
          </Badge>
        </CardHeader>

        <div className="px-6 pb-2">
          <Progress value={pct} />
          <div className="mt-1 text-xs text-muted-foreground">
            {answered}/{total} answered ({pct}%)
          </div>
        </div>

        <CardContent className="space-y-8">
          {sections.map((section) => {
            const fields = visibleFields(section, answers);
            if (!fields.length) return null;
            return (
              <section key={section.id} className="space-y-4">
                <header>
                  <h2 className="text-base font-semibold">{section.title}</h2>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                </header>
                <div className="grid gap-5 md:grid-cols-2">
                  {fields.map((f) => {
                    const fullSpan =
                      f.kind === "longtext" ||
                      f.kind === "image_cards" ||
                      f.kind === "color_swatches" ||
                      f.kind === "multiselect" ||
                      f.kind === "radio";
                    return (
                      <div key={f.id} className={cn(fullSpan && "md:col-span-2")}>
                        <FieldRenderer
                          field={f}
                          value={answers[f.id]}
                          onChange={(v) => setAnswer(f.id, v)}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <MissingHint set={set} answers={answers} />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-3 flex items-center justify-between gap-2 border-t bg-background/90 px-3 py-3 backdrop-blur sm:relative sm:bottom-auto sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button variant="ghost" onClick={prev} disabled={stepIdx === 0}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={next} disabled={saving} className="flex-1 sm:flex-none">
          {stepIdx === plan.length - 1 ? "Finish" : "Next"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepIndicator({
  plan,
  current,
  answers,
  projectId,
}: {
  plan: ReturnType<typeof planForProject>;
  current: number;
  answers: Record<string, Answers>;
  projectId: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {plan.map((p, i) => {
        const k = `${projectId}::${p.set.slug}::${p.roomKind ?? "_"}`;
        const a = answers[k] ?? {};
        const { answered, total } = progressOf(p.set, a);
        const done = total > 0 && answered === total;
        const active = i === current;
        return (
          <div
            key={`${p.set.slug}-${p.roomKind ?? "x"}-${i}`}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
              active && "border-primary bg-primary/10 text-primary",
              !active && done && "border-emerald-300 text-emerald-700 dark:text-emerald-300",
            )}
          >
            <span className="font-medium">{i + 1}.</span>
            <span>{p.set.name}{p.roomKind ? ` · ${p.roomKind.replace("_", " ")}` : ""}</span>
            {done && <CheckCircle2 className="h-3 w-3" />}
          </div>
        );
      })}
    </div>
  );
}

function MissingHint({ set, answers }: { set: QuestionSet; answers: Answers }) {
  const missing = missingRequired(set, answers);
  if (!missing.length) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        Required: {missing.map((m) => m.label).join(", ")}
      </div>
    </div>
  );
}

// Re-export to satisfy unused import lint when needed elsewhere
export { evaluate };
