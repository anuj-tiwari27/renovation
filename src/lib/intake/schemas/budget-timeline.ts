import type { QuestionSet } from "../types";

export const budgetSet: QuestionSet = {
  slug: "budget_v1",
  name: "Budget & financing",
  appliesTo: ["kitchen", "bathroom", "full_home", "multi_room", "commercial"],
  sections: [
    {
      id: "range",
      title: "Investment range",
      fields: [
        { id: "budget_min", kind: "currency", label: "Comfortable budget — minimum", bind: { table: "projects", column: "budget_min" } },
        { id: "budget_ideal", kind: "currency", label: "Ideal budget", bind: { table: "projects", column: "budget_ideal" } },
        { id: "budget_max", kind: "currency", label: "Maximum stretch budget", bind: { table: "projects", column: "budget_max" } },
        { id: "budget_financing", kind: "boolean", label: "Need financing options?", bind: { table: "projects", column: "budget_financing" } },
      ],
    },
  ],
};

export const timelineSet: QuestionSet = {
  slug: "timeline_v1",
  name: "Timeline & logistics",
  appliesTo: ["kitchen", "bathroom", "full_home", "multi_room", "commercial"],
  sections: [
    {
      id: "schedule",
      title: "Schedule",
      fields: [
        { id: "hard_deadline", kind: "date", label: "Hard deadline (if any)", bind: { table: "projects", column: "hard_deadline" } },
        { id: "vacation_schedule", kind: "longtext", label: "Travel / vacations during likely build window", bind: { table: "projects", column: "vacation_schedule" } },
      ],
    },
    {
      id: "logistics",
      title: "Logistics",
      fields: [
        { id: "temporary_relocation", kind: "boolean", label: "Open to temporary relocation?", bind: { table: "projects", column: "temporary_relocation" } },
        { id: "wfh_during", kind: "boolean", label: "Working from home during work?" },
        { id: "hoa_restrictions", kind: "longtext", label: "HOA restrictions", bind: { table: "projects", column: "hoa_restrictions" } },
        { id: "permit_concerns", kind: "longtext", label: "Permit / historic concerns", bind: { table: "projects", column: "permit_concerns" } },
      ],
    },
  ],
};
