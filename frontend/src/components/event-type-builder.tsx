/**
 * EventTypeBuilder — lets event hosts define registration tiers/distances.
 * e.g. 3km ($10), 5km ($15), 10km ($20), Half Marathon ($35), Full Marathon ($50)
 */
import { Trash2, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApiEventTypeDraft } from "@/lib/api-client";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function newEventType(position: number): ApiEventTypeDraft {
  return { name: "", description: "", capacity: null, price_cents: null, position };
}

// ── Row component ─────────────────────────────────────────────────────────────

function TypeRow({
  type,
  index,
  eventPriceCents,
  onChange,
  onRemove,
  removable,
}: {
  type: ApiEventTypeDraft;
  index: number;
  eventPriceCents: number;
  onChange: (t: ApiEventTypeDraft) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  function set<K extends keyof ApiEventTypeDraft>(key: K, value: ApiEventTypeDraft[K]) {
    onChange({ ...type, [key]: value });
  }

  const priceDisplay =
    type.price_cents != null
      ? (type.price_cents / 100).toFixed(2)
      : "";

  const capacityDisplay = type.capacity != null ? String(type.capacity) : "";

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripVertical className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs font-medium uppercase tracking-wide">Type {index + 1}</span>
        </div>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
        <Input
          value={type.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. 5km, Half Marathon"
          maxLength={120}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs">Description (optional)</Label>
        <Textarea
          value={type.description ?? ""}
          onChange={(e) => set("description", e.target.value || undefined)}
          placeholder="Route details, eligibility, notes…"
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      {/* Price + Capacity row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Price (USD)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={priceDisplay}
            onChange={(e) => {
              const val = e.target.value;
              set("price_cents", val === "" ? null : Math.round(Number(val) * 100));
            }}
            placeholder={`Default ($${(eventPriceCents / 100).toFixed(2)})`}
            className="h-8 text-sm"
          />
          {type.price_cents == null && (
            <p className="text-[11px] text-muted-foreground">Uses event price</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Capacity</Label>
          <Input
            type="number"
            min="1"
            value={capacityDisplay}
            onChange={(e) => {
              const val = e.target.value;
              set("capacity", val === "" ? null : Number(val));
            }}
            placeholder="Unlimited"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface EventTypeBuilderProps {
  types: ApiEventTypeDraft[];
  onTypesChange: (types: ApiEventTypeDraft[]) => void;
  /** Used to display the fallback price in the per-type price placeholder */
  eventPriceCents: number;
}

export function EventTypeBuilder({ types, onTypesChange, eventPriceCents }: EventTypeBuilderProps) {
  function addType() {
    onTypesChange([...types, newEventType(types.length)]);
  }

  function updateType(index: number, t: ApiEventTypeDraft) {
    onTypesChange(types.map((existing, i) => (i === index ? t : existing)));
  }

  function removeType(index: number) {
    onTypesChange(
      types
        .filter((_, i) => i !== index)
        .map((t, i) => ({ ...t, position: i }))
    );
  }

  return (
    <div className="space-y-3">
      {types.map((t, i) => (
        <TypeRow
          key={i}
          index={i}
          type={t}
          eventPriceCents={eventPriceCents}
          onChange={(updated) => updateType(i, updated)}
          onRemove={() => removeType(i)}
          removable={types.length > 1}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={addType}
      >
        <Plus className="h-4 w-4" /> Add type
      </Button>
    </div>
  );
}
