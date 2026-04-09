'use client';

import { useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NotificationsPanel } from "./NotificationsPanel";
import { DashboardView } from "../../features/dashboard/DashboardView";
import { TasksView } from "../../features/tasks/TasksView";
import { ProfileView } from "../../features/profile/ProfileView";
import { SettingsView } from "../../features/settings/SettingsView";
import type { AppProfileRole } from "../../types/profile";

// ЭКСПОРТИРУЕМ ТИП ДЛЯ ИСПОЛЬЗОВАНИЯ В page.tsx И ДРУГИХ ФАЙЛАХ
export type AppSection = "dashboard" | "tasks" | "profile" | "settings";

interface AppShellProps {
  user: User;
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
  profileRole: AppProfileRole;
  onSignOut?: () => void;
}

export function AppShell({ 
  user, 
  activeSection, 
  onSectionChange, 
  profileRole,
  onSignOut
}: AppShellProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCreatingFromDashboard, setIsCreatingFromDashboard] = useState(false);

  // Мемоизированные колбэки для оптимизации
  const handleCreateTask = useCallback(() => {
    setIsCreatingFromDashboard(true);
    onSectionChange("tasks");
  }, [onSectionChange]);

  const handleTaskCreated = useCallback(() => {
    setIsCreatingFromDashboard(false);
  }, []);

  const handleOpenNotifications = useCallback(() => {
    setShowNotifications(true);
  }, []);

  const handleCloseNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  // Рендер контента через switch для чистоты кода
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <DashboardView
            user={user}
            onCreateTask={handleCreateTask}
          />
        );
      case "tasks":
        return (
          <TasksView
            user={user}
            isCreatingFromDashboard={isCreatingFromDashboard}
            onTaskCreated={handleTaskCreated}
          />
        );
      case "profile":
        return <ProfileView user={user} profileRole={profileRole} />;
      case "settings":
        return <SettingsView user={user} />;
      default:
        return (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Section not found
          </div>
        );
    }
  };

  return (
    // Семантические классы темы + плавный переход
    <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Боковая панель навигации */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={onSectionChange} 
      />
      
      {/* Основная область контента */}
      <div className="relative flex flex-1 flex-col">
        {/* Верхняя панель с профилем и уведомлениями */}
        <Header
          user={user}
          onOpenNotifications={handleOpenNotifications}
          onSignOut={onSignOut}
        />
        
        {/* Основной контент с анимацией появления */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {renderContent()}
        </main>

        {/* Панель уведомлений с затемнением фона */}
        {showNotifications && (
          <NotificationsPanel
            user={user}
            onClose={handleCloseNotifications}
          />
        )}
      </div>
    </div>
  );
}