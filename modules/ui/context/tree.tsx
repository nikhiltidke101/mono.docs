import * as PageTree from "@/modules/core/server/page-tree";
import { usePathname } from "next/navigation";
import { createContext, useContext, type ReactNode, useMemo } from "react";
import { hasActive } from "@/modules/ui/utils/shared";

interface TreeContextType {
  tree: PageTree.Root;
  navigation: (PageTree.Item | PageTree.OpenAPIFolder)[];
  root: PageTree.Root | PageTree.Folder;
}

const TreeContext = createContext<TreeContextType | undefined>(undefined);

function findRoot(
  items: PageTree.Node[],
  pathname: string
): PageTree.Folder | undefined {
  for (const item of items) {
    if (item.type === "folder") {
      const root = findRoot(item.children, pathname);

      if (root) return root;
      if (item.root === true && hasActive(item.children, pathname)) {
        return item;
      }
    }
  }
}

function getNavigationList(
  tree: PageTree.Node[]
): (PageTree.Item | PageTree.OpenAPIFolder)[] {
  return tree.flatMap((node) => {
    if (node.type === "separator") return [];
    if (node.type === "href") return [];
    if (node.type === "openapi_folder") return [];
    if (node.type === "folder") {
      const children = getNavigationList(node.children);

      if (!node.root && node.index) children.unshift(node.index);
      return children;
    }

    // Only non-external links will be shown in the navigation list
    return !node.external ? [node] : [];
  });
}

export function TreeContextProvider({
  children,
  tree,
}: {
  tree: PageTree.Root;
  children: ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const value = useMemo<TreeContextType>(() => {
    const root = findRoot(tree.children, pathname) ?? tree;
    const navigation = getNavigationList(root.children);

    return {
      root,
      navigation,
      tree,
    };
  }, [pathname, tree]);

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
}

export function useTreeContext(): TreeContextType {
  const ctx = useContext(TreeContext);

  if (!ctx)
    throw new Error("You must wrap this component under <DocsLayout />");
  return ctx;
}
