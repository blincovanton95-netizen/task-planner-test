'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
// Импортируем типы из constants — единый источник истины
import {
    PRIORITY_OPTIONS,
    CATEGORY_OPTIONS,
    VIEW_MODES,
    type Priority,
    type Category,
    type CategoryOption,
} from "../../constants/tasks";
import { TaskModal } from "./TaskModal";
import { useLanguage } from "../../lib/i18n";

const STORAGE_KEY = "taskPlannerCategories";
const TASK_TIMES_KEY = "taskPlannerTaskTimes";
const REMINDERS_KEY = "taskPlannerReminders";

function getNowTimeValue() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
}

// Используем типизированный Task с импортированными типами
type Task = {
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    priority: Priority;
    category: Category | string;
    completed: boolean;
    user_id: string;
};

interface TasksViewProps {
    user: User;
    openFromDashboard?: boolean;
    onOpenFromDashboardHandled?: () => void;
    isCreatingFromDashboard?: boolean;
    onTaskCreated?: () => void;
}

export function TasksView({
                              user,
                              openFromDashboard,
                              onOpenFromDashboardHandled,
                          }: TasksViewProps) {
    const { t } = useLanguage();

    // Стейты данных
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Стейты фильтров
    const [viewMode, setViewMode] = useState<string>("today");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("dueDateAsc");
    const [searchQuery, setSearchQuery] = useState("");

    // Стейты модального окна
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Стейты категорий и времени
    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(CATEGORY_OPTIONS);
    const [taskTimes, setTaskTimes] = useState<Record<string, string>>({});

    // Стейты уведомлений
    const [notifyBeforeDay, setNotifyBeforeDay] = useState(false);
    const [notifyBeforeHour, setNotifyBeforeHour] = useState(false);
    const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

    // Стейты действий для визуальной обратной связи
    const [pendingAction, setPendingAction] = useState<{ type: 'toggle' | 'delete', id: string } | null>(null);

    // Реф для хранения задач в напоминаниях (чтобы не пересоздавать таймер)
    const tasksRef = useRef(tasks);
    tasksRef.current = tasks;

    const taskTimesRef = useRef(taskTimes);
    taskTimesRef.current = taskTimes;

    const getPriorityLabel = (priorityId: Priority) => {
        const key = `tasks.priority.${priorityId}`;
        return t(key) !== key ? t(key) : priorityId;
    };

    // Используем labelKey для перевода категорий
    const getCategoryLabel = (categoryId: string, fallbackKey?: string) => {
        const key = `tasks.category.${categoryId}`;
        const translated = t(key);
        if (translated !== key) return translated;
        if (fallbackKey) {
            const fallbackTranslated = t(fallbackKey);
            if (fallbackTranslated !== fallbackKey) return fallbackTranslated;
        }
        return categoryId || t("tasks.category.none");
    };

    const today = new Date().toISOString().slice(0, 10);
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    // Загрузка категорий из localStorage
    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) {
                    setCategoryOptions(parsed as CategoryOption[]);
                }
            }
        } catch {
            // ignore parse errors
        }
    }, []);

    // Загрузка времени задач
    useEffect(() => {
        try {
            if (typeof window === "undefined") return;
            const raw = window.localStorage.getItem(TASK_TIMES_KEY);
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

    // Сохранение категорий в localStorage
    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categoryOptions));
            }
        } catch {
            // ignore
        }
    }, [categoryOptions]);

    // Сохранение времени задач
    useEffect(() => {
        try {
            if (typeof window !== "undefined") {
                window.localStorage.setItem(TASK_TIMES_KEY, JSON.stringify(taskTimes));
            }
        } catch {
            // ignore
        }
    }, [taskTimes]);

    // Загрузка настроек уведомлений
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
                setNotifyBeforeDay(Boolean(data.notify_before_day));
                setNotifyBeforeHour(Boolean(data.notify_before_hour));
            }
        }
        loadUserSettings();
        return () => { ignore = true; };
    }, [user]);

    // Открытие модального окна из дашборда
    useEffect(() => {
        if (openFromDashboard) {
            handleOpenCreate();
            onOpenFromDashboardHandled?.();
        }
    }, [openFromDashboard, onOpenFromDashboardHandled]);

    // Загрузка задач
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
        return () => { ignore = true; };
    }, [user, t]);

    // Фильтрация и сортировка задач (оптимизировано)
    const filteredTasks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return tasks
            .filter((task) => {
                // Режимы просмотра
                if (viewMode === "today") {
                    return !task.completed && (task.dueDate === today || task.dueDate < today);
                }
                if (viewMode === "week") {
                    return !task.completed && task.dueDate >= today && task.dueDate <= weekFromNow;
                }
                if (viewMode === "overdue") {
                    return !task.completed && task.dueDate < today;
                }
                if (viewMode === "completed") {
                    return task.completed;
                }
                return true;
            })
            .filter((task) => categoryFilter === "all" || task.category === categoryFilter)
            .filter((task) => priorityFilter === "all" || task.priority === priorityFilter)
            .filter((task) => {
                if (!query) return true;
                return task.title.toLowerCase().includes(query) ||
                    (task.description?.toLowerCase().includes(query) ?? false);
            })
            .sort((a, b) => {
                if (sortBy === "dueDateAsc") return a.dueDate.localeCompare(b.dueDate);
                if (sortBy === "dueDateDesc") return b.dueDate.localeCompare(a.dueDate);
                if (sortBy === "priority") {
                    const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
                    return (order[a.priority] ?? 99) - (order[b.priority] ?? 99);
                }
                return 0;
            });
    }, [tasks, viewMode, categoryFilter, priorityFilter, sortBy, today, weekFromNow, searchQuery]);

    // Переключение статуса с визуальной обратной связью
    async function toggleCompleted(id: string, currentCompleted: boolean) {
        if (!supabase || !user) return;

        setPendingAction({ type: 'toggle', id });
        const nextCompleted = !currentCompleted;

        // Оптимистичное обновление UI
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
            // Откат при ошибке
            setTasks((prev) =>
                prev.map((task) =>
                    task.id === id ? { ...task, completed: currentCompleted } : task
                )
            );
            setError(t("tasks.errors.updateFailed"));
            console.error("Failed to update task:", error.message);
        }

        setPendingAction(null);
    }

    // Удаление задачи с подтверждением и обратной связью
    async function handleDelete(id: string) {
        if (!supabase || !user) return;

        if (typeof window !== "undefined" && !window.confirm(t("tasks.confirmDelete"))) {
            return;
        }

        setPendingAction({ type: 'delete', id });

        const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            setError(t("tasks.errors.deleteFailed"));
            console.error("Failed to delete task:", error.message);
        } else {
            setTasks((prev) => prev.filter((task) => task.id !== id));
        }

        setPendingAction(null);
    }

    function handleOpenCreate() {
        setEditingTask(null);
        setIsModalOpen(true);
    }

    function handleOpenEdit(task: Task) {
        setEditingTask(task);
        setIsModalOpen(true);
    }

    // Сохранение задачи с обработкой ошибок
    async function handleSave(taskData: Omit<Task, "id" | "user_id"> & { dueTime?: string }) {
        if (!supabase || !user) return;

        const { dueTime, ...dbTaskData } = taskData;

        try {
            if (editingTask) {
                // Обновление существующей задачи
                const { data, error } = await supabase
                    .from("tasks")
                    .update(dbTaskData)
                    .eq("id", editingTask.id)
                    .eq("user_id", user.id)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    const updated = data as Task;
                    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
                    if (dueTime) {
                        setTaskTimes((prev) => ({ ...prev, [updated.id]: dueTime }));
                    }
                }
            } else {
                // Создание новой задачи
                const { data, error } = await supabase
                    .from("tasks")
                    .insert([{ ...dbTaskData, user_id: user.id }])
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    const inserted = data as Task;
                    setTasks((prev) => [...prev, inserted]);
                    if (dueTime) {
                        setTaskTimes((prev) => ({ ...prev, [inserted.id]: dueTime }));
                    }

                    // Создание уведомления о новой задаче
                    if (emailNotificationsEnabled && (notifyBeforeDay || notifyBeforeHour)) {
                        await supabase.from("notifications").insert({
                            user_id: user.id,
                            task_id: inserted.id,
                            title: t("notifications.newTaskTitle"),
                            body: t("notifications.newTaskBody", {
                                title: inserted.title,
                                when: `${inserted.dueDate} ${dueTime || getNowTimeValue()}`
                            }),
                            type: "created",
                            is_read: false,
                        });
                    }
                }
            }

            setIsModalOpen(false);
            setEditingTask(null);
        } catch (err) {
            console.error("Failed to save task:", err);
            setError(t("tasks.errors.saveFailed"));
        }
    }

    // Упрощённая система напоминаний (вынесена в отдельный хук в продакшене)
    useEffect(() => {
        if (!supabase || !user || !emailNotificationsEnabled) return;

        let timerId: ReturnType<typeof setTimeout> | undefined;
        let stopped = false;

        const checkReminders = async () => {
            if (stopped) return;

            const now = new Date();
            const state = JSON.parse(
                typeof window !== "undefined"
                    ? (localStorage.getItem(REMINDERS_KEY) || "{}")
                    : "{}"
            );

            for (const task of tasksRef.current) {
                if (!task.dueDate || task.completed) continue;

                const timePart = taskTimesRef.current[task.id] ?? getNowTimeValue();
                const [h, m] = timePart.split(":").map((x) => parseInt(x, 10) || 0);

                const due = new Date(task.dueDate);
                due.setHours(h, m, 0, 0);

                const msDiff = due.getTime() - now.getTime();
                const taskState = state[task.id] || { day: false, hour: false, due: false };

                const reminders: Array<{ kind: 'day' | 'hour' | 'due'; title: string; body: string }> = [];

                if (notifyBeforeDay && !taskState.day && msDiff <= 24 * 60 * 60 * 1000 && msDiff > 23 * 60 * 60 * 1000) {
                    reminders.push({
                        kind: 'day',
                        title: t("notifications.reminderDayTitle"),
                        body: t("notifications.reminderDayBody", { title: task.title, when: `${task.dueDate} ${timePart}` })
                    });
                    taskState.day = true;
                }

                if (notifyBeforeHour && !taskState.hour && msDiff <= 60 * 60 * 1000 && msDiff > 59 * 60 * 1000) {
                    reminders.push({
                        kind: 'hour',
                        title: t("notifications.reminderHourTitle"),
                        body: t("notifications.reminderHourBody", { title: task.title, when: `${task.dueDate} ${timePart}` })
                    });
                    taskState.hour = true;
                }

                if (!taskState.due && msDiff <= 0 && msDiff > -60 * 1000) {
                    reminders.push({
                        kind: 'due',
                        title: t("notifications.reminderDueTitle"),
                        body: t("notifications.reminderDueBody", { title: task.title, when: `${task.dueDate} ${timePart}` })
                    });
                    taskState.due = true;
                }

                // Сохранение уведомлений в БД
                for (const reminder of reminders) {
                    try {
                        await supabase.from("notifications").insert({
                            user_id: user.id,
                            task_id: task.id,
                            title: reminder.title,
                            body: reminder.body,
                            type: `reminder_${reminder.kind}`,
                            is_read: false,
                        });
                    } catch (e) {
                        console.error("Failed to create reminder:", e);
                    }
                }

                state[task.id] = taskState;
            }

            if (typeof window !== "undefined") {
                localStorage.setItem(REMINDERS_KEY, JSON.stringify(state));
            }

            if (!stopped) {
                timerId = setTimeout(checkReminders, 60 * 1000);
            }
        };

        timerId = setTimeout(checkReminders, 5 * 1000);

        return () => {
            stopped = true;
            if (timerId) clearTimeout(timerId);
        };
    }, [user, emailNotificationsEnabled, notifyBeforeDay, notifyBeforeHour, t]);

    return (
        <div className="space-y-4">
            {/* Заголовок и кнопка создания */}
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{t("tasks.title")}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("tasks.subtitle")}</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                className="inline-flex items-center justify-center rounded-lg bg-[#0084D1] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0076BA]"
                >
                    {t("dashboard.newTask")}
                </button>
            </div>

            {/* Режимы просмотра */}
            <div
                className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                role="tablist"
                aria-label={t("tasks.tabs.title")}
            >
                {VIEW_MODES.map((mode) => (
                    <button
                        key={mode.id}
                        role="tab"
                        aria-selected={viewMode === mode.id}
                        onClick={() => setViewMode(mode.id)}
                        className={`rounded-full px-3 py-1 transition ${
                            viewMode === mode.id
                                ? "border border-[#0084D1] text-[#0084D1] dark:bg-sky-600 dark:text-white dark:border-transparent"
                                : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                        }`}
                    >
                        {t(mode.labelKey)}
                    </button>
                ))}
            </div>

            {/* Фильтры */}
            <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {/* Категория */}
                <div className="flex items-center gap-2">
                    <label htmlFor="filter-category" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">
                        {t("tasks.filters.category")}
                    </label>
                    <select
                        id="filter-category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white"
                    >
                        <option value="all">{t("tasks.tabs.all")}</option>
                        {categoryOptions.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {getCategoryLabel(cat.id, cat.labelKey)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Приоритет */}
                <div className="flex items-center gap-2">
                    <label htmlFor="filter-priority" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">
                        {t("tasks.filters.priority")}
                    </label>
                    <select
                        id="filter-priority"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white"
                    >
                        <option value="all">{t("tasks.tabs.all")}</option>
                        {PRIORITY_OPTIONS.map((pr) => (
                            <option key={pr.id} value={pr.id}>
                                {getPriorityLabel(pr.id)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Сортировка */}
                <div className="flex items-center gap-2">
                    <label htmlFor="filter-sort" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">
                        {t("tasks.filters.sorting")}
                    </label>
                    <select
                        id="filter-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white"
                    >
                        <option value="dueDateAsc">{t("tasks.filters.sortingDateAsc")}</option>
                        <option value="dueDateDesc">{t("tasks.filters.sortingDateDesc")}</option>
                        <option value="priority">{t("tasks.filters.sortingPriority")}</option>
                    </select>
                </div>

                {/* Поиск */}
                <div className="flex items-center gap-2">
                    <label htmlFor="search-tasks" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">
                        {t("tasks.filters.search")}
                    </label>
                    <input
                        id="search-tasks"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("tasks.filters.searchPlaceholder")}
                        className="w-40 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                    />
                </div>
            </div>

            {/* Список задач */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-300">
                    {t("tasks.listHeader")}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center px-6 py-8 text-sm text-slate-500 dark:text-slate-400">
                        {t("tasks.loading")}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center text-sm text-rose-600 dark:text-rose-400" role="alert">
                        <div className="text-2xl">⚠️</div>
                        <div>{error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-xs underline hover:no-underline"
                        >
                            {t("common.retry")}
                        </button>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                        <div className="text-2xl">📝</div>
                        <div>{t("tasks.emptyFilters")}</div>
                        <button
                            onClick={handleOpenCreate}
                            className="mt-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50"
                        >
                            {t("tasks.createFirst")}
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTasks.map((task) => {
                            const isPending = pendingAction?.id === task.id;
                            const category = categoryOptions.find((c) => c.id === task.category);

                            return (
                                <li
                                    key={task.id}
                                    className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    {/* Доступный чекбокс для статуса */}
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => !isPending && toggleCompleted(task.id, task.completed)}
                                        disabled={isPending}
                                        className={`mt-1 h-4 w-4 rounded border text-xs disabled:opacity-50 focus:ring-sky-500 ${
                                            task.completed
                                              ? "border-emerald-500 bg-emerald-500 text-white"
                                              : "border-slate-300 bg-white dark:border-white dark:bg-slate-800"
                                        }`}
                                        aria-label={t(task.completed ? "tasks.markIncomplete" : "tasks.markComplete")}
                                    />

                                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2 min-w-0">
                        <span
                            className={`text-sm font-medium truncate ${
                                task.completed
                                    ? "text-slate-400 line-through"
                                    : "text-slate-900 dark:text-white"
                            }`}
                        >
                          {task.title}
                        </span>
                                                {/* Бейдж приоритета */}
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                                                        category?.colorClass || PRIORITY_OPTIONS.find(p => p.id === task.priority)?.colorClass
                                                    }`}
                                                >
                          {getPriorityLabel(task.priority)}
                        </span>
                                            </div>

                                            {/* Мета-информация */}
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                                                {category && (
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium">
                            <span
                                className="mr-1 inline-flex h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: category.colorHex }}
                                aria-hidden="true"
                            />
                                                        {getCategoryLabel(task.category, category.labelKey)}
                          </span>
                                                )}
                                                <span>·</span>
                                                <span
                                                    className={
                                                        !task.completed && task.dueDate < today
                                                            ? "text-rose-600 dark:text-rose-400 font-medium"
                                                            : ""
                                                    }
                                                >
                          {task.dueDate} {taskTimes[task.id] ?? getNowTimeValue()}
                        </span>
                                            </div>
                                        </div>

                                        {task.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Кнопки действий */}
                                    <div className="flex flex-col items-end gap-1 text-xs">
                                        <button
                                            onClick={() => handleOpenEdit(task)}
                                            disabled={isPending}
                                            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                                            aria-label={t("tasks.actions.edit")}
                                        >
                                            {t("tasks.actions.edit")}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            disabled={isPending}
                                            className="rounded-lg px-2 py-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-300 transition-colors"
                                            aria-label={t("tasks.actions.delete")}
                                        >
                                            {isPending ? "…" : t("tasks.actions.delete")}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Модальное окно */}
            {isModalOpen && (
                <TaskModal
                    initialTask={
                        editingTask
                            ? { ...editingTask, dueTime: taskTimes[editingTask.id] ?? getNowTimeValue() }
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