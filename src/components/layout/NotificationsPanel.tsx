'use client';

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/i18n";

interface NotificationsPanelProps {
  user: User;
  onClose: () => void;
}

type NotificationRow = {
  id: string;
  title: string | null;
  body: string | null;
  created_at: string | null;
  is_read: boolean | null;
};

export function NotificationsPanel({ user, onClose }: NotificationsPanelProps) {
  const { t } = useLanguage();

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [timezone, setTimezone] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !user) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function loadData() {
      setIsLoading(true);
      setError("");

      // загружаем часовой пояс из профиля
      const profilePromise = supabase
        .from("profiles")
        .select("timezone")
        .eq("id", user.id)
        .maybeSingle();

      const notificationsPromise = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const [profileResult, notificationsResult] = await Promise.all([
        profilePromise,
        notificationsPromise,
      ]);

      if (ignore) return;

      const { data: profile } = profileResult;
      const { data, error } = notificationsResult;

      if (profile && (profile as any).timezone) {
        setTimezone((profile as any).timezone as string);
      }

      if (error) {
        setError(error.message ?? "Не удалось загрузить уведомления.");
        setItems([]);
      } else {
        setItems((data as NotificationRow[]) ?? []);
      }

      setIsLoading(false);
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [user]);

  const formatDate = (value: string | null) => {
    if (!value) return "";
    try {
      const date = new Date(value);
      return date.toLocaleString(undefined, {
        timeZone: timezone || undefined,
        hour12: false,
      });
    } catch {
      return value;
    }
  };

  return (
    <div className="pointer-events-auto absolute right-4 top-16 z-20 w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          {t("notifications.title")}
        </h3>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
      {isLoading ? (
        <p className="text-slate-500">{t("notifications.loading")}</p>
      ) : error ? (
        <p className="text-rose-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500">{t("notifications.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg px-3 py-2 ${
                n.is_read ? "bg-slate-50" : "bg-sky-50"
              }`}
            >
              <div className="text-[11px] font-semibold text-slate-700">
                {n.title || t("notifications.title")}
              </div>
              {n.body && (
                <div className="mt-0.5 text-[11px] text-slate-500">
                  {n.body}
                </div>
              )}
              <div className="mt-1 text-[10px] text-slate-400">
                {formatDate(n.created_at)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


