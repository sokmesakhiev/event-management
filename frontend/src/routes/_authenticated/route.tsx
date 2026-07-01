import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authApi, getToken } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const token = getToken();
    if (!token) throw redirect({ to: "/auth" });
    try {
      const { user } = await authApi.me();
      return { user };
    } catch {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
