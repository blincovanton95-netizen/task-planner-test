'use client';

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/i18n";
import { CATEGORY_OPTIONS } from "../../constants/tasks";

const STORAGE_KEY = "taskPlannerCategories";

type CategoryOption = {
  id: string;
  label: string;
  color: string;
};

interface DashboardViewProps {
  user: User;
  onCreateTask: () => void;
}

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  // локальное время берём из localStorage при отображении
  priority: string;
  category: string;
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
  const [taskTimes, setTaskTimes] = useState<Record<string, string>>({});
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(
    CATEGORY_OPTIONS as CategoryOption[]
  );

  const today = new Date().toISOString().slice(0, 10);
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        setCategoryOptions(parsed as CategoryOption[]);
      }
    } catch {
      // ignore
    }
  }, []);

  const getPriorityLabel = (priorityId: string) => {
    const key = `tasks.priority.${priorityId}`;
    const translated = t(key);
    return translated !== key ? translated : priorityId;
  };

  const getCategoryLabel = (categoryId: string, fallback?: string) => {
    const key = `tasks.category.${categoryId}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return fallback ?? (categoryId ? categoryId : t("tasks.category.none"));
  };

  useEffect(() => {
    if (!supabase || !user) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function loadTasks() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("dueDate", { ascending: true });

      if (!ignore) {
        if (error) {
          console.error("Не удалось загрузить задачи для дашборда:", error.message);
          setTasks([]);
          setStats(initialStats);
        } else {
          const list = (data as Task[]) ?? [];
          setTasks(list);
          const nextStats: DashboardStats = {
            today: 0,
            week: 0,
            overdue: 0,
            completedLast7: 0,
          };

          for (const t of list) {
            const due = t.dueDate;
            if (!t.completed) {
              if (due === today) {
                nextStats.today += 1;
              }
              if (due >= today && due <= weekFromNow) {
                nextStats.week += 1;
              }
              if (due < today) {
                nextStats.overdue += 1;
              }
            }
            if (t.completed && due >= sevenDaysAgo && due <= today) {
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
  }, [user, today, weekFromNow, sevenDaysAgo]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem("taskPlannerTaskTimes");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setTaskTimes(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(
        (t) => !t.completed && t.dueDate >= today && t.dueDate <= weekFromNow
      )
      .slice(0, 5);
  }, [tasks, today, weekFromNow]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      const key = task.category || "__none";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts);
  }, [tasks]);

  const displayName =
    (user as any)?.user_metadata?.full_name || user?.email || "друг";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t("dashboard.welcome").replace("{name}", displayName)}
          </h2>
        </div>
        <button
          onClick={onCreateTask}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          {t("dashboard.newTask")}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
              {t("dashboard.upcoming.title")}
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-300">{t("dashboard.upcoming.period")}</span>
          </div>
          {isLoading ? (
            <div className="px-2 py-4 text-xs text-slate-500">
              {t("tasks.loading")}
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="px-2 py-4 text-xs text-slate-500 dark:text-slate-300">
              {t("dashboard.upcoming.empty")}
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-800">
                      {task.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {task.dueDate} ·{" "}
                      {taskTimes[task.id]
                        ? `${taskTimes[task.id]} · `
                        : `— ${t("tasks.noTime")} · `}
                      {getPriorityLabel(task.priority)}
                    </div>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                    {getCategoryLabel(
                      task.category,
                      categoryOptions.find((c) => c.id === task.category)?.label
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
            {t("dashboard.categories.title")}
          </h3>
          <ul className="space-y-2 text-xs text-slate-600">
            {categoryCounts.map(([categoryKey, count]) => {
              const cat =
                categoryKey === "__none"
                  ? undefined
                  : categoryOptions.find((c) => c.id === categoryKey);
              const label = cat?.label ?? "Без категории";
              const color = cat?.color ?? "#64748b";

              return (
                <li
                  key={categoryKey}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
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
        </div>
      </div>
    </div>
  );
}

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
    >
      <div className="text-xs font-medium text-slate-500 dark:text-slate-300">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">{subtitle}</div>
    </div>
  );
}

