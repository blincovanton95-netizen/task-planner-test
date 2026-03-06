'use client';

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import {
  PRIORITY_COLORS,
  CATEGORY_COLORS,
  VIEW_MODES,
  PRIORITY_OPTIONS,
  CATEGORY_OPTIONS,
} from "../../constants/tasks";
import { TaskModal } from "./TaskModal";

const STORAGE_KEY = "taskPlannerCategories";

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: string;
  category: string;
  completed: boolean;
  user_id: string;
};

interface TasksViewProps {
  user: User;
  openFromDashboard?: boolean;
  onOpenFromDashboardHandled?: () => void;
}

export function TasksView({
  user,
  openFromDashboard,
  onOpenFromDashboardHandled,
}: TasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<string>("today");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDateAsc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [categoryOptions, setCategoryOptions] = useState(
    CATEGORY_OPTIONS
  );
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" &&
        window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setCategoryOptions(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(categoryOptions)
        );
      }
    } catch {
      // ignore
    }
  }, [categoryOptions]);

  useEffect(() => {
    if (openFromDashboard) {
      handleOpenCreate();
      onOpenFromDashboardHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openFromDashboard]);

  useEffect(() => {
    if (!supabase || !user) {
      setIsLoading(false);
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
          setError(error.message ?? "Не удалось загрузить задачи.");
          setTasks([]);
        } else {
          setTasks((data as Task[]) ?? []);
        }
        setIsLoading(false);
      }
    }

    loadTasks();

    return () => {
      ignore = true;
    };
  }, [user]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tasks
      .filter((task) => {
        if (viewMode === "today") {
          return (
            (!task.completed && task.dueDate === today) ||
            (!task.completed && task.dueDate < today)
          );
        }
        if (viewMode === "week") {
          return (
            !task.completed &&
            task.dueDate >= today &&
            task.dueDate <= weekFromNow
          );
        }
        if (viewMode === "overdue") {
          return !task.completed && task.dueDate < today;
        }
        if (viewMode === "completed") {
          return task.completed;
        }
        return true;
      })
      .filter((task) =>
        categoryFilter === "all" ? true : task.category === categoryFilter
      )
      .filter((task) =>
        priorityFilter === "all" ? true : task.priority === priorityFilter
      )
      .filter((task) => {
        if (!query) return true;
        const inTitle = task.title.toLowerCase().includes(query);
        const inDescription = (task.description ?? "")
          .toLowerCase()
          .includes(query);
        return inTitle || inDescription;
      })
      .slice()
      .sort((a, b) => {
        if (sortBy === "dueDateAsc") {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (sortBy === "dueDateDesc") {
          return b.dueDate.localeCompare(a.dueDate);
        }
        if (sortBy === "priority") {
          const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return (order[a.priority] ?? 99) - (order[b.priority] ?? 99);
        }
        return 0;
      });
  }, [
    tasks,
    viewMode,
    categoryFilter,
    priorityFilter,
    sortBy,
    today,
    weekFromNow,
    searchQuery,
  ]);

  async function toggleCompleted(id: string, currentCompleted: boolean) {
    if (!supabase || !user) return;

    const nextCompleted = !currentCompleted;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: nextCompleted } : task
      )
    );

    const { error } = await supabase
      .from("tasks")
      .update({ completed: nextCompleted })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Не удалось обновить статус задачи:", error.message);
    }
  }

  async function handleDelete(id: string) {
    if (!supabase || !user) return;

    if (
      typeof window !== "undefined" &&
      window.confirm("Удалить задачу?")
    ) {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Не удалось удалить задачу:", error.message);
        return;
      }

      setTasks((prev) => prev.filter((task) => task.id !== id));
    }
  }

  function handleOpenCreate() {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(task: Task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  async function handleSave(taskData: Omit<Task, "id" | "user_id">) {
    if (!supabase || !user) return;

    if (editingTask) {
      const { data, error } = await supabase
        .from("tasks")
        .update(taskData)
        .eq("id", editingTask.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Не удалось обновить задачу:", error.message);
      } else if (data) {
        setTasks((prev) =>
          prev.map((t) => (t.id === (data as Task).id ? (data as Task) : t))
        );
      }
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error("Не удалось создать задачу:", error.message);
      } else if (data) {
        setTasks((prev) => [...prev, data as Task]);
      }
    }
    setIsModalOpen(false);
    setEditingTask(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Мои задачи</h2>
          <p className="mt-1 text-sm text-slate-500">
            Управляйте личными делами по времени, приоритету и категориям.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          + Новая задача
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-600">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`rounded-full px-3 py-1 transition ${
              viewMode === mode.id
                ? "bg-sky-600 text-white"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Категория
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2"
          >
            <option value="all">Все</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Приоритет
          </span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2"
          >
            <option value="all">Все</option>
            {PRIORITY_OPTIONS.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Сортировка
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2"
          >
            <option value="dueDateAsc">По дате (раньше → позже)</option>
            <option value="dueDateDesc">По дате (позже → раньше)</option>
            <option value="priority">По приоритету</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Поиск
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Название или описание..."
            className="w-40 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Список задач
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center px-6 py-8 text-sm text-slate-500">
            Загрузка задач...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center text-sm text-rose-600">
            <div className="text-2xl">⚠️</div>
            <div>{error}</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center text-sm text-slate-500">
            <div className="text-2xl">📝</div>
            <div>Нет задач по выбранным фильтрам или поиску.</div>
            <button
              onClick={handleOpenCreate}
              className="mt-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
            >
              Создать первую задачу
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-slate-50"
              >
                <button
                  onClick={() => toggleCompleted(task.id, task.completed)}
                  className={`mt-1 h-4 w-4 rounded border text-xs ${
                    task.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {task.completed ? "✓" : ""}
                </button>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          task.completed
                            ? "text-slate-400 line-through"
                            : "text-slate-900"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          PRIORITY_COLORS[task.priority]
                        }`}
                      >
                        {
                          PRIORITY_OPTIONS.find(
                            (p) => p.id === task.priority
                          )?.label
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      {(() => {
                        const cat =
                          categoryOptions.find(
                            (c) => c.id === task.category
                          ) || {};
                        return (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium">
                            <span
                              className="mr-1 inline-flex h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  (cat as any).color ||
                                  CATEGORY_COLORS[task.category] ||
                                  "#64748b",
                              }}
                            />
                            {(cat as any).label ||
                              task.category ||
                              "Без категории"}
                          </span>
                        );
                      })()}
                      <span>·</span>
                      <span
                        className={
                          !task.completed && task.dueDate < today
                            ? "text-rose-600"
                            : ""
                        }
                      >
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg px-2 py-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <TaskModal
          initialTask={editingTask ?? undefined}
          categoryOptions={categoryOptions}
          onAddCategory={(cat) =>
            setCategoryOptions((prev) => {
              if (prev.some((c) => c.id === cat.id)) return prev;
              return [...prev, cat];
            })
          }
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

