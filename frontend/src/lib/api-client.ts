/**
 * Rails API client — replaces all Supabase queries.
 * Base URL reads from VITE_API_URL (defaults to http://localhost:3001).
 */

const BASE_URL = (
  typeof import.meta !== "undefined"
    ? (import.meta.env?.VITE_API_URL ?? "http://localhost:3001")
    : (process.env.API_URL ?? "http://localhost:3001")
) + "/api/v1";

const TOKEN_KEY = "rally_token";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(json.error ?? `API error ${res.status}`);
  }

  return json as T;
}

const api = {
  get:    <T>(path: string) => request<T>("GET", path),
  post:   <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch:  <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  upload: <T>(path: string, form: FormData) => request<T>("POST", path, form, true),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ApiEvent {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  start_at: string;
  end_at: string | null;
  capacity: number | null;
  price_cents: number;
  currency: string;
  is_published: boolean;
  brand_color: string;
  banner_url: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  registrations_count?: number;
}

export interface ApiRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  payment_status: string;
  amount_paid_cents: number;
  created_at: string;
  event?: ApiEvent;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export interface ApiProfile {
  id: string | null;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  async signup(email: string, password: string, displayName?: string) {
    const res = await api.post<{ token: string; user: ApiUser }>("/auth/signup", {
      email,
      password,
      display_name: displayName,
    });
    setToken(res.token);
    return res;
  },

  async signin(email: string, password: string) {
    const res = await api.post<{ token: string; user: ApiUser }>("/auth/signin", {
      email,
      password,
    });
    setToken(res.token);
    return res;
  },

  async me() {
    return api.get<{ user: ApiUser }>("/auth/me");
  },

  signout() {
    clearToken();
  },
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventsApi = {
  list() {
    return api.get<{ events: ApiEvent[] }>("/events");
  },

  my() {
    return api.get<{ events: ApiEvent[] }>("/events/my");
  },

  get(id: string) {
    return api.get<{ event: ApiEvent }>(`/events/${id}`);
  },

  create(data: Partial<ApiEvent>) {
    return api.post<{ event: ApiEvent }>("/events", { event: data });
  },

  update(id: string, data: Partial<ApiEvent>) {
    return api.patch<{ event: ApiEvent }>(`/events/${id}`, { event: data });
  },

  delete(id: string) {
    return api.delete<{ message: string }>(`/events/${id}`);
  },
};

// ─── Registrations ────────────────────────────────────────────────────────────

export const registrationsApi = {
  mine() {
    return api.get<{ registrations: ApiRegistration[] }>("/registrations");
  },

  forEvent(eventId: string) {
    return api.get<{ registrations: ApiRegistration[] }>(`/events/${eventId}/registrations`);
  },

  registrationCount(eventId: string) {
    return api
      .get<{ registrations: ApiRegistration[] }>(`/events/${eventId}/registrations`)
      .then((r) => r.registrations.length)
      .catch(() => 0);
  },

  create(eventId: string) {
    return api.post<{ registration: ApiRegistration }>(`/events/${eventId}/registrations`);
  },

  myRegistrationForEvent(eventId: string) {
    return api
      .get<{ registrations: ApiRegistration[] }>("/registrations")
      .then((r) => r.registrations.find((reg) => reg.event_id === eventId) ?? null);
  },

  updatePayment(id: string, paymentStatus: string, amountPaidCents: number) {
    return api.patch<{ registration: ApiRegistration }>(`/registrations/${id}`, {
      registration: { payment_status: paymentStatus, amount_paid_cents: amountPaidCents },
    });
  },

  remove(id: string) {
    return api.delete<{ message: string }>(`/registrations/${id}`);
  },
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileApi = {
  get() {
    return api.get<{ profile: ApiProfile }>("/profile");
  },

  update(data: Partial<ApiProfile>) {
    return api.patch<{ profile: ApiProfile }>("/profile", { profile: data });
  },
};

// ─── Uploads ──────────────────────────────────────────────────────────────────

export const uploadsApi = {
  async upload(file: File, type: "banner" | "logo" | "avatar"): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    form.append("type", type);
    const res = await api.upload<{ url: string }>("/uploads", form);
    return res.url;
  },
};
