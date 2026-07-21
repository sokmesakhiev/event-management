import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadsApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  /** "banner" renders as a wide 16:5 container; "logo"/"avatar" render as a square */
  variant?: "banner" | "logo" | "avatar";
  label?: string;
}

export function ImageUpload({ value, onChange, variant = "banner", label }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogo = variant !== "banner";

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadsApi.upload(file, variant);
      onChange(url);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        className={cn(
          "relative overflow-hidden border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary/50",
          variant === "avatar" ? "rounded-full" : "rounded-xl",
          isLogo ? "h-24 w-24" : "h-36 w-full",
          uploading && "pointer-events-none opacity-60",
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
            {/* Remove button */}
            <button
              type="button"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 p-3 text-center text-muted-foreground">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5" />
                {!isLogo && <p className="text-xs">Click or drag to upload</p>}
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
