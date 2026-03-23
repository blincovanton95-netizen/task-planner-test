'use client';

import { FormEvent, useState } from "react";
import { PRIORITY_OPTIONS } from "../../constants/tasks";
import { useLanguage } from "../../lib/i18n";

type CategoryOption = {
  id: string;
  label: string;
  color: string;
};

type TaskPayload = {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: string;
  category: string;
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
  const [title, setTitle] = useState(initialTask?.title || "");
  const [description, setDescription] = useState(
    initialTask?.description || ""
  );
  const [dueDate, setDueDate] = useState(
    initialTask?.dueDate || new Date().toISOString().slice(0, 10)
  );
  const [dueTime, setDueTime] = useState(
    initialTask?.dueTime || "09:00"
  );
  const [priority, setPriority] = useState(initialTask?.priority || "medium");
  const [category, setCategory] = useState(initialTask?.category || "work");
  const [completed, setCompleted] = useState(initialTask?.completed || false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

  const getPriorityLabel = (priorityId: string) => {
    const key = `tasks.priority.${priorityId}`;
    const translated = t(key);
    return translated !== key ? translated : priorityId;
  };

  const getCategoryLabel = (categoryId: string, fallback: string) => {
    const key = `tasks.category.${categoryId}`;
    const translated = t(key);
    return translated !== key ? translated : fallback;
  };

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    let finalCategory = category;

    if (isNewCategory && newCategoryName.trim()) {
      const baseId = newCategoryName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 32);
      let uniqueId = baseId || "custom";
      let suffix = 1;
      while (categoryOptions.some((c) => c.id === uniqueId)) {
        uniqueId = `${baseId || "custom"}-${suffix++}`;
      }

      const newCat: CategoryOption = {
        id: uniqueId,
        label: newCategoryName.trim(),
        color: newCategoryColor,
      };
      onAddCategory?.(newCat);
      finalCategory = newCat.id;
    }

    onSave({
      title,
      description,
      dueDate,
      dueTime,
      priority,
      category: finalCategory,
      completed,
    });
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {initialTask ? t("tasks.modal.editTitle") : t("tasks.modal.newTitle")}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-white">
              {t("tasks.modal.titleLabel")}
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={t("tasks.modal.titlePlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700  dark:text-white">
              {t("tasks.modal.descriptionLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("tasks.modal.descriptionPlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-white">
                {t("tasks.modal.dueDateLabel")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-white">
                {t("tasks.modal.priorityLabel")}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getPriorityLabel(p.id)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-white">
                {t("tasks.modal.categoryLabel")}
              </label>
              <select
                value={isNewCategory ? "__new" : category}
                onChange={(e) => {
                  if (e.target.value === "__new") {
                    setIsNewCategory(true);
                  } else {
                    setIsNewCategory(false);
                    setCategory(e.target.value);
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryLabel(cat.id, cat.label)}
                  </option>
                ))}
                <option value="__new">{t("tasks.modal.categoryNewOption")}</option>
              </select>
              {isNewCategory && (
                <div className="mt-2 flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={t("tasks.modal.categoryNamePlaceholder")}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none ring-sky-500 focus:ring-2 dark:border-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                  />
                  <div className="flex items-center gap-2">
                    <span>{t("tasks.modal.colorLabel")}</span>
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="h-6 w-10 cursor-pointer rounded border border-slate-200 bg-transparent p-0 dark:border-white"
                    />
                  </div>
                </div>
              )}
            </div>
            {initialTask && (
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="completed"
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-white dark:bg-slate-800"
                />
                <label
                  htmlFor="completed"
                  className="text-xs font-medium text-slate-700 dark:text-white"
                >
                  {t("tasks.modal.completedLabel")}
                </label>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {t("tasks.modal.cancel")}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
            >
              {t("tasks.modal.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

