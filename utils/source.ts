import { map } from "@/.map";
import type { InferPageType } from "fumadocs-core/source";
import { createMDXSource, defaultSchemas } from "fumadocs-mdx";
import { loader } from "fumadocs-core/source";
import { z } from "zod";

export const utils = loader({
  baseUrl: "/",
  rootDir: "",
  source: createMDXSource(map, {
    schema: {
      frontmatter: defaultSchemas.frontmatter.extend({
        preview: z.string().optional(),
        toc: z.boolean().default(true),
        index: z.boolean().default(false),
      }),
    },
  }),
});

export type Page = InferPageType<typeof utils>;
