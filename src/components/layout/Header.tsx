'use client';

import { useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { useLanguage } from "../../lib/i18n";

interface HeaderProps {
  user: User;
  onOpenNotifications: () => void;
}

export function Header({ user, onOpenNotifications }: HeaderProps) {
  const { t } = useLanguage();

  const displayName =
    (user as any)?.user_metadata?.full_name || user?.email || "Пользователь";

  const initials = useMemo(() => {
    const metaName = (user as any)?.user_metadata?.full_name as
      | string
      | undefined;
    if (metaName) {
      const parts = metaName.trim().split(" ");
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
  }, [user]);

  return (
    <header className="flex items-center justify-end border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenNotifications}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
        >
          🔔
        </button>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="hidden text-xs leading-tight text-slate-700 sm:block">
            <div className="font-medium">{displayName}</div>
            <div className="text-[11px] text-slate-400">
              {t("header.personalAccount")}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

