'use client';

import { FormEvent, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { Logo } from "../../components/ui/Logo";

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
        throw new Error("Заполните email.");
      }

      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/`
              : undefined,
        });

        if (error) throw error;

        setInfo(
          "Мы отправили письмо с кодом и ссылкой для восстановления пароля. Проверьте почту."
        );
        return;
      }

      if (!password) {
        throw new Error("Заполните пароль.");
      }

      if (isRegister && password !== passwordConfirm) {
        throw new Error("Пароли не совпадают.");
      }

      if (isRegister && !name) {
        throw new Error("Заполните имя.");
      }

      if (!supabase) {
        throw new Error("Supabase не инициализирован.");
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
            "Пользователь зарегистрирован. Проверьте почту и подтвердите аккаунт."
          );
        }

        onAuthenticated({ user: data.user, rememberMe: true });
      }
    } catch (err: any) {
      setError(err.message ?? "Ошибка авторизации.");
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
            Вход
          </button>
          <button
            type="button"
            onClick={() => onModeChange("register")}
            className={`flex-1 rounded-full px-3 py-2 transition ${
              isRegister ? "bg-white text-slate-900 shadow-sm" : ""
            }`}
          >
            Регистрация
          </button>
        </div>

        {isForgot && (
          <div className="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
            Введите email, и мы отправим код и ссылку для восстановления пароля.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Имя
              </label>
              <input
                type="text"
                name="name"
                placeholder="Как к вам обращаться"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              name="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2"
            />
          </div>

          {!isForgot && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Пароль
              </label>
              <input
                type="password"
                required
                name="password"
                placeholder="Минимум 8 символов"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-sky-500 focus:ring-2"
              />
            </div>
          )}

          {isRegister && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Повтор пароля
              </label>
              <input
                type="password"
                required
                name="passwordConfirm"
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
                Запомнить меня
              </label>
              <button
                type="button"
                className="text-sky-600 hover:text-sky-700"
                onClick={() => onModeChange("forgot")}
              >
                Забыли пароль?
              </button>
            </div>
          )}

          {isRegister && (
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              Я принимаю условия использования
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
              ? "Обработка..."
              : isForgot
              ? "Восстановить пароль"
              : isLogin
              ? "Войти"
              : "Создать аккаунт"}
          </button>

          {isForgot && (
            <button
              type="button"
              className="mt-2 w-full text-center text-xs text-slate-500 hover:text-slate-700"
              onClick={() => onModeChange("login")}
            >
              Вернуться к входу
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

