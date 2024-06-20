import { map } from "@/.map";
import { loader } from "@/modules/core/source/loader";
import { InferPageType } from "@/modules/core/source/types";
import { createMDXSource } from "@/modules/mdx/create";
import { defaultSchemas } from "@/modules/mdx/utils/schema";

import { z } from "zod";

export const utilsBeta = loader({
  baseUrl: "/beta",
  rootDir: "beta",
  source: createMDXSource(map, {
    schema: {
      frontmatter: defaultSchemas.frontmatter.extend({
        preview: z.string().optional(),
        toc: z.boolean().default(false),
        index: z.boolean().default(false),
        methods: z
          .array(
            z.object({
              type: z.string(),
              title: z.string(),
              slug: z.string(),
            })
          )
          .optional(),
      }),
    },
  }),
});

export const utilsPublic = loader({
  baseUrl: "/public",
  rootDir: "public",
  source: createMDXSource(map, {
    schema: {
      frontmatter: defaultSchemas.frontmatter.extend({
        preview: z.string().optional(),
        toc: z.boolean().default(false),
        index: z.boolean().default(false),
        methods: z
          .array(
            z.object({
              type: z.string(),
              title: z.string(),
              slug: z.string(),
            })
          )
          .optional(),
      }),
    },
  }),
});

export type PageBeta = InferPageType<typeof utilsBeta>;
export type PagePublic = InferPageType<typeof utilsPublic>;
