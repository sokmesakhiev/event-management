import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventQRCodeProps {
  eventId: string;
  brandColor?: string;
  /** Size in pixels (default 240) */
  size?: number;
  /** If true, renders smaller with no label — suitable for inline use */
  compact?: boolean;
}

export function EventQRCode({
  eventId,
  brandColor = "#6366f1",
  size = 240,
  compact = false,
}: EventQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/events/${eventId}`
      : `/events/${eventId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: {
        dark: brandColor,
        light: "#ffffff",
      },
    }).then(() => {
      setDataUrl(canvasRef.current!.toDataURL("image/png"));
    });
  }, [url, brandColor, size]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `rally-event-qr-${eventId}.png`;
    a.click();
  }

  return (
    <div className={compact ? "flex items-center gap-3" : "flex flex-col items-center gap-3"}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-xl border border-border shadow-sm"
        style={{ width: compact ? 80 : size, height: compact ? 80 : size }}
      />
      {!compact && (
        <>
          <p className="text-center text-xs text-muted-foreground">
            Scan to register for this event
          </p>
          <Button variant="outline" size="sm" onClick={download} disabled={!dataUrl}>
            <Download className="h-4 w-4" /> Download QR
          </Button>
        </>
      )}
      {compact && (
        <Button variant="ghost" size="sm" onClick={download} disabled={!dataUrl}>
          <Download className="h-4 w-4" /> Download
        </Button>
      )}
    </div>
  );
}
