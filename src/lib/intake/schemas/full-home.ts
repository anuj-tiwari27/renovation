import type { QuestionSet } from "../types";

export const fullHomeSet: QuestionSet = {
  slug: "full_home_v1",
  name: "Full-home remodel discovery",
  description: "Whole-home program, structural changes, and systems.",
  appliesTo: ["full_home"],
  sections: [
    {
      id: "rooms",
      title: "Rooms included",
      fields: [
        { id: "rooms_included", kind: "multiselect", label: "Rooms in scope", options: [
          { value: "kitchen", label: "Kitchen" },
          { value: "primary_bath", label: "Primary bath" },
          { value: "guest_bath", label: "Guest bath" },
          { value: "powder", label: "Powder" },
          { value: "primary_bed", label: "Primary bedroom" },
          { value: "secondary_beds", label: "Secondary bedrooms" },
          { value: "living", label: "Living / family room" },
          { value: "dining", label: "Dining" },
          { value: "office", label: "Office" },
          { value: "laundry", label: "Laundry / mudroom" },
          { value: "basement", label: "Basement" },
          { value: "exterior", label: "Exterior" },
        ]},
      ],
    },
    {
      id: "structural",
      title: "Structural & layout",
      fields: [
        { id: "wall_removal", kind: "boolean", label: "Removing walls?" },
        { id: "open_concept", kind: "boolean", label: "Open-concept goals?" },
        { id: "addition_plans", kind: "boolean", label: "Addition / new square footage?" },
        { id: "addition_size_sf", kind: "number", label: "Approx addition size", unit: "sf", showWhen: { kind: "truthy", field: "addition_plans" } },
        { id: "soundproofing", kind: "boolean", label: "Soundproofing needs?" },
      ],
    },
    {
      id: "systems",
      title: "Systems",
      fields: [
        { id: "hvac_concerns", kind: "longtext", label: "HVAC concerns" },
        { id: "electrical_rewire", kind: "boolean", label: "Electrical rewiring needed?" },
        { id: "plumbing_replace", kind: "boolean", label: "Plumbing replacement?" },
        { id: "smart_home", kind: "multiselect", label: "Smart home", options: [
          { value: "lighting", label: "Lighting / scenes" },
          { value: "shades", label: "Motorized shades" },
          { value: "security", label: "Security & cameras" },
          { value: "audio", label: "Whole-home audio" },
          { value: "hvac", label: "Smart HVAC zones" },
          { value: "ev", label: "EV charging" },
          { value: "solar", label: "Solar / battery" },
        ]},
        { id: "energy_efficiency", kind: "rating", label: "Energy efficiency priority", min: 0, max: 5 },
      ],
    },
    {
      id: "lifestyle",
      title: "Lifestyle",
      fields: [
        { id: "wfh", kind: "boolean", label: "Work-from-home requirements?" },
        { id: "wfh_users", kind: "number", label: "How many people WFH?", min: 1, max: 6, showWhen: { kind: "truthy", field: "wfh" } },
        { id: "multigen", kind: "boolean", label: "Multi-generational living?" },
        { id: "rental_adu", kind: "boolean", label: "Rental / ADU plans?" },
        { id: "flooring_continuity", kind: "boolean", label: "Continuous flooring across home?" },
        { id: "paint_palette", kind: "longtext", label: "Paint palette preferences" },
      ],
    },
  ],
};
