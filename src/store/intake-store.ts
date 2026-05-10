"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Answers } from "@/lib/intake/types";

interface IntakeState {
  /** Map: `${projectId}::${setSlug}::${roomId ?? '_'}` → answers */
  drafts: Record<string, Answers>;
  setDraft: (key: string, answers: Answers) => void;
  patchDraft: (key: string, patch: Answers) => void;
  clearDraft: (key: string) => void;
  /** Last visited step per project */
  lastStep: Record<string, number>;
  setLastStep: (projectId: string, idx: number) => void;
}

export const useIntakeStore = create<IntakeState>()(
  persist(
    (set) => ({
      drafts: {},
      lastStep: {},
      setDraft: (key, answers) =>
        set((s) => ({ drafts: { ...s.drafts, [key]: { ...answers } } })),
      patchDraft: (key, patch) =>
        set((s) => ({
          drafts: { ...s.drafts, [key]: { ...(s.drafts[key] ?? {}), ...patch } },
        })),
      clearDraft: (key) =>
        set((s) => {
          const next = { ...s.drafts };
          delete next[key];
          return { drafts: next };
        }),
      setLastStep: (projectId, idx) =>
        set((s) => ({ lastStep: { ...s.lastStep, [projectId]: idx } })),
    }),
    {
      name: "remodel-intake",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const draftKey = (projectId: string, setSlug: string, roomId?: string | null) =>
  `${projectId}::${setSlug}::${roomId ?? "_"}`;
