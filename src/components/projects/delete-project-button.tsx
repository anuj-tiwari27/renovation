"use client";

import * as React from "react";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "@/lib/actions/projects";

interface Props {
  projectId: string;
  projectTitle: string;
}

export function DeleteProjectButton({ projectId, projectTitle }: Props) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    const ok = confirm(
      `Delete "${projectTitle}"?\n\n` +
        "This permanently removes the project, every wizard answer, room, " +
        "measurement, media file, estimate, and activity log entry tied to " +
        "it. The client record stays (in case they have other projects).\n\n" +
        "This cannot be undone.",
    );
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteProjectAction(projectId);
        // deleteProjectAction redirects; toast won't usually fire, but keeps
        // the UX honest if redirect is intercepted by a navigation guard.
        toast.success("Project deleted");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not delete project");
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isPending}
      className="border-destructive/50 text-destructive hover:bg-destructive/5"
    >
      <Trash2 className="h-4 w-4" /> {isPending ? "Deleting…" : "Delete project"}
    </Button>
  );
}
