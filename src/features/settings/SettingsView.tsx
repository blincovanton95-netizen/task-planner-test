'use client';

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/i18n";

interface SettingsViewProps {
  user: User;
  onSignedOutAll?: () => void;
}

type ProfileSettings = {
  language: string;
  notifyBeforeDay: boolean;
  notifyBeforeHour: boolean;
  emailNotificationsEnabled: boolean;
};

const DEFAULT_SETTINGS: ProfileSettings = {
  language: "ru",
  notifyBeforeDay: false,
  notifyBeforeHour: false,
  emailNotificationsEnabled: true,
};

export function SettingsView({ user, onSignedOutAll }: SettingsViewProps) {
  const { t, setLanguage } = useLanguage();

  const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!supabase || !user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user.id)
        .single();

      if (!ignore) {
        if (!error && data) {
          const next: ProfileSettings = {
            language: data.language || DEFAULT_SETTINGS.language,
            notifyBeforeDay: DEFAULT_SETTINGS.notifyBeforeDay,
            notifyBeforeHour: DEFAULT_SETTINGS.notifyBeforeHour,
            emailNotificationsEnabled: DEFAULT_SETTINGS.emailNotificationsEnabled,
          };
          setSettings(next);
          if (next.language === "ru" || next.language === "en") {
            setLanguage(next.language);
          }
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [user]);

  // загружаем настройки уведомлений из user_settings (без мастер-переключателя e-mail — он только на фронте)
  useEffect(() => {
    if (!supabase || !user) return;

    let ignore = false;

    async function loadUserSettings() {
      const { data, error } = await supabase
        .from("user_settings")
        .select("notify_before_day, notify_before_hour")
        .eq("user_id", user.id)
        .maybeSingle();

      if (ignore) return;

      if (!error && data) {
        setSettings((prev) => ({
          ...prev,
          notifyBeforeDay: !!(data as any).notify_before_day,
          notifyBeforeHour: !!(data as any).notify_before_hour,
        }));
      }
    }

    loadUserSettings();

    return () => {
      ignore = true;
    };
  }, [user]);

  // загружаем тему и мастер-переключатель e-mail из localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedTheme = window.localStorage.getItem("taskPlannerTheme");
      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
      }

      const storedEmail = window.localStorage.getItem(
        "taskPlannerEmailNotifications"
      );
      if (storedEmail === "0" || storedEmail === "1") {
        setSettings((prev) => ({
          ...prev,
          emailNotificationsEnabled: storedEmail === "1",
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  // применяем тему ко всему приложению и сохраняем настройки в localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(theme === "dark" ? "theme-dark" : "theme-light");

    try {
      window.localStorage.setItem("taskPlannerTheme", theme);
      window.localStorage.setItem(
        "taskPlannerEmailNotifications",
        settings.emailNotificationsEnabled ? "1" : "0"
      );
    } catch {
      // ignore
    }
  }, [theme, settings.emailNotificationsEnabled]);

  async function persistProfileSettings(partial: {
    language?: string;
  }) {
    if (!supabase || !user) return;

    const next = {
      language: partial.language ?? settings.language,
    };

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        language: next.language,
      },
      { onConflict: "id" }
    );

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Не удалось сохранить настройки профиля:", error.message);
    }
  }

  async function updateUserSettings(partial: {
    notify_before_day?: boolean;
    notify_before_hour?: boolean;
  }) {
    if (!supabase || !user) return;

    const payload = {
      user_id: user.id,
      notify_before_day:
        partial.notify_before_day ?? settings.notifyBeforeDay,
      notify_before_hour:
        partial.notify_before_hour ?? settings.notifyBeforeHour,
    };

    // Ручной upsert, чтобы не зависеть от onConflict и индексов
    const { data: existing, error: selectError } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (selectError) {
      // eslint-disable-next-line no-console
      console.error(
        "Не удалось загрузить существующие настройки уведомлений:",
        selectError.message
      );
      return;
    }

    let error = null;

    if (existing) {
      const res = await supabase
        .from("user_settings")
        .update({
          notify_before_day: payload.notify_before_day,
          notify_before_hour: payload.notify_before_hour,
        })
        .eq("id", (existing as any).id);
      error = res.error;
    } else {
      // При первой вставке связываем id с пользователем,
      // чтобы удовлетворить внешнему ключу user_settings_id_fkey.
      const res = await supabase
        .from("user_settings")
        .insert([{ id: user.id, ...payload }]);
      error = res.error;
    }

    if (error) {
      // eslint-disable-next-line no-console
      console.error(
        "Не удалось сохранить настройки уведомлений:",
        error.message
      );
    }
  }

  async function handleSignOutAll() {
    if (!supabase) return;
    // Глобальный выход: ревок всех refresh-токенов и очистка локальной сессии.
    await supabase.auth.signOut({ scope: "global" as any });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("taskPlannerRememberMe");
    }
    onSignedOutAll?.();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {t("settings.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("settings.subtitle")}
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          {t("settings.title")}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              {t("settings.theme")}
            </label>
            <select
              value={theme}
              onChange={(e) =>
                setTheme(e.target.value === "dark" ? "dark" : "light")
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            >
              <option value="light">{t("settings.theme.light")}</option>
              <option value="dark">{t("settings.theme.dark")}</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              {t("settings.language")}
            </label>
            <select
              value={settings.language}
              onChange={(e) => {
                const value = e.target.value;
                setSettings((prev) => ({ ...prev, language: value }));
                void persistProfileSettings({ language: value });
                if (value === "ru" || value === "en") {
                  setLanguage(value);
                }
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          {t("settings.notifications.title")}
        </h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>{t("settings.notifications.emailToggle")}</span>
            <input
              type="checkbox"
              checked={settings.emailNotificationsEnabled}
              onChange={(e) => {
                const value = e.target.checked;
                setSettings((prev) => ({
                  ...prev,
                  emailNotificationsEnabled: value,
                }));
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>{t("settings.notifications.beforeDay")}</span>
            <input
              type="checkbox"
              checked={settings.notifyBeforeDay}
              onChange={(e) => {
                const value = e.target.checked;
                setSettings((prev) => ({ ...prev, notifyBeforeDay: value }));
                updateUserSettings({ notify_before_day: value });
              }}
              disabled={!settings.emailNotificationsEnabled}
              className="h-4 w-4 rounded border-slate-300 disabled:opacity-50"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>{t("settings.notifications.beforeHour")}</span>
            <input
              type="checkbox"
              checked={settings.notifyBeforeHour}
              onChange={(e) => {
                const value = e.target.checked;
                setSettings((prev) => ({ ...prev, notifyBeforeHour: value }));
                updateUserSettings({ notify_before_hour: value });
              }}
              disabled={!settings.emailNotificationsEnabled}
              className="h-4 w-4 rounded border-slate-300 disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          {t("settings.security.title")}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              {t("settings.security.oldPassword")}
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              {t("settings.security.newPassword")}
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-medium text-slate-700">
              {t("settings.security.confirmPassword")}
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            {t("settings.security.updatePassword")}
          </button>
          <button
            type="button"
            onClick={handleSignOutAll}
            className="text-xs font-medium text-rose-700 hover:underline"
          >
            {t("settings.security.logoutAll")}
          </button>
        </div>
      </div>
    </div>
  );
}

