"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import { useTransition } from "react";
import { Eraser, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { createSignatureAction } from "@/lib/actions/signatures";

interface Props {
  projectId: string;
  redirectTo: string;
  defaultSignerName?: string;
  defaultSignerEmail?: string;
  consentText: string;
  estimateId?: string;
}

export function SignaturePad({
  projectId,
  redirectTo,
  defaultSignerName,
  defaultSignerEmail,
  consentText,
  estimateId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const padRef = React.useRef<SignatureCanvas | null>(null);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [signerName, setSignerName] = React.useState(defaultSignerName ?? "");
  const [signerEmail, setSignerEmail] = React.useState(defaultSignerEmail ?? "");
  const [agreed, setAgreed] = React.useState(false);
  const [empty, setEmpty] = React.useState(true);

  // Resize the canvas to fit its container — required by signature_pad.
  React.useEffect(() => {
    const wrap = wrapRef.current;
    const pad = padRef.current;
    if (!wrap || !pad) return;
    const resize = () => {
      const canvas = pad.getCanvas();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const { width } = wrap.getBoundingClientRect();
      const height = 200;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      pad.clear();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const clearPad = () => {
    padRef.current?.clear();
    setEmpty(true);
  };

  const onEnd = () => {
    setEmpty(padRef.current?.isEmpty() ?? true);
  };

  const submit = () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      toast.warning("Please draw your signature in the box.");
      return;
    }
    if (signerName.trim().length < 2) {
      toast.warning("Enter the signer's full name.");
      return;
    }
    if (!agreed) {
      toast.warning("Tick the confirmation box to acknowledge the requirements.");
      return;
    }
    // Get SVG XML from the data URL the pad gives us.
    const dataUrl = padRef.current.toDataURL("image/svg+xml");
    let svg: string;
    if (dataUrl.startsWith("data:image/svg+xml;base64,")) {
      const b64 = dataUrl.replace("data:image/svg+xml;base64,", "");
      svg = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("utf-8");
    } else {
      // Already-decoded variant some browsers return
      svg = decodeURIComponent(dataUrl.replace(/^data:image\/svg\+xml(;[^,]+)?,/, ""));
    }

    startTransition(async () => {
      try {
        await createSignatureAction({
          projectId,
          estimateId: estimateId ?? null,
          signerName,
          signerEmail: signerEmail || null,
          signatureSvg: svg,
          advanceStatus: !estimateId,
        });
        toast.success("Signed. Thanks!");
        router.push(redirectTo);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not save signature");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="signer-name">
            Signer name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="signer-name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="Full legal name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signer-email">Email (optional)</Label>
          <Input
            id="signer-email"
            type="email"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            placeholder="signer@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Signature <span className="text-destructive">*</span>
        </Label>
        <div
          ref={wrapRef}
          className="relative rounded-lg border bg-card"
        >
          <SignatureCanvas
            ref={(r) => {
              padRef.current = r;
            }}
            penColor="#0b0b0b"
            onEnd={onEnd}
            canvasProps={{
              className: "block w-full rounded-lg touch-none",
              style: { height: 200 },
            }}
          />
          {empty && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
              Sign here with your finger or stylus
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPad}
            className="absolute right-2 top-2"
          >
            <Eraser className="h-4 w-4" /> Clear
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Signed timestamp, IP, and user-agent are recorded for the audit trail.
        </p>
      </div>

      <Label
        htmlFor="consent"
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm",
          agreed && "border-primary bg-primary/5",
        )}
      >
        <Checkbox
          id="consent"
          checked={agreed}
          onCheckedChange={(v) => setAgreed(Boolean(v))}
          className="mt-0.5"
        />
        <span className="leading-snug">{consentText}</span>
      </Label>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={isPending} size="lg">
          {isPending ? "Saving…" : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Confirm & sign
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
