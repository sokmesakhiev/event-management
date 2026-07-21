import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Wallet, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "@/lib/api-client";
import { useAuth } from "@/lib/use-auth";
import { SiteHeader } from "@/components/site-header";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Your profile — Rally" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { profile } = await profileApi.get();
      return profile;
    },
  });

  const profile = profileQuery.data;

  // ── Basic info ──
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(undefined);

  if (profile && displayName === null) setDisplayName(profile.display_name ?? "");
  if (profile && avatarUrl === undefined) setAvatarUrl(profile.avatar_url ?? null);

  const saveProfile = useMutation({
    mutationFn: () =>
      profileApi.update({
        display_name: displayName ?? "",
        avatar_url: avatarUrl ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save your profile."),
  });

  // ── PayWay credentials ──
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  if (profile && merchantId === null) setMerchantId(profile.payway_merchant_id ?? "");

  const savePayway = useMutation({
    mutationFn: () =>
      profileApi.update({
        payway_merchant_id: merchantId ?? "",
        // Blank means "leave the saved key unchanged" — omit it entirely so
        // the backend doesn't overwrite it with an empty value.
        payway_api_key: apiKey.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setApiKey("");
      toast.success("Payment settings saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save payment settings."),
  });

  const disconnectPayway = useMutation({
    mutationFn: () => profileApi.update({ payway_merchant_id: "", payway_api_key: "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setMerchantId("");
      setApiKey("");
      toast.success("PayWay disconnected");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not disconnect PayWay."),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <div>
          <h1 className="font-display text-3xl font-bold">Your profile</h1>
          <p className="mt-1 text-muted-foreground">{user?.email}</p>
        </div>

        {profileQuery.isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
        {profileQuery.isError && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="font-medium text-destructive">Couldn't load your profile.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => profileQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {profile && (
          <div className="mt-8 space-y-6">
            {/* Basic info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic info</CardTitle>
                <CardDescription>
                  This is what participants and other organizers see.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <ImageUpload
                  value={avatarUrl ?? null}
                  onChange={setAvatarUrl}
                  variant="avatar"
                  label="Avatar"
                />
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input
                    id="display-name"
                    value={displayName ?? ""}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
                  {saveProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save profile
                </Button>
              </CardFooter>
            </Card>

            {/* Payment settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Payment settings</CardTitle>
                  {profile.payway_configured && (
                    <Badge variant="default" className="gap-1">
                      <ShieldCheck className="h-3 w-3" /> Connected
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Connect your own{" "}
                  <a
                    href="https://developer.payway.com.kh"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
                  >
                    ABA PayWay
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  merchant account so payments from people registering for your events go straight
                  to you. Until you connect one, registration payments are collected through Rally's
                  default account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="payway-merchant-id">Merchant ID</Label>
                  <Input
                    id="payway-merchant-id"
                    value={merchantId ?? ""}
                    onChange={(e) => setMerchantId(e.target.value)}
                    placeholder="e.g. ec439175"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payway-api-key">API key</Label>
                  <Input
                    id="payway-api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      profile.payway_api_key_masked
                        ? `Saved: ${profile.payway_api_key_masked} — leave blank to keep it`
                        : "Paste your PayWay API key"
                    }
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Stored encrypted. We never show the full key again once it's saved.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button onClick={() => savePayway.mutate()} disabled={savePayway.isPending}>
                  {savePayway.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save payment settings
                </Button>
                {profile.payway_configured && (
                  <Button
                    variant="outline"
                    onClick={() => disconnectPayway.mutate()}
                    disabled={disconnectPayway.isPending}
                  >
                    {disconnectPayway.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Disconnect
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
