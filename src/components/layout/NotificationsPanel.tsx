'use client';

import { useEffect, useState, useRef, useCallback } from "react";
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
  const [isLoading, setIsLoading] = useState(() => !!supabase && !!user);
  const [error, setError] = useState("");
  
  const panelRef = useRef<HTMLDivElement>(null);

  // Загрузка уведомлений + Realtime подписка
  useEffect(() => {
    if (!supabase || !user) {
      return;
    }

    let ignore = false;

    async function loadData() {
      setIsLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (ignore) return;

      if (error) {
        setError(error.message ?? t("notifications.loadError"));
        setItems([]);
      } else {
        setItems(data ?? []);
      }
      setIsLoading(false);
    }

    loadData();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (!ignore) {
            setItems((prev) => [payload.new as NotificationRow, ...prev.slice(0, 19)]);
          }
        }
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [user, t]);

  // Закрытие по Escape (доступность)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Форматирование даты
  const formatDate = useCallback((value: string | null) => {
    if (!value) return "";
    try {
      const date = new Date(value);
      return date.toLocaleString(undefined, {
        hour12: false,
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  }, []);

  // Отметка как прочитанное (опционально)
  const markAsRead = async (id: string) => {
    if (!supabase) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id);
    
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("notifications.title")}
      tabIndex={-1}
      className="pointer-events-auto absolute right-4 top-16 z-20 w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          {t("notifications.title")}
        </h3>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 dark:text-slate-300">{t("notifications.loading")}</p>
      ) : error ? (
        <p className="text-rose-600 dark:text-rose-400">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-300">{t("notifications.empty")}</p>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((n) => (
            <li
              key={n.id}
              onClick={() => !n.is_read && markAsRead(n.id)}
              className={`cursor-pointer rounded-lg px-3 py-2 ${
                n.is_read
                  ? "bg-slate-50 dark:bg-slate-900"
                  : "bg-sky-50 dark:bg-sky-900/30"
              }`}
            >
              <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {n.title || t("notifications.title")}
              </div>
              {n.body && (
                <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-300">
                  {n.body}
                </div>
              )}
              <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-400/80">
                {formatDate(n.created_at)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}