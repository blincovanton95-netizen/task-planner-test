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
import { useLanguage } from "../../lib/i18n";

const STORAGE_KEY = "taskPlannerCategories";

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  // время храним локально (localStorage), в Supabase только дата
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
  const { t } = useLanguage();
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
  const [notifyBeforeDay, setNotifyBeforeDay] = useState(false);
  const [notifyBeforeHour, setNotifyBeforeHour] = useState(false);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(true);
  const [taskTimes, setTaskTimes] = useState<Record<string, string>>({});

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

  // локальное хранение времени задач по id
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

  // настройки уведомлений (мастер e-mail только на фронте, в user_settings его нет)
  useEffect(() => {
    if (!supabase || !user) return;

    let ignore = false;

    async function loadUserSettings() {
      const { data, error } = await supabase
        .from("user_settings")
        .select("notify_before_day, notify_before_hour")
        .eq("user_id", user.id)
        .maybeSingle();

      if (ignore) return;

      if (!error && data) {
        setNotifyBeforeDay(!!(data as any).notify_before_day);
        setNotifyBeforeHour(!!(data as any).notify_before_hour);
      }
    }

    loadUserSettings();

    return () => {
      ignore = true;
    };
  }, [user]);

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
          setError(error.message ?? t("tasks.loadError"));
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

  // синхронизация taskTimes в localStorage
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(
        "taskPlannerTaskTimes",
        JSON.stringify(taskTimes)
      );
    } catch {
      // ignore
    }
  }, [taskTimes]);

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
      window.confirm(t("tasks.confirmDelete"))
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

  async function handleSave(
    taskData: Omit<Task, "id" | "user_id"> & { dueTime?: string }
  ) {
    if (!supabase || !user) return;
    const { dueTime, ...dbTaskData } = taskData;

    if (editingTask) {
      const { data, error } = await supabase
        .from("tasks")
        .update(dbTaskData)
        .eq("id", editingTask.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Не удалось обновить задачу:", error.message);
      } else if (data) {
        const updated = data as Task;
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        const time = dueTime;
        if (time) {
          setTaskTimes((prev) => ({ ...prev, [updated.id]: time }));
        }
      }
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ ...dbTaskData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error("Не удалось создать задачу:", error.message);
      } else if (data) {
        const inserted = data as Task;
        setTasks((prev) => [...prev, inserted]);

        const time = dueTime;
        if (time) {
          setTaskTimes((prev) => ({ ...prev, [inserted.id]: time }));
        }

        // создаём уведомление о новой задаче, если включены e-mail уведомления и напоминания
        if (emailNotificationsEnabled && (notifyBeforeDay || notifyBeforeHour)) {
          try {
            const when = `${inserted.dueDate}${
              time ? ` ${time}` : ""
            }`;
            await supabase.from("notifications").insert([
              {
                user_id: user.id,
                task_id: inserted.id,
                title: "Новая задача",
                body: `Задача «${inserted.title}» запланирована на ${when}.`,
                type: "created",
                is_read: false,
              },
            ]);
          } catch (e) {
            console.error("Не удалось создать уведомление:", e);
          }
        }
      }
    }
    setIsModalOpen(false);
    setEditingTask(null);
  }

  // напоминания о задачах по дате/времени (пока приложение открыто)
  useEffect(() => {
    if (!supabase || !user) return;
    if (!emailNotificationsEnabled) return;

    let timerId: number | undefined;
    let stopped = false;

    const loadState = () => {
      if (typeof window === "undefined") return {};
      try {
        const raw = window.localStorage.getItem("taskPlannerReminders");
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    };

    const saveState = (state: any) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(
          "taskPlannerReminders",
          JSON.stringify(state)
        );
      } catch {
        // ignore
      }
    };

    const tick = async () => {
      if (stopped) return;
      const now = new Date();
      const state = loadState();

      const toNotify: {
        task: Task;
        kind: "day" | "hour" | "due";
      }[] = [];

      for (const task of tasks) {
        if (!task.dueDate || task.completed) continue;

        const datePart = task.dueDate;
        const timePart = taskTimes[task.id] || "09:00";
        const [h, m] = timePart.split(":").map((x) => parseInt(x, 10) || 0);

        const due = new Date(datePart);
        if (Number.isNaN(due.getTime())) continue;
        due.setHours(h, m, 0, 0);

        const msDiff = due.getTime() - now.getTime();

        const taskState =
          state[task.id] ||
          {
            day: false,
            hour: false,
            due: false,
          };

        if (
          notifyBeforeDay &&
          !taskState.day &&
          msDiff <= 24 * 60 * 60 * 1000 &&
          msDiff > 23 * 60 * 60 * 1000
        ) {
          toNotify.push({ task, kind: "day" });
          taskState.day = true;
        }

        if (
          notifyBeforeHour &&
          !taskState.hour &&
          msDiff <= 60 * 60 * 1000 &&
          msDiff > 59 * 60 * 1000
        ) {
          toNotify.push({ task, kind: "hour" });
          taskState.hour = true;
        }

        if (!taskState.due && msDiff <= 0 && msDiff > -60 * 1000) {
          toNotify.push({ task, kind: "due" });
          taskState.due = true;
        }

        state[task.id] = taskState;
      }

      saveState(state);

      for (const item of toNotify) {
        const { task, kind } = item;
        let title = "Напоминание о задаче";
        let body = task.title;
        const datePart = task.dueDate;
        const timePart = taskTimes[task.id] || "09:00";
        const when = `${datePart} ${timePart}`;

        if (kind === "day") {
          title = "Напоминание за день до дедлайна";
          body = `Задача «${task.title}» запланирована на ${when}.`;
        } else if (kind === "hour") {
          title = "Напоминание за час до дедлайна";
          body = `Задача «${task.title}» скоро наступит (${when}).`;
        } else if (kind === "due") {
          title = "Время выполнить задачу";
          body = `Сейчас время для задачи «${task.title}» (${when}).`;
        }

        try {
          await supabase.from("notifications").insert([
            {
              user_id: user.id,
              task_id: task.id,
              title,
              body,
              type: `reminder_${kind}`,
              is_read: false,
            },
          ]);
        } catch (e) {
          console.error("Не удалось создать напоминание:", e);
        }
      }

      if (!stopped) {
        timerId = window.setTimeout(tick, 60 * 1000);
      }
    };

    timerId = window.setTimeout(tick, 5 * 1000);

    return () => {
      stopped = true;
      if (timerId !== undefined && typeof window !== "undefined") {
        window.clearTimeout(timerId);
      }
    };
  }, [
    tasks,
    taskTimes,
    notifyBeforeDay,
    notifyBeforeHour,
    emailNotificationsEnabled,
    user,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t("tasks.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {t("tasks.subtitle")}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
        >
          {t("dashboard.newTask")}
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
            {t(`tasks.tabs.${mode.id}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t("tasks.filters.category")}
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2"
          >
            <option value="all">{t("tasks.tabs.all")}</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {getCategoryLabel(cat.id, cat.label)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t("tasks.filters.priority")}
          </span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2"
          >
            <option value="all">{t("tasks.tabs.all")}</option>
            {PRIORITY_OPTIONS.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {getPriorityLabel(pr.id)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t("tasks.filters.sorting")}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2"
          >
            <option value="dueDateAsc">{t("tasks.filters.sortingDateAsc")}</option>
            <option value="dueDateDesc">{t("tasks.filters.sortingDateDesc")}</option>
            <option value="priority">{t("tasks.filters.sortingPriority")}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t("tasks.filters.search")}
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("tasks.filters.searchPlaceholder")}
            className="w-40 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t("tasks.listHeader")}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center px-6 py-8 text-sm text-slate-500">
            {t("tasks.loading")}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center text-sm text-rose-600">
            <div className="text-2xl">⚠️</div>
            <div>{error}</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center text-sm text-slate-500">
            <div className="text-2xl">📝</div>
            <div>{t("tasks.emptyFilters")}</div>
            <button
              onClick={handleOpenCreate}
              className="mt-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
            >
              {t("tasks.createFirst")}
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
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      {(() => {
                        const cat =
                          categoryOptions.find(
                            (c) => c.id === task.category
                          ) || {};
                        const label = getCategoryLabel(
                          task.category,
                          (cat as any).label
                        );
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
                            {label}
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
                        {task.dueDate}{" "}
                        {taskTimes[task.id]
                          ? taskTimes[task.id]
                          : `— ${t("tasks.noTime")}`}
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
                    {t("tasks.actions.edit")}
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="rounded-lg px-2 py-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {t("tasks.actions.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <TaskModal
          initialTask={
            editingTask
              ? {
                  ...editingTask,
                  dueTime: taskTimes[editingTask.id] || "09:00",
                }
              : undefined
          }
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

