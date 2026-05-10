import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar" };

interface Appt {
  id: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  kind: string | null;
}

export default async function CalendarPage() {
  let appts: Appt[] = [];
  if (isSupabaseConfigured()) {
    const supa = await createClient();
    const { data } = await supa
      .from("appointments" as never)
      .select("id,starts_at,ends_at,location,kind")
      .gte("starts_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("starts_at");
    appts = ((data as unknown as Appt[]) ?? []);
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Upcoming consultations, design reviews, and walks.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Upcoming</CardTitle><CardDescription>Next 30 days</CardDescription></CardHeader>
        <CardContent>
          {appts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              No appointments yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {appts.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium capitalize">{a.kind ?? "consultation"}</div>
                    <div className="text-muted-foreground">{a.location ?? "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatDate(a.starts_at)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
