'use client';

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Logo } from "./Logo";

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-sky-100 text-sky-700 border-sky-200",
};

const CATEGORY_COLORS = {
  work: "bg-blue-100 text-blue-800",
  study: "bg-purple-100 text-purple-800",
  personal: "bg-emerald-100 text-emerald-800",
  health: "bg-pink-100 text-pink-800",
};

const VIEW_MODES = [
  { id: "today", label: "Сегодня" },
  { id: "week", label: "Неделя" },
  { id: "all", label: "Все" },
  { id: "overdue", label: "Просроченные" },
  { id: "completed", label: "Выполненные" },
];

const PRIORITY_OPTIONS = [
  { id: "high", label: "Высокий" },
  { id: "medium", label: "Средний" },
  { id: "low", label: "Низкий" },
];

const CATEGORY_OPTIONS = [
  { id: "work", label: "Работа" },
  { id: "study", label: "Учёба" },
  { id: "personal", label: "Личные дела" },
  { id: "health", label: "Здоровье" },
];

export function AppShell({ user, activeSection, onSectionChange }) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
      <div className="flex flex-1 flex-col">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {activeSection === "dashboard" && <DashboardView user={user} />}
          {activeSection === "tasks" && <TasksView user={user} />}
          {activeSection === "profile" && <ProfileView user={user} />}
          {activeSection === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ activeSection, onSectionChange }) {
  const navItemClasses = (id) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      activeSection === id
        ? "bg-sky-100 text-sky-800"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <aside className="hidden w-64 border-r border-slate-200 bg-white px-4 py-5 md:flex md:flex-col">
      <div className="mb-8 px-2">
        <Logo align="left" />
      </div>

      <nav className="flex-1 space-y-6 text-sm">
        <div>
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Основное
          </div>
          <button
            className={navItemClasses("dashboard")}
            onClick={() => onSectionChange("dashboard")}
          >
            Главная
          </button>
          <button
            className={navItemClasses("tasks")}
            onClick={() => onSectionChange("tasks")}
          >
            Задачи
          </button>
        </div>

        <div>
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Пользователь
          </div>
          <button
            className={navItemClasses("profile")}
            onClick={() => onSectionChange("profile")}
          >
            Профиль
          </button>
          <button
            className={navItemClasses("settings")}
            onClick={() => onSectionChange("settings")}
          >
            Настройки
          </button>
        </div>
      </nav>

      <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
        © {new Date().getFullYear()} Task Planner
      </div>
    </aside>
  );
}

