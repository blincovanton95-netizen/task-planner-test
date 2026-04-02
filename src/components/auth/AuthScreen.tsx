'use client';

import { FormEvent, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { Logo } from "../ui/Logo";
import { useLanguage } from "../../lib/i18n";

type AuthMode = "login" | "register" | "forgot";

interface AuthScreenProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (payload: { user?: User | null; rememberMe?: boolean }) => void;
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
  const [acceptTerms, setAcceptTerms] = useState(false);

  function toAuthErrorMessage(err: unknown) {
    const message =
      typeof err === "object" && err && "message" in err
        ? String((err as { message?: string }).message ?? "")
        : "";

    if (message.toLowerCase().includes("error sending confirmation email")) {
      return t("auth.errors.confirmationEmailUnavailable");
    }
    if (message.toLowerCase().includes("password")) {
      return t("auth.errors.passwordWeak");
    }

    return message || t("auth.errors.generic");
  }

  function validatePassword(password: string): string | null {
    if (password.length < 8) return t("auth.errors.passwordTooShort");
    if (!/[A-Z]/.test(password)) return t("auth.errors.passwordNoUppercase");
    if (!/[0-9]/.test(password)) return t("auth.errors.passwordNoNumber");
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) {
      onAuthenticated({ rememberMe });
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

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error(t("auth.errors.emailInvalid"));
      }

      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/?section=settings`
              : undefined,
        });
        if (error) throw error;
        setInfo(t("auth.recovery.info"));
        return;
      }

      if (!password) {
        throw new Error(t("auth.errors.passwordRequired"));
      }

      if (isRegister) {
        const pwdError = validatePassword(password);
        if (pwdError) throw new Error(pwdError);
        
        if (password !== passwordConfirm) {
          throw new Error(t("auth.errors.passwordMismatch"));
        }
        if (!name) {
          throw new Error(t("auth.errors.nameRequired"));
        }
        if (!acceptTerms) {
          throw new Error(t("auth.errors.termsRequired"));
        }
      }

      if (!supabase) {
        throw new Error(t("auth.errors.supabaseNotReady"));
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthenticated({ rememberMe });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/`
                : undefined,
          },
        });
        if (error) throw error;
        if (!data.user) {
          throw new Error(t("auth.errors.registerFailed"));
        }
        setInfo(t("auth.register.success"));
        setTimeout(() => onModeChange("login"), 3000);
      }
    } catch (err: any) {
      setError(toAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    // Семантические классы темы
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950 transition-colors duration-300">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-8">
          <Logo align="center" />
        </div>

        {/* Переключатель режимов */}
        <div className="mb-6 flex rounded-full bg-slate-100 p-1 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300" role="tablist">
          <button
            type="button"
            onClick={() => onModeChange("login")}
            className={`flex-1 rounded-full px-3 py-2 transition ${
              isLogin 
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" 
                : "dark:hover:text-slate-100"
            }`}
            aria-selected={isLogin}
            role="tab"
          >
            {t("auth.login")}
          </button>
          <button
            type="button"
            onClick={() => onModeChange("register")}
            className={`flex-1 rounded-full px-3 py-2 transition ${
              isRegister 
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" 
                : "dark:hover:text-slate-100"
            }`}
            aria-selected={isRegister}
            role="tab"
          >
            {t("auth.register")}
          </button>
        </div>

        {isForgot && (
          <div className="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
            {t("auth.recovery.description")}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {isRegister && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("auth.register.name")}
              </label>
              <input
                type="text"
                name="name"
                placeholder={t("auth.register.namePlaceholder")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                required
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t("auth.email")}
            </label>
            <input
              type="email"
              required
              name="email"
              placeholder={t("auth.emailPlaceholder")}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          {!isForgot && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("auth.password")}
              </label>
              <input
                type="password"
                required
                name="password"
                placeholder={t("auth.passwordPlaceholder")}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                minLength={8}
              />
              {isRegister && (
                <p className="text-xs text-muted-foreground">
                  {t("auth.register.passwordHint")}
                </p>
              )}
            </div>
          )}

          {isRegister && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("auth.register.repeatPassword")}
                </label>
                <input
                  type="password"
                  required
                  name="passwordConfirm"
                  placeholder={t("auth.register.repeatPasswordPlaceholder")}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-sky-600"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <span>{t("auth.register.acceptTerms")}</span>
              </label>
            </>
          )}

          {isLogin && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 cursor-pointer dark:text-sky-600"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {t("auth.login.rememberMe")}
              </label>
              <button
                type="button"
                className="text-[#0084D1] hover:text-[#0076BA] dark:text-sky-400 dark:hover:text-sky-300"
                onClick={() => onModeChange("forgot")}
              >
                {t("auth.login.forgotPassword")}
              </button>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          {info && !error && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400" role="status">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-[#0084D1] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0076BA] disabled:cursor-not-allowed disabled:bg-sky-400 dark:hover:bg-sky-500 dark:disabled:bg-sky-800 dark:disabled:text-slate-400"
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
              className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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