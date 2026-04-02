// Строгие типы для приоритетов и категорий
export type Priority = "high" | "medium" | "low";
export type Category = "work" | "study" | "personal" | "health";

// РАЗДЕЛЁННЫЕ интерфейсы (у приоритетов нет colorHex)
export interface PriorityOption {
  id: Priority;
  labelKey: string;
  colorClass: string;
}

export interface CategoryOption {
  id: Category;
  labelKey: string;
  colorHex: string;
  colorClass: string;
}

export interface ViewMode {
  id: string;
  labelKey: string;
}

// Приоритеты (без colorHex)
export const PRIORITY_OPTIONS: PriorityOption[] = [
  { 
    id: "high", 
    labelKey: "tasks.priority.high", 
    colorClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" 
  },
  { 
    id: "medium", 
    labelKey: "tasks.priority.medium", 
    colorClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" 
  },
  { 
    id: "low", 
    labelKey: "tasks.priority.low", 
    colorClass: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" 
  },
];

// Категории (с colorHex)
export const CATEGORY_OPTIONS: CategoryOption[] = [
  { 
    id: "work", 
    labelKey: "tasks.category.work", 
    colorHex: "#3b82f6", 
    colorClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" 
  },
  { 
    id: "study", 
    labelKey: "tasks.category.study", 
    colorHex: "#a855f7", 
    colorClass: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400" 
  },
  { 
    id: "personal", 
    labelKey: "tasks.category.personal", 
    colorHex: "#10b981", 
    colorClass: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" 
  },
  { 
    id: "health", 
    labelKey: "tasks.category.health", 
    colorHex: "#ec4899", 
    colorClass: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400" 
  },
];

// Helper для быстрого доступа к цветам приоритетов
export const PRIORITY_COLORS: Record<Priority, string> = {
  high: PRIORITY_OPTIONS.find((p) => p.id === "high")!.colorClass,
  medium: PRIORITY_OPTIONS.find((p) => p.id === "medium")!.colorClass,
  low: PRIORITY_OPTIONS.find((p) => p.id === "low")!.colorClass,
};

// Helper для быстрого доступа к цветам категорий
export const CATEGORY_COLORS: Record<Category, string> = {
  work: CATEGORY_OPTIONS.find((c) => c.id === "work")!.colorHex,
  study: CATEGORY_OPTIONS.find((c) => c.id === "study")!.colorHex,
  personal: CATEGORY_OPTIONS.find((c) => c.id === "personal")!.colorHex,
  health: CATEGORY_OPTIONS.find((c) => c.id === "health")!.colorHex,
};

// Режимы просмотра с ключами i18n
export const VIEW_MODES: ViewMode[] = [
  { id: "today", labelKey: "tasks.tabs.today" },
  { id: "week", labelKey: "tasks.tabs.week" },
  { id: "all", labelKey: "tasks.tabs.all" },
  { id: "overdue", labelKey: "tasks.tabs.overdue" },
  { id: "completed", labelKey: "tasks.tabs.completed" },
];

// Значения по умолчанию
export const DEFAULT_PRIORITY: Priority = "medium";
export const DEFAULT_CATEGORY: Category = "personal";