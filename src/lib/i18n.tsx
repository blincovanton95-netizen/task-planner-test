'use client';

import { createContext, useContext, useMemo, useState } from "react";

// Типы
export type Language = "ru" | "en";
type TranslationDict = Record<string, string>;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, TranslationDict> = {
  ru: {
    // === NAVIGATION ===
    "nav.mainSection": "Основное",
    "nav.userSection": "Пользователь",
    "nav.dashboard": "Главная",
    "nav.tasks": "Задачи",
    "nav.profile": "Профиль",
    "nav.settings": "Настройки",

    // === HEADER ===
    "header.personalAccount": "Личный кабинет",
    "header.notifications": "Уведомления",
    "header.signOut": "Выйти",
    "header.guest": "Гость",

    // === ADMIN ===
    "admin.title": "Администрирование",
    "admin.signOut": "Выйти из аккаунта",
    "admin.themeSystem": "Как в системе",
    "admin.loading": "Загрузка…",
    "admin.syncingTasks": "Подгружаем задачи…",
    "admin.empty": "Нет записей профилей.",
    "admin.expandTasks": "Задачи",
    "admin.collapse": "Свернуть",
    "admin.tasksCount": "задач",
    "admin.noTasks": "У пользователя нет задач.",
    "admin.deleteUser": "Удалить пользователя",
    "admin.confirmDeleteUser": "Удалить пользователя и все связанные данные? Действие необратимо.",
    "admin.confirmDeleteTask": "Удалить эту задачу у пользователя?",
    "admin.errors.noSupabase": "База недоступна (Supabase не настроен).",
    "admin.errors.loadUsers": "Не удалось загрузить пользователей.",
    "admin.errors.loadTasks": "Не удалось загрузить задачи.",
    "admin.errors.noSession": "Нет сессии. Войдите снова.",
    "admin.errors.deleteUser": "Не удалось удалить пользователя.",

    // === NOTIFICATIONS ===
    "notifications.title": "Уведомления",
    "notifications.empty": "Уведомлений пока нет. Напоминания о задачах будут появляться здесь.",
    "notifications.loading": "Загрузка…",
    "notifications.loadError": "Не удалось загрузить уведомления.",
    "notifications.markAsRead": "Пометить как прочитанное",
      "notifications.newTaskTitle": "Новая задача",
      "notifications.newTaskBody": "Задача «{title}» запланирована на {when}",
      "notifications.reminderDayTitle": "Напоминание за день до дедлайна",
      "notifications.reminderDayBody": "Задача «{title}» запланирована на {when}",
      "notifications.reminderHourTitle": "Напоминание за час до дедлайна",
      "notifications.reminderHourBody": "Задача «{title}» скоро наступит ({when})",
      "notifications.reminderDueTitle": "Время выполнить задачу",
      "notifications.reminderDueBody": "Сейчас время для задачи «{title}» ({when})",

    // === COMMON ===
    "common.loading": "Загрузка…",
    "common.close": "Закрыть",
    "common.saving": "Сохранение…",

    // === PROFILE ===
    "profile.title": "Профиль",
    "profile.subtitle": "Управляйте личными данными и статистикой продуктивности.",
    "profile.name": "Имя",
    "profile.email": "Email",
    "profile.emailNotSet": "email не задан",
    "PROFILE.error.saveFailed": "Не удалось сохранить изменения. Попробуйте снова.",
    "profile.language": "Язык интерфейса",
    "profile.role": "Роль",
    "profile.role.guest": "Гость",
    "profile.role.admin": "Админ",
    "profile.role.user": "Пользователь",
    "profile.stats.title": "Статистика продуктивности",
    "profile.stats.totalTasks": "Всего задач",
    "profile.stats.completedTasks": "Выполнено",
    "profile.stats.completedWeek": "Выполнено за последнюю неделю",

    // === SETTINGS ===
    "settings.general": "Общие настройки",
    "settings.error.saveFailed": "Не удалось сохранить настройки. Попробуйте снова.",
    "settings.title": "Настройки",
    "settings.subtitle": "Настройте внешний вид, уведомления и безопасность аккаунта.",
    "settings.theme": "Тема",
    "settings.theme.light": "Светлая",
    "settings.theme.dark": "Тёмная",
    "settings.language": "Язык интерфейса",
    "settings.notifications.title": "Уведомления",
    "settings.notifications.toggle": "Уведомления о предстоящих задачах",
    "settings.notifications.beforeDay": "Напоминать за 1 день до дедлайна",
    "settings.notifications.beforeHour": "Напоминать за 1 час до дедлайна",
    "settings.security.title": "Безопасность",
    "settings.security.oldPassword": "Старый пароль",
    "settings.security.newPassword": "Новый пароль",
    "settings.security.confirmPassword": "Подтверждение нового пароля",
    "settings.security.updatePassword": "Обновить пароль",
    "settings.security.logoutAll": "Выйти из всех устройств",
    "settings.security.passwordUpdated": "Пароль успешно изменён",

    // === DASHBOARD ===
    "dashboard.welcome": "Добро пожаловать, {name}",
    "dashboard.newTask": "+ Новая задача",
    "dashboard.stats.todayTitle": "Сегодня",
    "dashboard.stats.todayDesc": "Задачи на сегодня",
    "dashboard.stats.weekTitle": "Неделя",
    "dashboard.stats.weekDesc": "Запланировано на неделю",
    "dashboard.stats.overdueTitle": "Просрочено",
    "dashboard.stats.overdueDesc": "Требуют внимания",
    "dashboard.stats.completedTitle": "Выполнено",
    "dashboard.stats.completedDesc": "За последние 7 дней",
    "dashboard.upcoming.title": "Ближайшие задачи",
    "dashboard.upcoming.period": "Следующие 7 дней",
    "dashboard.upcoming.empty": "Нет запланированных задач на ближайшую неделю.",
    "dashboard.categories.title": "По категориям",
    "dashboard.categories.empty": "Задачи ещё не созданы.",

    // === TASKS ===
      "tasks.error.updateFailed": "Не удалось обновить задачу",
      "tasks.error.deleteFailed": "Не удалось удалить задачу",
      "tasks.error.titleRequired": "Заголовок обязателен",
      "tasks.error.titleTooShort": "Заголовок должен содержать минимум 3 символа",
      "tasks.error.saveFailed": "Не удалось сохранить задачу. Попробуйте снова.",
    "tasks.title": "Мои задачи",
    "tasks.subtitle": "Управляйте личными делами по времени, приоритету и категориям.",
      "tasks.tabs.today": "Сегодня",
    "tasks.tabs.title": "Режимы просмотра задач",
    "tasks.tabs.week": "Неделя",
    "tasks.tabs.all": "Все",
    "tasks.tabs.overdue": "Просроченные",
    "tasks.tabs.completed": "Выполненные",
    "tasks.filters.category": "КАТЕГОРИЯ",
    "tasks.filters.priority": "ПРИОРИТЕТ",
    "tasks.filters.sorting": "СОРТИРОВКА",
    "tasks.filters.sortingDateAsc": "По дате (раньше → позже)",
    "tasks.filters.sortingDateDesc": "По дате (позже → раньше)",
    "tasks.filters.sortingPriority": "По приоритету",
    "tasks.filters.search": "ПОИСК",
    "tasks.filters.searchPlaceholder": "Название или описание",
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
      "tasks.markComplete": "Пометить как выполненную",
      "tasks.markIncomplete": "Пометить как невыполненную",
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

    // === AUTH ===
    "auth.login": "Вход",
    "auth.register": "Регистрация",
    "auth.email": "Email",
    "auth.emailPlaceholder": "you@example.com",
    "auth.password": "Пароль",
    "auth.passwordPlaceholder": "Минимум 8 символов",
    "auth.login.rememberMe": "Запомнить меня",
    "auth.login.forgotPassword": "Забыли пароль?",
    "auth.login.submit": "Войти",
    "auth.common.processing": "Обработка...",
    "auth.errors.emailRequired": "Заполните email.",
    "auth.errors.passwordRequired": "Заполните пароль.",
    "auth.errors.passwordMismatch": "Пароли не совпадают.",
    "auth.errors.nameRequired": "Заполните имя.",
    "auth.errors.supabaseNotReady": "Supabase не инициализирован.",
    "auth.errors.registerFailed": "Не удалось зарегистрировать пользователя.",
    "auth.errors.confirmationEmailUnavailable": "Сервис подтверждения email сейчас недоступен. Попробуйте позже или обратитесь к администратору.",
    "auth.errors.generic": "Ошибка авторизации.",
    "auth.errors.passwordTooShort": "Пароль должен содержать минимум 8 символов.",
    "auth.errors.passwordNoUppercase": "Пароль должен содержать заглавную букву.",
    "auth.errors.passwordNoNumber": "Пароль должен содержать цифру.",
    "auth.errors.emailInvalid": "Неверный формат email.",
    "auth.errors.termsRequired": "Необходимо принять условия использования.",
    "auth.register.name": "Имя",
    "auth.register.namePlaceholder": "Как к вам обращаться",
    "auth.register.repeatPassword": "Повтор пароля",
    "auth.register.repeatPasswordPlaceholder": "Повторите пароль",
    "auth.register.acceptTerms": "Я принимаю условия использования",
    "auth.register.submit": "Создать аккаунт",
    "auth.register.pending": "Пользователь зарегистрирован. Проверьте почту и подтвердите аккаунт.",
    "auth.register.success": "Регистрация успешна! Проверьте почту для подтверждения.",
    "auth.register.passwordHint": "Мин. 8 символов, заглавная буква и цифра",
    "auth.recovery.title": "Восстановление пароля",
    "auth.recovery.description": "Введите email, и мы отправим код и ссылку для восстановления пароля.",
    "auth.recovery.submit": "Восстановить пароль",
    "auth.recovery.backToLogin": "Вернуться к входу",
    "auth.recovery.info": "Мы отправили письмо с кодом и ссылкой для восстановления пароля. Проверьте почту.",
  },

  en: {
    // === NAVIGATION ===
    "nav.mainSection": "Main",
    "nav.userSection": "User",
    "nav.dashboard": "Dashboard",
    "nav.tasks": "Tasks",
    "nav.profile": "Profile",
    "nav.settings": "Settings",

    // === HEADER ===
    "header.personalAccount": "Personal account",
    "header.notifications": "Notifications",
    "header.signOut": "Sign out",
    "header.guest": "Guest",

    // === ADMIN ===
    "admin.title": "Administration",
    "admin.signOut": "Sign out",
    "admin.themeSystem": "System",
    "admin.loading": "Loading…",
    "admin.syncingTasks": "Loading tasks…",
    "admin.empty": "No profile rows.",
    "admin.expandTasks": "Tasks",
    "admin.collapse": "Collapse",
    "admin.tasksCount": "tasks",
    "admin.noTasks": "This user has no tasks.",
    "admin.deleteUser": "Delete user",
    "admin.confirmDeleteUser": "Delete this user and all related data? This cannot be undone.",
    "admin.confirmDeleteTask": "Delete this task for this user?",
    "admin.errors.noSupabase": "Database unavailable (Supabase not configured).",
    "admin.errors.loadUsers": "Failed to load users.",
    "admin.errors.loadTasks": "Failed to load tasks.",
    "admin.errors.noSession": "No session. Please sign in again.",
    "admin.errors.deleteUser": "Failed to delete user.",

    // === NOTIFICATIONS ===
    "notifications.title": "Notifications",
    "notifications.empty": "No notifications yet. Task reminders will appear here.",
    "notifications.loading": "Loading…",
    "notifications.loadError": "Failed to load notifications.",
    "notifications.markAsRead": "Mark as read",
      "notifications.newTaskTitle": "New task",
      "notifications.newTaskBody": "Task «{title}» scheduled for {when}",
      "notifications.reminderDayTitle": "Reminder: 1 day before deadline",
      "notifications.reminderDayBody": "Task «{title}» scheduled for {when}",
      "notifications.reminderHourTitle": "Reminder: 1 hour before deadline",
      "notifications.reminderHourBody": "Task «{title}» is coming up soon ({when})",
      "notifications.reminderDueTitle": "Time to complete the task",
      "notifications.reminderDueBody": "It's time for task «{title}» ({when})",

    // === COMMON ===
    "common.loading": "Loading…",
    "common.close": "Close",
    "common.saving": "Saving…",

    // === PROFILE ===
    "profile.title": "Profile",
    "profile.subtitle": "Manage your personal data and productivity statistics.",
    "profile.name": "Name",
    "profile.email": "Email",
    "profile.emailNotSet": "email is not set",
    "profile.error.saveFailed": "Failed to save changes. Try again.",
    "profile.language": "Interface language",
    "profile.role": "Role",
    "profile.role.guest": "Guest",
    "profile.role.admin": "Admin",
    "profile.role.user": "User",
    "profile.stats.title": "Productivity statistics",
    "profile.stats.totalTasks": "Total tasks",
    "profile.stats.completedTasks": "Completed",
    "profile.stats.completedWeek": "Completed in the last week",

    // === SETTINGS ===
    "settings.general": "General settings",
    "settings.error.saveFailed": "Failed to save settings. Try again.",
    "settings.title": "Settings",
    "settings.subtitle": "Configure appearance, notifications, and account security.",
    "settings.theme": "Theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.language": "Interface language",
    "settings.notifications.title": "Notifications",
    "settings.notifications.toggle": "Notifications about upcoming tasks",
    "settings.notifications.beforeDay": "Remind 1 day before deadline",
    "settings.notifications.beforeHour": "Remind 1 hour before deadline",
    "settings.security.title": "Security",
    "settings.security.oldPassword": "Old password",
    "settings.security.newPassword": "New password",
    "settings.security.confirmPassword": "Confirm new password",
    "settings.security.updatePassword": "Update password",
    "settings.security.logoutAll": "Sign out from all devices",
    "settings.security.passwordUpdated": "Password successfully updated",

    // === DASHBOARD ===
    "dashboard.welcome": "Welcome, {name}",
    "dashboard.newTask": "+ New task",
    "dashboard.stats.todayTitle": "Today",
    "dashboard.stats.todayDesc": "Tasks for today",
    "dashboard.stats.weekTitle": "Week",
    "dashboard.stats.weekDesc": "Scheduled for the week",
    "dashboard.stats.overdueTitle": "Overdue",
    "dashboard.stats.overdueDesc": "Require attention",
    "dashboard.stats.completedTitle": "Completed",
    "dashboard.stats.completedDesc": "In the last 7 days",
    "dashboard.upcoming.title": "Upcoming tasks",
    "dashboard.upcoming.period": "Next 7 days",
    "dashboard.upcoming.empty": "No tasks scheduled for the upcoming week.",
    "dashboard.categories.title": "By category",
    "dashboard.categories.empty": "Tasks are not created yet.",

    // === TASKS ===
      "tasks.error.titleRequired": "Title is required",
      "tasks.error.titleTooShort": "The title must contain at least 3 characters.",
      "tasks.error.saveFailed": "Failed to save task. Try again.",
      "tasks.errors.updateFailed": "Failed to update task",
      "tasks.errors.deleteFailed": "Failed to delete task",
    "tasks.title": "My tasks",
    "tasks.subtitle": "Manage personal affairs by time, priority, and categories.",
      "tasks.tabs.title": "Task view modes",
    "tasks.tabs.today": "Today",
    "tasks.tabs.week": "Week",
    "tasks.tabs.all": "All",
    "tasks.tabs.overdue": "Overdue",
    "tasks.tabs.completed": "Completed",
    "tasks.filters.category": "CATEGORY",
    "tasks.filters.priority": "PRIORITY",
    "tasks.filters.sorting": "SORTING",
    "tasks.filters.sortingDateAsc": "By date (earlier → later)",
    "tasks.filters.sortingDateDesc": "By date (later → earlier)",
    "tasks.filters.sortingPriority": "By priority",
    "tasks.filters.search": "SEARCH",
    "tasks.filters.searchPlaceholder": "Title or description",
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
      "tasks.markComplete": "Mark as completed",
      "tasks.markIncomplete": "Mark as incomplete",
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

    // === AUTH ===
    "auth.login": "Sign In",
    "auth.register": "Sign Up",
    "auth.email": "Email",
    "auth.emailPlaceholder": "you@example.com",
    "auth.password": "Password",
    "auth.passwordPlaceholder": "Minimum 8 characters",
    "auth.login.rememberMe": "Remember me",
    "auth.login.forgotPassword": "Forgot password?",
    "auth.login.submit": "Sign In",
    "auth.common.processing": "Processing...",
    "auth.errors.emailRequired": "Please enter your email.",
    "auth.errors.passwordRequired": "Please enter your password.",
    "auth.errors.passwordMismatch": "Passwords do not match.",
    "auth.errors.nameRequired": "Please enter your name.",
    "auth.errors.supabaseNotReady": "Supabase is not initialized.",
    "auth.errors.registerFailed": "Failed to register user.",
    "auth.errors.confirmationEmailUnavailable": "Email confirmation service is currently unavailable. Please try again later or contact support.",
    "auth.errors.generic": "Authorization error.",
    "auth.errors.passwordTooShort": "Password must be at least 8 characters.",
    "auth.errors.passwordNoUppercase": "Password must contain an uppercase letter.",
    "auth.errors.passwordNoNumber": "Password must contain a number.",
    "auth.errors.emailInvalid": "Invalid email format.",
    "auth.errors.termsRequired": "You must accept the terms of use.",
    "auth.register.name": "Name",
    "auth.register.namePlaceholder": "How should we address you",
    "auth.register.repeatPassword": "Repeat password",
    "auth.register.repeatPasswordPlaceholder": "Repeat your password",
    "auth.register.acceptTerms": "I accept the terms of use",
    "auth.register.submit": "Create account",
    "auth.register.pending": "User registered. Check your email and confirm your account.",
    "auth.register.success": "Registration successful! Check your email to confirm.",
    "auth.register.passwordHint": "Min. 8 chars, uppercase letter & number",
    "auth.recovery.title": "Password Recovery",
    "auth.recovery.description": "Enter your email and we'll send you a code and link to reset your password.",
    "auth.recovery.submit": "Recover password",
    "auth.recovery.backToLogin": "Back to sign in",
    "auth.recovery.info": "We sent an email with a code and a link to reset your password. Check your inbox.",
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "ru";
    const stored = window.localStorage.getItem("taskPlannerLanguage");
    return stored === "ru" || stored === "en" ? stored : "ru";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("taskPlannerLanguage", lang);
    }
  };

  const translate = useMemo(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[language] ?? translations.ru;
      let text = dict[key] ?? key;

      // Интерполяция: {name} → значение из params
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          text = text.replace(new RegExp(`\\{${escapedKey}\\}`, 'g'), String(v));
        });
      }
      return text;
    };
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: translate,
    }),
    [language, setLanguage, translate]
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