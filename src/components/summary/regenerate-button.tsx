"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Forces a fresh re-fetch of the summary server component. The page is
 * already `dynamic = 'force-dynamic'` so a regular navigation re-runs it,
 * but users who edited budget/style in a separate tab need a way to refresh
 * the open summary without browser-reloading and losing scroll.
 */
export function RegenerateSummaryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      router.refresh();
      // Give the server enough time to refetch — the spinner stays visible
      // until startTransition resolves, which happens after refresh completes.
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Summary regenerated");
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={isPending}>
      <RefreshCw className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      {isPending ? "Regenerating…" : "Regenerate"}
    </Button>
  );
}
