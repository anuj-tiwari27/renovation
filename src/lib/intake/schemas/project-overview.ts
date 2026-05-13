import type { QuestionSet } from "../types";

export const projectOverviewSet: QuestionSet = {
  slug: "project_overview_v1",
  name: "Project overview",
  description: "Goals, motivations, and priorities.",
  appliesTo: ["kitchen", "bathroom", "full_home", "multi_room", "commercial"],
  sections: [
    {
      id: "timing",
      title: "Timing",
      description: "Project type and rooms were captured at intake — review them on the project detail page.",
      fields: [
        { id: "desired_completion", kind: "date", label: "Desired completion date", bind: { table: "projects", column: "desired_completion" } },
        {
          id: "start_flexibility",
          kind: "select",
          label: "Start date flexibility",
          options: [
            { value: "asap", label: "ASAP" },
            { value: "1_3_months", label: "1 – 3 months" },
            { value: "3_6_months", label: "3 – 6 months" },
            { value: "flexible", label: "Flexible" },
          ],
          bind: { table: "projects", column: "start_flexibility" },
        },
      ],
    },
    {
      id: "weighting",
      title: "Calibrate the design",
      description: "These sliders set the tone of every recommendation.",
      fields: [
        { id: "function_vs_aesthetic", kind: "slider", label: "Function ↔ Aesthetic", min: 0, max: 100, step: 1, helper: "0 = pure function, 100 = pure beauty", bind: { table: "projects", column: "function_vs_aesthetic" } },
        { id: "luxury_level", kind: "slider", label: "Luxury level", min: 0, max: 100, step: 1, bind: { table: "projects", column: "luxury_level" } },
        { id: "budget_flexibility", kind: "slider", label: "Budget flexibility", min: 0, max: 100, step: 1, bind: { table: "projects", column: "budget_flexibility" } },
        { id: "timeline_urgency", kind: "slider", label: "Timeline urgency", min: 0, max: 100, step: 1, bind: { table: "projects", column: "timeline_urgency" } },
        { id: "design_boldness", kind: "slider", label: "Design boldness", min: 0, max: 100, step: 1, helper: "0 = timeless, 100 = statement-making", bind: { table: "projects", column: "design_boldness" } },
      ],
    },
    {
      id: "household_needs",
      title: "Household needs",
      fields: [
        { id: "accessibility_needs", kind: "boolean", label: "Any accessibility needs?", bind: { table: "projects", column: "accessibility_needs" } },
        { id: "aging_in_place", kind: "boolean", label: "Designing for aging-in-place?", bind: { table: "projects", column: "aging_in_place" } },
        { id: "child_pet_considerations", kind: "longtext", label: "Children or pets to consider?", placeholder: "Toddler heights, dog wash, cat shelves…", bind: { table: "projects", column: "child_pet_considerations" } },
      ],
    },
  ],
};
