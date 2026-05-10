import type { QuestionSet } from "../types";
import type { ProjectType } from "@/lib/supabase/database.types";
import { clientInfoSet } from "./client-info";
import { projectOverviewSet } from "./project-overview";
import { kitchenSet } from "./kitchen";
import { bathroomSet } from "./bathroom";
import { fullHomeSet } from "./full-home";
import { budgetSet, timelineSet } from "./budget-timeline";

export const allSets: QuestionSet[] = [
  clientInfoSet,
  projectOverviewSet,
  kitchenSet,
  bathroomSet,
  fullHomeSet,
  budgetSet,
  timelineSet,
];

export const setsBySlug: Record<string, QuestionSet> = Object.fromEntries(
  allSets.map((s) => [s.slug, s]),
);

/** Build the ordered wizard plan for a given project type and selected rooms. */
export function planForProject(
  type: ProjectType,
  selectedRooms: string[],
): { set: QuestionSet; roomKind?: string }[] {
  const plan: { set: QuestionSet; roomKind?: string }[] = [];

  // Always start with client info + overview
  plan.push({ set: clientInfoSet });
  plan.push({ set: projectOverviewSet });

  if (type === "full_home") plan.push({ set: fullHomeSet });

  // Per-room sets
  for (const set of [kitchenSet, bathroomSet]) {
    if (!set.appliesTo.includes(type)) continue;
    if (set.perRoom && set.roomKinds) {
      for (const room of selectedRooms) {
        if (set.roomKinds.includes(room)) plan.push({ set, roomKind: room });
      }
    }
  }

  plan.push({ set: budgetSet });
  plan.push({ set: timelineSet });
  return plan;
}

export {
  clientInfoSet,
  projectOverviewSet,
  kitchenSet,
  bathroomSet,
  fullHomeSet,
  budgetSet,
  timelineSet,
};
