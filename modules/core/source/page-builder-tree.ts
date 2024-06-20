import { ReactElement } from "react";
import * as PageTree from "../server/page-tree";
import { Folder, File, Storage } from "./file-system";
import { FileData, UrlFn } from "./types";
import { resolvePath } from "./path";

interface PageTreeBuilderContext {
  lang?: string;

  storage: Storage;
  builder: PageTreeBuilder;
  options: BuildPageTreeOptions;
}

export interface BuildPageTreeOptions {
  /**
   * Attach the `folder.id` property
   *
   * @defaultValue false
   */
  attachFolderIds?: boolean;

  attachFile?: (node: PageTree.Item, file?: File) => PageTree.Item;
  attachFolder?: (
    node: PageTree.Folder,
    folder: Folder,
    meta?: File
  ) => PageTree.Folder;
  attachSeparator?: (node: PageTree.Separator) => PageTree.Separator;

  storage: Storage;
  getUrl: UrlFn;
  resolveIcon?: (icon: string | undefined) => ReactElement | undefined;
}

export interface PageTreeBuilder {
  build: (options: BuildPageTreeOptions) => PageTree.Root;

  /**
   * Build page tree and fallback to the default language if the localized page doesn't exist
   */
  buildI18n: (
    options: BuildPageTreeOptionsWithI18n
  ) => Record<string, PageTree.Root>;
}

export interface BuildPageTreeOptionsWithI18n extends BuildPageTreeOptions {
  languages?: string[];
}

const link = /^\[(?<text>.+)]\((?<url>.+)\)$/;
const separator = /^---(?<name>.*?)---$/;
const rest = "...";
const extractor = /^\.\.\.(?<name>.+)$/;

/**
 * @param nodes - All nodes to be built
 * @param ctx - Context
 * @param skipIndex - Skip index
 * @returns Nodes with specified locale in context (sorted)
 */
function buildAll(
  nodes: (Folder | File)[],
  ctx: PageTreeBuilderContext,
  skipIndex: boolean
): PageTree.Node[] {
  const output: PageTree.Node[] = [];

  for (const node of [...nodes].sort((a, b) =>
    a.file.name.localeCompare(b.file.name)
  )) {
    if ("data" in node && node.format === "page" && !node.file.locale) {
      const nodeData = node.data.data as any;

      if ("methods" in nodeData) {
        const treeNode = buildAPIFolderNode(node, ctx);
        output.push(treeNode);
        continue;
      }

      const treeNode = buildFileNode(node, ctx);

      if (node.file.name === "index") {
        if (!skipIndex) output.unshift(treeNode);
        continue;
      }

      output.push(treeNode);
    }

    if ("children" in node) {
      output.push(buildFolderNode(node, false, ctx));
    }
  }

  // console.log("output", output);

  return output;
}

function resolveFolderItem(
  folder: Folder,
  item: string,
  ctx: PageTreeBuilderContext,
  addedNodePaths: Set<string>
): PageTree.Node[] | "..." {
  if (item === rest) return "...";

  const separateResult = separator.exec(item);
  if (separateResult?.groups) {
    const node: PageTree.Separator = {
      type: "separator",
      name: separateResult.groups.name,
    };

    return [ctx.options.attachSeparator?.(node) ?? node];
  }

  const linkResult = link.exec(item);
  if (linkResult?.groups) {
    const { url, text } = linkResult.groups;
    const isRelative =
      url.startsWith("/") || url.startsWith("#") || url.startsWith(".");

    const node: PageTree.Item = {
      type: "page",
      name: text,
      url,
      external: !isRelative,
    };

    return [ctx.options.attachFile?.(node) ?? node];
  }

  const extractResult = extractor.exec(item);

  const path = resolvePath(
    folder.file.path,
    extractResult?.groups?.name ?? item
  );
  const itemNode = ctx.storage.readDir(path) ?? ctx.storage.read(path, "page");

  if (!itemNode) return [];

  addedNodePaths.add(itemNode.file.path);

  if ("children" in itemNode) {
    const node = buildFolderNode(itemNode, false, ctx);

    return extractResult ? node.children : [node];
  }

  return [buildFileNode(itemNode, ctx)];
}

