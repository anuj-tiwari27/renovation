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
