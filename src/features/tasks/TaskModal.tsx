'use client';

import { FormEvent, useState, useEffect, useRef, useCallback } from "react";
import { PRIORITY_OPTIONS, type Priority, type Category } from "../../constants/tasks";
import { useLanguage } from "../../lib/i18n";

// Используем тип CategoryOption из constants
import type { CategoryOption } from "../../constants/tasks";

function getNowTimeValue() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
}

// Типизированный payload с использованием типов из constants
type TaskPayload = {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: Priority;
    category: Category | string;
    completed: boolean;
};

interface TaskModalProps {
    initialTask?: TaskPayload & { id?: string };
    onClose: () => void;
    onSave: (task: TaskPayload) => void;
    categoryOptions: CategoryOption[];
    onAddCategory?: (cat: CategoryOption) => void;
}

export function TaskModal({
                              initialTask,
                              onClose,
                              onSave,
                              categoryOptions,
                              onAddCategory,
                          }: TaskModalProps) {
    const { t } = useLanguage();

    // Стейты формы
    const [title, setTitle] = useState(initialTask?.title || "");
    const [description, setDescription] = useState(initialTask?.description || "");
    const [dueDate, setDueDate] = useState(
        initialTask?.dueDate || new Date().toISOString().slice(0, 10)
    );
    const [dueTime, setDueTime] = useState(
        initialTask?.dueTime || getNowTimeValue()
    );
    const [priority, setPriority] = useState<Priority>(
        (initialTask?.priority as Priority) || "medium"
    );
    const [category, setCategory] = useState<Category | string>(
        initialTask?.category || "work"
    );
    const [completed, setCompleted] = useState(initialTask?.completed || false);

    // Стейты для новой категории
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

    // Стейты для валидации и загрузки
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Реф для фокуса на первом поле (доступность)
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Фокус на заголовке при открытии
    useEffect(() => {
        titleInputRef.current?.focus();
    }, []);

    // Закрытие по Escape (доступность)
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    const getPriorityLabel = (priorityId: Priority) => {
        const key = `tasks.priority.${priorityId}`;
        const translated = t(key);
        return translated !== key ? translated : priorityId;
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

    // Генерация безопасного ID категории
    function generateCategoryId(name: string, existingIds: string[]): string {
        const baseId = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 32);

        let uniqueId = baseId || "custom";
        let suffix = 1;
        while (existingIds.includes(uniqueId)) {
            uniqueId = `${baseId || "custom"}-${suffix++}`;
        }
        return uniqueId;
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        // Валидация с сообщением об ошибке
        if (!title.trim()) {
            setError(t("tasks.errors.titleRequired"));
            return;
        }

        if (title.trim().length < 3) {
            setError(t("tasks.errors.titleTooShort"));
            return;
        }

        setIsSaving(true);

        try {
            let finalCategory = category;

            if (isNewCategory && newCategoryName.trim()) {
                const uniqueId = generateCategoryId(newCategoryName, categoryOptions.map(c => c.id));

                const newCat: CategoryOption = {
                    id: uniqueId as Category,
                    labelKey: `tasks.category.${uniqueId}`,
                    colorHex: newCategoryColor,
                    colorClass: "bg-primary/10 text-primary",
                };

                onAddCategory?.(newCat);
                finalCategory = uniqueId;
            }

            onSave({
                title: title.trim(),
                description,
                dueDate,
                dueTime: dueTime || getNowTimeValue(),
                priority,
                category: finalCategory,
                completed,
            });

            onClose(); // Закрываем только после успешного сохранения
        } catch (err) {
            console.error("Failed to save task:", err);
            setError(t("tasks.errors.saveFailed"));
        } finally {
            setIsSaving(false);
        }
    }

    return (
        // Доступность: role, aria-modal, aria-label
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4 py-6"
            onClick={(e) => {
                // Закрытие по клику на оверлей (не на контент)
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
                {/* Заголовок модалки */}
                <div className="mb-4 flex items-center justify-between">
                    <h3
                        id="task-modal-title"
                        className="text-base font-semibold text-foreground"
                    >
                        {initialTask ? t("tasks.modal.editTitle") : t("tasks.modal.newTitle")}
                    </h3>
                    {/* Доступность: aria-label для кнопки закрытия */}
                    <button
                        onClick={onClose}
                        aria-label={t("common.close")}
                        className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                    {/* Заголовок задачи */}
                    <div className="space-y-1">
                        <label
                            htmlFor="task-title"
                            className="block text-xs font-medium text-foreground"
                        >
                            {t("tasks.modal.titleLabel")}
                            <span className="text-destructive ml-1">*</span>
                        </label>
                        <input
                            id="task-title"
                            ref={titleInputRef}
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (error) setError(null);
                            }}
                            required
                            minLength={3}
                            placeholder={t("tasks.modal.titlePlaceholder")}
                            disabled={isSaving}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                            aria-invalid={!!error}
                            aria-describedby={error ? "task-title-error" : undefined}
                        />
                        {error && (
                            <p id="task-title-error" className="text-xs text-destructive" role="alert">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Описание */}
                    <div className="space-y-1">
                        <label
                            htmlFor="task-description"
                            className="block text-xs font-medium text-foreground"
                        >
                            {t("tasks.modal.descriptionLabel")}
                        </label>
                        <textarea
                            id="task-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder={t("tasks.modal.descriptionPlaceholder")}
                            disabled={isSaving}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 resize-none dark:border-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                        />
                    </div>

                    {/* Дата, время, приоритет */}
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1 md:col-span-2">
                            <label className="block text-xs font-medium text-foreground">
                                {t("tasks.modal.dueDateLabel")}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    disabled={isSaving}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white"
                                />
                                <input
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    disabled={isSaving}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="task-priority"
                                className="block text-xs font-medium text-foreground"
                            >
                                {t("tasks.modal.priorityLabel")}
                            </label>
                            <select
                                id="task-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                disabled={isSaving}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white"
                            >
                                {PRIORITY_OPTIONS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {getPriorityLabel(p.id)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Категория */}
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label
                                htmlFor="task-category"
                                className="block text-xs font-medium text-foreground"
                            >
                                {t("tasks.modal.categoryLabel")}
                            </label>
                            <select
                                id="task-category"
                                value={isNewCategory ? "__new" : category}
                                onChange={(e) => {
                                    if (e.target.value === "__new") {
                                        setIsNewCategory(true);
                                    } else {
                                        setIsNewCategory(false);
                                        setCategory(e.target.value as Category);
                                    }
                                }}
                                disabled={isSaving}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white"
                            >
                                {categoryOptions.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {getCategoryLabel(cat.id, cat.labelKey)}
                                    </option>
                                ))}
                                <option value="__new">{t("tasks.modal.categoryNewOption")}</option>
                            </select>

                            {/* Поля для новой категории */}
                            {isNewCategory && (
                                <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/50 p-2">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder={t("tasks.modal.categoryNamePlaceholder")}
                                        disabled={isSaving}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none ring-sky-500 focus:ring-2 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                                    />
                                    <label className="flex items-center gap-2 text-xs text-foreground">
                                        {t("tasks.modal.colorLabel")}
                                        <input
                                            type="color"
                                            value={newCategoryColor}
                                            onChange={(e) => setNewCategoryColor(e.target.value)}
                                            disabled={isSaving}
                                            className="h-6 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0 disabled:opacity-50 dark:border-white"
                                            aria-label={t("tasks.modal.colorLabel")}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Чекбокс "Выполнено" (только при редактировании) */}
                        {initialTask && (
                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    id="task-completed"
                                    type="checkbox"
                                    checked={completed}
                                    onChange={(e) => setCompleted(e.target.checked)}
                                    disabled={isSaving}
                                    className="h-4 w-4 rounded border-slate-300 bg-white text-slate-900 focus:ring-sky-500 disabled:opacity-50 dark:border-white dark:bg-slate-800 dark:text-white"
                                />
                                <label
                                    htmlFor="task-completed"
                                    className="text-xs font-medium text-foreground"
                                >
                                    {t("tasks.modal.completedLabel")}
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Кнопки действий */}
                    <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white disabled:opacity-50 transition-colors"
                        >
                            {t("tasks.modal.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-lg bg-[#0084D1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0076BA] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                        >
                            {isSaving ? t("common.saving") : t("tasks.modal.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}