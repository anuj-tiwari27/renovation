import type { ProjectType } from "@/lib/supabase/database.types";

export type QuestionId = string;

/** Conditional logic — show/hide based on prior answers */
export type Condition =
  | { kind: "always" }
  | { kind: "equals"; field: QuestionId; value: unknown }
  | { kind: "in"; field: QuestionId; values: unknown[] }
  | { kind: "truthy"; field: QuestionId }
  | { kind: "falsy"; field: QuestionId }
  | { kind: "gte"; field: QuestionId; value: number }
  | { kind: "lte"; field: QuestionId; value: number }
  | { kind: "any"; conditions: Condition[] }
  | { kind: "all"; conditions: Condition[] }
  | { kind: "not"; condition: Condition };

export type FieldKind =
  | "text"
  | "longtext"
  | "number"
  | "currency"
  | "phone"
  | "email"
  | "address"
  | "date"
  | "select"
  | "multiselect"
  | "radio"
  | "boolean"
  | "slider"
  | "rating"
  | "tags"
  | "image_cards" /* selectable visual style cards */
  | "color_swatches"
  | "section_break";

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
  imageUrl?: string;
  swatch?: string; // hex
}

export interface Field {
  id: QuestionId;
  kind: FieldKind;
  label: string;
  helper?: string;
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showWhen?: Condition;
  /** When set, persisted to projects/clients/rooms canonical column instead of answers table */
  bind?:
    | { table: "projects"; column: string }
    | { table: "clients"; column: string }
    | { table: "rooms"; column: string };
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  showWhen?: Condition;
}

export interface QuestionSet {
  slug: string;
  name: string;
  description?: string;
  appliesTo: ProjectType[];
  /** Optional per-room: when true, the wizard renders this set once per matched room */
  perRoom?: boolean;
  roomKinds?: string[];
  sections: Section[];
}

export type Answers = Record<QuestionId, unknown>;
