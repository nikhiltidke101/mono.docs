import "./global.css";

import type { ReactNode } from "react";

import { DocsLayout } from "fumadocs-ui/layout";
import { RootToggle } from "fumadocs-ui/components/layout/root-toggle";
import { RootProvider } from "fumadocs-ui/provider";

import { utils } from "../utils/source";

import { Inter } from "next/font/google";
import { modes } from "@/utils/modes";

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <RootProvider>
          <DocsLayout
            tree={utils.pageTree}
            nav={{
              enabled: false,
            }}
            sidebar={{
              defaultOpenLevel: 1,
              banner: (
                <RootToggle
                  options={modes.map((mode) => ({
                    url: `/${mode.param}`,
                    icon: null,
                    // <mode.icon
                    //   className="size-9 shrink-0 rounded-md bg-gradient-to-t from-background/80 p-1.5"
                    //   style={{
                    //     backgroundColor: `hsl(var(--${mode.param}-color)/.3)`,
                    //     color: `hsl(var(--${mode.param}-color))`,
                    //   }}
                    // />
                    title: mode.name,
                    description: mode.description,
                  }))}
                />
              ),
            }}
          >
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
