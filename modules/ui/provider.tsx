"use client";

import { ThemeProvider } from "next-themes";
import { type ReactNode } from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import type { ThemeProviderProps } from "next-themes/dist/types";
import { SidebarProvider } from "@/modules/ui/context/sidebar";

export interface RootProviderProps {
  /**
   * `dir` option for Radix UI
   */
  dir?: "rtl" | "ltr";

  /**
   * Customise options of `next-themes`
   */
  theme?: Partial<ThemeProviderProps> & {
    /**
     * Enable `next-themes`
     *
     * @defaultValue true
     */
    enabled?: boolean;
  };

  children: ReactNode;
}

export function RootProvider({
  children,
  dir,
  theme: { enabled = true, ...theme } = {},
}: RootProviderProps): React.ReactElement {
  let body = children;

  if (enabled)
    body = (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        {...theme}
      >
        {body}
      </ThemeProvider>
    );

  return (
    <DirectionProvider dir={dir ?? "ltr"}>
      <SidebarProvider>{body}</SidebarProvider>
    </DirectionProvider>
  );
}

export { useSidebar } from "./context/sidebar";
export { useTreeContext } from "./context/tree";
