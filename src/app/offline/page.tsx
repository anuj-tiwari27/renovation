import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="grid min-h-svh place-items-center px-6">
      <div className="max-w-md text-center">
        <WifiOff className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold">You're offline</h1>
        <p className="mt-2 text-muted-foreground">
          You can keep working on saved intakes — anything you change will sync when you reconnect.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
