"use client";

import { db, type OutboxRow } from "./db";
import { createClient } from "@/lib/supabase/client";

export async function enqueue(op: OutboxRow["op"], payload: unknown) {
  const row: OutboxRow = {
    key: crypto.randomUUID(),
    createdAt: Date.now(),
    op,
    payload,
    attempts: 0,
  };
  await db().outbox.add(row);
  return row.key;
}

export async function pending(): Promise<OutboxRow[]> {
  return db().outbox.orderBy("createdAt").toArray();
}

export async function flush(): Promise<{ ok: number; failed: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: 0, failed: 0 };
  }
  const supa = createClient();
  let ok = 0;
  let failed = 0;
  const rows = await pending();

  for (const row of rows) {
    try {
      switch (row.op) {
        case "answer.upsert": {
          const p = row.payload as { project_id: string; room_id?: string | null; question_set_slug: string; question_id: string; value: unknown };
          if (!p.project_id || p.project_id.startsWith("new:")) {
            // Project hasn't been persisted yet; keep draft locally and skip
            // — the wizard will resync once the row has a real id.
            break;
          }
          const { error } = await supa.from("answers").upsert(
            {
              project_id: p.project_id,
              room_id: p.room_id ?? null,
              question_set_slug: p.question_set_slug,
              question_id: p.question_id,
              value: p.value,
            },
            { onConflict: "project_id,room_id,question_set_slug,question_id" },
          );
          if (error) throw error;
          break;
        }
        case "project.update": {
          const p = row.payload as { id: string; patch: Record<string, unknown> };
          const { error } = await supa.from("projects").update(p.patch).eq("id", p.id);
          if (error) throw error;
          break;
        }
        case "client.update": {
          const p = row.payload as { id: string; patch: Record<string, unknown> };
          const { error } = await supa.from("clients").update(p.patch).eq("id", p.id);
          if (error) throw error;
          break;
        }
        case "room.update": {
          const p = row.payload as { id: string; patch: Record<string, unknown> };
          const { error } = await supa.from("rooms").update(p.patch).eq("id", p.id);
          if (error) throw error;
          break;
        }
        case "note.create": {
          const p = row.payload as { project_id: string; body: string };
          const { error } = await supa.from("notes").insert(p);
          if (error) throw error;
          break;
        }
        case "activity.create": {
          const p = row.payload as Record<string, unknown>;
          const { error } = await supa.from("activities").insert(p);
          if (error) throw error;
          break;
        }
        case "media.upload": {
          const p = row.payload as { project_id: string; storage_path: string; record: Record<string, unknown> };
          const cached = await db().mediaCache.where("key").equals(row.key).first();
          if (!cached) throw new Error("missing cached blob");
          const up = await supa.storage.from("project-media").upload(p.storage_path, cached.blob, {
            upsert: false,
            contentType: cached.mime,
          });
          if (up.error) throw up.error;
          const { error } = await supa.from("media").insert({
            project_id: p.project_id,
            storage_path: p.storage_path,
            ...p.record,
          });
          if (error) throw error;
          await db().mediaCache.where("key").equals(row.key).delete();
          break;
        }
      }
      await db().outbox.delete(row.id!);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db().outbox.update(row.id!, {
        attempts: row.attempts + 1,
        lastError: msg,
      });
      failed++;
    }
  }
  return { ok, failed };
}

let timer: ReturnType<typeof setInterval> | null = null;
export function startAutoFlush(intervalMs = 15_000) {
  if (typeof window === "undefined" || timer) return;
  const tick = () => void flush();
  timer = setInterval(tick, intervalMs);
  window.addEventListener("online", tick);
  window.addEventListener("focus", tick);
}
export function stopAutoFlush() {
  if (timer) clearInterval(timer);
  timer = null;
}
