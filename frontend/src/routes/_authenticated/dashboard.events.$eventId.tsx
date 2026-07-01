import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  DollarSign,
  Trash2,
  Check,
  X,
  Download,
  Loader2,
  Palette,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { eventsApi, registrationsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/use-auth";
import { SiteHeader } from "@/components/site-header";
import { EventQRCode } from "@/components/event-qr-code";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDateTime, formatPrice, categoryLabel } from "@/lib/event-utils";
import { downloadICS } from "@/lib/ics";

export const Route = createFileRoute("/_authenticated/dashboard/events/$eventId")({
  head: () => ({ meta: [{ title: "Manage event — Rally" }] }),
  component: ManageEvent,
});

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#0ea5e9", "#64748b",
];

function ManageEvent() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Branding local state — undefined = not yet synced from server
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null | undefined>(undefined);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  const eventQuery = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { event } = await eventsApi.get(eventId);
      return event;
    },
  });

  const ev = eventQuery.data;

  // Sync local branding state on first load
  if (ev && brandColor === null) setBrandColor(ev.brand_color ?? "#6366f1");
  if (ev && bannerUrl === undefined) setBannerUrl(ev.banner_url ?? null);
  if (ev && logoUrl === undefined) setLogoUrl(ev.logo_url ?? null);

  const participantsQuery = useQuery({
    queryKey: ["event-participants", eventId],
    queryFn: () => registrationsApi.forEvent(eventId).then((r) => r.registrations),
  });

  const setPayment = useMutation({
    mutationFn: async ({ id, status, amount }: { id: string; status: string; amount: number }) => {
      await registrationsApi.updatePayment(id, status, status === "paid" ? amount : 0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
      toast.success("Payment updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeParticipant = useMutation({
    mutationFn: (id: string) => registrationsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-participants", eventId] });
      toast.success("Participant removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveBranding = useMutation({
    mutationFn: () =>
      eventsApi.update(eventId, {
        brand_color: brandColor ?? "#6366f1",
        banner_url: bannerUrl ?? null,
        logo_url: logoUrl ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["public-event", eventId] });
      toast.success("Branding saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteEvent = useMutation({
    mutationFn: () => eventsApi.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      toast.success("Event deleted");
      navigate({ to: "/dashboard" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const participants = participantsQuery.data ?? [];
  const paidCount = participants.filter((p) => p.payment_status === "paid").length;
  const revenue = participants.reduce((sum, p) => sum + (p.amount_paid_cents ?? 0), 0);

  const activeBrandColor = brandColor ?? ev?.brand_color ?? "#6366f1";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </Button>

        {eventQuery.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {ev && (
          <>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{categoryLabel(ev.category)}</Badge>
                  {!ev.is_published && <Badge variant="outline">Draft</Badge>}
                  <Badge variant="outline">{formatPrice(ev.price_cents, ev.currency)}</Badge>
                </div>
                <h1 className="mt-2 font-display text-3xl font-bold">{ev.title}</h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" /> {formatDateTime(ev.start_at)}
                </p>
                {ev.location && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {ev.location}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadICS(ev)}>
                  <Download className="h-4 w-4" /> .ics
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes the event and all registrations. This cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteEvent.mutate()}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat
                icon={Users}
                label="Participants"
                value={`${participants.length}${ev.capacity ? ` / ${ev.capacity}` : ""}`}
              />
              <Stat
                icon={Check}
                label="Paid"
                value={ev.price_cents === 0 ? "—" : `${paidCount} / ${participants.length}`}
              />
              <Stat
                icon={DollarSign}
                label="Revenue"
                value={formatPrice(revenue, ev.currency)}
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="participants" className="mt-10">
              <TabsList className="grid w-full max-w-sm grid-cols-2">
                <TabsTrigger value="participants">
                  <Users className="h-4 w-4 mr-1.5" /> Participants
                </TabsTrigger>
                <TabsTrigger value="branding">
                  <Palette className="h-4 w-4 mr-1.5" /> QR & Branding
                </TabsTrigger>
              </TabsList>

              {/* ── Participants ── */}
              <TabsContent value="participants" className="mt-6">
                <div className="overflow-hidden rounded-2xl border border-border">
                  {participantsQuery.isLoading && (
                    <p className="p-5 text-sm text-muted-foreground">Loading…</p>
                  )}
                  {!participantsQuery.isLoading && participants.length === 0 && (
                    <p className="p-8 text-center text-sm text-muted-foreground">
                      No one has registered yet. Share your event to get sign-ups.
                    </p>
                  )}
                  {participants.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex flex-wrap items-center justify-between gap-3 p-4 ${
                        i > 0 ? "border-t border-border" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium">{p.profile?.display_name ?? "Participant"}</p>
                        <p className="text-xs text-muted-foreground">
                          Registered {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.price_cents > 0 && (
                          <Badge variant={p.payment_status === "paid" ? "default" : "outline"}>
                            {p.payment_status === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                        )}
                        {ev.price_cents > 0 &&
                          (p.payment_status === "paid" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setPayment.mutate({ id: p.id, status: "unpaid", amount: 0 })
                              }
                            >
                              <X className="h-4 w-4" /> Mark unpaid
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setPayment.mutate({
                                  id: p.id,
                                  status: "paid",
                                  amount: ev.price_cents,
                                })
                              }
                            >
                              <Check className="h-4 w-4" /> Mark paid
                            </Button>
                          ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant.mutate(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ── QR & Branding ── */}
              <TabsContent value="branding" className="mt-6 space-y-6">
                {/* QR code card */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <QrCode className="h-5 w-5 text-muted-foreground" />
                    <h2 className="font-semibold">Event QR code</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Share this so people can scan and go straight to the registration page. The
                    color follows your brand color below.
                  </p>
                  <EventQRCode eventId={eventId} brandColor={activeBrandColor} />
                </div>

                {/* Branding editor card */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                  <div>
                    <h2 className="font-semibold">Branding</h2>
                    <p className="text-sm text-muted-foreground">
                      Update the look of your public event page.
                    </p>
                  </div>

                  <ImageUpload
                    value={bannerUrl ?? null}
                    onChange={setBannerUrl}
                    variant="banner"
                    label="Banner image"
                  />

                  <div className="flex flex-wrap gap-6">
                    <ImageUpload
                      value={logoUrl ?? null}
                      onChange={setLogoUrl}
                      variant="logo"
                      label="Logo"
                    />

                    <div className="flex-1 space-y-2 min-w-[160px]">
                      <Label>Brand color</Label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                              backgroundColor: c,
                              borderColor: activeBrandColor === c ? "white" : "transparent",
                              outline: activeBrandColor === c ? `2px solid ${c}` : "none",
                              outlineOffset: "1px",
                            }}
                            onClick={() => setBrandColor(c)}
                            aria-label={c}
                          />
                        ))}
                        <label
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border bg-muted text-xs text-muted-foreground hover:border-primary"
                          title="Custom color"
                        >
                          <input
                            type="color"
                            value={activeBrandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="sr-only"
                          />
                          +
                        </label>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="inline-block h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: activeBrandColor }}
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {activeBrandColor}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => saveBranding.mutate()}
                    disabled={saveBranding.isPending}
                    variant="hero"
                  >
                    {saveBranding.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save branding
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-secondary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