function Header({ user }) {
  const displayName =
    user?.user_metadata?.full_name || user?.email || "Пользователь";
  const initials = useMemo(() => {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.trim().split(" ");
      return parts
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
    }
    if (user?.email) {
      return user.email[0]?.toUpperCase() ?? "?";
    }
    return "TP";
  }, [user]);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            🔍
          </span>
          <input
            type="search"
            placeholder="Поиск задач..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm outline-none ring-sky-500 focus:bg-white focus:ring-2"
          />
        </div>
      </div>
      <div className="ml-4 flex items-center gap-3">
        <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
          🔔
        </button>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="hidden text-xs leading-tight text-slate-700 sm:block">
            <div className="font-medium">{displayName}</div>
            <div className="text-[11px] text-slate-400">Личный аккаунт</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardView({ user }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Добро пожаловать,{" "}
            {user?.user_metadata?.full_name || user?.email || "друг"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Сегодня у вас 4 задачи, из них 1 просрочена.
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
          + Новая задача
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Сегодня"
          value="2"
          subtitle="Задачи на сегодня"
          accent="border-sky-200 bg-sky-50"
        />
        <DashboardCard
          title="Неделя"
          value="5"
          subtitle="Запланировано на неделю"
          accent="border-violet-200 bg-violet-50"
        />
        <DashboardCard
          title="Просрочено"
          value="1"
          subtitle="Требуют внимания"
          accent="border-rose-200 bg-rose-50"
        />
        <DashboardCard
          title="Выполнено"
          value="12"
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
          <div className="space-y-2">
            {["Подготовить отчёт по проекту", "Выучить раздел по алгоритмам"].map(
              (title, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-800">{title}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      Сегодня · Высокий приоритет
                    </div>
                  </div>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                    Работа
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">
            По категориям
          </h3>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Работа
              </div>
              <span className="font-medium text-slate-800">6</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                Учёба
              </div>
              <span className="font-medium text-slate-800">3</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Личные дела
              </div>
              <span className="font-medium text-slate-800">4</span>
            </li>
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                Здоровье
              </div>
              <span className="font-medium text-slate-800">2</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, value, subtitle, accent }) {
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

function TasksView({ user }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("today");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("dueDateAsc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
          setTasks(data ?? []);
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
      .slice()
      .sort((a, b) => {
        if (sortBy === "dueDateAsc") {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (sortBy === "dueDateDesc") {
          return b.dueDate.localeCompare(a.dueDate);
        }
        if (sortBy === "priority") {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.priority] - order[b.priority];
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
  ]);

  async function toggleCompleted(id, currentCompleted) {
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
      // eslint-disable-next-line no-console
      console.error("Не удалось обновить статус задачи:", error.message);
    }
  }

  async function handleDelete(id) {
    if (!supabase || !user) return;

    if (window.confirm("Удалить задачу?")) {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        // eslint-disable-next-line no-console
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

  function handleOpenEdit(task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  async function handleSave(taskData) {
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
        // eslint-disable-next-line no-console
        console.error("Не удалось обновить задачу:", error.message);
      } else if (data) {
        setTasks((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      }
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ ...taskData, user_id: user.id }])
        .select()
        .single();

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Не удалось создать задачу:", error.message);
      } else if (data) {
        setTasks((prev) => [...prev, data]);
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
            {CATEGORY_OPTIONS.map((cat) => (
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
            <div>Нет задач по выбранным фильтрам.</div>
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
                          PRIORITY_OPTIONS.find((p) => p.id === task.priority)
                            ?.label
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium">
                        <span
                          className={`mr-1 inline-flex h-1.5 w-1.5 rounded-full ${
                            CATEGORY_COLORS[task.category]
                          }`}
                        />
                        {
                          CATEGORY_OPTIONS.find(
                            (c) => c.id === task.category
                          )?.label
                        }
                      </span>
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
          initialTask={editingTask}
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

function TaskModal({ initialTask, onClose, onSave }) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(
    initialTask?.description || ""
  );
  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate || new Date().toISOString().slice(0, 10)
  );
  const [priority, setPriority] = useState(initialTask?.priority || "medium");
  const [category, setCategory] = useState(initialTask?.category || "work");
  const [completed, setCompleted] = useState(initialTask?.completed || false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, dueDate, priority, category, completed });
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            {initialTask ? "Редактировать задачу" : "Новая задача"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Название
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Коротко опишите задачу"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Детали, подзадачи, ссылки..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Дата выполнения
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Приоритет
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Категория
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            {initialTask && (
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="completed"
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label
                  htmlFor="completed"
                  className="text-xs font-medium text-slate-700"
                >
                  Пометить как выполненную
                </label>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileView({ user }) {
  const displayName =
    user?.user_metadata?.full_name || user?.email || "Пользователь";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Профиль</h2>
        <p className="mt-1 text-sm text-slate-500">
          Управляйте личными данными и статистикой продуктивности.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-lg font-semibold text-white">
            {displayName
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">
              {displayName}
            </div>
            <div className="text-xs text-slate-500">
              {user?.email || "email не задан"}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Имя
            </label>
            <input
              type="text"
              defaultValue={displayName}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              defaultValue={user?.email || ""}
              disabled
              className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Часовой пояс
            </label>
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2">
              <option>GMT+3 (Москва)</option>
              <option>GMT+1 (Берлин)</option>
              <option>GMT+0 (Лондон)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Язык интерфейса
            </label>
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2">
              <option>Русский</option>
              <option>English</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Сохранить изменения
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Статистика продуктивности
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-slate-500">Всего задач</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">24</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Выполнено</div>
            <div className="mt-1 text-lg font-semibold text-emerald-600">
              18
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">
              Выполнено за последнюю неделю
            </div>
            <div className="mt-1 text-lg font-semibold text-sky-600">12</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Настройки</h2>
        <p className="mt-1 text-sm text-slate-500">
          Настройте внешний вид, уведомления и безопасность аккаунта.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Общие</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Тема
            </label>
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2">
              <option>Светлая</option>
              <option>Тёмная</option>
              <option>Системная</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700">
              Язык интерфейса
            </label>
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2">
              <option>Русский</option>
              <option>English</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>Скрывать выполненные задачи по умолчанию</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>Группировать задачи по дате</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Уведомления</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>Email-уведомления о предстоящих задачах</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>Напоминать за 1 день до дедлайна</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <span>Напоминать за 1 час до дедлайна</span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm shadow-sm">
        <h3 className="text-sm font-semibold text-rose-800">Безопасность</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-rose-900">
              Старый пароль
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm outline-none ring-rose-400 focus:ring-2"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-rose-900">
              Новый пароль
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm outline-none ring-rose-400 focus:ring-2"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-xs font-medium text-rose-900">
              Подтверждение нового пароля
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm outline-none ring-rose-400 focus:ring-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            Обновить пароль
          </button>
          <button className="text-xs font-medium text-rose-700 hover:underline">
            Выйти из всех устройств
          </button>
        </div>
      </div>
    </div>
  );
}

