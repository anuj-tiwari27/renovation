import type { Answers, Condition, Field, QuestionSet, Section } from "./types";

export function evaluate(cond: Condition | undefined, answers: Answers): boolean {
  if (!cond || cond.kind === "always") return true;
  switch (cond.kind) {
    case "equals":
      return answers[cond.field] === cond.value;
    case "in":
      return cond.values.includes(answers[cond.field]);
    case "truthy":
      return Boolean(answers[cond.field]);
    case "falsy":
      return !answers[cond.field];
    case "gte": {
      const v = Number(answers[cond.field]);
      return Number.isFinite(v) && v >= cond.value;
    }
    case "lte": {
      const v = Number(answers[cond.field]);
      return Number.isFinite(v) && v <= cond.value;
    }
    case "any":
      return cond.conditions.some((c) => evaluate(c, answers));
    case "all":
      return cond.conditions.every((c) => evaluate(c, answers));
    case "not":
      return !evaluate(cond.condition, answers);
  }
}

export function visibleFields(section: Section, answers: Answers): Field[] {
  return section.fields.filter((f) => evaluate(f.showWhen, answers));
}

export function visibleSections(set: QuestionSet, answers: Answers): Section[] {
  return set.sections.filter((s) => evaluate(s.showWhen, answers));
}

export function progressOf(set: QuestionSet, answers: Answers): { answered: number; total: number } {
  let total = 0;
  let answered = 0;
  for (const section of visibleSections(set, answers)) {
    for (const field of visibleFields(section, answers)) {
      if (field.kind === "section_break") continue;
      total++;
      const v = answers[field.id];
      if (v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)) {
        answered++;
      }
    }
  }
  return { answered, total };
}

export function missingRequired(set: QuestionSet, answers: Answers): Field[] {
  const missing: Field[] = [];
  for (const section of visibleSections(set, answers)) {
    for (const field of visibleFields(section, answers)) {
      if (!field.required) continue;
      const v = answers[field.id];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
        missing.push(field);
      }
    }
  }
  return missing;
}

/**
 * Cross-field validations that aren't expressible by `required` or `showWhen`.
 * Returns a list of human-readable error messages — empty array = OK.
 *
 * Validations are keyed by set.slug so a schema author can ignore this file
 * for additive changes; only contributors writing budgets etc. touch it.
 */
export function validateSet(set: QuestionSet, answers: Answers): string[] {
  const errors: string[] = [];

  if (set.slug === "budget_v1") {
    const min = numOrNull(answers["budget_min"]);
    const ideal = numOrNull(answers["budget_ideal"]);
    const max = numOrNull(answers["budget_max"]);

    if (min != null && min < 0) errors.push("Minimum budget can't be negative.");
    if (ideal != null && ideal < 0) errors.push("Ideal budget can't be negative.");
    if (max != null && max < 0) errors.push("Maximum budget can't be negative.");

    if (min != null && ideal != null && min > ideal) {
      errors.push("Minimum budget must be less than or equal to the ideal budget.");
    }
    if (ideal != null && max != null && ideal > max) {
      errors.push("Ideal budget must be less than or equal to the maximum.");
    }
    if (min != null && max != null && min > max) {
      errors.push("Minimum budget must be less than or equal to the maximum.");
    }
  }

  return errors;
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
