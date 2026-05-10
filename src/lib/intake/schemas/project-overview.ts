import type { QuestionSet } from "../types";

export const projectOverviewSet: QuestionSet = {
  slug: "project_overview_v1",
  name: "Project overview",
  description: "Goals, motivations, and priorities.",
  appliesTo: ["kitchen", "bathroom", "full_home", "multi_room", "commercial"],
  sections: [
    {
      id: "scope",
      title: "Scope & timing",
      fields: [
        {
          id: "type",
          kind: "image_cards",
          label: "Project type",
          required: true,
          options: [
            { value: "kitchen", label: "Kitchen" },
            { value: "bathroom", label: "Bathroom" },
            { value: "full_home", label: "Full home" },
            { value: "multi_room", label: "Multi-room" },
            { value: "commercial", label: "Commercial" },
          ],
          bind: { table: "projects", column: "type" },
        },
        {
          id: "rooms",
          kind: "multiselect",
          label: "Rooms involved",
          options: [
            { value: "kitchen", label: "Kitchen" },
            { value: "primary_bath", label: "Primary bath" },
            { value: "guest_bath", label: "Guest bath" },
            { value: "powder", label: "Powder room" },
            { value: "living_room", label: "Living room" },
            { value: "dining_room", label: "Dining room" },
            { value: "primary_bedroom", label: "Primary bedroom" },
            { value: "office", label: "Office / WFH" },
            { value: "laundry", label: "Laundry / mudroom" },
            { value: "basement", label: "Basement" },
            { value: "exterior", label: "Exterior" },
          ],
          bind: { table: "projects", column: "rooms" },
        },
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
      id: "motivation",
      title: "Why now?",
      description: "What's driving this remodel — and what must we get right?",
      fields: [
        { id: "motivation", kind: "longtext", label: "Why are you remodeling?", placeholder: "Outdated finishes, growing family, better workflow…", bind: { table: "projects", column: "motivation" } },
        { id: "pain_points", kind: "longtext", label: "Biggest pain points today", placeholder: "Not enough storage, dark, awkward layout…", bind: { table: "projects", column: "pain_points" } },
        { id: "must_stay_unchanged", kind: "longtext", label: "What must stay unchanged?", helper: "Sentimental items, recent upgrades, structural elements", bind: { table: "projects", column: "must_stay_unchanged" } },
        { id: "top_priorities", kind: "longtext", label: "Top 3 priorities", placeholder: "1) … 2) … 3) …", bind: { table: "projects", column: "top_priorities" } },
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
