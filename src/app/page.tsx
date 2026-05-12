import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChefHat, Bath, Home, Sparkles, ShieldCheck, WifiOff, Layers } from "lucide-react";
import { BrandMark, BrandLogo } from "@/components/brand";
import { env } from "@/lib/env";

export default function LandingPage() {
  return (
    <main className="min-h-svh">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <BrandMark size={28} className="shrink-0" />
          <span className="truncate text-base sm:text-lg">{env.NEXT_PUBLIC_APP_NAME}</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/intake/new">
              Start a project <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="sm" className="sm:hidden">
            <Link href="/intake/new">
              Start <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Premium remodeling, end-to-end
            </span>
            <div className="mt-5 sm:mt-6">
              <BrandLogo height={80} className="max-w-full sm:hidden" />
              <BrandLogo height={120} className="hidden max-w-full sm:block lg:hidden" />
              <BrandLogo height={140} className="hidden max-w-full lg:block" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-semibold leading-tight tracking-tight sm:mt-6 sm:text-3xl lg:text-4xl">
              Kitchen, bath, full-home —
              <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent"> discovery to handover.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
              Capture every detail of your remodel — onsite, even offline.
              Generate scope, summaries, and proposals your clients will actually read.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
              <Button asChild size="lg" className="flex-1 sm:flex-none">
                <Link href="/intake/new">Start an intake <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-none">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:mt-10 sm:grid-cols-3 sm:gap-6">
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Role-based access for sales, design, estimating, PM</div>
              <div className="flex items-start gap-2"><WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Works offline onsite — auto-syncs when reconnected</div>
              <div className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> AI-assisted summaries & scope drafts</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: ChefHat, label: "Kitchen", blurb: "Cabinets, counters, appliances, lighting, flow" },
              { icon: Bath, label: "Bathroom", blurb: "Spa expectations, waterproofing, accessibility" },
              { icon: Home, label: "Full home", blurb: "Programs, structural, systems, lifestyle" },
              { icon: Layers, label: "Multi-room", blurb: "Coordinate scope across rooms" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md">
                <c.icon className="h-6 w-6 text-primary" />
                <div className="mt-3 font-semibold">{c.label}</div>
                <div className="text-sm text-muted-foreground">{c.blurb}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {env.NEXT_PUBLIC_COMPANY_NAME}
      </footer>
    </main>
  );
}
