'use client';

import { Logo } from "../../components/ui/Logo";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const navItemClasses = (id: string) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      activeSection === id
        ? "bg-sky-100 text-sky-800"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <aside className="hidden w-64 border-r border-slate-200 bg-white px-4 py-5 md:flex md:flex-col">
      <div className="mb-8 px-2">
        <Logo align="left" />
      </div>

      <nav className="flex-1 space-y-6 text-sm">
        <div>
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Основное
          </div>
          <button
            className={navItemClasses("dashboard")}
            onClick={() => onSectionChange("dashboard")}
          >
            Главная
          </button>
          <button
            className={navItemClasses("tasks")}
            onClick={() => onSectionChange("tasks")}
          >
            Задачи
          </button>
        </div>

        <div>
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Пользователь
          </div>
          <button
            className={navItemClasses("profile")}
            onClick={() => onSectionChange("profile")}
          >
            Профиль
          </button>
          <button
            className={navItemClasses("settings")}
            onClick={() => onSectionChange("settings")}
          >
            Настройки
          </button>
        </div>
      </nav>

      <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
        © {new Date().getFullYear()} Task Planner
      </div>
    </aside>
  );
}

