"use client";

import Dexie, { type Table } from "dexie";

export interface OutboxRow {
  id?: number;
  /** unique idempotency key e.g. crypto.randomUUID() */
  key: string;
  createdAt: number;
  /** opaque operation type — handler picks how to flush */
  op:
    | "answer.upsert"
    | "project.update"
    | "client.update"
    | "media.upload"
    | "note.create"
    | "activity.create";
  payload: unknown;
  attempts: number;
  lastError?: string;
}

export interface DraftRow {
  id?: number;
  /** projectId or 'new:<uuid>' for unsaved */
  scope: string;
  /** question set slug (and optional roomId) */
  key: string;
  data: Record<string, unknown>;
  updatedAt: number;
}

export interface MediaCacheRow {
  id?: number;
  /** local key tied to outbox row */
  key: string;
  blob: Blob;
  filename: string;
  mime: string;
  meta: Record<string, unknown>;
}

class RemodelDB extends Dexie {
  outbox!: Table<OutboxRow, number>;
  drafts!: Table<DraftRow, number>;
  mediaCache!: Table<MediaCacheRow, number>;

  constructor() {
    super("remodel-studio");
    this.version(1).stores({
      outbox: "++id, key, op, createdAt",
      drafts: "++id, &[scope+key], scope, updatedAt",
      mediaCache: "++id, &key",
    });
  }
}

let _db: RemodelDB | null = null;
export function db(): RemodelDB {
  if (typeof window === "undefined") throw new Error("offline db is browser-only");
  if (!_db) _db = new RemodelDB();
  return _db;
}
