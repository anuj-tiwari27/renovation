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

  // Belt-and-braces: also scroll to top whenever the step actually changes,
  // so deep-linked or back-button navigation lands at the top.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIdx]);

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

  const scrollToTop = () => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    scrollToTop();
  };

  const prev = () => {
    setLastStep(projectId, Math.max(0, stepIdx - 1));
    setStepIdx((i) => Math.max(0, i - 1));
    scrollToTop();
  };

  const jumpToStep = (i: number) => {
    setLastStep(projectId, i);
    setStepIdx(i);
    scrollToTop();
  };

  return (
    <div className="space-y-6">
      <StepIndicator plan={plan} current={stepIdx} answers={drafts} projectId={projectId} onJump={jumpToStep} />

      <Card>
        <CardHeader className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Step {stepIdx + 1} of {plan.length}
              {current.roomKind ? ` · ${current.roomKind.replace("_", " ")}` : ""}
            </div>
            <CardTitle className="mt-1">{set.name}</CardTitle>
            {set.description && <CardDescription>{set.description}</CardDescription>}
          </div>
          <Badge variant="secondary" className="gap-1 self-start">
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
  onJump,
}: {
  plan: ReturnType<typeof planForProject>;
  current: number;
  answers: Record<string, Answers>;
  projectId: string;
  onJump: (i: number) => void;
}) {
  return (
    <nav aria-label="Discovery steps" className="-mx-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max items-start gap-0">
        {plan.map((p, i) => {
          const k = `${projectId}::${p.set.slug}::${p.roomKind ?? "_"}`;
          const a = answers[k] ?? {};
          const { answered, total } = progressOf(p.set, a);
          const done = total > 0 && answered === total;
          const active = i === current;
          const past = i < current;
          const isLast = i === plan.length - 1;
          // The line segment to the next step is "filled" if this step is complete or in the past.
          const lineFilled = past || done;

          return (
            <li
              key={`${p.set.slug}-${p.roomKind ?? "x"}-${i}`}
              className="flex flex-1 items-start"
            >
              <div className="flex min-w-[88px] flex-col items-center sm:min-w-[112px]">
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-semibold transition-colors",
                    active && "border-primary bg-primary text-primary-foreground shadow-sm",
                    !active && done && "border-emerald-500 bg-emerald-500 text-white",
                    !active && !done && past && "border-primary bg-background text-primary",
                    !active && !done && !past && "border-border bg-background text-muted-foreground",
                  )}
                >
                  {done && !active ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </button>
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className={cn(
                    "mt-2 max-w-[7rem] text-center text-[11px] leading-tight sm:max-w-[8rem] sm:text-xs",
                    active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="line-clamp-2">
                    {p.set.name}
                    {p.roomKind ? ` · ${p.roomKind.replace("_", " ")}` : ""}
                  </span>
                </button>
              </div>
              {!isLast && (
                <div
                  aria-hidden
                  className={cn(
                    "mt-4 h-0.5 flex-1 min-w-[24px] rounded-full transition-colors",
                    lineFilled ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
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
