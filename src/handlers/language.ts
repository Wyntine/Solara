import { Locale } from "discord.js";
import { readClassDirectory } from "../utils/readClassDirectory.js";
import { languageLogger } from "./logger.js";
import type { GetLanguageReturn } from "../types/files.types.js";
import { config } from "./config.js";
import { Language } from "../classes/language.js";

const languagesDir = "languages";

let languages: Language[] = [];
let defaultLang: Language | undefined = undefined;

export function getLanguages(): Language[] {
  return languages;
}

export function getDefaultLang(): Language {
  return defaultLang ?? languageLogger.throw("No default language available.");
}

export function getLanguage<UseDefault extends boolean = false>(
  locale: Locale | undefined,
  useDefault?: UseDefault,
): GetLanguageReturn<UseDefault> {
  const foundLang =
    locale ?
      languages.find((language) => language.languages.includes(locale))
    : undefined;

  return (foundLang ??
    (useDefault ? getDefaultLang() : (
      undefined
    ))) as GetLanguageReturn<UseDefault>;
}

export async function readLangs(): Promise<Language[]> {
  const languageVerificaton = (
    language: Language,
    loggedPath: string,
  ): boolean => {
    language.setLanguagePath(loggedPath);
    return true;
  };
  return await readClassDirectory(
    Language,
    languagesDir,
    languageLogger,
    languageVerificaton,
  );
}

export async function registerLangs(): Promise<void> {
  const newLanguages = await readLangs();
  validateLangConf(newLanguages);
  languages = newLanguages;
}

function validateLangConf(languages: Language[]): void {
  const duplicateLanguages = languages.filter(
    (language, index) =>
      languages.findIndex(
        (lang, i) =>
          lang.languages.find((l) => language.languages.includes(l)) &&
          i !== index,
      ) !== -1,
  );

  if (duplicateLanguages.length > 0) {
    const loggedLanguages = languages
      .map((language) => language.getLanguagePath())
      .join(", ");

    return languageLogger.throw(
      `Duplicate language configurations (${loggedLanguages}) found.`,
    );
  }

  const defaultLanguageData = config.get().bot.defaultLanguage as Locale;
  const newDefaultLanguage = languages.find((lang) =>
    lang.languages.includes(defaultLanguageData),
  );

  if (!newDefaultLanguage) {
    return languageLogger.throw(
      `Default language "${defaultLanguageData}" not found.`,
    );
  }

  defaultLang = newDefaultLanguage;
}
