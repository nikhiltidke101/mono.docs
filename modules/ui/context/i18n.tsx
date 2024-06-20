import { createContext, useContext } from "react";

export interface Translations {
  search: string;
  searchNoResult: string;

  toc: string;
  tocNoHeadings: string;

  lastUpdate: string;
  chooseLanguage: string;
  nextPage: string;
  previousPage: string;
  chooseTheme: string;
}

export interface NamedTranslation extends Partial<Translations> {
  /**
   * The name of translation
   */
  name: string;
}

interface I18nContextType {
  locale?: string;
  onChange?: (v: string) => void;
  text: Translations;
  translations?: Record<string, NamedTranslation>;
}

export const I18nContext = createContext<I18nContextType>({
  text: {
    search: "Search",
    searchNoResult: "No results found",
    toc: "On this page",
    tocNoHeadings: "No Headings",
    lastUpdate: "Last updated on",
    chooseLanguage: "Choose a language",
    nextPage: "Next",
    previousPage: "Previous",
    chooseTheme: "Theme",
  },
});

export function useI18n(): I18nContextType {
  return useContext(I18nContext);
}
