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
    {
      id: "tradeoffs",
      title: "Trade-offs",
      fields: [
        { id: "willing_to_splurge", kind: "longtext", label: "Where are you willing to splurge?", bind: { table: "projects", column: "willing_to_splurge" } },
        { id: "willing_to_save", kind: "longtext", label: "Where are you willing to save?", bind: { table: "projects", column: "willing_to_save" } },
        { id: "phase_remodel_ok", kind: "boolean", label: "Phase the remodel if needed?", bind: { table: "projects", column: "phase_remodel_ok" } },
        { id: "roi_importance", kind: "rating", label: "ROI importance", min: 0, max: 5 },
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
