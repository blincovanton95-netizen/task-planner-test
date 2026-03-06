export const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-sky-100 text-sky-700 border-sky-200",
};

export const CATEGORY_COLORS = {
  work: "#3b82f6",
  study: "#a855f7",
  personal: "#10b981",
  health: "#ec4899",
};

export const VIEW_MODES = [
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "all", label: "Все" },
  { id: "overdue", label: "Просроченные" },
  { id: "completed", label: "Выполненные" },
];

export const PRIORITY_OPTIONS = [
  { id: "high", label: "Высокий" },
  { id: "medium", label: "Средний" },
  { id: "low", label: "Низкий" },
];

export const CATEGORY_OPTIONS = [
  { id: "work", label: "Работа", color: CATEGORY_COLORS.work },
  { id: "study", label: "Учёба", color: CATEGORY_COLORS.study },
  { id: "personal", label: "Личные дела", color: CATEGORY_COLORS.personal },
  { id: "health", label: "Здоровье", color: CATEGORY_COLORS.health },
];
