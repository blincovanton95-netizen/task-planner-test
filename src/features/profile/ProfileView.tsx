'use client';

import { useEffect, useState, FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

interface ProfileViewProps {
  user: User;
}

type ProfileData = {
  full_name: string;
  language: string;
  timezone: string;
};

const DEFAULT_PROFILE: ProfileData = {
  full_name: "",
  language: "ru",
  timezone: "Europe/Moscow",
};

export function ProfileView({ user }: ProfileViewProps) {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
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
        .select("full_name, language, timezone")
        .eq("id", user.id)
        .single();

      if (!ignore) {
        if (!error && data) {
          setProfile({
            full_name:
              data.full_name ||
              (user.user_metadata?.full_name as string | undefined) ||
              "",
            language: data.language || "ru",
            timezone: data.timezone || "Europe/Moscow",
          });
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

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !user) return;
    setIsSaving(true);
    setMessage(null);

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        full_name: profile.full_name || null,
        language: profile.language,
        timezone: profile.timezone,
      },
      { onConflict: "id" }
    );

    if (error) {
      setMessage(error.message ?? "Не удалось сохранить профиль.");
    } else {
      setMessage("Профиль сохранён.");
    }

    setIsSaving(false);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Профиль</h2>
        <p className="mt-1 text-sm text-slate-500">
          Управляйте личными данными и статистикой продуктивности.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
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
              {user?.email || "email не задан"}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Имя
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, full_name: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Email
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
              Часовой пояс
            </label>
            <select
              value={profile.timezone}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, timezone: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            >
              <option value="Europe/Moscow">GMT+3 (Москва)</option>
              <option value="Europe/Berlin">GMT+1 (Берлин)</option>
              <option value="Europe/London">GMT+0 (Лондон)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Язык интерфейса
            </label>
            <select
              value={profile.language}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, language: e.target.value }))
              }
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
          >
            {isSaving ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Статистика продуктивности
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-slate-500">Всего задач</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {totalTasks}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Выполнено</div>
            <div className="mt-1 text-lg font-semibold text-emerald-600">
              {completedTasks}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">
              Выполнено за последнюю неделю
            </div>
            <div className="mt-1 text-lg font-semibold text-sky-600">
              {completedWeek}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

