'use client';

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Sidebar } from "../../components/layout/Sidebar";
import { Header } from "../../components/layout/Header";
import { NotificationsPanel } from "../../components/layout/NotificationsPanel";
import { DashboardView } from "../../features/dashboard/DashboardView";
import { TasksView } from "../../features/tasks/TasksView";
import { ProfileView } from "../../features/profile/ProfileView";
import { SettingsView } from "../../features/settings/SettingsView";

interface AppShellProps {
  user: User;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AppShell({ user, activeSection, onSectionChange }: AppShellProps) {
  const [openFromDashboard, setOpenFromDashboard] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />
      <div className="relative flex flex-1 flex-col">
        <Header
          user={user}
          onOpenNotifications={() => setShowNotifications(true)}
        />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {activeSection === "dashboard" && (
            <DashboardView
              user={user}
              onCreateTask={() => {
                onSectionChange("tasks");
                setOpenFromDashboard(true);
              }}
            />
          )}
          {activeSection === "tasks" && (
            <TasksView
              user={user}
              openFromDashboard={openFromDashboard}
              onOpenFromDashboardHandled={() => setOpenFromDashboard(false)}
            />
          )}
          {activeSection === "profile" && <ProfileView user={user} />}
          {activeSection === "settings" && <SettingsView />}
        </main>

        {showNotifications && (
          <NotificationsPanel
            user={user}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </div>
    </div>
  );
}

