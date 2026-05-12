import type { QuestionSet } from "../types";

export const clientInfoSet: QuestionSet = {
  slug: "client_info_v1",
  name: "Client information",
  description: "Homeowner contacts, household, and decision context.",
  appliesTo: ["kitchen", "bathroom", "full_home", "multi_room", "commercial"],
  sections: [
    {
      id: "contact",
      title: "Contact",
      fields: [
        { id: "full_name", kind: "text", label: "Full name", required: true, bind: { table: "clients", column: "full_name" } },
        { id: "email", kind: "email", label: "Email", required: true, bind: { table: "clients", column: "email" } },
        { id: "phone", kind: "phone", label: "Phone", required: true, bind: { table: "clients", column: "phone" } },
        { id: "address_street", kind: "text", label: "Property address", required: true, bind: { table: "clients", column: "address_street" } },
        { id: "address_city", kind: "text", label: "City", required: true, bind: { table: "clients", column: "address_city" } },
        { id: "address_state", kind: "text", label: "State", required: true, bind: { table: "clients", column: "address_state" } },
        { id: "address_zip", kind: "text", label: "ZIP", required: true, bind: { table: "clients", column: "address_zip" } },
        {
          id: "preferred_comm",
          kind: "radio",
          label: "Preferred communication",
          options: [
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone call" },
            { value: "sms", label: "Text" },
            { value: "any", label: "Any" },
          ],
          bind: { table: "clients", column: "preferred_comm" },
        },
        { id: "best_time_to_contact", kind: "text", label: "Best time to contact", placeholder: "Weekdays after 5pm", bind: { table: "clients", column: "best_time_to_contact" } },
        {
          id: "referral_source",
          kind: "select",
          label: "How did you hear about us?",
          options: [
            { value: "google", label: "Google search" },
            { value: "instagram", label: "Instagram" },
            { value: "houzz", label: "Houzz" },
            { value: "referral", label: "Friend / family referral" },
            { value: "past_client", label: "Past client" },
            { value: "other", label: "Other" },
          ],
          bind: { table: "clients", column: "referral_source" },
        },
      ],
    },
  ],
};
