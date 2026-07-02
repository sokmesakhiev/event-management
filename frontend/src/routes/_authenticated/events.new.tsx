import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { eventsApi, surveysApi, type SurveyQuestionDraft, type ApiEventTypeDraft } from "@/lib/api-client";
import { useAuth } from "@/lib/use-auth";
import { SurveyBuilder } from "@/components/survey-builder";
import { EventTypeBuilder, newEventType } from "@/components/event-type-builder";
import { SiteHeader } from "@/components/site-header";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_CATEGORIES } from "@/lib/event-utils";

export const Route = createFileRoute("/_authenticated/events/new")({
  head: () => ({ meta: [{ title: "Create event — Rally" }] }),
  component: NewEvent,
});

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#64748b", // slate
];

function NewEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("running");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // Branding fields
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Survey fields
  const [hasSurvey, setHasSurvey] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState("Registration Survey");
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestionDraft[]>([
    { question_text: "", question_type: "text", options: [], required: false },
  ]);

  // Event type fields
  const [hasEventTypes, setHasEventTypes] = useState(false);
  const [eventTypes, setEventTypes] = useState<ApiEventTypeDraft[]>([newEventType(0)]);

  const eventPriceCents = isPaid && price ? Math.round(Number(price) * 100) : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Optionally create the survey first
      let surveyId: string | null = null;
      if (hasSurvey && surveyQuestions.some((q) => q.question_text.trim())) {
        const { survey } = await surveysApi.create(surveyTitle, surveyQuestions);
        surveyId = survey.id;
      }

      // 2. Build event types payload
      const eventTypesAttrs = hasEventTypes
        ? eventTypes
            .filter((t) => t.name.trim())
            .map((t, i) => ({ ...t, position: i }))
        : [];

      // 3. Create the event
      const { event } = await eventsApi.create({
        title: title.trim(),
        description: description.trim() || null,
        category,
        location: location.trim() || null,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        capacity: capacity ? Number(capacity) : null,
        price_cents: isPaid ? Math.round(Number(price) * 100) : 0,
        currency: "usd",
        is_published: isPublished,
        brand_color: brandColor,
        banner_url: bannerUrl,
        logo_url: logoUrl,
        ...(surveyId ? { survey_id: surveyId } : {}),
        ...(eventTypesAttrs.length ? { event_types_attributes: eventTypesAttrs } : {}),
      });
      return event;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      toast.success("Event created!");
      navigate({ to: "/dashboard/events/$eventId", params: { eventId: data.id } });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not create event"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Add a title");
    if (!startAt) return toast.error("Add a start date & time");
    if (endAt && new Date(endAt) <= new Date(startAt))
      return toast.error("End time must be after start time");
    if (isPaid && (!price || Number(price) <= 0)) return toast.error("Add a valid price");
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </Button>
        <h1 className="font-display text-3xl font-bold">Create an event</h1>
        <p className="mt-1 text-muted-foreground">Fill in the details and open registrations.</p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          {/* ── Basic details ── */}
          <div className="space-y-2">
            <Label htmlFor="title">Event title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunrise 10K"
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Route, what to bring, start line details…"
              rows={4}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc">Location</Label>
              <Input
                id="loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Central Park, NYC"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start">Starts</Label>
              <Input
                id="start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Ends (optional)</Label>
              <Input
                id="end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cap">Capacity (optional)</Label>
            <Input
              id="cap"
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Unlimited"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-medium">Paid event</p>
              <p className="text-sm text-muted-foreground">Charge participants to register.</p>
            </div>
            <Switch checked={isPaid} onCheckedChange={setIsPaid} />
          </div>

          {isPaid && (
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="25.00"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="font-medium">Publish now</p>
              <p className="text-sm text-muted-foreground">
                Make it visible and open for sign-ups.
              </p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>

          {/* ── Branding ── */}
          <div className="rounded-xl border border-border p-5 space-y-5">
            <div>
              <h2 className="font-semibold">Branding</h2>
              <p className="text-sm text-muted-foreground">
                Personalize your event with a color, banner, and logo.
              </p>
            </div>

            <ImageUpload
              value={bannerUrl}
              onChange={setBannerUrl}
              variant="banner"
              label="Banner image"
            />

            <div className="flex flex-wrap gap-6">
              <ImageUpload
                value={logoUrl}
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
                        borderColor: brandColor === c ? "white" : "transparent",
                        outline: brandColor === c ? `2px solid ${c}` : "none",
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
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="sr-only"
                    />
                    +
                  </label>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="inline-block h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: brandColor }}
                  />
                  <span className="text-xs text-muted-foreground font-mono">{brandColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Event types ── */}
          <div className="rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Event types / distances</h2>
                <p className="text-sm text-muted-foreground">
                  Let participants choose between different options (e.g. 5km, 10km, marathon).
                </p>
              </div>
              <Switch checked={hasEventTypes} onCheckedChange={setHasEventTypes} />
            </div>

            {hasEventTypes && (
              <EventTypeBuilder
                types={eventTypes}
                onTypesChange={setEventTypes}
                eventPriceCents={eventPriceCents}
              />
            )}
          </div>

          {/* ── Survey ── */}
          <div className="rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Registration survey</h2>
                <p className="text-sm text-muted-foreground">
                  Ask participants questions when they sign up.
                </p>
              </div>
              <Switch checked={hasSurvey} onCheckedChange={setHasSurvey} />
            </div>

            {hasSurvey && (
              <SurveyBuilder
                title={surveyTitle}
                onTitleChange={setSurveyTitle}
                questions={surveyQuestions}
                onQuestionsChange={setSurveyQuestions}
              />
            )}
          </div>

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create event
          </Button>
        </form>
      </main>
    </div>
  );
}
