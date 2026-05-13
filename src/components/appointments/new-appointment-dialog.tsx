"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAppointmentAction } from "@/lib/actions/appointments";

export interface ProjectOption {
  id: string;
  title: string;
  client_id: string;
}

interface Props {
  projects: ProjectOption[];
  defaultProjectId?: string;
  trigger?: React.ReactNode;
}

const KINDS = [
  { value: "consultation", label: "Consultation" },
  { value: "design", label: "Design review" },
  { value: "site_visit", label: "Site visit" },
  { value: "final_walk", label: "Final walkthrough" },
];

// Quickly format the next round-hour as a default `datetime-local` value.
function defaultStart(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toLocalDt(d);
}
function defaultEnd(start: string): string {
  const d = new Date(start);
  if (isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() + 60);
  return toLocalDt(d);
}
function toLocalDt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewAppointmentDialog({ projects, defaultProjectId, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();

  const [projectId, setProjectId] = React.useState<string>(defaultProjectId ?? "");
  const [kind, setKind] = React.useState("consultation");
  const [starts, setStarts] = React.useState(defaultStart());
  const [ends, setEnds] = React.useState(defaultEnd(defaultStart()));
  const [location, setLocation] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Reset when the dialog opens so each appointment gets fresh defaults.
  React.useEffect(() => {
    if (open) {
      const s = defaultStart();
      setStarts(s);
      setEnds(defaultEnd(s));
      setKind("consultation");
      setLocation("");
      setNotes("");
      if (defaultProjectId) setProjectId(defaultProjectId);
    }
  }, [open, defaultProjectId]);

  const onStartsChange = (v: string) => {
    setStarts(v);
    // Auto-shift the end by an hour if the user hasn't customised it.
    if (!ends || new Date(ends) <= new Date(v)) setEnds(defaultEnd(v));
  };

  const submit = () => {
    const project = projects.find((p) => p.id === projectId);
    startTransition(async () => {
      try {
        await createAppointmentAction({
          starts_at: new Date(starts).toISOString(),
          ends_at: new Date(ends).toISOString(),
          kind,
          project_id: projectId || null,
          client_id: project?.client_id ?? null,
          location: location || null,
          notes: notes || null,
        });
        toast.success("Appointment scheduled");
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not schedule");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> New appointment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Schedule appointment
          </DialogTitle>
          <DialogDescription>
            Consultations, design reviews, site visits, and walkthroughs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="appt-project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="appt-project">
                  <SelectValue placeholder="Optional — unlinked appointment" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-kind">Type</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger id="appt-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="appt-starts">Starts</Label>
              <Input id="appt-starts" type="datetime-local" value={starts} onChange={(e) => onStartsChange(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-ends">Ends</Label>
              <Input id="appt-ends" type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appt-location">Location</Label>
            <Input
              id="appt-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Property address, video call link, office…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appt-notes">Notes</Label>
            <Textarea
              id="appt-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agenda, parking notes, things to bring…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Saving…" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
