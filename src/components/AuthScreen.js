'use client';

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Logo } from "./Logo";

export function AuthScreen({ mode, onModeChange, onAuthenticated }) {
  const isLogin = mode === "login";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supabase) {
      onAuthenticated(null);
      return;
    }

    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString() ?? "";
    const passwordConfirm =
      formData.get("passwordConfirm")?.toString() ?? "";

    try {
      if (!email || !password) {
        throw new Error("Заполните email и пароль.");
      }

      if (!isLogin && password !== passwordConfirm) {
        throw new Error("Пароли не совпадают.");
      }

      if (!isLogin && !name) {
        throw new Error("Заполните имя.");
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthenticated(data.user);
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

        onAuthenticated(data.user);
      }
    } catch (err) {
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
              !isLogin ? "bg-white text-slate-900 shadow-sm" : ""
            }`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
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

          {!isLogin && (
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

          {isLogin ? (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                Запомнить меня
              </label>
              <button
                type="button"
                className="text-sky-600 hover:text-sky-700"
              >
                Забыли пароль?
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              Я принимаю условия использования
            </label>
          )}

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
          >
            {isLoading
              ? "Обработка..."
              : isLogin
              ? "Войти"
              : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </div>
  );
}

