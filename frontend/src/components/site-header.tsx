import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogOut, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/use-auth";
import { VerifyEmailBanner } from "@/components/verify-email-banner";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const greetingName = user?.display_name?.trim() || user?.email.split("@")[0] || "there";
  const initials = greetingName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <VerifyEmailBanner />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/src/assets/logo.png"
            alt="Rails Dev"
            className="relative h-16 cursor-pointer"
          />

          <span className="font-display text-lg font-bold tracking-tight">Rally</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/events" className="transition-colors hover:text-foreground">
            Browse events
          </Link>
          {user ? (
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
          ) : (
            <>
              <a href="/#features" className="transition-colors hover:text-foreground">
                Features
              </a>
              <a href="/#pricing" className="transition-colors hover:text-foreground">
                Pricing
              </a>
              <a href="/#how" className="transition-colors hover:text-foreground">
                How it works
              </a>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button asChild variant="hero" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">Dashboard</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 pl-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url ?? undefined} alt={greetingName} />
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[9rem] truncate sm:inline">
                      Welcome, {greetingName}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate text-sm font-medium">{greetingName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="h-4 w-4" /> Edit profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" hash="payment-settings" className="cursor-pointer">
                      <Wallet className="h-4 w-4" /> Payment settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            pathname !== "/auth" && (
              <Button asChild variant="hero" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
