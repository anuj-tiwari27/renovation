"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { Field } from "@/lib/intake/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldRenderer({ field, value, onChange }: Props) {
  if (field.kind === "section_break") return null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={field.id} className="text-sm">
          {field.label}
          {field.required ? <span className="ml-1 text-destructive">*</span> : null}
        </Label>
        {field.unit && <span className="text-xs text-muted-foreground">{field.unit}</span>}
      </div>
      {field.helper && <p className="-mt-1 text-xs text-muted-foreground">{field.helper}</p>}
      {renderInput(field, value, onChange)}
    </div>
  );
}

function renderInput(field: Field, value: unknown, onChange: (v: unknown) => void) {
  switch (field.kind) {
    case "text":
    case "email":
    case "phone":
      return (
        <Input
          id={field.id}
          type={field.kind === "email" ? "email" : field.kind === "phone" ? "tel" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    case "address":
      return (
        <Textarea
          id={field.id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "Street, city, state, ZIP"}
        />
      );
    case "longtext":
      return (
        <Textarea
          id={field.id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      );
    case "number":
    case "currency":
      return (
        <Input
          id={field.id}
          type="number"
          inputMode="decimal"
          value={value == null || value === "" ? "" : String(value)}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : Number(v));
          }}
          min={field.min}
          max={field.max}
          step={field.step ?? (field.kind === "currency" ? 100 : "any")}
          placeholder={field.kind === "currency" ? "$" : ""}
        />
      );
    case "date":
      return (
        <Input
          id={field.id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
    case "boolean": {
      const v: boolean | null =
        value === true ? true : value === false ? false : null;
      const segBase =
        "w-20 sm:w-16 h-10 sm:h-9 text-sm font-medium rounded-md transition-colors";
      return (
        <div
          role="radiogroup"
          aria-labelledby={field.id}
          className="inline-flex items-stretch gap-1 rounded-lg border bg-muted/40 p-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={v === true}
            onClick={() => onChange(true)}
            className={cn(
              segBase,
              v === true
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/70 hover:bg-background hover:text-foreground",
            )}
          >
            Yes
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={v === false}
            onClick={() => onChange(false)}
            className={cn(
              segBase,
              v === false
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/70 hover:bg-background hover:text-foreground",
            )}
          >
            No
          </button>
        </div>
      );
    }
    case "select":
      return (
        <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id={field.id}>
            <SelectValue placeholder={field.placeholder ?? "Select…"} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "radio":
      return (
        <RadioGroup
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v)}
          className="grid gap-2 sm:grid-cols-2"
        >
          {field.options?.map((o) => (
            <Label
              key={o.value}
              htmlFor={`${field.id}-${o.value}`}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem id={`${field.id}-${o.value}`} value={o.value} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">{o.label}</div>
                {o.description && (
                  <div className="text-xs text-muted-foreground">{o.description}</div>
                )}
              </div>
            </Label>
          ))}
        </RadioGroup>
      );
    case "multiselect":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {field.options?.map((o) => {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const checked = arr.includes(o.value);
            return (
              <Label
                key={o.value}
                htmlFor={`${field.id}-${o.value}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent",
                  checked && "border-primary bg-primary/5",
                )}
              >
                <Checkbox
                  id={`${field.id}-${o.value}`}
                  checked={checked}
                  onCheckedChange={(v) => {
                    const next = v ? [...arr, o.value] : arr.filter((x) => x !== o.value);
                    onChange(next);
                  }}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium">{o.label}</div>
                  {o.description && (
                    <div className="text-xs text-muted-foreground">{o.description}</div>
                  )}
                </div>
              </Label>
            );
          })}
        </div>
      );
    case "tags": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div>
          <div className="mb-2 flex flex-wrap gap-1">
            {arr.map((t) => (
              <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => onChange(arr.filter((x) => x !== t))}>
                {t} ×
              </Badge>
            ))}
          </div>
          <Input
            placeholder={field.placeholder ?? "Type and press Enter"}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const v = (e.currentTarget.value || "").trim();
                if (v && !arr.includes(v)) onChange([...arr, v]);
                e.currentTarget.value = "";
              }
            }}
          />
        </div>
      );
    }
    case "slider": {
      const v = typeof value === "number" ? value : Math.round(((field.min ?? 0) + (field.max ?? 100)) / 2);
      return (
        <div className="space-y-2">
          <Slider
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            value={[v]}
            onValueChange={(vals) => onChange(vals[0])}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{field.min ?? 0}</span>
            <span className="font-medium text-foreground">{v}</span>
            <span>{field.max ?? 100}</span>
          </div>
        </div>
      );
    }
    case "rating": {
      const max = field.max ?? 5;
      const v = typeof value === "number" ? value : 0;
      return (
        <div className="flex gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={cn(
                "h-9 w-9 rounded-md border text-sm transition",
                i <= v ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
              )}
            >
              {i}
            </button>
          ))}
        </div>
      );
    }
    case "image_cards": {
      const anyHasImage = field.options?.some((o) => o.imageUrl);
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {field.options?.map((o) => {
            const checked = value === o.value;
            // With imageUrl: hero card (4:3 aspect, label overlaid bottom).
            // Without: compact card with label + description (no fixed aspect ratio).
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => onChange(o.value)}
                className={cn(
                  "group relative flex overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:shadow-md",
                  o.imageUrl
                    ? "aspect-[4/3] flex-col items-start justify-end p-4"
                    : "items-start gap-3 p-4",
                  // When some cards in this set have images, keep heights uniform-ish on the imageless ones too
                  !o.imageUrl && anyHasImage && "min-h-[88px]",
                  checked && "border-primary ring-2 ring-primary",
                )}
                style={
                  o.imageUrl
                    ? {
                        backgroundImage: `linear-gradient(to top, rgba(0,0,0,.55), transparent), url(${o.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <div className="flex-1">
                  <div className={cn("text-sm font-medium", o.imageUrl && "text-white")}>{o.label}</div>
                  {o.description && (
                    <div className={cn("mt-0.5 text-xs", o.imageUrl ? "text-white/85" : "text-muted-foreground")}>
                      {o.description}
                    </div>
                  )}
                </div>
                {checked && (
                  <span className="absolute right-2 top-2 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      );
    }
    case "color_swatches": {
      const arr = Array.isArray(value) ? (value as string[]) : value ? [value as string] : [];
      return (
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {field.options?.map((o) => {
            const checked = arr.includes(o.value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => {
                  const next = checked ? arr.filter((x) => x !== o.value) : [...arr, o.value];
                  onChange(next);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition hover:bg-accent",
                  checked && "border-primary bg-primary/5",
                )}
              >
                <span
                  className="inline-block h-6 w-6 rounded-full border"
                  style={{ background: o.swatch }}
                  aria-hidden
                />
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    default:
      return null;
  }
}
