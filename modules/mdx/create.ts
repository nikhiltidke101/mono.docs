import type { z } from "zod";
import { defaultSchemas } from "./utils/schema";
import { Source } from "../core/source/loader";
import { MDXPageData, SourceFile } from "./types";
import { resolveFiles } from "./resolve-files";

interface SourceOptions<Frontmatter, Meta> {
  schema?: {
    frontmatter?: Frontmatter;
    meta?: Meta;
  };
}

interface LoadOptions<Frontmatter, Meta>
  extends SourceOptions<Frontmatter, Meta> {
  rootDir?: string;
}

type DefaultFrontmatter = (typeof defaultSchemas)["frontmatter"];
type DefaultMeta = (typeof defaultSchemas)["meta"];

export function createMDXSource<
  Frontmatter extends DefaultFrontmatter = DefaultFrontmatter,
  Meta extends DefaultMeta = DefaultMeta,
>(
  map: Record<string, unknown>,
  options?: SourceOptions<Frontmatter, Meta>
): Source<{
  metaData: z.infer<Meta>;
  pageData: MDXPageData<z.infer<Frontmatter>>;
}> {
  return {
    files: (rootDir) => loadMDXSource(map, { ...options, rootDir }),
  };
}

export function loadMDXSource<
  Frontmatter extends DefaultFrontmatter = DefaultFrontmatter,
  Meta extends DefaultMeta = DefaultMeta,
>(
  map: Record<string, unknown>,
  options?: LoadOptions<Frontmatter, Meta>
): SourceFile<z.infer<Meta>, z.infer<Frontmatter>>[] {
  return resolveFiles({
    map,
    ...options,
  }) as ReturnType<typeof loadMDXSource>;
}