function buildAPIFolderNode(
  file: File,
  ctx: PageTreeBuilderContext
): PageTree.OpenAPIFolder {
  const localized =
    findLocalizedFile(file.file.flattenedPath, "page", ctx) ?? file;
  const data = localized.data as FileData["file"];

  const index = buildFileNode(file, ctx);

  const methods: PageTree.APIHref[] =
    data.data.methods?.map(
      (method: { title: string; slug: string; type: string }) => {
        return {
          type: "href",
          method: method.type,
          name: method.title,
          url: `${ctx.options.getUrl(data.slugs, ctx.lang)}#${method.slug}`,
          slug: method.slug,
        };
      }
    ) ?? [];

  const node: PageTree.OpenAPIFolder = {
    index,
    type: "openapi_folder",
    name: data.data.title,
    children: methods,
    url: ctx.options.getUrl(data.slugs, ctx.lang),
    defaultOpen: false,
  };

  return node;
}

function buildFolderNode(
  folder: Folder,
  defaultIsRoot: boolean,
  ctx: PageTreeBuilderContext
): PageTree.Folder {
  const metaPath = resolvePath(folder.file.path, "meta");

  let meta = ctx.storage.read(metaPath, "meta");
  meta = findLocalizedFile(metaPath, "meta", ctx) ?? meta;
  const indexFile = ctx.storage.read(
    resolvePath(folder.file.flattenedPath, "index"),
    "page"
  );

  const metadata = meta?.data.data as FileData["meta"]["data"] | undefined;
  const index = indexFile ? buildFileNode(indexFile, ctx) : undefined;

  let children: PageTree.Node[];

  if (!meta) {
    children = buildAll(folder.children, ctx, !defaultIsRoot);
  } else {
    const isRoot = metadata?.root ?? defaultIsRoot;
    const addedNodePaths = new Set<string>();

    const resolved = metadata?.pages?.flatMap<PageTree.Node | "...">((item) => {
      return resolveFolderItem(folder, item, ctx, addedNodePaths);
    });

    const restNodes = buildAll(
      folder.children.filter((node) => !addedNodePaths.has(node.file.path)),
      ctx,
      !isRoot
    );

    // console.log("restNodes", restNodes[0]);

    const nodes = resolved?.flatMap<PageTree.Node>((item) => {
      if (item === "...") {
        return restNodes;
      }

      return item;
    });

    children = nodes ?? restNodes;
  }

  const node: PageTree.Folder = {
    type: "folder",
    name: metadata?.title ?? index?.name ?? pathToName(folder.file.name),
    icon: ctx.options.resolveIcon?.(metadata?.icon),
    root: metadata?.root,
    defaultOpen: metadata?.defaultOpen,
    index,
    children,
  };

  if (ctx.options.attachFolderIds) {
    node.id = folder.file.flattenedPath;
  }

  return removeUndefined(
    ctx.options.attachFolder?.(node, folder, meta) ?? node
  );
}

function buildFileNode(file: File, ctx: PageTreeBuilderContext): PageTree.Item {
  const localized =
    findLocalizedFile(file.file.flattenedPath, "page", ctx) ?? file;
  const data = localized.data as FileData["file"];

  const item: PageTree.Item = {
    type: "page",
    name: data.data.title,
    icon: ctx.options.resolveIcon?.(data.data.icon),
    url: ctx.options.getUrl(data.slugs, ctx.lang),
  };

  return removeUndefined(ctx.options.attachFile?.(item, file) ?? item);
}

function build(ctx: PageTreeBuilderContext): PageTree.Root {
  const root = ctx.storage.root();
  const folder = buildFolderNode(root, true, ctx);

  return {
    name: folder.name,
    children: folder.children,
  };
}

export function createPageTreeBuilder(): PageTreeBuilder {
  return {
    build(options) {
      return build({
        options,
        builder: this,
        storage: options.storage,
      });
    },
    buildI18n({ languages = [], ...options }) {
      const entries = languages.map<[string, PageTree.Root]>((lang) => {
        const tree = build({
          lang,
          options,
          builder: this,
          storage: options.storage,
        });

        return [lang, tree];
      });

      return Object.fromEntries(entries);
    },
  };
}

function findLocalizedFile(
  path: string,
  format: "meta" | "page",
  ctx: PageTreeBuilderContext
): File | undefined {
  if (!ctx.lang) return;

  return ctx.storage.read(`${path}.${ctx.lang}`, format);
}

function pathToName(path: string): string {
  return path.slice(0, 1).toUpperCase() + path.slice(1);
}

function removeUndefined<T extends object>(value: T): T {
  const obj = value as Record<string, unknown>;
  Object.keys(obj).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Remove undefined values
    if (obj[key] === undefined) delete obj[key];
  });

  return value;
}
