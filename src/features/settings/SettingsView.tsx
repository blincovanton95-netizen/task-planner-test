'use client';

import { useTheme } from "next-themes";
import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/i18n";

interface SettingsViewProps {
  user: User;
  onSignedOutAll?: () => void;
}

// Типизированные настройки
type ProfileSettings = {
  language: string;
  notifyBeforeDay: boolean;
  notifyBeforeHour: boolean;
  notificationsEnabled: boolean; // ✅ Переименовано: было emailNotificationsEnabled
};

const DEFAULT_SETTINGS: ProfileSettings = {
  language: "ru",
  notifyBeforeDay: false,
  notifyBeforeHour: false,
  notificationsEnabled: true, // ✅ Переименовано
};

export function SettingsView({ user, onSignedOutAll }: SettingsViewProps) {
  const { t, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<ProfileSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Состояния для смены пароля
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Загрузка языка из профиля
  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!supabase || !user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user.id)
        .single();

      if (!ignore && !error && data?.language) {
        const lang = data.language;
        if (lang === "ru" || lang === "en") {
          setSettings((prev) => ({ ...prev, language: lang }));
          setLanguage(lang);
        }
      }
    }
    loadProfile();
    return () => { ignore = true; };
  }, [user, setLanguage]);

  // Загрузка настроек уведомлений из user_settings
  useEffect(() => {
    if (!supabase || !user) return;
    let ignore = false;

    async function loadUserSettings() {
      const { data, error } = await supabase
        .from("user_settings")
        .select("notify_before_day, notify_before_hour")
        .eq("user_id", user.id)
        .maybeSingle();

      if (ignore || error || !data) return;
      
      setSettings((prev) => ({
        ...prev,
        notifyBeforeDay: Boolean(data.notify_before_day),
        notifyBeforeHour: Boolean(data.notify_before_hour),
      }));
    }
    loadUserSettings();
    return () => { ignore = true; };
  }, [user]);

  // ✅ Загрузка настроек уведомлений из localStorage (с поддержкой старого ключа)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // Поддерживаем старый ключ для обратной совместимости
      const storedNew = window.localStorage.getItem("taskPlannerNotifications");
      const storedOld = window.localStorage.getItem("taskPlannerEmailNotifications");
      const storedValue = storedNew ?? storedOld;
      
      if (storedValue === "0" || storedValue === "1") {
        setSettings((prev) => ({
          ...prev,
          notificationsEnabled: storedValue === "1",
        }));
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // ✅ Сохранение настроек уведомлений в localStorage (новый ключ)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "taskPlannerNotifications", // ✅ Новый ключ
        settings.notificationsEnabled ? "1" : "0"
      );
      // ✅ Удаляем старый ключ, если он есть
      window.localStorage.removeItem("taskPlannerEmailNotifications");
    } catch {
      // ignore
    }
  }, [settings.notificationsEnabled]);

  // Сохранение настроек профиля с состоянием загрузки
  const persistProfileSettings = useCallback(async (partial: { language?: string }) => {
    if (!supabase || !user) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          language: partial.language ?? settings.language,
        },
        { onConflict: "id" }
      );
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save profile settings:", err);
      setSaveError(t("settings.errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [user, settings.language, t]);

  // Упрощённое сохранение настроек уведомлений
  const updateUserSettings = useCallback(async (partial: {
    notify_before_day?: boolean;
    notify_before_hour?: boolean;
  }) => {
    if (!supabase || !user) {
      console.error("❌ Supabase или user не доступны");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = {
        notify_before_day: partial.notify_before_day ?? settings.notifyBeforeDay,
        notify_before_hour: partial.notify_before_hour ?? settings.notifyBeforeHour,
        updated_at: new Date().toISOString(),
      };

      console.log("🔍 Проверяем существующую запись...");
      
      // 1. Сначала проверяем, есть ли запись
      const { data: existing, error: selectError } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("❌ Ошибка SELECT:", selectError);
        throw new Error(`SELECT failed: ${selectError.message}`);
      }

      console.log("📝 Existing record:", existing);

      let saveError = null;

      if (existing) {
        // 2. Обновляем существующую запись
        console.log("✏️ Обновляем запись id:", existing.id);
        const { error } = await supabase
          .from("user_settings")
          .update(payload)
          .eq("id", existing.id);
        saveError = error;
      } else {
        // 3. Создаём новую запись
        console.log("➕ Создаём новую запись для user_id:", user.id);
        const { error } = await supabase
          .from("user_settings")
          .insert({ 
            user_id: user.id, 
            ...payload 
          });
        saveError = error;
      }

      if (saveError) {
        console.error("❌ Ошибка SAVE:", saveError);
        throw new Error(`SAVE failed: ${saveError.message}`);
      }
      
      console.log("✅ Настройки успешно сохранены!");
      
    } catch (err: any) {
      console.error("💥 Полная ошибка:", err);
      console.error("💥 Message:", err?.message);
      console.error("💥 Stack:", err?.stack);
      setSaveError(err?.message ?? t("settings.errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [user, settings.notifyBeforeDay, settings.notifyBeforeHour, t]);

  // Глобальный выход из системы
  async function handleSignOutAll() {
    if (!supabase) return;
    try {
      await supabase.auth.signOut({ scope: "global" });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("taskPlannerRememberMe");
      }
      onSignedOutAll?.();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  // Смена пароля
  const handleChangePassword = useCallback(async () => {
    if (!supabase || !user) return;
    
    setPasswordError(null);
    setPasswordSuccess(false);
    
    // Валидация
    if (newPassword.length < 8) {
      setPasswordError(t("auth.errors.passwordTooShort"));
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError(t("auth.errors.passwordNoUppercase"));
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError(t("auth.errors.passwordNoNumber"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("auth.errors.passwordMismatch"));
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Supabase меняет пароль без проверки старого (требуется только активная сессия)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
      
      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => setPasswordSuccess(false), 3000);
      
    } catch (err: any) {
      console.error("Failed to change password:", err);
      setPasswordError(err?.message ?? t("settings.errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [supabase, user, newPassword, confirmPassword, t]);

  // Обработчики с автосохранением
  const handleLanguageChange = useCallback((value: string) => {
    setSettings((prev) => ({ ...prev, language: value }));
    void persistProfileSettings({ language: value });
    if (value === "ru" || value === "en") {
      setLanguage(value);
    }
  }, [persistProfileSettings, setLanguage]);

  // ✅ Обновлённый обработчик: notificationsEnabled вместо emailNotificationsEnabled
  const handleNotificationsToggle = useCallback((value: boolean) => {
    setSettings((prev) => ({ ...prev, notificationsEnabled: value }));
  }, []);

  const handleNotifyDay = useCallback((value: boolean) => {
    setSettings((prev) => ({ ...prev, notifyBeforeDay: value }));
    void updateUserSettings({ notify_before_day: value });
  }, [updateUserSettings]);

  const handleNotifyHour = useCallback((value: boolean) => {
    setSettings((prev) => ({ ...prev, notifyBeforeHour: value }));
    void updateUserSettings({ notify_before_hour: value });
  }, [updateUserSettings]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("settings.subtitle")}</p>
      </div>

      {/* Общие настройки */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{t("settings.general")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Тема */}
          <div className="space-y-1">
            <label htmlFor="setting-theme" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              {t("settings.theme")}
            </label>
            <select
              id="setting-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white"
              aria-label={t("settings.theme")}
            >
              <option value="light">{t("settings.theme.light")}</option>
              <option value="dark">{t("settings.theme.dark")}</option>
              <option value="system">{t("admin.themeSystem")}</option>
            </select>
          </div>

          {/* Язык */}
          <div className="space-y-1">
            <label htmlFor="setting-language" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              {t("settings.language")}
            </label>
            <select
              id="setting-language"
              value={settings.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white"
              aria-label={t("settings.language")}
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </section>

      {/* ✅ Уведомления (без упоминания email) */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{t("settings.notifications.title")}</h2>
        <div className="space-y-3">
          {/* ✅ Мастер-переключатель уведомлений (без "Email-") */}
          <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span>{t("settings.notifications.toggle")}</span>
            <input
              type="checkbox"
              id="notify-toggle"
              checked={settings.notificationsEnabled}
              onChange={(e) => handleNotificationsToggle(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500 dark:border-white dark:bg-slate-800"
              aria-label={t("settings.notifications.toggle")}
            />
          </label>

          {/* Напоминание за день */}
          <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span>{t("settings.notifications.beforeDay")}</span>
            <input
              type="checkbox"
              id="notify-day"
              checked={settings.notifyBeforeDay}
              onChange={(e) => handleNotifyDay(e.target.checked)}
              disabled={!settings.notificationsEnabled || isSaving} // ✅ notificationsEnabled вместо emailNotificationsEnabled
              className="h-4 w-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500 disabled:opacity-50 dark:border-white dark:bg-slate-800"
              aria-label={t("settings.notifications.beforeDay")}
            />
          </label>

          {/* Напоминание за час */}
          <label className="flex items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span>{t("settings.notifications.beforeHour")}</span>
            <input
              type="checkbox"
              id="notify-hour"
              checked={settings.notifyBeforeHour}
              onChange={(e) => handleNotifyHour(e.target.checked)}
              disabled={!settings.notificationsEnabled || isSaving} // ✅ notificationsEnabled вместо emailNotificationsEnabled
              className="h-4 w-4 rounded border-slate-300 bg-white text-sky-600 focus:ring-sky-500 disabled:opacity-50 dark:border-white dark:bg-slate-800"
              aria-label={t("settings.notifications.beforeHour")}
            />
          </label>
        </div>
      </section>

      {/* Безопасность */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{t("settings.security.title")}</h2>
        
        {/* Форма смены пароля */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="new-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              {t("settings.security.newPassword")}
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSaving}
              placeholder={t("auth.register.passwordHint")}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white"
              aria-label={t("settings.security.newPassword")}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirm-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              {t("settings.security.confirmPassword")}
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white"
              aria-label={t("settings.security.confirmPassword")}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button 
            type="button"
            onClick={handleChangePassword}
            disabled={isSaving || !newPassword || !confirmPassword}
            className="rounded-lg bg-[#EC003F] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#D10037] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {isSaving ? t("common.saving") : t("settings.security.updatePassword")}
          </button>
          <button
            type="button"
            onClick={handleSignOutAll}
            className="text-xs font-medium text-[#D53141] hover:underline focus:outline-none focus:ring-2 focus:ring-rose-400 dark:text-rose-400 rounded"
          >
            {t("settings.security.logoutAll")}
          </button>
        </div>
        
        {/* Сообщения об успехе/ошибке */}
        {passwordError && (
          <p className="text-xs text-destructive mt-2" role="alert">
            {passwordError}
          </p>
        )}
        {passwordSuccess && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2" role="status">
            {t("settings.security.passwordUpdated")}
          </p>
        )}
      </section>

      {/* Статус сохранения / ошибки */}
      <div className="min-h-[1.25rem]">
        {isSaving && (
          <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
            {t("common.saving")}
          </p>
        )}
        {saveError && !isSaving && (
          <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}