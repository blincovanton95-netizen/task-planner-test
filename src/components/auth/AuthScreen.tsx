'use client';

import { FormEvent, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { Logo } from "../../components/ui/Logo";
import { useLanguage } from "../../lib/i18n";

type AuthMode = "login" | "register" | "forgot";

interface AuthScreenProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (payload: { user: User | null; rememberMe?: boolean }) => void;
}

export function AuthScreen({ mode, onModeChange, onAuthenticated }: AuthScreenProps) {
  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) {
      onAuthenticated({ user: null, rememberMe });
      return;
    }

    setError("");
    setInfo("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString() ?? "";
    const passwordConfirm = formData.get("passwordConfirm")?.toString() ?? "";

    try {
      if (!email) {
        throw new Error(t("auth.errors.emailRequired"));
      }

      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/`
              : undefined,
        });

        if (error) throw error;

        setInfo(t("auth.recovery.info"));
        return;
      }

      if (!password) {
        throw new Error(t("auth.errors.passwordRequired"));
      }

      if (isRegister && password !== passwordConfirm) {
        throw new Error(t("auth.errors.passwordMismatch"));
      }

      if (isRegister && !name) {
        throw new Error(t("auth.errors.nameRequired"));
      }

      if (!supabase) {
        throw new Error(t("auth.errors.supabaseNotReady"));
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthenticated({ user: data.user, rememberMe });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;

        if (!data.user) {
          throw new Error(
            t("auth.register.pending")
          );
        }

        onAuthenticated({ user: data.user, rememberMe: true });
      }
    } catch (err: any) {
      setError(err.message ?? t("auth.errors.generic"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8">
          <Logo align="center" />
        </div>

        <div className="mb-6 flex rounded-full bg-slate-100 p-1 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onModeChange("login")}
            className={`flex-1 rounded-full px-3 py-2 transition ${
              isLogin ? "bg-white text-slate-900 shadow-sm" : ""
            }`}
          >
            {t("auth.login")}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("register")}
            className={`flex-1 rounded-full px-3 py-2 transition ${
              isRegister ? "bg-white text-slate-900 shadow-sm" : ""
            }`}
          >
            {t("auth.register")}
          </button>
        </div>

        {isForgot && (
          <div className="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
            {t("auth.recovery.description")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                {t("auth.register.name")}
              </label>
              <input
                type="text"
                name="name"
                placeholder={t("auth.register.namePlaceholder")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              {t("auth.email")}
            </label>
            <input
              type="email"
              required
              name="email"
              placeholder={t("auth.emailPlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2"
            />
          </div>

          {!isForgot && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                {t("auth.password")}
              </label>
              <input
                type="password"
                required
                name="password"
                placeholder={t("auth.passwordPlaceholder")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2"
              />
            </div>
          )}

          {isRegister && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                {t("auth.register.repeatPassword")}
              </label>
              <input
                type="password"
                required
                name="passwordConfirm"
                placeholder={t("auth.register.repeatPasswordPlaceholder")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2"
              />
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {t("auth.login.rememberMe")}
              </label>
              <button
                type="button"
                className="text-sky-600 hover:text-sky-700"
                onClick={() => onModeChange("forgot")}
              >
              {t("auth.login.forgotPassword")}
              </button>
            </div>
          )}

          {isRegister && (
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              {t("auth.register.acceptTerms")}
            </label>
          )}

          {error && (
            <p className="text-xs text-rose-600">
              {error}
            </p>
          )}
          {info && !error && (
            <p className="text-xs text-emerald-600">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
          >
            {isLoading
              ? t("auth.common.processing")
              : isForgot
              ? t("auth.recovery.submit")
              : isLogin
              ? t("auth.login.submit")
              : t("auth.register.submit")}
          </button>

          {isForgot && (
            <button
              type="button"
              className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-700"
              onClick={() => onModeChange("login")}
            >
              {t("auth.recovery.backToLogin")}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

