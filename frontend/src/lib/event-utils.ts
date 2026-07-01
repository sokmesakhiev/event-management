export function formatPrice(cents: number, currency = "usd"): string {
  if (!cents) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const EVENT_CATEGORIES = [
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
  { value: "gathering", label: "Gathering" },
  { value: "other", label: "Other" },
] as const;

export function categoryLabel(value: string): string {
  return EVENT_CATEGORIES.find((c) => c.value === value)?.label ?? "Event";
}
