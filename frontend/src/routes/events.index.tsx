import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, ArrowRight, Ticket, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { eventsApi } from "@/lib/api-client";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatPrice, categoryLabel } from "@/lib/event-utils";

// Only worth showing a filter once there's enough to filter through.
const FILTER_THRESHOLD = 10;

const VALUE_PROP_ITEMS = [
  { icon: CalendarDays, key: "realDates" },
  { icon: Users, key: "community" },
  { icon: Ticket, key: "registerFast" },
] as const;

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
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["published-events"],
    queryFn: async () => {
      const { events } = await eventsApi.list();
      return events;
    },
  });

  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const showFilter = (query.data?.length ?? 0) > FILTER_THRESHOLD;

  // Only offer categories that actually have events, each with a count.
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ev of query.data ?? []) {
      counts.set(ev.category, (counts.get(ev.category) ?? 0) + 1);
    }
    return counts;
  }, [query.data]);

  const filteredEvents = useMemo(() => {
    if (!showFilter || categoryFilter === "all") return query.data;
    return query.data?.filter((ev) => ev.category === categoryFilter);
  }, [query.data, showFilter, categoryFilter]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-10">
        {/* Intro — explains what this page is before the listing itself */}
        <section className="border-b border-border pb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("eventsList.openForRegistration")}
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            {t("eventsList.titlePrefix")}{" "}
            <span className="text-gradient">{t("eventsList.titleHighlight")}</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t("eventsList.subtitle")}</p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {VALUE_PROP_ITEMS.map((item) => (
              <div key={item.key} className="flex items-start gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg [background-image:var(--gradient-hero)] text-primary-foreground">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {t(`eventsList.valueProps.${item.key}.title`)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t(`eventsList.valueProps.${item.key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">{t("eventsList.upcomingEvents")}</h2>
          {showFilter && (
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label={t("eventsList.filterAll")}
                count={query.data?.length}
                active={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
              />
              {[...categoryCounts.entries()].map(([value, count]) => (
                <FilterChip
                  key={value}
                  label={categoryLabel(value)}
                  count={count}
                  active={categoryFilter === value}
                  onClick={() => setCategoryFilter(value)}
                />
              ))}
            </div>
          )}
        </div>

        {query.isLoading && <p className="mt-8 text-muted-foreground">{t("common.loading")}</p>}
        {query.data?.length === 0 && (
          <p className="mt-16 text-center text-muted-foreground">{t("eventsList.emptyAll")}</p>
        )}
        {showFilter && filteredEvents?.length === 0 && (
          <p className="mt-16 text-center text-muted-foreground">{t("eventsList.emptyCategory")}</p>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {filteredEvents?.map((ev) => {
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
                      alt={t("common.bannerAlt", { title: ev.title })}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="h-2 w-full" style={{ backgroundColor: brandColor }} />
                )}

                <div className="p-6">
                  {/* Logo + badges row */}
                  <div className="flex items-center gap-3">
                    {ev.logo_url && (
                      <img
                        src={ev.logo_url}
                        alt={t("common.eventLogoAlt")}
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
                    {t("eventsList.viewAndRegister")} <ArrowRight className="h-4 w-4" />
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

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {typeof count === "number" && <span className="ml-1 opacity-70">({count})</span>}
    </button>
  );
}
