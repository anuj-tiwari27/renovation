import type { QuestionSet } from "../types";

export const bathroomSet: QuestionSet = {
  slug: "bathroom_v1",
  name: "Bathroom remodel discovery",
  description: "Spa expectations, waterproofing, and accessibility.",
  appliesTo: ["bathroom", "multi_room", "full_home"],
  perRoom: true,
  roomKinds: ["primary_bath", "guest_bath", "powder"],
  sections: [
    {
      id: "existing",
      title: "Existing bathroom",
      fields: [
        { id: "bath_type", kind: "select", label: "Bathroom type", options: [
          { value: "primary_bath", label: "Primary bath" },
          { value: "guest_bath", label: "Guest / hall bath" },
          { value: "powder", label: "Powder room" },
          { value: "jack_jill", label: "Jack-and-Jill" },
          { value: "kids", label: "Kids bath" },
        ]},
        { id: "length_in", kind: "number", label: "Length", unit: "in", bind: { table: "rooms", column: "length_in" } },
        { id: "width_in", kind: "number", label: "Width", unit: "in", bind: { table: "rooms", column: "width_in" } },
        { id: "ceiling_in", kind: "number", label: "Ceiling height", unit: "in", bind: { table: "rooms", column: "ceiling_in" } },
        { id: "current_issues", kind: "longtext", label: "Current issues", placeholder: "Layout, storage, drainage, fixtures…" },
        { id: "moisture_problems", kind: "longtext", label: "Moisture problems?" },
        { id: "mold_history", kind: "boolean", label: "Any history of mold?" },
        { id: "ventilation_quality", kind: "rating", label: "Ventilation quality today", min: 0, max: 5 },
      ],
    },
    {
      id: "vibe",
      title: "Vibe",
      fields: [
        { id: "spa_vs_practical", kind: "slider", label: "Practical ↔ Spa-like", min: 0, max: 100, step: 1 },
        { id: "hotel_inspired", kind: "boolean", label: "Hotel-inspired aesthetic?" },
        { id: "maintenance_tolerance", kind: "select", label: "Maintenance tolerance", options: [
          { value: "low", label: "Low — easy to clean" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High — natural materials OK" },
        ]},
        { id: "luxury_expectations", kind: "longtext", label: "Luxury expectations" },
      ],
    },
    {
      id: "vanity",
      title: "Vanity",
      fields: [
        { id: "vanity_count", kind: "select", label: "Sink count", options: [
          { value: "single", label: "Single" },
          { value: "double", label: "Double" },
          { value: "his_hers", label: "Separated his/hers" },
        ]},
        { id: "vanity_mount", kind: "select", label: "Mount", options: [
          { value: "floor", label: "Floor" },
          { value: "floating", label: "Floating / wall-mount" },
        ]},
        { id: "vanity_storage", kind: "longtext", label: "Storage needs" },
        { id: "mirror_style", kind: "select", label: "Mirror style", options: [
          { value: "framed", label: "Framed" },
          { value: "frameless", label: "Frameless" },
          { value: "lighted", label: "Lighted / smart" },
          { value: "medicine", label: "Medicine cabinet" },
        ]},
      ],
    },
    {
      id: "shower",
      title: "Shower",
      fields: [
        { id: "shower_type", kind: "image_cards", label: "Shower configuration", options: [
          { value: "walk_in", label: "Walk-in" },
          { value: "curbless", label: "Curbless" },
          { value: "alcove", label: "Alcove" },
          { value: "wet_room", label: "Wet room (tub + shower)" },
          { value: "none", label: "No shower" },
        ]},
        { id: "frameless_glass", kind: "boolean", label: "Frameless glass?" },
        { id: "rain_head", kind: "boolean", label: "Rain head?" },
        { id: "body_jets", kind: "boolean", label: "Body jets?" },
        { id: "handheld", kind: "boolean", label: "Handheld?" },
        { id: "bench", kind: "boolean", label: "Bench seat?" },
        { id: "niches", kind: "select", label: "Niches", options: [
          { value: "single", label: "Single" },
          { value: "double", label: "Double" },
          { value: "ledge", label: "Full ledge" },
          { value: "none", label: "None" },
        ]},
        { id: "steam", kind: "boolean", label: "Steam shower?" },
        { id: "steam_generator_location", kind: "text", label: "Where can a steam generator live?", showWhen: { kind: "truthy", field: "steam" } },
        { id: "waterproofing_method", kind: "select", label: "Waterproofing approach", showWhen: { kind: "any", conditions: [{ kind: "truthy", field: "steam" }, { kind: "in", field: "shower_type", values: ["curbless", "wet_room"] }] }, options: [
          { value: "schluter", label: "Sheet membrane (Schluter Kerdi)" },
          { value: "redgard", label: "Liquid (RedGard)" },
          { value: "wedi", label: "Wedi panels" },
          { value: "other", label: "Other / unsure" },
        ]},
      ],
    },
    {
      id: "tub",
      title: "Bathtub",
      fields: [
        { id: "tub_type", kind: "select", label: "Tub", options: [
          { value: "freestanding", label: "Freestanding" },
          { value: "drop_in", label: "Drop-in" },
          { value: "alcove", label: "Alcove" },
          { value: "japanese", label: "Japanese soaking" },
          { value: "none", label: "No tub" },
        ]},
        { id: "tub_features", kind: "multiselect", label: "Tub features", options: [
          { value: "air", label: "Air jets" },
          { value: "whirlpool", label: "Whirlpool" },
          { value: "heated", label: "Heated surface" },
          { value: "chromatherapy", label: "Chromatherapy" },
        ]},
      ],
    },
    {
      id: "tile_finishes",
      title: "Tile & finishes",
      fields: [
        { id: "tile_floor", kind: "longtext", label: "Floor tile preference" },
        { id: "tile_walls", kind: "longtext", label: "Wall tile preference" },
        { id: "grout_color", kind: "select", label: "Grout color", options: [
          { value: "match", label: "Match tile" },
          { value: "contrast_dark", label: "Contrast dark" },
          { value: "contrast_light", label: "Contrast light" },
        ]},
        { id: "fixture_finish", kind: "select", label: "Fixture finish", options: [
          { value: "polished_chrome", label: "Polished chrome" },
          { value: "brushed_nickel", label: "Brushed nickel" },
          { value: "matte_black", label: "Matte black" },
          { value: "brushed_brass", label: "Brushed brass" },
          { value: "polished_brass", label: "Polished brass" },
          { value: "gunmetal", label: "Gunmetal" },
        ]},
      ],
    },
    {
      id: "comfort",
      title: "Comfort & tech",
      fields: [
        { id: "heated_floors", kind: "boolean", label: "Heated floors?" },
        { id: "towel_warmer", kind: "boolean", label: "Towel warmer?" },
        { id: "smart_toilet", kind: "boolean", label: "Smart toilet?" },
        { id: "bidet", kind: "boolean", label: "Bidet / bidet seat?" },
        { id: "exhaust_quality", kind: "select", label: "Exhaust fan plan", options: [
          { value: "quiet_humidity", label: "Quiet w/ humidity sensor" },
          { value: "panasonic", label: "Premium (Panasonic / Broan-Pro)" },
          { value: "minimum", label: "Code minimum" },
        ]},
      ],
    },
    {
      id: "accessibility",
      title: "Accessibility",
      showWhen: { kind: "any", conditions: [
        { kind: "truthy", field: "accessibility_needs" },
        { kind: "truthy", field: "aging_in_place" },
      ]},
      fields: [
        { id: "grab_bars", kind: "boolean", label: "Reinforced grab bars" },
        { id: "curbless_shower", kind: "boolean", label: "Curbless shower" },
        { id: "wide_doorways", kind: "boolean", label: "Wider doorways (36\"+)" },
        { id: "comfort_height", kind: "boolean", label: "Comfort-height toilet" },
        { id: "lever_handles", kind: "boolean", label: "Lever handles" },
        { id: "slip_floor", kind: "boolean", label: "Slip-resistant flooring" },
      ],
    },
  ],
};
