'use client';

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Language = "ru" | "en";

type TranslationDict = Record<string, string>;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, TranslationDict> = {
  ru: {
    "nav.mainSection": "Основное",
    "nav.userSection": "Пользователь",
    "nav.dashboard": "Главная",
    "nav.tasks": "Задачи",
    "nav.profile": "Профиль",
    "nav.settings": "Настройки",
    "header.personalAccount": "Личный аккаунт",
    "notifications.title": "Уведомления",
    "notifications.empty":
      "Уведомлений пока нет. Напоминания о задачах будут появляться здесь.",
    "notifications.loading": "Загрузка…",
    "profile.title": "Профиль",
    "profile.subtitle":
      "Управляйте личными данными и статистикой продуктивности.",
    "profile.name": "Имя",
    "profile.email": "Email",
    "profile.emailNotSet": "email не задан",
    "profile.language": "Язык интерфейса",
    "settings.title": "Настройки",
    "settings.subtitle":
      "Настройте внешний вид, уведомления и безопасность аккаунта.",
    "settings.theme": "Тема",
    "settings.theme.light": "Светлая",
    "settings.theme.dark": "Тёмная",
    "settings.language": "Язык интерфейса",
    "settings.timezone": "Часовой пояс",
    "settings.notifications.title": "Уведомления",
    "settings.notifications.emailToggle":
      "Email-уведомления о предстоящих задачах",
    "settings.notifications.beforeDay": "Напоминать за 1 день до дедлайна",
    "settings.notifications.beforeHour": "Напоминать за 1 час до дедлайна",
    "settings.security.title": "Безопасность",
    "settings.security.oldPassword": "Старый пароль",
    "settings.security.newPassword": "Новый пароль",
    "settings.security.confirmPassword": "Подтверждение нового пароля",
    "settings.security.updatePassword": "Обновить пароль",
    "settings.security.logoutAll": "Выйти из всех устройств",
  },
  en: {
    "nav.mainSection": "Main",
    "nav.userSection": "User",
    "nav.dashboard": "Dashboard",
    "nav.tasks": "Tasks",
    "nav.profile": "Profile",
    "nav.settings": "Settings",
    "header.personalAccount": "Personal account",
    "notifications.title": "Notifications",
    "notifications.empty":
      "No notifications yet. Task reminders will appear here.",
    "notifications.loading": "Loading…",
    "profile.title": "Profile",
    "profile.subtitle":
      "Manage your personal data and productivity statistics.",
    "profile.name": "Name",
    "profile.email": "Email",
    "profile.emailNotSet": "email is not set",
    "profile.language": "Interface language",
    "settings.title": "Settings",
    "settings.subtitle":
      "Configure appearance, notifications, and account security.",
    "settings.theme": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.language": "Interface language",
    "settings.timezone": "Time zone",
    "settings.notifications.title": "Notifications",
    "settings.notifications.emailToggle":
      "Email notifications about upcoming tasks",
    "settings.notifications.beforeDay": "Remind 1 day before deadline",
    "settings.notifications.beforeHour": "Remind 1 hour before deadline",
    "settings.security.title": "Security",
    "settings.security.oldPassword": "Old password",
    "settings.security.newPassword": "New password",
    "settings.security.confirmPassword": "Confirm new password",
    "settings.security.updatePassword": "Update password",
    "settings.security.logoutAll": "Sign out from all devices",
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("taskPlannerLanguage");
    if (stored === "ru" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("taskPlannerLanguage", lang);
    }
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: string) => {
        const dict = translations[language] ?? translations.ru;
        return dict[key] ?? key;
      },
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

