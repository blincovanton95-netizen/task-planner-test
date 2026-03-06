'use client';

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { AuthScreen } from "../components/auth/AuthScreen";
import { AppShell } from "../components/layout/AppShell";

type AuthMode = "login" | "register";

type AuthenticatedPayload = {
  user: User | null;
  rememberMe?: boolean;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    const rememberMeValue =
      typeof window !== "undefined"
        ? window.localStorage.getItem("taskPlannerRememberMe")
        : null;

    if (rememberMeValue === "0") {
      supabase.auth.signOut().finally(() => {
        setUser(null);
        setAuthChecked(true);
      });
      return;
    }

    let ignore = false;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!ignore) {
        if (!error && data?.user) {
          setUser(data.user);
        }
        setAuthChecked(true);
      }
    }

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!ignore) {
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      ignore = true;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const handleAuthenticated = ({ user, rememberMe }: AuthenticatedPayload) => {
    setUser(user);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "taskPlannerRememberMe",
        rememberMe ? "1" : "0"
      );
    }
  };

  const isAuthenticated = !!user;

  if (!authChecked && supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm text-slate-500 shadow">
          Загрузка...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <AppShell
      user={user}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    />
  );
}

