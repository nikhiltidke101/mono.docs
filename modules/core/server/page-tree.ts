import type { ReactElement, ReactNode } from "react";

export interface Root {
  name: ReactNode;
  children: Node[];
}

export type Node = Item | Separator | Folder | OpenAPIFolder | APIHref;

export interface APIHref {
  type: "href";
  name: ReactNode;
  url: string;
  method: string;
  /*
   * The anchor slug of the method
   */
  slug: string;
}

export interface Item {
  type: "page";
  name: ReactNode;
  url: string;
  external?: boolean;
  icon?: ReactElement;
}

export interface Separator {
  type: "separator";
  name: ReactNode;
}

export interface OpenAPIFolder {
  /**
   * Optional id to be attached to api file folders
   */
  url: string;
  id?: string;
  index?: Item;
  type: "openapi_folder";
  name: ReactNode;
  children: Node[];
  defaultOpen?: boolean;
}

export interface Folder {
  /**
   * Optional id to be attached to folders
   */
  id?: string;

  type: "folder";
  name: ReactNode;
  root?: boolean;
  defaultOpen?: boolean;
  index?: Item;
  icon?: ReactElement;
  children: Node[];
}
