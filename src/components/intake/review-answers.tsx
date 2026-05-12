"use client";

import * as React from "react";
import { Pencil, Edit3, ArrowLeft, FileDown, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { visibleFields, visibleSections } from "@/lib/intake/logic";
import { planForProject } from "@/lib/intake/schemas";
import type { Answers, Field } from "@/lib/intake/types";
import { draftKey } from "@/store/intake-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ReviewAnswersProps {
  plan: ReturnType<typeof planForProject>;
  projectId: string;
  drafts: Record<string, Answers>;
  onEditAll: () => void;
  onEditStep: (stepIdx: number) => void;
  onGenerateSummary: () => void;
  onExit: () => void;
}

export function ReviewAnswers({
  plan,
  projectId,
  drafts,
  onEditAll,
  onEditStep,
  onGenerateSummary,
  onExit,
}: ReviewAnswersProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Review your answers</h2>
          <p className="text-sm text-muted-foreground">
            Scroll through every section. Use <strong>Edit</strong> on any section to fix something, or
            <strong> Edit responses</strong> to walk through everything again from the start.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button variant="outline" onClick={onEditAll}>
            <Edit3 className="h-4 w-4" /> Edit responses
          </Button>
          <Button onClick={onGenerateSummary}>
            <Sparkles className="h-4 w-4" /> Generate summary
          </Button>
        </div>
      </div>

      {plan.map((step, stepIdx) => {
        const key = draftKey(projectId, step.set.slug, step.roomKind ?? null);
        const answers = drafts[key] ?? {};
        const sections = visibleSections(step.set, answers);
        const totalAnswered = sections
          .flatMap((s) => visibleFields(s, answers))
          .filter((f) => f.kind !== "section_break" && hasAnswer(answers[f.id])).length;
        const totalFields = sections
          .flatMap((s) => visibleFields(s, answers))
          .filter((f) => f.kind !== "section_break").length;

        return (
          <Card key={`${step.set.slug}-${step.roomKind ?? "x"}-${stepIdx}`}>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Step {stepIdx + 1}
                  {step.roomKind ? ` · ${step.roomKind.replace("_", " ")}` : ""}
                </div>
                <CardTitle>{step.set.name}</CardTitle>
                {step.set.description && <CardDescription>{step.set.description}</CardDescription>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={totalAnswered === totalFields && totalFields > 0 ? "success" : "secondary"}>
                  {totalAnswered}/{totalFields}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => onEditStep(stepIdx)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.length === 0 && (
                <div className="text-sm italic text-muted-foreground">No questions in this section.</div>
              )}
              {sections.map((section, si) => {
                const fields = visibleFields(section, answers).filter((f) => f.kind !== "section_break");
                if (!fields.length) return null;
                return (
                  <div key={section.id} className="space-y-3">
                    {si > 0 && <Separator />}
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{section.description}</p>
                      )}
                    </div>
                    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {fields.map((f) => (
                        <AnswerRow key={f.id} field={f} value={answers[f.id]} />
                      ))}
                    </dl>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      <div className="sticky bottom-0 -mx-3 flex items-center justify-between gap-2 border-t bg-background/90 px-3 py-3 backdrop-blur sm:relative sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <Button variant="outline" onClick={onEditAll}>
          <Edit3 className="h-4 w-4" /> Edit responses
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={`/api/pdf/${projectId}`} target="_blank" rel="noreferrer">
              <FileDown className="h-4 w-4" /> Open report
            </a>
          </Button>
          <Button onClick={onGenerateSummary}>
            <Sparkles className="h-4 w-4" /> Generate summary
          </Button>
        </div>
      </div>
    </div>
  );
}

function AnswerRow({ field, value }: { field: Field; value: unknown }) {
  const formatted = formatValue(field, value);
  const empty = !hasAnswer(value);
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{field.label}</dt>
      <dd
        className={cn(
          "text-sm",
          empty ? "italic text-muted-foreground/70" : "font-medium text-foreground",
        )}
      >
        {empty ? "—" : formatted}
      </dd>
    </div>
  );
}

function hasAnswer(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
}

function labelOf(field: Field, value: unknown): string {
  const opt = field.options?.find((o) => o.value === value);
  return opt?.label ?? String(value);
}

function formatValue(field: Field, value: unknown): React.ReactNode {
  if (!hasAnswer(value)) return "—";
  switch (field.kind) {
    case "boolean":
      return value === true ? "Yes" : value === false ? "No" : "—";
    case "currency":
      return formatCurrency(Number(value));
    case "number":
      return field.unit ? `${value} ${field.unit}` : String(value);
    case "date":
      return formatDate(value as string);
    case "slider":
      return (
        <span>
          {String(value)}
          <span className="text-muted-foreground"> / {field.max ?? 100}</span>
        </span>
      );
    case "rating":
      return (
        <span>
          {String(value)}
          <span className="text-muted-foreground"> / {field.max ?? 5}</span>
        </span>
      );
    case "select":
    case "radio":
    case "image_cards":
      return labelOf(field, value);
    case "multiselect":
    case "color_swatches":
    case "tags": {
      const arr = Array.isArray(value) ? value : [value];
      const labels = arr.map((v) => (field.options ? labelOf(field, v) : String(v)));
      return (
        <span className="flex flex-wrap gap-1">
          {labels.map((l, i) => (
            <Badge key={i} variant="secondary" className="font-normal">
              {l}
            </Badge>
          ))}
        </span>
      );
    }
    case "longtext":
    case "address":
      return <span className="whitespace-pre-wrap">{String(value)}</span>;
    default:
      return String(value);
  }
}
