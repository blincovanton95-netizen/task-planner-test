'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { AuthScreen } from "../components/auth/AuthScreen";
import { AppShell, type AppSection } from "../components/layout/AppShell";
import { AdminLayout } from "../features/admin/AdminLayout";
import { AdminView } from "../features/admin/AdminView";
import type { AppProfileRole } from "../types/profile";
import { useLanguage } from "../lib/i18n";

type AuthMode = "login" | "register" | "forgot";

type AuthenticatedPayload = {
  user?: User | null;
  rememberMe?: boolean;
};

export default function Home() {
  const { t } = useLanguage();
  
  // Состояния аутентификации
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  
  // Состояния приложения
  const [activeSection, setActiveSection] = useState<AppSection>("dashboard");
  const [profileRole, setProfileRole] = useState<AppProfileRole>("user");
  const [profileChecked, setProfileChecked] = useState(false);

  const authReadyRef = useRef(false);

  // Если открыли ссылку восстановления пароля, переводим на раздел настроек.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    const isRecoveryLink = window.location.hash.includes("type=recovery");

    if (section === "settings" || isRecoveryLink) {
      setActiveSection("settings");
    }
  }, []);

  // Проверка сессии
  useEffect(() => {
    authReadyRef.current = false;

    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    const rememberMeValue =
      typeof window !== "undefined"
        ? window.localStorage.getItem("taskPlannerRememberMe")
        : null;

    if (rememberMeValue === "0") {
      void supabase.auth.signOut({ scope: "local" }).finally(() => {
        setUser(null);
        setAuthChecked(true);
        authReadyRef.current = true;
      });
      return;
    }

    let ignore = false;

    const finishAuthInit = () => {
      if (ignore || authReadyRef.current) return;
      authReadyRef.current = true;
      setAuthChecked(true);
    };

    const fallbackTimer =
      typeof window !== "undefined"
        ? window.setTimeout(() => {
            if (!ignore) finishAuthInit();
          }, 4000)
        : undefined;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return;
      setUser(session?.user ?? null);
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
      }
      finishAuthInit();
    });

    return () => {
      ignore = true;
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
      }
      subscription.unsubscribe();
    };
  }, []);

  // Проверка роли профиля
  useEffect(() => {
    const userId = user?.id ?? null;

    if (!userId) {
      setProfileRole("user");
      setProfileChecked(true);
      return;
    }

    if (!supabase) {
      setProfileRole("user");
      setProfileChecked(true);
      return;
    }

    let cancelled = false;
    setProfileChecked(false);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setProfileRole("user");
          return;
        }

        const role: AppProfileRole = data?.role === "admin" ? "admin" : "user";
        setProfileRole(role);
      } finally {
        if (!cancelled) {
          setProfileChecked(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Обработка успешной аутентификации
  const handleAuthenticated = useCallback((payload: AuthenticatedPayload) => {
    if (typeof window !== "undefined" && payload.rememberMe !== undefined) {
      window.localStorage.setItem(
        "taskPlannerRememberMe",
        payload.rememberMe ? "1" : "0"
      );
    }
    if (payload.user) {
      setUser(payload.user);
    }
  }, []);

  // Обработчик выхода из системы
  const handleSignOut = useCallback(async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Sign out error:", error);
      } finally {
        setUser(null);
        setProfileRole("user");
        setProfileChecked(true);
        setActiveSection("dashboard");
      }
    }
  }, []);

  const isAuthenticated = !!user;

  // Экраны загрузки
  if (!authChecked || !profileChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background transition-colors duration-300">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm text-slate-500 shadow dark:bg-slate-900 dark:text-slate-400">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  // Экран авторизации
  if (!isAuthenticated) {
    return (
      <AuthScreen
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  // Админка
  if (profileRole === "admin") {
    return (
      <AdminLayout
        user={user}
        onSignedOut={handleSignOut}
      >
        <AdminView user={user} />
      </AdminLayout>
    );
  }

  // Основное приложение
  return (
    <AppShell
      user={user}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      profileRole={profileRole}
      onSignOut={handleSignOut}
    />
  );
}