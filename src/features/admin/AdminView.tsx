'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { useLanguage } from "../../lib/i18n";

const AUTO_REFRESH_MS = 30_000;

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  language: string | null;
  created_at: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  user_id: string;
  priority: string;
  category: string;
};

interface AdminViewProps {
  user: User;
}

export function AdminView({ user }: AdminViewProps) {
  const { t } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingTasks, setSyncingTasks] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  // Фильтрация админов
  const visibleProfiles = useMemo(
    () => profiles.filter((p) => p.role !== "admin"),
    [profiles]
  );

  // Группировка задач по пользователям
  const tasksByUser = useMemo(() => {
    const map: Record<string, TaskRow[]> = {};
    for (const task of tasks) {
      if (!map[task.user_id]) map[task.user_id] = [];
      map[task.user_id].push(task);
    }
    for (const uid of Object.keys(map)) {
      map[uid].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }
    return map;
  }, [tasks]);

  // Загрузка данных
  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    const tr = tRef.current;

    if (!supabase) {
      setError(tr("admin.errors.noSupabase"));
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }
    setError("");

    try {
      const prRes = await supabase
        .from("profiles")
        .select("id, full_name, email, role, language, created_at")
        .order("created_at", { ascending: false });

      if (prRes.error) {
        setError(prRes.error.message ?? tr("admin.errors.loadUsers"));
        setProfiles([]);
        setTasks([]);
        if (!silent) setLoading(false);
        return;
      }

      setProfiles((prRes.data as ProfileRow[]) ?? []);

      if (!silent) {
        setLoading(false);
        setSyncingTasks(true);
      }

      const tRes = await supabase
        .from("tasks")
        .select("id, title, dueDate, completed, user_id, priority, category");

      if (tRes.error) {
        setError(tRes.error.message ?? tr("admin.errors.loadTasks"));
        setTasks([]);
      } else {
        setTasks((tRes.data as TaskRow[]) ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("admin.errors.loadUsers"));
      setProfiles([]);
      setTasks([]);
    } finally {
      if (!silent) setLoading(false);
      setSyncingTasks(false);
    }
  }, []);

  const loadRef = useRef(load);
  loadRef.current = load;

  // Initial load
  useEffect(() => {
    void load({ silent: false });
  }, [load]);

  // Auto-refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(
      () => void loadRef.current({ silent: true }),
      AUTO_REFRESH_MS
    );
    return () => window.clearInterval(id);
  }, []);

  // Refresh on visibility change
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void loadRef.current({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // ✅ Функции для перевода приоритета и категории
  const getPriorityLabel = (priorityId: string) => {
    const key = `tasks.priority.${priorityId}`;
    const translated = t(key);
    return translated !== key ? translated : priorityId;
  };

  const getCategoryLabel = (categoryId: string) => {
    const key = `tasks.category.${categoryId}`;
    const translated = t(key);
    return translated !== key ? translated : categoryId;
  };

  // Удаление задачи
  async function deleteTask(taskId: string) {
    if (!supabase) return;
    if (typeof window !== "undefined" && !window.confirm(t("admin.confirmDeleteTask"))) {
      return;
    }
    setPendingTaskId(taskId);
    const { error: delErr } = await supabase.from("tasks").delete().eq("id", taskId);
    setPendingTaskId(null);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setTasks((prev) => prev.filter((x) => x.id !== taskId));
  }

  // Удаление пользователя
  async function deleteUserRow(targetId: string) {
    if (targetId === user.id) return;
    if (typeof window !== "undefined" && !window.confirm(t("admin.confirmDeleteUser"))) {
      return;
    }
    setPendingUserId(targetId);
    try {
      const { data: sessionData } = await supabase!.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setError(t("admin.errors.noSession"));
        setPendingUserId(null);
        return;
      }

      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: targetId }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof payload.error === "string" ? payload.error : t("admin.errors.deleteUser"));
        setPendingUserId(null);
        return;
      }

      setProfiles((prev) => prev.filter((p) => p.id !== targetId));
      setTasks((prev) => prev.filter((x) => x.user_id !== targetId));
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("admin.errors.deleteUser"));
    } finally {
      setPendingUserId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-foreground">{t("admin.title")}</h1>
        {syncingTasks && !loading && (
          <span className="text-xs text-muted-foreground animate-pulse">{t("admin.syncingTasks")}</span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
          <button 
            onClick={() => setError("")} 
            className="float-right text-xs underline hover:no-underline"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-sm text-muted-foreground">
          {t("admin.loading")}
        </div>
      ) : visibleProfiles.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          {t("admin.empty")}
        </div>
      ) : (
        <ul className="space-y-3">
          {visibleProfiles.map((p) => {
            const userTasks = tasksByUser[p.id] ?? [];
            const isOpen = !!expanded[p.id];
            const isSelf = p.id === user.id;
            return (
              <li
                key={p.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpand(p.id)}
                    aria-expanded={isOpen}
                    className="min-w-0 flex-1 text-left hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">
                        {p.full_name?.trim() || p.email || p.id.slice(0, 8) + "…"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {userTasks.length} {t("admin.tasksCount")}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {p.email || "—"} · {p.id}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(p.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {isOpen ? t("admin.collapse") : t("admin.expandTasks")}
                    </button>
                    <button
                      type="button"
                      disabled={isSelf || pendingUserId === p.id}
                      onClick={() => void deleteUserRow(p.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                    >
                      {pendingUserId === p.id ? (
                        <span className="animate-pulse">⏳</span>
                      ) : (
                        t("admin.deleteUser")
                      )}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-muted/50 px-4 py-3">
                    {userTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("admin.noTasks")}</p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {userTasks.map((task) => (
                          <li
                            key={task.id}
                            className="flex flex-col gap-2 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <span
                                className={
                                  task.completed
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }
                              >
                                {task.title}
                              </span>
                              {/* ✅ ИСПРАВЛЕНО: перевод приоритета и категории */}
                              <span className="ml-2 text-xs text-muted-foreground">
                                {task.dueDate} · {getPriorityLabel(task.priority)} · {getCategoryLabel(task.category)}
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled={pendingTaskId === task.id}
                              onClick={() => void deleteTask(task.id)}
                              className="shrink-0 text-xs font-medium text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
                            >
                              {pendingTaskId === task.id ? (
                                <span className="animate-pulse">⏳</span>
                              ) : (
                                t("tasks.actions.delete")
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}