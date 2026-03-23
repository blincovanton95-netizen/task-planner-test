'use client';

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/i18n";

interface ProfileViewProps {
  user: User;
}

type ProfileData = {
  full_name: string;
  language: string;
};

const DEFAULT_PROFILE: ProfileData = {
  full_name: "",
  language: "ru",
};

export function ProfileView({ user }: ProfileViewProps) {
  const { t, setLanguage } = useLanguage();

  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [message, setMessage] = useState<string | null>(null);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [completedWeek, setCompletedWeek] = useState(0);

  const displayName =
    profile.full_name || user?.user_metadata?.full_name || user?.email || "Пользователь";

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!supabase || !user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, language")
        .eq("id", user.id)
        .single();

      if (!ignore) {
        if (!error && data) {
          const nextProfile: ProfileData = {
            full_name:
              data.full_name ||
              (user.user_metadata?.full_name as string | undefined) ||
              "",
            language: data.language || "ru",
          };
          setProfile(nextProfile);
          if (nextProfile.language === "ru" || nextProfile.language === "en") {
            setLanguage(nextProfile.language);
          }
        } else {
          setProfile((prev) => ({
            ...prev,
            full_name:
              (user.user_metadata?.full_name as string | undefined) ||
              prev.full_name,
          }));
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [user]);

  // Статистика продуктивности по задачам
  useEffect(() => {
    if (!supabase || !user) return;

    let ignore = false;

    async function loadStats() {
      const { data, error } = await supabase
        .from("tasks")
        .select("completed, dueDate")
        .eq("user_id", user.id);

      if (ignore) return;

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Не удалось загрузить статистику задач:", error.message);
        return;
      }

      const rows = (data as { completed: boolean; dueDate: string | null }[]) ?? [];
      const total = rows.length;
      const completed = rows.filter((t) => t.completed).length;

      const today = new Date();
      const weekAgo = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 7
      );

      const completedInWeek = rows.filter((t) => {
        if (!t.completed || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= weekAgo && d <= today;
      }).length;

      setTotalTasks(total);
      setCompletedTasks(completed);
      setCompletedWeek(completedInWeek);
    }

    loadStats();

    return () => {
      ignore = true;
    };
  }, [user]);

  async function persistProfile(next: ProfileData) {
    if (!supabase || !user) return;
    setMessage(null);

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        full_name: next.full_name || null,
        language: next.language,
      },
      { onConflict: "id" }
    );

    if (error) {
      setMessage(error.message ?? "Не удалось сохранить профиль.");
    } else {
      // Успешное сохранение не показываем (убрали "Изменения сохранены").
      setMessage(null);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          {t("profile.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-lg font-semibold text-white">
            {displayName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">
              {displayName}
            </div>
            <div className="text-xs text-slate-500">
              {user?.email || t("profile.emailNotSet")}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              {t("profile.name")}
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => {
                const value = e.target.value;
                setProfile((prev) => {
                  const next = { ...prev, full_name: value };
                  void persistProfile(next);
                  return next;
                });
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              {t("profile.email")}
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              {t("profile.language")}
            </label>
            <select
              value={profile.language}
              onChange={(e) => {
                const value = e.target.value;
                setProfile((prev) => {
                  const next = { ...prev, language: value };
                  void persistProfile(next);
                  return next;
                });
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

        {message && (
          <p className="text-xs text-slate-500">
            {message}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          {t("profile.stats.title")}
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-slate-500">{t("profile.stats.totalTasks")}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {totalTasks}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{t("profile.stats.completedTasks")}</div>
            <div className="mt-1 text-lg font-semibold text-emerald-600">
              {completedTasks}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{t("profile.stats.completedWeek")}</div>
            <div className="mt-1 text-lg font-semibold text-sky-600">
              {completedWeek}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

