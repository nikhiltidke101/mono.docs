"use client";
import Link from "fumadocs-core/link";
import { type ReactNode, useEffect, useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/modules/ui/utils/cn";
import type { LinkItemType } from "@/modules/ui/layout";
import { LinksMenu } from "@/modules/ui/layouts/links-menu";
import { LinkItem } from "./link-item";

export interface NavProps {
  title?: ReactNode;

  /**
   * Redirect url of title
   * @defaultValue '/'
   */
  url?: string;

  /**
   * Show/hide search toggle
   *
   * Note: Enable/disable search from root provider instead
   */
  enableSearch?: boolean;

  /**
   * When to use transparent navbar
   * @defaultValue none
   */
  transparentMode?: "always" | "top" | "none";
  children?: ReactNode;
}

export function Nav({
  title = "My App",
  url = "/",
  items,
  transparentMode = "none",
  enableSearch = true,
  children,
}: NavProps & { items: LinkItemType[] }): React.ReactElement {
  const [transparent, setTransparent] = useState(transparentMode !== "none");

  useEffect(() => {
    if (transparentMode !== "top") return;

    const listener = (): void => {
      setTransparent(window.scrollY < 10);
    };

    listener();
    window.addEventListener("scroll", listener);
    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [transparentMode]);

  return (
    <header
      id="nd-nav"
      className={cn(
        "sticky top-0 z-50 h-16 border-b transition-colors",
        transparent
          ? "border-transparent"
          : "border-foreground/10 bg-background/80 backdrop-blur-md"
      )}
    >
      <nav className="mx-auto flex size-full max-w-container flex-row items-center gap-6 px-4">
        <Link
          href={url}
          className="inline-flex items-center gap-2.5 font-semibold"
        >
          {title}
        </Link>
        {children}
        {items
          .filter((item) => item.type !== "secondary")
          .map((item, i) => (
            <LinkItem
              key={i}
              item={item}
              className="-mx-2 text-sm max-lg:hidden"
            />
          ))}
        <div className="flex flex-1 flex-row items-center justify-end md:gap-2">
          <LinksMenu items={items} className="lg:hidden">
            <MoreVertical />
          </LinksMenu>
          {items
            .filter((item) => item.type === "secondary")
            .map((item, i) => (
              <LinkItem key={i} item={item} className="max-lg:hidden" />
            ))}
        </div>
      </nav>
    </header>
  );
}
