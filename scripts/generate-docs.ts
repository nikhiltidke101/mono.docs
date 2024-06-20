import * as OpenAPI from "../modules/openapi/generate-file";

void OpenAPI.generateFiles({
  input: ["./openapi/*.yaml"],
  output: "./content/",
  per: "tag",
  render: (title, description, methods) => {
    return {
      frontmatter: [
        "---",
        `type: openapi`,
        `title: ${title}`,
        `description: ${description}`,
        `methods:\n${methods
          .map(
            (method) =>
              `  - type: ${method.type}\n    title: ${method.title}\n    slug: ${method.slug}`
          )
          .join("\n")}`,
        "toc: false",
        "---",
      ].join("\n"),
    };
  },
});
