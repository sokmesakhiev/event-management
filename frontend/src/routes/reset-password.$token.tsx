import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordResetsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/reset-password/$token")({
  head: () => ({
    meta: [{ title: "Set a new password — Rally" }],
  }),
  component: ResetPasswordPage,
});

const passwordSchema = z.string().min(8).max(72);

function ResetPasswordPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refresh } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(t("auth.errors.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("resetPassword.mismatch"));
      return;
    }

    setLoading(true);
    try {
      await passwordResetsApi.reset(token, password, confirmPassword);
      await refresh();
      toast.success(t("resetPassword.success"));
      navigate({ to: "/dashboard", replace: true });
    } catch (e: any) {
      toast.error(e.message ?? t("resetPassword.invalidLink"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg [background-image:var(--gradient-hero)]">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold">Rally</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h1 className="font-display text-xl font-bold">{t("resetPassword.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("resetPassword.subtitle")}</p>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("resetPassword.newPassword")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.fields.passwordPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t("resetPassword.confirmPassword")}</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("resetPassword.confirmPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>

          <Button variant="hero" className="mt-4 w-full" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("resetPassword.update")}
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/auth" className="hover:text-foreground">
              ← {t("forgotPassword.backToSignIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
