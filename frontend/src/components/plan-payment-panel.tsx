import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Loader2, Smartphone, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eventPlanPaymentsApi, type ApiEventPlanPayment } from "@/lib/api-client";
import { formatPrice } from "@/lib/event-utils";

interface PlanPaymentPanelProps {
  eventId: string;
  plan: string;
  brandColor?: string;
  /** Called once the event is actually published (free tier, or approved payment). */
  onPublished?: () => void;
}

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? Math.max(0, new Date(expiresAt).getTime() - Date.now()) : 0,
  );

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { remaining, label: `${minutes}:${seconds.toString().padStart(2, "0")}` };
}

export function PlanPaymentPanel({
  eventId,
  plan,
  brandColor = "#6366f1",
  onPublished,
}: PlanPaymentPanelProps) {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [planPaymentId, setPlanPaymentId] = useState<string | null>(null);
  const [publishedDirectly, setPublishedDirectly] = useState(false);

  const startPublish = useMutation({
    mutationFn: () => eventPlanPaymentsApi.create(eventId, plan),
    onSuccess: (res) => {
      // Free tier (or re-picking an already-paid plan) publishes immediately
      // with no plan_payment to poll.
      if (res.event) {
        setPublishedDirectly(true);
        return;
      }
      if (res.plan_payment) setPlanPaymentId(res.plan_payment.id);
    },
  });

  useEffect(() => {
    if (!planPaymentId && !publishedDirectly && !startPublish.isPending && !startPublish.isError) {
      startPublish.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const statusQuery = useQuery({
    queryKey: ["plan-payment-status", planPaymentId],
    queryFn: () => eventPlanPaymentsApi.status(planPaymentId!),
    enabled: !!planPaymentId,
    refetchInterval: (query) => {
      const p = query.state.data?.plan_payment as ApiEventPlanPayment | undefined;
      return p && p.status === "pending" ? 4000 : false;
    },
  });

  const payment = statusQuery.data?.plan_payment;

  const { label: countdownLabel, remaining } = useCountdown(payment?.expires_at ?? null);

  useEffect(() => {
    if (publishedDirectly || payment?.status === "paid") {
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      onPublished?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishedDirectly, payment?.status]);

  useEffect(() => {
    if (payment?.qr_string && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, payment.qr_string, {
        width: 220,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#ffffff" },
      }).catch(() => {});
    }
  }, [payment?.qr_string]);

  function regenerate() {
    setPlanPaymentId(null);
    setPublishedDirectly(false);
    startPublish.reset();
    startPublish.mutate();
  }

  if (publishedDirectly) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-5 w-5" style={{ color: brandColor }} />
        </span>
        <p className="font-medium">Event published!</p>
        <p className="text-sm text-muted-foreground">It's now visible on the public events page.</p>
      </div>
    );
  }

  if (startPublish.isPending || (planPaymentId && statusQuery.isLoading && !payment)) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Preparing your plan…</p>
      </div>
    );
  }

  if (startPublish.isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {(startPublish.error as any)?.message ?? "Could not start this plan."}
        </p>
        <Button variant="outline" size="sm" onClick={regenerate}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }

  if (!payment) return null;

  if (payment.status === "paid") {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-5 w-5" style={{ color: brandColor }} />
        </span>
        <p className="font-medium">Payment received — event published!</p>
        <p className="text-sm text-muted-foreground">
          {formatPrice(payment.amount_cents, payment.currency)} paid.
        </p>
      </div>
    );
  }

  if (payment.status === "expired" || (payment.status === "pending" && remaining === 0)) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-muted-foreground">This QR code has expired.</p>
        <Button variant="outline" size="sm" onClick={regenerate}>
          <RefreshCw className="h-4 w-4" /> Generate a new QR code
        </Button>
      </div>
    );
  }

  if (payment.status === "declined" || payment.status === "cancelled") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">
          This payment was {payment.status}. You can try again.
        </p>
        <Button variant="outline" size="sm" onClick={regenerate}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }

  // pending — show the scannable QR
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <div>
        <p className="font-medium">Scan with ABA Mobile or any KHQR banking app</p>
        <p className="text-sm text-muted-foreground">
          {formatPrice(payment.amount_cents, payment.currency)} — code expires in {countdownLabel}
        </p>
      </div>

      <canvas
        ref={canvasRef}
        width={220}
        height={220}
        className="rounded-xl border border-border shadow-sm"
      />

      {payment.abapay_deeplink && (
        <Button
          asChild
          style={{ backgroundColor: brandColor }}
          className="text-white hover:opacity-90"
        >
          <a href={payment.abapay_deeplink}>
            <Smartphone className="h-4 w-4" /> Open ABA Mobile
          </a>
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        We'll publish your event automatically once payment is received.
      </p>
    </div>
  );
}
