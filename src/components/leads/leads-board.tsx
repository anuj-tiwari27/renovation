"use client";

import * as React from "react";
import Link from "next/link";
import { useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateProjectStatusAction } from "@/lib/actions/projects";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Project, ProjectStatus, Client } from "@/lib/supabase/database.types";

export interface LeadRow extends Project {
  clients: Pick<Client, "full_name" | "address_city" | "address_state"> | null;
}

export const COLUMNS: { id: ProjectStatus; label: string }[] = [
  { id: "new_lead", label: "New" },
  { id: "consultation_scheduled", label: "Consultation" },
  { id: "discovery_completed", label: "Discovery" },
  { id: "estimate_pending", label: "Estimating" },
  { id: "estimate_sent", label: "Sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "approved", label: "Approved" },
  { id: "lost", label: "Lost" },
];

export function LeadsBoard({ initial }: { initial: LeadRow[] }) {
  const [rows, setRows] = React.useState<LeadRow[]>(initial);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Sensors: pointer (mouse) with a small distance gate so clicks still
  // navigate, and touch with a hold delay for clean mobile drag/scroll split.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  );

  const onDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const id = e.active.id as string;
    const overId = e.over?.id as string | undefined;
    if (!overId) return;

    // The droppable id is the column status. The dragged card's id is the project id.
    const targetStatus = overId as ProjectStatus;
    const card = rows.find((r) => r.id === id);
    if (!card || card.status === targetStatus) return;

    // Optimistic update
    setRows((curr) =>
      curr.map((r) => (r.id === id ? { ...r, status: targetStatus } : r)),
    );

    startTransition(async () => {
      try {
        await updateProjectStatusAction(id, targetStatus);
      } catch (err) {
        // Roll back on failure
        setRows((curr) =>
          curr.map((r) => (r.id === id ? { ...r, status: card.status } : r)),
        );
        toast.error(err instanceof Error ? err.message : "Could not move lead");
      }
    });
  };

  const active = activeId ? rows.find((r) => r.id === activeId) ?? null : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 sm:-mx-0 sm:gap-4 sm:px-0">
        {COLUMNS.map((col) => {
          const items = rows.filter((r) => r.status === col.id);
          return (
            <Column key={col.id} id={col.id} label={col.label} count={items.length}>
              {items.map((p) => (
                <DraggableCard key={p.id} project={p} dragging={activeId === p.id} />
              ))}
            </Column>
          );
        })}
      </div>

      {/* Overlay shows the card under the user's cursor without re-mounting */}
      <DragOverlay dropAnimation={null}>
        {active ? <CardSurface project={active} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  id,
  label,
  count,
  children,
}: {
  id: ProjectStatus;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="w-[260px] shrink-0 sm:w-72">
      <Card className={cn("bg-muted/40 transition-colors", isOver && "ring-2 ring-primary")}>
        <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
          <CardTitle className="text-sm">{label}</CardTitle>
          <Badge variant="secondary">{count}</Badge>
        </CardHeader>
        <CardContent className="min-h-[80px] space-y-2">
          {count === 0 ? (
            <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
              Drop a lead here
            </div>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DraggableCard({ project, dragging }: { project: LeadRow; dragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: project.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-none rounded-lg border bg-card shadow-sm transition",
        dragging && "opacity-30",
      )}
    >
      <CardBody project={project} />
    </div>
  );
}

function CardSurface({ project }: { project: LeadRow }) {
  return (
    <div className="rounded-lg border bg-card shadow-lg ring-2 ring-primary">
      <CardBody project={project} />
    </div>
  );
}

function CardBody({ project: p }: { project: LeadRow }) {
  return (
    <div className="p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/projects/${p.id}`}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="font-medium hover:underline"
        >
          {p.title}
        </Link>
      </div>
      <div className="text-xs text-muted-foreground">
        {p.clients?.full_name ?? "—"}
        {p.clients?.address_city ? ` · ${p.clients.address_city}, ${p.clients.address_state ?? ""}` : ""}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="capitalize text-muted-foreground">{p.type.replace("_", " ")}</span>
        <span>{formatCurrency(p.expected_value)}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">Updated {formatDate(p.updated_at)}</div>
    </div>
  );
}
