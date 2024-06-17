import type { OpenAPIV3 as OpenAPI } from "openapi-types";
import { noRef } from "../utils";
import { p, span } from "./element";
import { property, accordion, accordions } from "./custom";

const keys: {
  [T in keyof OpenAPI.SchemaObject]: string;
} = {
  example: "Example",
  default: "Default",
  minimum: "Minimum",
  maximum: "Maximum",
  minLength: "Minimum length",
  maxLength: "Maximum length",
  pattern: "Pattern",
  format: "Format",
};

interface Context {
  /** Allow read only */
  readOnly: boolean;
  /** Allow write only */
  writeOnly: boolean;

  required: boolean;

  /** Parse object */
  parseObject: boolean;
}

function isObject(schema: OpenAPI.SchemaObject): boolean {
  return schema.type === "object" || schema.properties !== undefined;
}

export function schemaElement(
  name: string,
  schema: OpenAPI.SchemaObject,
  { parseObject, ...ctx }: Context
): string {
  if (schema.readOnly && !ctx.readOnly) return "";
  if (schema.writeOnly && !ctx.writeOnly) return "";

  const child: string[] = [];

  function field(key: string, value: string): void {
    child.push(span(`${key}:  \`${value}\``));
  }

  if (isObject(schema) && parseObject) {
    const { additionalProperties, properties } = schema;

    if (additionalProperties) {
      if (additionalProperties === true) {
        child.push(
          property({
            name: "[key: string]",
            type: "any",
          })
        );
      } else {
        child.push(
          schemaElement("[key: string]", noRef(additionalProperties), {
            ...ctx,
            required: false,
            parseObject: false,
          })
        );
      }
    }

    Object.entries(properties ?? {}).forEach(([key, value]) => {
      child.push(
        schemaElement(key, noRef(value), {
          ...ctx,
          required: schema.required?.includes(key) ?? false,
          parseObject: false,
        })
      );
    });

    return child.join("\n\n");
  }

  child.push(p(schema.description));
  for (const [key, value] of Object.entries(keys)) {
    if (key in schema) {
      field(value, JSON.stringify(schema[key as keyof OpenAPI.SchemaObject]));
    }
  }

  if (schema.enum) {
    field(
      "Value in",
      schema.enum.map((value) => JSON.stringify(value)).join(" | ")
    );
  }

  const resolved = resolveObjectType(schema);

  if (resolved && !parseObject) {
    child.push(
      accordions(
        accordion(
          { title: "Object Type" },
          schemaElement(name, resolved, {
            ...ctx,
            parseObject: true,
            required: false,
          })
        )
      )
    );
  }

  return property(
    {
      name,
      type: getSchemaType(schema),
      required: ctx.required,
      deprecated: schema.deprecated,
    },
    ...child
  );
}

function resolveObjectType(
  schema: OpenAPI.SchemaObject
): OpenAPI.SchemaObject | undefined {
  if (isObject(schema)) return schema;

  if (schema.type === "array") {
    return resolveObjectType(noRef(schema.items));
  }
}

function getSchemaType(schema: OpenAPI.SchemaObject): string {
  if (schema.nullable) {
    if (!schema.type) return "null";

    return `${getSchemaType({ ...schema, nullable: false })} | null`;
  }

  if (schema.type === "array")
    return `array of ${getSchemaType(noRef(schema.items))}`;

  if (schema.oneOf)
    return schema.oneOf.map((one) => getSchemaType(noRef(one))).join(" | ");

  if (schema.allOf)
    return schema.allOf.map((one) => getSchemaType(noRef(one))).join(" & ");

  if (schema.anyOf)
    return `Any properties in ${schema.anyOf
      .map((one) => getSchemaType(noRef(one)))
      .join(", ")}`;

  if (schema.type) return schema.type;

  if (isObject(schema)) return "object";

  throw new Error(`Cannot detect object type: ${JSON.stringify(schema)}`);
}
