'use client';

import { useLanguage } from "../../lib/i18n";
import { Logo } from "../ui/Logo";
import type { AppSection } from "./AppShell";

interface SidebarProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
}

// Данные навигации — иконки удалены
const NAV_ITEMS = [
  {
    section: "main" as const,
    label: "nav.mainSection",
    items: [
      { id: "dashboard" as AppSection, label: "nav.dashboard" },
      { id: "tasks" as AppSection, label: "nav.tasks" },
    ],
  },
  {
    section: "user" as const,
    label: "nav.userSection",
    items: [
      { id: "profile" as AppSection, label: "nav.profile" },
      { id: "settings" as AppSection, label: "nav.settings" },
    ],
  },
] as const;

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { t } = useLanguage();

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 md:flex md:flex-col dark:border-slate-700 dark:bg-slate-950">
      <div className="mb-8 px-2">
        <Logo align="left" />
      </div>

      <nav className="flex-1 space-y-6 text-sm" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            {/* Заголовок группы */}
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              {t(group.label)}
            </div>
            
            {/* Элементы группы */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    // Убран gap-3, так как иконки больше нет
                    className={`
                      flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                      ${
                        isActive
                          ? "bg-[#DFF2FE] text-[#0F6A91] dark:bg-sky-600 dark:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    {/* Текст пункта меню — без иконки */}
                    {t(item.label)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Футер */}
      <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-white">
        © {new Date().getFullYear()} Task Planner
      </div>
    </aside>
  );
}