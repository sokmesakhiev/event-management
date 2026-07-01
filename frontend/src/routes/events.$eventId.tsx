import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Users, ArrowLeft, Download, Loader2, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import { eventsApi, registrationsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/use-auth";
import { SiteHeader } from "@/components/site-header";
import { EventQRCode } from "@/components/event-qr-code";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatPrice, categoryLabel } from "@/lib/event-utils";
import { downloadICS } from "@/lib/ics";

export const Route = createFileRoute("/events/$eventId")({
  head: () => ({ meta: [{ title: "Event — Rally" }] }),
  component: EventDetail,
});

function EventDetail() {
  const { eventId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ["public-event", eventId],
    queryFn: async () => {
      const { event } = await eventsApi.get(eventId);
      return event;
    },
  });

  const regQuery = useQuery({
    queryKey: ["my-reg", eventId, user?.id],
    enabled: !!user,
    queryFn: () => registrationsApi.myRegistrationForEvent(eventId),
  });

  const countQuery = useQuery({
    queryKey: ["event-count", eventId],
    queryFn: () => registrationsApi.registrationCount(eventId),
  });

  const register = useMutation({
    mutationFn: () => registrationsApi.create(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reg", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-count", eventId] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      toast.success("You're registered! Add the event to your calendar.");
      if (ev) downloadICS(ev);
    },
    onError: (e: any) => toast.error(e.message ?? "Could not register"),
  });

  const ev = eventQuery.data;
  const isFull = !!ev?.capacity && (countQuery.data ?? 0) >= ev.capacity;
  const brandColor = ev?.brand_color ?? "#6366f1";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Banner */}
      {ev?.banner_url && (
        <div className="relative h-52 w-full overflow-hidden md:h-72">
          <img
            src={ev.banner_url}
            alt={`${ev.title} banner`}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      <main className="mx-auto max-w-3xl px-5 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/events">
            <ArrowLeft className="h-4 w-4" /> All events
          </Link>
        </Button>

        {eventQuery.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {eventQuery.isError && (
          <p className="text-muted-foreground">This event could not be found.</p>
        )}

        {ev && (
          <>
            {/* Logo + title row */}
            <div className="flex items-start gap-4">
              {ev.logo_url && (
                <img
                  src={ev.logo_url}
                  alt="Event logo"
                  className="h-14 w-14 rounded-xl border border-border object-cover shadow-sm flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: `${brandColor}22`, color: brandColor, borderColor: `${brandColor}44` }}
                  >
                    {categoryLabel(ev.category)}
                  </Badge>
                  <Badge variant="outline">{formatPrice(ev.price_cents, ev.currency)}</Badge>
                </div>
                <h1 className="mt-2 font-display text-4xl font-bold">{ev.title}</h1>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-muted-foreground">
              <p className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" /> {formatDateTime(ev.start_at)}
              </p>
              {ev.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> {ev.location}
                </p>
              )}
              <p className="flex items-center gap-2">
                <Users className="h-5 w-5" /> {countQuery.data ?? 0}
                {ev.capacity ? ` / ${ev.capacity}` : ""} registered
              </p>
            </div>

            {ev.description && (
              <p className="mt-6 whitespace-pre-wrap leading-relaxed">{ev.description}</p>
            )}

            {/* Registration card */}
            <div
              className="mt-8 rounded-2xl border p-6"
              style={{ borderColor: `${brandColor}44`, backgroundColor: `${brandColor}0a` }}
            >
              {regQuery.data ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="flex items-center gap-2 font-medium" style={{ color: brandColor }}>
                    <Check className="h-5 w-5" /> You're registered
                  </p>
                  <Button variant="outline" onClick={() => downloadICS(ev)}>
                    <Download className="h-4 w-4" /> Add to calendar
                  </Button>
                </div>
              ) : !user && !loading ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-muted-foreground">Sign in to register for this event.</p>
                  <Button
                    onClick={() => navigate({ to: "/auth" })}
                    style={{ backgroundColor: brandColor }}
                    className="text-white hover:opacity-90"
                  >
                    Sign in to register
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {ev.price_cents === 0
                        ? "Free registration"
                        : formatPrice(ev.price_cents, ev.currency)}
                    </p>
                    {ev.price_cents > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Payment collected by the organizer.
                      </p>
                    )}
                  </div>
                  <Button
                    disabled={register.isPending || isFull}
                    onClick={() => register.mutate()}
                    style={{ backgroundColor: brandColor }}
                    className="text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {register.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isFull ? "Event full" : "Register"}
                  </Button>
                </div>
              )}
            </div>

            {/* QR code */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">Share this event</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Scan the QR code to open this page, or download it to share on posters and social
                media.
              </p>
              <EventQRCode eventId={eventId} brandColor={brandColor} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
