"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { TreeContextProvider } from "./context/tree";
import Link from "next/link";
import { cn } from "./utils/cn";
import * as PageTree from "@/modules/core/server/page-tree";
import { NavProps } from "./layouts/nav";
import { LinksMenu } from "./layouts/links-menu";
import { DynamicSidebar } from "./components/dynamic-sidebar";
import { Sidebar, SidebarProps } from "./layouts/sidebar";

type ActiveType = "none" | "url" | "nested-url";

export type LinkItemType =
  | {
      type?: "main";
      url: string;
      /**
       * When the item is marked as active
       *
       * @defaultValue 'url'
       */
      active?: ActiveType;
      icon?: ReactNode;
      text: string;
      external?: boolean;
    }
  | {
      type: "menu";
      icon?: ReactNode;
      text: string;
      items: LinkItemType[];
    }
  | {
      type: "secondary";
      url: string;
      /**
       * When the item is marked as active
       *
       * @defaultValue 'url'
       */
      active?: ActiveType;
      icon: ReactNode;
      text: string;
      external?: boolean;
    };

interface NavOptions extends Omit<NavProps, "items"> {
  enabled: boolean;
  component: ReactNode;
}

interface SidebarOptions extends Omit<SidebarProps, "items"> {
  enabled: boolean;
  component: ReactNode;
  collapsible: boolean;
}

export interface BaseLayoutProps {
  /**
   * GitHub url
   */
  githubUrl?: string;

  links?: LinkItemType[];
  /**
   * Replace or disable navbar
   */
  nav?: Partial<NavOptions>;

  children?: ReactNode;
}

export interface DocsLayoutProps extends BaseLayoutProps {
  tree: PageTree.Root;

  sidebar?: Partial<SidebarOptions>;

  containerProps?: HTMLAttributes<HTMLDivElement>;

  /**
   * Enable Language Switch
   *
   * @defaultValue false
   */
  i18n?: boolean;
}
export function DocsLayout({
  nav,
  githubUrl,
  sidebar: {
    enabled: sidebarEnabled = true,
    collapsible = true,
    component: sidebarReplace,
    ...sidebar
  } = {},
  links = [],
  containerProps,
  tree,
  i18n = false,
  children,
}: DocsLayoutProps): React.ReactElement {
  const finalLinks = getLinks(links, githubUrl);
  const Aside = sidebarEnabled && collapsible ? DynamicSidebar : Sidebar;

  return (
    <TreeContextProvider tree={tree}>
      <div
        {...containerProps}
        className={cn("flex flex-1 flex-row", containerProps?.className)}
      >
        <Aside {...sidebar} items={finalLinks} />
        {children}
      </div>
    </TreeContextProvider>
  );
}

function getLinks(links?: LinkItemType[], githubUrl?: string): LinkItemType[] {
  let result = links ?? [];

  if (githubUrl)
    result = [
      ...result,
      {
        type: "secondary",
        url: githubUrl,
        text: "Github",
        icon: (
          <svg role="img" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        ),
        external: true,
      },
    ];

  return result;
}
