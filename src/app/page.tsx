import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Hammer, ChefHat, Bath, Home, Sparkles, ShieldCheck, WifiOff } from "lucide-react";
import { env } from "@/lib/env";

export default function LandingPage() {
  return (
    <main className="min-h-svh">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Hammer className="h-5 w-5 text-primary" />
          {env.NEXT_PUBLIC_APP_NAME}
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/intake/new">Start a project <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Built for remodeling teams
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Discovery, intake, and estimation —
              <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent"> in one premium workspace.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Capture every detail of a kitchen, bath, or whole-home remodel — onsite, even offline.
              Generate scope, summaries, and proposals your clients will actually read.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/intake/new">Start an intake <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" /> Role-based access for sales, design, estimating, PM</div>
              <div className="flex items-start gap-2"><WifiOff className="mt-0.5 h-4 w-4 text-primary" /> Works offline onsite — auto-syncs when reconnected</div>
              <div className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 text-primary" /> AI-assisted summaries & scope drafts</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: ChefHat, label: "Kitchen", blurb: "Cabinets, counters, appliances, lighting, flow" },
              { icon: Bath, label: "Bathroom", blurb: "Spa expectations, waterproofing, accessibility" },
              { icon: Home, label: "Full home", blurb: "Programs, structural, systems, lifestyle" },
              { icon: Hammer, label: "Multi-room", blurb: "Coordinate scope across rooms" },
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
