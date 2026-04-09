"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// Типизация пропсов для строгого режима TypeScript
interface ThemeProviderProps {
  children: ReactNode;
}

export default function Provider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey="taskPlannerTheme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}