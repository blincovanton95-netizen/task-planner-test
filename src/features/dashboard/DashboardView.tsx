'use client';

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);
  const [taskTimes, setTaskTimes] = useState<Record<string, string>>({});

  const today = new Date().toISOString().slice(0, 10);
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

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

  const displayName =
    (user as any)?.user_metadata?.full_name || user?.email || "друг";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Добро пожаловать, {displayName}
          </h2>
        </div>
        <button
          onClick={onCreateTask}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          + Новая задача
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Сегодня"
          value={isLoading ? "…" : String(stats.today)}
          subtitle="Задачи на сегодня"
          accent="border-sky-200 bg-sky-50"
        />
        <DashboardCard
          title="Неделя"
          value={isLoading ? "…" : String(stats.week)}
          subtitle="Запланировано на неделю"
          accent="border-violet-200 bg-violet-50"
        />
        <DashboardCard
          title="Просрочено"
          value={isLoading ? "…" : String(stats.overdue)}
          subtitle="Требуют внимания"
          accent="border-rose-200 bg-rose-50"
        />
        <DashboardCard
          title="Выполнено"
          value={isLoading ? "…" : String(stats.completedLast7)}
          subtitle="За последние 7 дней"
          accent="border-emerald-200 bg-emerald-50"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              Ближайшие задачи
            </h3>
            <span className="text-xs text-slate-400">Следующие 7 дней</span>
          </div>
          {isLoading ? (
            <div className="px-2 py-4 text-xs text-slate-500">
              Загрузка задач...
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="px-2 py-4 text-xs text-slate-500">
              Нет запланированных задач на ближайшую неделю.
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
                        : "— без времени · "}
                      {task.priority === "high"
                        ? "Высокий приоритет"
                        : task.priority === "medium"
                        ? "Средний приоритет"
                        : "Низкий приоритет"}
                    </div>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                    {task.category || "Без категории"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            По категориям
          </h3>
          <ul className="space-y-2 text-xs text-slate-600">
            {useMemo(() => {
              const counts: Record<string, number> = {};
              for (const t of tasks) {
                const key = t.category || "Без категории";
                counts[key] = (counts[key] || 0) + 1;
              }
              return Object.entries(counts);
            }, [tasks]).map(([category, count]) => (
              <li key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                  {category}
                </div>
                <span className="font-medium text-slate-800">{count}</span>
              </li>
            ))}
            {tasks.length === 0 && !isLoading && (
              <li className="text-xs text-slate-500">
                Задачи ещё не созданы.
              </li>
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
      <div className="text-xs font-medium text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-[11px] text-slate-500">{subtitle}</div>
    </div>
  );
}

