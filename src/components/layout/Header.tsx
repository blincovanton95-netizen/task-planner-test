'use client';

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useLanguage } from "../../lib/i18n";

interface HeaderProps {
  user: User;
  onOpenNotifications: () => void;
  onSignOut?: () => void;
}

export function Header({ user, onOpenNotifications, onSignOut }: HeaderProps) {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userMetadata = user.user_metadata as { 
    full_name?: string; 
    avatar_url?: string;
  };

  const displayName =
    userMetadata?.full_name || user?.email || t("header.guest");

  const initials = (() => {
    if (userMetadata?.full_name) {
      const parts = userMetadata.full_name.trim().split(" ");
      return parts
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
    }
    if (user?.email) {
      return user.email[0]?.toUpperCase() ?? "?";
    }
    return "TP";
  })();

  return (
    <header className="flex items-center justify-end border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenNotifications}
          aria-label={t("header.notifications")}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          🔔
        </button>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="hidden text-xs leading-tight text-slate-700 sm:block dark:text-slate-200">
              <div className="font-medium">{displayName}</div>
              <div className="text-[11px] text-slate-400">
                {t("header.personalAccount")}
              </div>
            </div>
          </button>

          {isMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsMenuOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-popover py-2 shadow-lg z-20">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSignOut?.();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent"
                >
                  {t("header.signOut")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}