import Parser from "@apidevtools/json-schema-ref-parser";
import type { OpenAPIV3 as OpenAPI } from "openapi-types";
import { root } from "./render/custom";
import { renderOperation } from "./render/operation";
import { slug } from "./slug";

export async function dereference(
  pathOrDocument: string | OpenAPI.Document
): Promise<OpenAPI.Document> {
  return await Parser.dereference(pathOrDocument);
}

export interface RouteInformation {
  path: string;
  summary?: string;
  description?: string;
  methods: MethodInformation[];
}

export interface MethodInformation extends OpenAPI.OperationObject {
  parameters: OpenAPI.ParameterObject[];
  method: string;
}

export interface GenerateOptions {
  tag?: string;

  /**
   * The import path of your API components, it must exports all components in `fumadocs-ui/components/api`
   *
   * @defaultValue `fumadocs-ui/components/api`
   */
  componentsImportPath?: string;

  render?: (
    title: string | undefined,
    description: string | undefined,
    methods: {
      type: string;
      title: string | undefined;
      slug: string;
    }[],
    content: string
  ) => Partial<RenderResult>;
}

interface RenderResult {
  frontmatter: string;
  imports: string[];
  content: string;
}

export async function generate(
  pathOrDocument: string | OpenAPI.Document,
  options: GenerateOptions = {}
): Promise<string> {
  const document = await dereference(pathOrDocument);
  const tag = options.tag
    ? document.tags?.find((item) => item.name === options.tag)
    : undefined;

  const routes = Object.entries(document.paths).map<RouteInformation>(
    ([key, value]) => {
      if (!value) throw new Error("Invalid schema");

      const methodKeys = [
        "get",
        "post",
        "patch",
        "delete",
        "head",
        "put",
      ] as const;
      const methods: MethodInformation[] = [];

      for (const methodKey of methodKeys) {
        const operation = value[methodKey];
        if (!operation) continue;
        if (tag && !operation.tags?.includes(tag.name)) continue;

        methods.push(buildOperation(methodKey, operation));
      }

      return {
        ...value,
        path: key,
        methods,
      };
    }
  );

  const serverUrl = document.servers?.[0].url;
  const s: string[] = [];
  const methods = [];

  for (const route of routes) {
    for (const method of route.methods) {
      const title = method.operationId
        ?.split("-")
        .filter((item) => !method.tags?.includes(item))
        .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
        .join(" ");

      methods.push({
        type: method.method,
        title,
        slug: method.operationId ?? "",
      });
      s.push(await renderOperation(route.path, method, serverUrl));
    }
  }

  return render(
    tag?.name ?? document.info.title,
    tag?.description ?? document.info.description,
    methods,
    root(...s),
    options
  );
}

export async function generateTags(
  pathOrDocument: string | OpenAPI.Document,
  options: Omit<GenerateOptions, "tag"> = {}
): Promise<{ tag: string; content: string }[]> {
  const document = await dereference(pathOrDocument);

  const results = document.tags?.map(async (tag) => {
    return {
      tag: tag.name,
      content: await generate(document, {
        tag: tag.name,
        ...options,
      }),
    };
  });

  return Promise.all(results ?? []);
}

function render(
  title: string | undefined,
  description: string | undefined,
  methods: {
    type: string;
    title: string | undefined;
    slug: string;
  }[],
  content: string,
  {
    render: fn,
    componentsImportPath = "fumadocs-ui/components/api",
  }: GenerateOptions
): string {
  const result = fn?.(title, description, methods, content) ?? {};

  const rendered: RenderResult = {
    frontmatter:
      result.frontmatter ??
      [
        "---",
        title && `title: ${title}`,
        description &&
          `description: |\n  ${description.split("\n").join("\n  ")}\n`,
        methods.length > 0 &&
          `methods:\n${methods
            .map(
              (method) =>
                `  - type: ${method.type}\n    title: ${method.title}\n    slug: ${method.slug}`
            )
            .join("\n")}`,
        "---",
      ]
        .filter(Boolean)
        .join("\n"),
    imports: result.imports ?? [
      `import { Root, API, APIInfo, APIExample, Property } from '${componentsImportPath}'`,
      `import { Tabs, Tab } from 'fumadocs-ui/components/tabs'`,
      `import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';`,
    ],
    content: result.content ?? content,
  };

  return [rendered.frontmatter, rendered.imports.join("\n"), rendered.content]
    .filter(Boolean)
    .join("\n\n");
}

function buildOperation(
  method: string,
  operation: OpenAPI.OperationObject
): MethodInformation {
  return {
    ...operation,
    parameters: (operation.parameters ?? []) as OpenAPI.ParameterObject[],
    method: method.toUpperCase(),
  };
}
