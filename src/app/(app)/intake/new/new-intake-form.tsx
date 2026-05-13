"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChefHat, Bath, Home, Layers, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import type { ProjectType } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

const TYPES: { value: ProjectType; label: string; blurb: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "kitchen", label: "Kitchen", blurb: "Cabinets, counters, appliances, layout", icon: ChefHat },
  { value: "bathroom", label: "Bathroom", blurb: "Spa, vanity, shower, accessibility", icon: Bath },
  { value: "full_home", label: "Full home", blurb: "Whole-home program & systems", icon: Home },
  { value: "multi_room", label: "Multi-room", blurb: "Two or more rooms together", icon: Layers },
  { value: "commercial", label: "Commercial", blurb: "Light-commercial space", icon: Building2 },
];

const ROOMS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "primary_bath", label: "Primary bath" },
  { value: "guest_bath", label: "Guest bath" },
  { value: "powder", label: "Powder room" },
  { value: "primary_bedroom", label: "Primary bedroom" },
  { value: "office", label: "Office / WFH" },
  { value: "living_room", label: "Living room" },
  { value: "dining_room", label: "Dining room" },
  { value: "laundry", label: "Laundry / mudroom" },
  { value: "basement", label: "Basement" },
  { value: "exterior", label: "Exterior" },
];

export function NewIntakeForm() {
  const router = useRouter();
  const [type, setType] = React.useState<ProjectType>("kitchen");
  const [title, setTitle] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [rooms, setRooms] = React.useState<string[]>(["kitchen"]);
  const [pending, setPending] = React.useState(false);

  // Auto-suggest rooms based on type
  React.useEffect(() => {
    if (type === "kitchen") setRooms(["kitchen"]);
    else if (type === "bathroom") setRooms(["primary_bath"]);
    else if (type === "full_home") setRooms(["kitchen", "primary_bath", "living_room"]);
  }, [type]);

  const titleTrim = title.trim();
  const clientTrim = clientName.trim();
  const errors = {
    title: titleTrim.length < 2,
    client: clientTrim.length < 2,
    rooms: rooms.length === 0,
  };
  const hasErrors = errors.title || errors.client || errors.rooms;
  const [showErrors, setShowErrors] = React.useState(false);

  const start = async () => {
    if (hasErrors) {
      setShowErrors(true);
      toast.warning("Please fill in the required fields highlighted in red.");
      return;
    }
    setPending(true);
    try {
      let projectId = `new:${crypto.randomUUID()}`;
      if (isSupabaseConfigured()) {
        const supa = createClient();
        const { data: { user } } = await supa.auth.getUser();
        // Create client + project
        const { data: client, error: cErr } = await supa
          .from("clients")
          .insert({ full_name: clientTrim, owner_id: user?.id ?? null })
          .select("id")
          .single();
        if (cErr) throw cErr;
        const { data: project, error: pErr } = await supa
          .from("projects")
          .insert({
            client_id: client.id,
            title: titleTrim,
            type,
            status: "new_lead",
            rooms,
            consultant_id: user?.id ?? null,
            created_by: user?.id ?? null,
          })
          .select("id")
          .single();
        if (pErr) throw pErr;
        // Pre-create rooms
        if (rooms.length) {
          await supa.from("rooms").insert(rooms.map((r) => ({ project_id: project.id, kind: r })));
        }
        await supa.from("activities").insert({ project_id: project.id, client_id: client.id, actor_id: user?.id ?? null, kind: "created" });
        projectId = project.id;
      }
      router.push(`/intake/${projectId}?type=${type}&rooms=${encodeURIComponent(rooms.join(","))}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start intake");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Project type <span className="text-destructive">*</span>
          </CardTitle>
          <CardDescription>What are we remodeling?</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((t) => {
            const active = type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition hover:shadow-md",
                  active && "ring-2 ring-primary",
                )}
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <t.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.blurb}</div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className={cn(showErrors && errors.rooms && "border-destructive")}>
        <CardHeader>
          <CardTitle>
            Rooms in scope <span className="text-destructive">*</span>
          </CardTitle>
          <CardDescription>Pick at least one room. You can add more later.</CardDescription>
        </CardHeader>
        <CardContent>
          {showErrors && errors.rooms && (
            <p className="mb-3 text-xs text-destructive">Select at least one room.</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ROOMS.map((r) => {
              const checked = rooms.includes(r.value);
              return (
                <Label
                  key={r.value}
                  htmlFor={`room-${r.value}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border p-3 hover:bg-accent",
                    checked && "border-primary bg-primary/5",
                  )}
                >
                  <Checkbox
                    id={`room-${r.value}`}
                    checked={checked}
                    onCheckedChange={(v) => setRooms((prev) => (v ? [...prev, r.value] : prev.filter((x) => x !== r.value)))}
                  />
                  {r.label}
                </Label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick details</CardTitle>
          <CardDescription>Fill these now — the rest comes inside the wizard.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">
              Project title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Patel — Kitchen remodel"
              aria-invalid={showErrors && errors.title}
              className={cn(showErrors && errors.title && "border-destructive ring-1 ring-destructive")}
            />
            {showErrors && errors.title && (
              <p className="text-xs text-destructive">Give the project a short title (e.g. surname + room).</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">
              Client name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Avery Patel"
              aria-invalid={showErrors && errors.client}
              className={cn(showErrors && errors.client && "border-destructive ring-1 ring-destructive")}
            />
            {showErrors && errors.client && (
              <p className="text-xs text-destructive">Add the homeowner's name.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={start} disabled={pending}>
          {pending ? "Creating…" : "Start discovery"}
        </Button>
      </div>
    </div>
  );
}
