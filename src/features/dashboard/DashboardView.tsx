'use client';

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/i18n";
import { CATEGORY_OPTIONS, type CategoryOption, type Category } from "../../constants/tasks";

const STORAGE_KEY = "taskPlannerCategories";
const TASK_TIMES_KEY = "taskPlannerTaskTimes";

function getNowTimeValue() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

interface DashboardViewProps {
  user: User;
  onCreateTask: () => void;
}

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: string;
  category: Category | string;
  completed: boolean;
  user_id: string;
};

type DashboardStats = {
  today: number;
  week: number;
  overdue: number;
  completedLast7: number;
};

const initialStats: DashboardStats = {
  today: 0,
  week: 0,
  overdue: 0,
  completedLast7: 0,
};

export function DashboardView({ user, onCreateTask }: DashboardViewProps) {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskTimes, setTaskTimes] = useState<Record<string, string>>({});
  
  // Используем тип CategoryOption из constants
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(
    CATEGORY_OPTIONS
  );

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // Загрузка кастомных категорий из localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        const next = parsed as CategoryOption[];
        // ESLint/React Compiler: избегаем синхронного setState прямо в effect-body
        setTimeout(() => setCategoryOptions(next), 0);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Загрузка времени задач из localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(TASK_TIMES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const next = parsed as Record<string, string>;
          // ESLint/React Compiler: избегаем синхронного setState прямо в effect-body
          setTimeout(() => setTaskTimes(next), 0);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Безопасное получение имени пользователя
  const userMetadata = user.user_metadata as { full_name?: string };
  const displayName = userMetadata?.full_name || user?.email || t("header.guest");

  const getPriorityLabel = (priorityId: string) => {
    const key = `tasks.priority.${priorityId}`;
    const translated = t(key);
    return translated !== key ? translated : priorityId;
  };

  // Используем labelKey для перевода категорий
  const getCategoryLabel = (categoryId: string, fallbackKey?: string) => {
    const key = `tasks.category.${categoryId}`;
    const translated = t(key);
    if (translated !== key) return translated;
    
    // Если есть fallbackKey (из constants), пробуем перевести его
    if (fallbackKey) {
      const fallbackTranslated = t(fallbackKey);
      if (fallbackTranslated !== fallbackKey) return fallbackTranslated;
    }
    
    return categoryId ? categoryId : t("tasks.category.none");
  };

  // Загрузка задач из Supabase
  useEffect(() => {
    if (!supabase || !user) {
      // ESLint/React Compiler: избегаем синхронного setState прямо в effect-body
      setTimeout(() => setIsLoading(false), 0);
      return;
    }

    let ignore = false;

    async function loadTasks() {
      setIsLoading(true);
      setError("");
      
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("dueDate", { ascending: true });

      if (!ignore) {
        if (error) {
          console.error("Failed to load tasks:", error.message);
          setError(t("tasks.loadError"));
          setTasks([]);
          setStats(initialStats);
        } else {
          const list = (data as Task[]) ?? [];
          setTasks(list);
          
          // Подсчёт статистики
          const nextStats: DashboardStats = {
            today: 0,
            week: 0,
            overdue: 0,
            completedLast7: 0,
          };

          for (const task of list) {
            const due = task.dueDate;
            if (!task.completed) {
              if (due === today) nextStats.today += 1;
              if (due >= today && due <= weekFromNow) nextStats.week += 1;
              if (due < today) nextStats.overdue += 1;
            }
            if (task.completed && due >= sevenDaysAgo && due <= today) {
              nextStats.completedLast7 += 1;
            }
          }
          setStats(nextStats);
        }
        setIsLoading(false);
      }
    }

    loadTasks();

    return () => {
      ignore = true;
    };
  }, [user, today, weekFromNow, sevenDaysAgo, t]);

  // Ближайшие задачи (не выполненные, в пределах недели)
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.completed && t.dueDate >= today && t.dueDate <= weekFromNow)
      .slice(0, 5);
  }, [tasks, today, weekFromNow]);

  // Подсчёт задач по категориям
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      const key = task.category || "__none";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts);
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой создания задачи */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t("dashboard.welcome", { name: displayName })}
          </h1>
        </div>
        <button
          onClick={onCreateTask}
          aria-label={t("dashboard.newTask")}
          className="inline-flex items-center justify-center rounded-lg bg-[#0084D1] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0076BA]"
        >
          {t("dashboard.newTask")}
        </button>
      </div>

      {/* Отображение ошибки загрузки */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {/* Карточки статистики */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label={t("profile.stats.title")}>
        <DashboardCard
          title={t("dashboard.stats.todayTitle")}
          value={isLoading ? "…" : String(stats.today)}
          subtitle={t("dashboard.stats.todayDesc")}
          accent="border-sky-200 bg-sky-50 dark:bg-slate-900"
        />
        <DashboardCard
          title={t("dashboard.stats.weekTitle")}
          value={isLoading ? "…" : String(stats.week)}
          subtitle={t("dashboard.stats.weekDesc")}
          accent="border-violet-200 bg-violet-50 dark:bg-slate-900"
        />
        <DashboardCard
          title={t("dashboard.stats.overdueTitle")}
          value={isLoading ? "…" : String(stats.overdue)}
          subtitle={t("dashboard.stats.overdueDesc")}
          accent="border-rose-200 bg-rose-50 dark:bg-slate-900"
        />
        <DashboardCard
          title={t("dashboard.stats.completedTitle")}
          value={isLoading ? "…" : String(stats.completedLast7)}
          subtitle={t("dashboard.stats.completedDesc")}
          accent="border-emerald-200 bg-emerald-50 dark:bg-slate-900"
        />
      </div>

      {/* Секции: Ближайшие задачи и Категории */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ближайшие задачи */}
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
              {t("dashboard.upcoming.title")}
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-300">{t("dashboard.upcoming.period")}</span>
          </div>
          {isLoading ? (
            <div className="px-2 py-4 text-xs text-slate-500 dark:text-slate-300">
              {t("tasks.loading")}
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="px-2 py-4 text-xs text-slate-500 dark:text-slate-300">
              {t("dashboard.upcoming.empty")}
            </div>
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.map((task) => {
                const category = categoryOptions.find((c) => c.id === task.category);
                const categoryLabel = getCategoryLabel(task.category, category?.labelKey);
                
                return (
                  <li
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900"
                  >
                    <div>
                      <div className="font-medium text-slate-800 dark:text-white">
                        {task.title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">
                        {task.dueDate} · {taskTimes[task.id] ?? getNowTimeValue()} ·{" "}
                        {getPriorityLabel(task.priority)}
                      </div>
                    </div>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                      {categoryLabel}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Категории */}
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
            {t("dashboard.categories.title")}
          </h2>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {categoryCounts.map(([categoryKey, count]) => {
              const cat = categoryKey === "__none"
                ? undefined
                : categoryOptions.find((c) => c.id === categoryKey);
              
              const label = categoryKey === "__none"
                ? t("tasks.category.none")
                : getCategoryLabel(categoryKey, cat?.labelKey);
              
              const color = cat?.colorHex ?? "#64748b";

              return (
                <li
                  key={categoryKey}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    {label}
                  </div>
                  <span className="font-medium text-slate-800">{count}</span>
                </li>
              );
            })}
            {tasks.length === 0 && !isLoading && (
              <li className="text-xs text-slate-500 dark:text-slate-300">{t("dashboard.categories.empty")}</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

// Типизированный вспомогательный компонент карточки
interface DashboardCardProps {
  title: string;
  value: string;
  subtitle: string;
  accent: string;
}

function DashboardCard({ title, value, subtitle, accent }: DashboardCardProps) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 text-sm shadow-sm ${accent}`}
      role="status"
      aria-live="polite"
    >
      <div className="text-xs font-medium text-slate-500 dark:text-slate-300">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">{subtitle}</div>
    </div>
  );
}