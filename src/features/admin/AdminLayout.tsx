"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/i18n";

interface AdminLayoutProps {
  user: User;
  onSignedOut: () => void;
  children: ReactNode;
}

export function AdminLayout({ user, onSignedOut, children }: AdminLayoutProps) {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSavingLang, setIsSavingLang] = useState(false);

  // Инициализация mounted для SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Загрузка языка из профиля при монтировании
  useEffect(() => {
    let ignore = false;
    
    (async () => {
      if (!supabase || !user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user.id)
        .maybeSingle();
      
      if (ignore || error || !data?.language) return;
      
      const lang = data.language;
      if (lang === "ru" || lang === "en") {
        setLanguage(lang);
      }
    })();
    
    return () => { ignore = true; };
  }, [user, setLanguage]);

  // Сохранение языка с обработкой состояний
  async function persistLanguage(value: string) {
    if (!supabase || !user) return;
    
    setIsSavingLang(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        { id: user.id, email: user.email, language: value },
        { onConflict: "id" }
      );
      if (error) {
        console.error("Failed to save language:", error);
        // Можно добавить toast-уведомление здесь
      }
    } catch (err) {
      console.error("Error saving language:", err);
    } finally {
      setIsSavingLang(false);
    }
  }

  // Упрощённый и надёжный выход
  async function handleSignOut() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("taskPlannerRememberMe");
    }

    try {
      if (supabase) {
        // Пробуем быстрый локальный выход
        await supabase.auth.signOut({ scope: "local" });
      }
    } catch {
      // Fallback: если локальный не сработал, пробуем глобальный
      try {
        await supabase?.auth.signOut();
      } catch {
        // Игнорируем ошибки на последнем этапе
      }
    }

    onSignedOut();
  }

  return (
    // Семантические классы темы
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-end gap-3 border-b border-border bg-background/90 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Переключатель темы */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">{t("settings.theme")}</span>
            <select
              aria-label={t("settings.theme")}
              value={mounted ? theme : "system"}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none ring-sky-500 focus:ring-2 dark:border-slate-600"
            >
              <option value="light">{t("settings.theme.light")}</option>
              <option value="dark">{t("settings.theme.dark")}</option>
              <option value="system">{t("admin.themeSystem")}</option>
            </select>
          </label>

          {/* Переключатель языка */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">{t("settings.language")}</span>
            <select
              aria-label={t("settings.language")}
              value={language}
              disabled={isSavingLang}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "ru" || value === "en") {
                  setLanguage(value);
                  void persistLanguage(value);
                }
              }}
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-slate-600"
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>

        {/* Кнопка выхода */}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="rounded-lg border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {t("admin.signOut")}
        </button>
      </header>
      
      <main className="mx-auto max-w-4xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}