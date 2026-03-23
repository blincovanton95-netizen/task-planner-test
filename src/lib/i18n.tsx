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
    "common.loading": "Загрузка…",
    "profile.title": "Профиль",
    "profile.subtitle":
      "Управляйте личными данными и статистикой продуктивности.",
    "profile.name": "Имя",
    "profile.email": "Email",
    "profile.emailNotSet": "email не задан",
    "profile.language": "Язык интерфейса",
    "profile.stats.title": "Статистика продуктивности",
    "profile.stats.totalTasks": "Всего задач",
    "profile.stats.completedTasks": "Выполнено",
    "profile.stats.completedWeek": "Выполнено за последнюю неделю",
    "settings.title": "Настройки",
    "settings.subtitle":
      "Настройте внешний вид, уведомления и безопасность аккаунта.",
    "settings.theme": "Тема",
    "settings.theme.light": "Светлая",
    "settings.theme.dark": "Тёмная",
    "settings.language": "Язык интерфейса",
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
    // Dashboard (Главная)
    "dashboard.welcome": "Добро пожаловать, {name}",
    "dashboard.newTask": "+ Новая задача",
    
    // Stats Cards
    "dashboard.stats.todayTitle": "Сегодня",
    "dashboard.stats.todayDesc": "Задачи на сегодня",
    "dashboard.stats.weekTitle": "Неделя",
    "dashboard.stats.weekDesc": "Запланировано на неделю",
    "dashboard.stats.overdueTitle": "Просрочено",
    "dashboard.stats.overdueDesc": "Требуют внимания",
    "dashboard.stats.completedTitle": "Выполнено",
    "dashboard.stats.completedDesc": "За последние 7 дней",

    // Sections
    "dashboard.upcoming.title": "Ближайшие задачи",
    "dashboard.upcoming.period": "Следующие 7 дней",
    "dashboard.upcoming.empty": "Нет запланированных задач на ближайшую неделю.",
    "dashboard.categories.title": "По категориям",
    "dashboard.categories.empty": "Задачи ещё не созданы.",

    // Tasks Page (Мои задачи)
    "tasks.title": "Мои задачи",
    "tasks.subtitle": "Управляйте личными делами по времени, приоритету и категориям.",
    
    // Tabs
    "tasks.tabs.today": "Сегодня",
    "tasks.tabs.week": "Неделя",
    "tasks.tabs.all": "Все",
    "tasks.tabs.overdue": "Просроченные",
    "tasks.tabs.completed": "Выполненные",

    // Filters
    "tasks.filters.category": "КАТЕГОРИЯ",
    "tasks.filters.priority": "ПРИОРИТЕТ",
    "tasks.filters.sorting": "СОРТИРОВКА",
    "tasks.filters.sortingDateAsc": "По дате (раньше → позже)",
    "tasks.filters.sortingDateDesc": "По дате (позже → раньше)",
    "tasks.filters.sortingPriority": "По приоритету",
    "tasks.filters.search": "ПОИСК",
    "tasks.filters.searchPlaceholder": "Название или описание",
    
    // List
    "tasks.listHeader": "СПИСОК ЗАДАЧ",
    "tasks.loading": "Загрузка задач...",
    "tasks.loadError": "Не удалось загрузить задачи.",
    "tasks.emptyFilters": "Нет задач по выбранным фильтрам или поиску.",
    "tasks.createFirst": "Создать первую задачу",
    "tasks.priority.medium": "Средний",
    "tasks.priority.high": "Высокий",
    "tasks.priority.low": "Низкий",
    "tasks.category.work": "Работа",
    "tasks.category.health": "Здоровье",
    "tasks.category.study": "Учёба",
    "tasks.category.personal": "Личные дела",
    "tasks.category.none": "Без категории",
    "tasks.noTime": "без времени",
    "tasks.actions.edit": "Редактировать",
    "tasks.actions.delete": "Удалить",
    "tasks.confirmDelete": "Удалить задачу?",

    // Task Modal
    "tasks.modal.newTitle": "Новая задача",
    "tasks.modal.editTitle": "Редактировать задачу",
    "tasks.modal.titleLabel": "Название",
    "tasks.modal.titlePlaceholder": "Коротко опишите задачу",
    "tasks.modal.descriptionLabel": "Описание",
    "tasks.modal.descriptionPlaceholder": "Детали, подзадачи, ссылки...",
    "tasks.modal.dueDateLabel": "Дата выполнения",
    "tasks.modal.priorityLabel": "Приоритет",
    "tasks.modal.categoryLabel": "Категория",
    "tasks.modal.categoryNewOption": "Новая категория…",
    "tasks.modal.categoryNamePlaceholder": "Название категории",
    "tasks.modal.colorLabel": "Цвет:",
    "tasks.modal.completedLabel": "Пометить как выполненную",
    "tasks.modal.cancel": "Отмена",
    "tasks.modal.save": "Сохранить",

    // Common
    "auth.login": "Вход",
    "auth.register": "Регистрация",
    "auth.email": "Email",
    "auth.emailPlaceholder": "you@example.com",
    "auth.password": "Пароль",
    "auth.passwordPlaceholder": "Минимум 8 символов",
    
    // Login Page
    "auth.login.rememberMe": "Запомнить меня",
    "auth.login.forgotPassword": "Забыли пароль?",
    "auth.login.submit": "Войти",
    "auth.common.processing": "Обработка...",
    "auth.errors.emailRequired": "Заполните email.",
    "auth.errors.passwordRequired": "Заполните пароль.",
    "auth.errors.passwordMismatch": "Пароли не совпадают.",
    "auth.errors.nameRequired": "Заполните имя.",
    "auth.errors.supabaseNotReady": "Supabase не инициализирован.",
    "auth.errors.generic": "Ошибка авторизации.",
    
    // Register Page
    "auth.register.name": "Имя",
    "auth.register.namePlaceholder": "Как к вам обращаться",
    "auth.register.repeatPassword": "Повтор пароля",
    "auth.register.repeatPasswordPlaceholder": "Повторите пароль",
    "auth.register.acceptTerms": "Я принимаю условия использования",
    "auth.register.submit": "Создать аккаунт",
    "auth.register.pending": "Пользователь зарегистрирован. Проверьте почту и подтвердите аккаунт.",
    
    // Password Recovery Page
    "auth.recovery.title": "Восстановление пароля",
    "auth.recovery.description": "Введите email, и мы отправим код и ссылку для восстановления пароля.",
    "auth.recovery.submit": "Восстановить пароль",
    "auth.recovery.backToLogin": "Вернуться к входу",
    "auth.recovery.info":
      "Мы отправили письмо с кодом и ссылкой для восстановления пароля. Проверьте почту.",
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
    "common.loading": "Loading…",
    "profile.title": "Profile",
    "profile.subtitle":
      "Manage your personal data and productivity statistics.",
    "profile.name": "Name",
    "profile.email": "Email",
    "profile.emailNotSet": "email is not set",
    "profile.language": "Interface language",
    "profile.stats.title": "Productivity statistics",
    "profile.stats.totalTasks": "Total tasks",
    "profile.stats.completedTasks": "Completed",
    "profile.stats.completedWeek": "Completed in the last week",
    "settings.title": "Settings",
    "settings.subtitle":
      "Configure appearance, notifications, and account security.",
    "settings.theme": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.language": "Interface language",
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
    // Dashboard
    "dashboard.welcome": "Welcome, {name}",
    "dashboard.newTask": "+ New task",

    // Stats Cards
    "dashboard.stats.todayTitle": "Today",
    "dashboard.stats.todayDesc": "Tasks for today",
    "dashboard.stats.weekTitle": "Week",
    "dashboard.stats.weekDesc": "Scheduled for the week",
    "dashboard.stats.overdueTitle": "Overdue",
    "dashboard.stats.overdueDesc": "Require attention",
    "dashboard.stats.completedTitle": "Completed",
    "dashboard.stats.completedDesc": "In the last 7 days",

    // Sections
    "dashboard.upcoming.title": "Upcoming tasks",
    "dashboard.upcoming.period": "Next 7 days",
    "dashboard.upcoming.empty": "No tasks scheduled for the upcoming week.",
    "dashboard.categories.title": "By category",
    "dashboard.categories.empty": "Tasks are not created yet.",

    // Tasks Page
    "tasks.title": "My tasks",
    "tasks.subtitle": "Manage personal affairs by time, priority, and categories.",

    // Tabs
    "tasks.tabs.today": "Today",
    "tasks.tabs.week": "Week",
    "tasks.tabs.all": "All",
    "tasks.tabs.overdue": "Overdue",
    "tasks.tabs.completed": "Completed",

    // Filters
    "tasks.filters.category": "CATEGORY",
    "tasks.filters.priority": "PRIORITY",
    "tasks.filters.sorting": "SORTING",
    "tasks.filters.sortingDateAsc": "By date (earlier → later)",
    "tasks.filters.sortingDateDesc": "By date (later → earlier)",
    "tasks.filters.sortingPriority": "By priority",
    "tasks.filters.search": "SEARCH",
    "tasks.filters.searchPlaceholder": "Title or description",

    // List
    "tasks.listHeader": "TASK LIST",
    "tasks.loading": "Loading tasks...",
    "tasks.loadError": "Failed to load tasks.",
    "tasks.emptyFilters": "No tasks match the selected filters or search.",
    "tasks.createFirst": "Create your first task",
    "tasks.priority.medium": "Medium",
    "tasks.priority.high": "High",
    "tasks.priority.low": "Low",
    "tasks.category.work": "Work",
    "tasks.category.health": "Health",
    "tasks.category.study": "Study",
    "tasks.category.personal": "Personal",
    "tasks.category.none": "No category",
    "tasks.noTime": "no time",
    "tasks.actions.edit": "Edit",
    "tasks.actions.delete": "Delete",
    "tasks.confirmDelete": "Delete task?",

    // Task Modal
    "tasks.modal.newTitle": "New task",
    "tasks.modal.editTitle": "Edit task",
    "tasks.modal.titleLabel": "Title",
    "tasks.modal.titlePlaceholder": "Briefly describe the task",
    "tasks.modal.descriptionLabel": "Description",
    "tasks.modal.descriptionPlaceholder": "Details, sub-tasks, links...",
    "tasks.modal.dueDateLabel": "Due date",
    "tasks.modal.priorityLabel": "Priority",
    "tasks.modal.categoryLabel": "Category",
    "tasks.modal.categoryNewOption": "New category…",
    "tasks.modal.categoryNamePlaceholder": "Category name",
    "tasks.modal.colorLabel": "Color:",
    "tasks.modal.completedLabel": "Mark as completed",
    "tasks.modal.cancel": "Cancel",
    "tasks.modal.save": "Save",

    // Common
    "auth.login": "Sign In",
    "auth.register": "Sign Up",
    "auth.email": "Email",
    "auth.emailPlaceholder": "you@example.com",
    "auth.password": "Password",
    "auth.passwordPlaceholder": "Minimum 8 characters",
    
    // Login Page
    "auth.login.rememberMe": "Remember me",
    "auth.login.forgotPassword": "Forgot password?",
    "auth.login.submit": "Sign In",
    "auth.common.processing": "Processing...",
    "auth.errors.emailRequired": "Please enter your email.",
    "auth.errors.passwordRequired": "Please enter your password.",
    "auth.errors.passwordMismatch": "Passwords do not match.",
    "auth.errors.nameRequired": "Please enter your name.",
    "auth.errors.supabaseNotReady": "Supabase is not initialized.",
    "auth.errors.generic": "Authorization error.",
    
    // Register Page
    "auth.register.name": "Name",
    "auth.register.namePlaceholder": "How should we address you",
    "auth.register.repeatPassword": "Repeat password",
    "auth.register.repeatPasswordPlaceholder": "Repeat your password",
    "auth.register.acceptTerms": "I accept the terms of use",
    "auth.register.submit": "Create account",
    "auth.register.pending": "User registered. Check your email and confirm your account.",
    
    // Password Recovery Page
    "auth.recovery.title": "Password Recovery",
    "auth.recovery.description": "Enter your email and we'll send you a code and link to reset your password.",
    "auth.recovery.submit": "Recover password",
    "auth.recovery.backToLogin": "Back to sign in",
    "auth.recovery.info": "We sent an email with a code and a link to reset your password. Check your inbox.",
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

