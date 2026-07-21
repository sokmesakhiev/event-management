import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bike,
  Users,
  CalendarCheck,
  MapPin,
  Trophy,
  Ticket,
  BarChart3,
  Bell,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { eventPlansApi } from "@/lib/api-client";
import { formatPrice } from "@/lib/event-utils";
import heroImg from "@/assets/hero-runners.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rally — Create & Join Running Events" },
      {
        name: "description",
        content:
          "Rally lets anyone organize running races, group rides, and community gatherings in minutes. Manage registrations, send updates, and grow your community.",
      },
      { property: "og:title", content: "Rally — Create & Join Running Events" },
      {
        property: "og:description",
        content: "Organize running races, group rides, and community gatherings in minutes.",
      },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: CalendarCheck,
    title: "Set up in minutes",
    desc: "Create an event with date, route, capacity and pricing through a guided flow.",
  },
  {
    icon: Ticket,
    title: "Registrations & tickets",
    desc: "Free or paid sign-ups with capacity limits, waitlists and instant confirmations.",
  },
  {
    icon: MapPin,
    title: "Routes & maps",
    desc: "Share start points, distances and elevation so participants know what to expect.",
  },
  {
    icon: Bell,
    title: "Updates that land",
    desc: "Notify everyone about schedule changes, weather, or last-minute details.",
  },
  {
    icon: BarChart3,
    title: "Live dashboard",
    desc: "Track sign-ups and attendance in real time from one clean overview.",
  },
  {
    icon: Trophy,
    title: "Results & community",
    desc: "Post results, celebrate finishers, and keep your people coming back.",
  },
];

const eventTypes = [
  { icon: Activity, label: "Running races", note: "5K, 10K, half & full marathons" },
  { icon: Bike, label: "Group rides", note: "Casual spins to century challenges" },
  { icon: Users, label: "Community gatherings", note: "Meetups, clinics & social runs" },
];

const steps = [
  { n: "01", title: "Create your event", desc: "Add details, route and registration settings." },
  { n: "02", title: "Share the link", desc: "Promote it and let people sign up in seconds." },
  { n: "03", title: "Run the day", desc: "Manage check-ins, updates and results in one place." },
];

function Index() {
  const plansQuery = useQuery({
    queryKey: ["event-plans"],
    queryFn: async () => {
      const { plans } = await eventPlansApi.list();
      return plans;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Runners racing along a coastal road at dawn"
            width={1600}
            height={1200}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-24 md:py-36">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Event management for movers
            </span>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] md:text-7xl">
              Bring people <span className="text-gradient">together</span>, one event at a time.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Rally is the easiest way to organize running races, group rides and community
              gatherings. Set up an event, open registrations and manage the whole day from a single
              dashboard.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button asChild variant="hero" size="xl">
                <Link to="/auth">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-8 text-sm text-muted-foreground">
              <div>
                <p className="font-display text-2xl font-bold text-foreground">12k+</p>
                <p>events hosted</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">480k</p>
                <p>participants</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">4.9★</p>
                <p>organizer rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event types */}
      <section id="events" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Built for every kind of gathering
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Whether it's a competitive race or a relaxed weekend meetup, Rally has you covered.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {eventTypes.map((t) => (
            <div
              key={t.label}
              className="group rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-secondary">
                <t.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{t.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Everything you need to run a great event
            </h2>
            <p className="mt-3 text-muted-foreground">
              From the first registration to the finish line, Rally handles the logistics so you can
              focus on the experience.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-background p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg [background-image:var(--gradient-hero)] text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Every event starts as a free draft. When you're ready to open registrations, pick a plan
            based on how many people you expect — that's what you pay to publish.
          </p>
        </div>

        {plansQuery.isLoading && (
          <p className="mt-12 text-center text-sm text-muted-foreground">Loading plans…</p>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {plansQuery.data?.map((plan) => {
            const isFree = plan.price_cents === 0;
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border p-6 shadow-[var(--shadow-card)] ${
                  isFree ? "border-primary/40 bg-primary/5" : "border-border bg-card"
                }`}
              >
                {isFree && (
                  <span className="mb-3 inline-flex w-fit items-center rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                    Start here
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.label}</h3>
                <p className="mt-2 font-display text-3xl font-bold">
                  {isFree ? "Free" : formatPrice(plan.price_cents, "usd")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">per published event</p>
                <div className="mt-5 flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Up to {plan.capacity.toLocaleString()} registrants</span>
                </div>
                <div className="mt-2 flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Full dashboard, branding & QR code</span>
                </div>
                <Button asChild variant={isFree ? "hero" : "outline"} size="sm" className="mt-6">
                  <Link to="/auth">Get started</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Go from idea to a fully managed event in three simple steps.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-8">
              <span className="font-display text-4xl font-bold text-gradient">{s.n}</span>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="overflow-hidden rounded-3xl border border-border p-10 text-center shadow-[var(--shadow-glow)] [background-image:var(--gradient-hero)] md:p-16">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">
            Ready to rally your community?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Create your first event today. It's free to get started.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
            >
              <Link to="/auth">
                Sign in to get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">Rally</span>
          </div>
          <p>© {new Date().getFullYear()} Rally. Bring people together.</p>
        </div>
      </footer>
    </div>
  );
}
