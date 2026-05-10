"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, ImageIcon, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/offline/db";
import { enqueue, flush } from "@/lib/offline/outbox";
import { cn } from "@/lib/utils";
import type { MediaCategory, MediaKind } from "@/lib/supabase/database.types";

const CATS: { value: MediaCategory; label: string }[] = [
  { value: "existing_condition", label: "Existing condition" },
  { value: "inspiration", label: "Inspiration" },
  { value: "utility", label: "Utility / mechanical" },
  { value: "damage", label: "Damage" },
  { value: "measurement", label: "Measurement" },
  { value: "other", label: "Other" },
];

interface Props {
  projectId: string;
  roomId?: string | null;
}

export function MediaDropzone({ projectId, roomId }: Props) {
  const [category, setCategory] = React.useState<MediaCategory>("existing_condition");
  const [busy, setBusy] = React.useState(false);
  const [queued, setQueued] = React.useState<{ key: string; preview: string; name: string }[]>([]);

  const onDrop = React.useCallback(
    async (files: File[]) => {
      setBusy(true);
      try {
        for (const file of files) {
          const kind: MediaKind = file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("audio/")
              ? "voice_note"
              : file.type === "application/pdf"
                ? "pdf"
                : "photo";
          const filename = file.name;
          const path = `${projectId}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
          const key = await enqueue("media.upload", {
            project_id: projectId,
            storage_path: path,
            record: {
              room_id: roomId ?? null,
              kind,
              category,
              mime_type: file.type,
              size_bytes: file.size,
            },
          });
          await db().mediaCache.add({
            key,
            blob: file,
            filename,
            mime: file.type,
            meta: { category, kind, projectId, roomId },
          });
          setQueued((q) => [
            ...q,
            { key, preview: URL.createObjectURL(file), name: filename },
          ]);
        }
        const result = await flush();
        if (result.ok) toast.success(`Uploaded ${result.ok} file${result.ok === 1 ? "" : "s"}`);
        else if (!navigator.onLine) toast.warning("Saved offline — will upload when reconnected");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [projectId, roomId, category],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "video/*": [],
      "audio/*": [],
      "application/pdf": [],
    },
    maxSize: 100 * 1024 * 1024,
  });

  const removeQueued = (key: string) => {
    setQueued((q) => q.filter((x) => x.key !== key));
    void db().mediaCache.where("key").equals(key).delete();
    void db().outbox.where("key").equals(key).delete();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Category</span>
        <Select value={category} onValueChange={(v) => setCategory(v as MediaCategory)}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition",
          isDragActive ? "border-primary bg-primary/5" : "hover:bg-accent/50",
        )}
      >
        <input {...getInputProps()} />
        {busy ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="mt-3 text-sm font-medium">Drag photos, videos, voice notes, or PDFs</p>
        <p className="text-xs text-muted-foreground">or tap to choose · max 100MB each</p>
      </div>

      {queued.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {queued.map((q) => (
            <div key={q.key} className="relative overflow-hidden rounded-lg border bg-card">
              {q.preview.startsWith("blob:") ? (
                <img alt={q.name} src={q.preview} className="aspect-square w-full object-cover" />
              ) : (
                <div className="grid aspect-square place-items-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <div className="flex items-center justify-between p-2">
                <Badge variant="secondary" className="truncate">{q.name}</Badge>
                <Button size="icon" variant="ghost" onClick={() => removeQueued(q.key)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
