'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/i18n";
import type { AppProfileRole } from "../../types/profile";

interface ProfileViewProps {
  user: User;
  profileRole: AppProfileRole;
}

type ProfileData = {
  full_name: string;
  language: string;
};

const DEFAULT_PROFILE: ProfileData = {
  full_name: "",
  language: "ru",
};

// Debounce хук для автосохранения
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function ProfileView({ user, profileRole }: ProfileViewProps) {
  const { t, setLanguage } = useLanguage();

  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Статистика
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [completedWeek, setCompletedWeek] = useState(0);

  // Мемоизация имени для аватара
  const displayName = useMemo(() => {
    return profile.full_name || 
           (user.user_metadata?.full_name as string) || 
           user?.email || 
           t("header.guest");
  }, [profile.full_name, user, t]);

  // Мемоизация инициалов
  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [displayName]);

  // Debounced профиль для автосохранения
  const debouncedProfile = useDebounce(profile, 1000);
  const prevProfileRef = useRef(profile);

  // Автосохранение при изменении debounced профиля
  useEffect(() => {
    // Не сохраняем при первой загрузке
    if (prevProfileRef.current === DEFAULT_PROFILE && profile === DEFAULT_PROFILE) {
      prevProfileRef.current = profile;
      return;
    }
    
    // Сохраняем только если реально изменилось
    if (debouncedProfile !== prevProfileRef.current) {
      void persistProfile(debouncedProfile);
      prevProfileRef.current = debouncedProfile;
    }
  }, [debouncedProfile]);

  // Загрузка профиля
  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!supabase || !user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, language")
        .eq("id", user.id)
        .single();

      if (!ignore) {
        if (!error && data) {
          const nextProfile: ProfileData = {
            full_name: data.full_name || (user.user_metadata?.full_name as string) || "",
            language: data.language || "ru",
          };
          setProfile(nextProfile);
          if (nextProfile.language === "ru" || nextProfile.language === "en") {
            setLanguage(nextProfile.language);
          }
        } else {
          // Fallback на метаданные
          setProfile((prev) => ({
            ...prev,
            full_name: (user.user_metadata?.full_name as string) || prev.full_name,
          }));
        }
        setIsLoading(false);
      }
    }

    loadProfile();
    return () => { ignore = true; };
  }, [user, setLanguage]);

  // Загрузка статистики
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
        console.error("Failed to load stats:", error.message);
        return;
      }

      const rows = (data as { completed: boolean; dueDate: string | null }[]) ?? [];
      const total = rows.length;
      const completed = rows.filter((t) => t.completed).length;

      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

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
    return () => { ignore = true; };
  }, [user]);

  // Сохранение профиля с состоянием загрузки
  const persistProfile = useCallback(async (next: ProfileData) => {
    if (!supabase || !user) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
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
        setMessage(error.message ?? t("profile.errors.saveFailed"));
      }
      // Успех: не показываем сообщение, чтобы не отвлекать
    } catch (err) {
      setMessage(t("profile.errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [user, t]);

  // ✅ УДАЛЕНО: handleNameChange (имя больше не редактируется)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t("profile.title")}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("profile.subtitle")}</p>
      </div>

      {/* Карточка профиля */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Аватар + инфо */}
        <div className="flex items-center gap-4">
          <div 
            className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-lg font-semibold text-white"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email || t("profile.emailNotSet")}
            </div>
          </div>
        </div>

        {/* Форма — ТОЛЬКО ОТОБРАЖЕНИЕ (без редактирования) */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Имя — ТОЛЬКО ОТОБРАЖЕНИЕ */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
              {t("profile.name")}
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
              {displayName}
            </div>
          </div>

          {/* Email (только чтение) */}
          <div className="space-y-1">
            <label 
              htmlFor="profile-email" 
              className="block text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              {t("profile.email")}
            </label>
            <input
              id="profile-email"
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400"
            />
          </div>

          {/* Язык интерфейса — ТОЛЬКО ОТОБРАЖЕНИЕ */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
              {t("profile.language")}
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
              {profile.language === "ru" 
                ? "Русский" 
                : profile.language === "en" 
                  ? "English" 
                  : profile.language}
            </div>
          </div>

          {/* Роль */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
              {t("profile.role")}
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">
              {profileRole === "admin" ? t("profile.role.admin") : t("profile.role.user")}
            </div>
          </div>
        </div>

        {/* Статус сохранения / ошибки */}
        <div className="min-h-[1.25rem]">
          {isSaving && (
            <p className="text-xs text-muted-foreground animate-pulse">
              {t("common.saving")}
            </p>
          )}
          {message && !isSaving && (
            <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
          {t("profile.stats.title")}
        </h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3" role="list">
          <StatItem 
            label={t("profile.stats.totalTasks")} 
            value={totalTasks} 
            ariaLabel={t("profile.stats.totalTasks")}
          />
          <StatItem 
            label={t("profile.stats.completedTasks")} 
            value={completedTasks} 
            className="text-emerald-600 dark:text-emerald-400"
            ariaLabel={t("profile.stats.completedTasks")}
          />
          <StatItem 
            label={t("profile.stats.completedWeek")} 
            value={completedWeek} 
            className="text-primary"
            ariaLabel={t("profile.stats.completedWeek")}
          />
        </div>
      </div>
    </div>
  );
}

// Вынесенный компонент для статистики
interface StatItemProps {
  label: string;
  value: number;
  className?: string;
  ariaLabel?: string;
}

function StatItem({ label, value, className, ariaLabel }: StatItemProps) {
  return (
    <div role="listitem">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold text-slate-900 dark:text-white ${className || ""}`} aria-label={ariaLabel}>
        {value}
      </div>
    </div>
  );
}