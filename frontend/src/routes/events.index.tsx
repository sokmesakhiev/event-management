import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { eventsApi } from "@/lib/api-client";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatPrice, categoryLabel } from "@/lib/event-utils";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Browse events — Rally" },
      {
        name: "description",
        content: "Discover running races, group rides and community gatherings to join.",
      },
    ],
  }),
  component: BrowseEvents,
});

function BrowseEvents() {
  const query = useQuery({
    queryKey: ["published-events"],
    queryFn: async () => {
      const { events } = await eventsApi.list();
      return events;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="font-display text-3xl font-bold">Upcoming events</h1>
        <p className="mt-1 text-muted-foreground">Find your next race, ride or gathering.</p>

        {query.isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}
        {query.data?.length === 0 && (
          <p className="mt-16 text-center text-muted-foreground">
            No upcoming events yet. Check back soon!
          </p>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {query.data?.map((ev) => {
            const brandColor = ev.brand_color ?? "#6366f1";
            return (
              <Link
                key={ev.id}
                to="/events/$eventId"
                params={{ eventId: ev.id }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-transform hover:-translate-y-1"
              >
                {/* Banner or color strip */}
                {ev.banner_url ? (
                  <div className="relative h-36 w-full overflow-hidden">
                    <img
                      src={ev.banner_url}
                      alt={`${ev.title} banner`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                ) : (
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: brandColor }}
                  />
                )}

                <div className="p-6">
                  {/* Logo + badges row */}
                  <div className="flex items-center gap-3">
                    {ev.logo_url && (
                      <img
                        src={ev.logo_url}
                        alt="Event logo"
                        className="h-8 w-8 rounded-lg border border-border object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${brandColor}22`,
                          color: brandColor,
                          borderColor: `${brandColor}44`,
                        }}
                      >
                        {categoryLabel(ev.category)}
                      </Badge>
                      <Badge variant="outline">{formatPrice(ev.price_cents, ev.currency)}</Badge>
                    </div>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold">{ev.title}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" /> {formatDateTime(ev.start_at)}
                  </p>
                  {ev.location && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {ev.location}
                    </p>
                  )}
                  <span
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-1"
                    style={{ color: brandColor }}
                  >
                    View & register <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
