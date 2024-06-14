export interface Mode {
  param: string;
  name: string;
  package: string;
  description: string;
}

export const modes: Mode[] = [
  {
    param: "public",
    name: "Public",
    package: "developer-public",
    description: "Public API documentation",
  },
  {
    param: "beta",
    name: "Beta",
    package: "developer-beta",
    description: "Beta API documentation",
  },
];
