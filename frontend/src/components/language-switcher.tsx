import { Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  km: "ភាសាខ្មែរ",
};

const LANGUAGE_SHORT_LABELS: Record<SupportedLanguage, string> = {
  en: "EN",
  km: "ខ្មែរ",
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = (i18n.language?.split("-")[0] as SupportedLanguage) || "en";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          <span>{LANGUAGE_SHORT_LABELS[current] ?? "EN"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={cn("cursor-pointer justify-between", current === lang && "font-medium")}
          >
            {LANGUAGE_LABELS[lang]}
            {current === lang && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
