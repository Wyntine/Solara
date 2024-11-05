import lodash from "lodash";
import { config } from "./config.js";
import { isArray, isObject } from "@wyntine/verifier";
import { Language } from "../classes/language.js";
import { languageLogger } from "./logger.js";
import { readClassDirectory } from "../utils/readClassDirectory.js";
import { removeMultipleKeys } from "../utils/objects.js";
import {
  Locale,
  type APIApplicationCommandOptionChoice,
  type LocalizationMap,
} from "discord.js";
import type {
  CompiledLanguageBaseCommandTexts,
  FinalLanguageBaseCommandTexts,
  GetLanguageReturn,
  LanguageBaseCommandTexts,
  LanguageCommandTexts,
  LanguageOptionsOnlyTexts,
  LanguageOptionTextData,
  LanguageSubcommandGroupTexts,
  LanguageSubcommandsOnlyTexts,
  LanguageSubcommandTexts,
} from "../types/files.types.js";
import type { StringMap } from "../types/utils.types.js";

const languagesDir = "languages";

let languages: Language[] = [];
let defaultLang: Language | undefined = undefined;
let commandTextData: StringMap<
  LanguageCommandTexts<FinalLanguageBaseCommandTexts>
> = {};

/**
 * Retrieves the list of available languages.
 *
 * @returns An array of Language objects.
 */
export function getLanguages(): Language[] {
  return languages;
}

/**
 * Retrieves the default language setting.
 *
 * @returns The default language.
 * @throws Will throw an error if no default language is available.
 */
export function getDefaultLang(): Language {
  return defaultLang ?? languageLogger.throw("No default language available.");
}

/**
 * Retrieves the command text associated with the given key.
 *
 * @param key - The key for which to retrieve the command text.
 * @returns The command text corresponding to the provided key.
 */
export function getCommandText(key: string) {
  return commandTextData[key];
}

/**
 * Retrieves the language configuration based on the provided locale.
 *
 * @param locale - The locale to search for in the available languages.
 * @param useDefault - Optional flag to determine if the default language should be returned when the locale is not found.
 * @returns The language configuration corresponding to the provided locale, or the default language if `useDefault` is true and the locale is not found.
 */
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

/**
 * Reads and returns an array of Language objects from the specified directory.
 *
 * @returns A promise that resolves to an array of Language objects.
 */
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

/**
 * Registers new languages by reading, validating, and compiling them.
 *
 * This function performs the following steps:
 * 1. Reads the new languages configuration.
 * 2. Validates the new languages configuration.
 * 3. Updates the global languages variable with the new configuration.
 * 4. Compiles the new languages into command text data.
 *
 * @returns A promise that resolves when the languages have been registered.
 */
export async function registerLangs(): Promise<void> {
  const newLanguages = await readLangs();
  validateLangConf(newLanguages);
  languages = newLanguages;
  commandTextData = compileLangs();
}

/**
 * Compiles language command texts for all available languages.
 *
 * This function retrieves the default language and other available languages,
 * compiles their command texts, and merges them into a single map.
 *
 * @returns A map containing the compiled command texts for all languages.
 */
export function compileLangs(): StringMap<
  LanguageCommandTexts<FinalLanguageBaseCommandTexts>
> {
  const defaultLang = getDefaultLang();
  const otherLangs = getLanguages().filter((lang) => lang !== defaultLang);

  const defaultTexts = compileDefaultLangChoices(defaultLang.getCommandText());
  const otherTexts = otherLangs.map((lang) =>
    compileAllCommandTexts(lang.getCommandText(), lang.languages),
  );

  return otherTexts.reduce(
    (tot, cur) => lodash.merge(tot, cur),
    defaultTexts,
  ) as StringMap<LanguageCommandTexts<FinalLanguageBaseCommandTexts>>;
}

/**
 * Adds command choices for an API application command option.
 *
 * @param choices - A rest parameter of strings representing the choices to be added.
 * @returns An array of objects where each object represents a choice with a name and value.
 */
export function addCommandChoices(
  ...choices: string[]
): APIApplicationCommandOptionChoice<string>[] {
  return choices.map((choice, index) => ({
    name: index.toString(),
    value: choice,
  }));
}

/**
 * Compiles all command texts for the given languages.
 *
 * @param data - A map of language command texts to be compiled.
 * @param langs - An array of locales for which the command texts should be compiled.
 * @returns A map of compiled language command texts.
 *
 * @throws Will throw an error if no command text is found for a given item.
 */
function compileAllCommandTexts(
  data: StringMap<LanguageCommandTexts<LanguageBaseCommandTexts>>,
  langs: Locale[],
): StringMap<LanguageCommandTexts<CompiledLanguageBaseCommandTexts>> {
  const finalData: StringMap<
    LanguageCommandTexts<CompiledLanguageBaseCommandTexts>
  > = {};

  for (const item in data) {
    const value = data[item];

    if (!value) {
      return languageLogger.throw("Unknown error: No command text found.");
    }

    finalData[item] = compileCommandTexts(value, langs);
  }

  return finalData;
}

/**
 * Compiles command texts based on the provided language data and locales.
 *
 * @param data - The language command texts to be compiled.
 * @param langs - An array of locale identifiers.
 * @returns The compiled language command texts.
 */
function compileCommandTexts(
  data: LanguageCommandTexts<LanguageBaseCommandTexts>,
  langs: Locale[],
): LanguageCommandTexts<CompiledLanguageBaseCommandTexts> {
  if ("options" in data && data.options.length) {
    return compileOptionOnlyTexts(data, langs);
  }

  return compileSubcommandsOnlyTexts(data, langs);
}

/**
 * Compiles the language options and their texts for the given data and locales.
 *
 * @param data - The language options and texts to be compiled.
 * @param langs - The list of locales to compile the texts for.
 * @returns The compiled language options and texts.
 */
function compileOptionOnlyTexts(
  data: LanguageOptionsOnlyTexts<LanguageBaseCommandTexts>,
  langs: Locale[],
): LanguageOptionsOnlyTexts<CompiledLanguageBaseCommandTexts> {
  const newData = compileBaseCommandTexts(data, langs);

  const options = newData.options?.map((option) =>
    compileOptionTexts(option, langs),
  );

  return (
    options ?
      { ...newData, options }
    : newData) as LanguageOptionsOnlyTexts<CompiledLanguageBaseCommandTexts>;
}

/**
 * Compiles the texts for subcommands and subcommand groups in multiple languages.
 *
 * @param data - The data containing the texts for subcommands and subcommand groups.
 * @param langs - The list of locales to compile the texts for.
 * @returns The compiled texts for subcommands and subcommand groups.
 */
function compileSubcommandsOnlyTexts(
  data: LanguageSubcommandsOnlyTexts<LanguageBaseCommandTexts>,
  langs: Locale[],
): LanguageSubcommandsOnlyTexts<CompiledLanguageBaseCommandTexts> {
  let newData = compileBaseCommandTexts(data, langs);

  const subcommands = data.subcommands?.map((subcommand) =>
    compileSubcommandTexts(subcommand, langs),
  );

  const subcommandGroups = data.subcommandGroups?.map((subcommandGroup) =>
    compileSubcommandGroupTexts(subcommandGroup, langs),
  );

  if (subcommands)
    newData = {
      ...newData,
      subcommands,
    } as LanguageOptionsOnlyTexts<CompiledLanguageBaseCommandTexts>;
  if (subcommandGroups)
    newData = {
      ...newData,
      subcommandGroups,
    } as LanguageOptionsOnlyTexts<CompiledLanguageBaseCommandTexts>;

  return newData as LanguageOptionsOnlyTexts<CompiledLanguageBaseCommandTexts>;
}

/**
 * Compiles base command texts by removing specified keys and adding localizations.
 *
 * @param data - The base command texts data.
 * @param langs - The array of locales to generate localizations for.
 * @returns An object with the specified keys removed and localizations added.
 */
function compileBaseCommandTexts<Data extends LanguageBaseCommandTexts>(
  data: Data,
  langs: Locale[],
): Omit<Data, "name" | "description"> & CompiledLanguageBaseCommandTexts {
  const newData = removeMultipleKeys(data, ["name", "description"]);

  return {
    ...newData,
    name_localizations: addLocalizations(data.name, langs),
    description_localizations: addLocalizations(data.description, langs),
  };
}

/**
 * Compiles language option texts by adding localizations to the choices.
 *
 * @param data - The language option text data to be compiled.
 * @param langs - An array of locales to be used for localization.
 * @returns The compiled language option text data with localized choices.
 */
function compileOptionTexts(
  data: LanguageOptionTextData<LanguageBaseCommandTexts>,
  langs: Locale[],
): LanguageOptionTextData<CompiledLanguageBaseCommandTexts> {
  const newData = compileBaseCommandTexts(data, langs);

  const choices = newData.choices?.map((choice) => ({
    name_localizations: addLocalizations(choice, langs),
  }));

  return (
    choices ?
      { ...newData, choices }
    : newData) as LanguageOptionTextData<CompiledLanguageBaseCommandTexts>;
}

/**
 * Compiles the subcommand texts for multiple languages.
 *
 * @param data - The subcommand texts to be compiled.
 * @param langs - An array of locales for which the texts should be compiled.
 * @returns The compiled subcommand texts for the specified languages.
 */
function compileSubcommandTexts(
  data: LanguageSubcommandTexts<LanguageBaseCommandTexts>,
  langs: Locale[],
): LanguageSubcommandTexts<CompiledLanguageBaseCommandTexts> {
  const newSubcommand = compileBaseCommandTexts(data, langs);

  const options =
    newSubcommand.options?.map((option) => compileOptionTexts(option, langs)) ??
    [];

  return {
    ...newSubcommand,
    options,
  };
}

/**
 * Compiles the texts for a subcommand group in multiple languages.
 *
 * @param data - The subcommand group texts to be compiled.
 * @param langs - The list of locales to compile the texts for.
 * @returns The compiled subcommand group texts.
 */
function compileSubcommandGroupTexts(
  data: LanguageSubcommandGroupTexts<LanguageBaseCommandTexts>,
  langs: Locale[],
): LanguageSubcommandGroupTexts<CompiledLanguageBaseCommandTexts> {
  const newSubcommandGroup = compileBaseCommandTexts(data, langs);
  const newSubcommands = newSubcommandGroup.subcommands.map((subcommand) =>
    compileSubcommandTexts(subcommand, langs),
  );

  return {
    ...newSubcommandGroup,
    subcommands: newSubcommands,
  };
}

/**
 * Compiles the default language choices from the given input.
 *
 * This function recursively processes the input, transforming arrays and objects
 * to ensure that language choices are properly formatted. If the input is an array,
 * it maps over the elements and applies the transformation. If the input is an object,
 * it processes each key-value pair accordingly.
 *
 * @param input - The input data to be processed.
 * @returns The processed input with default language choices compiled.
 */
function compileDefaultLangChoices<Input>(input: Input): Input {
  if (!isObject(input) && !isArray(input)) {
    if (!isArray(input)) return input;

    return input.map(compileDefaultLangChoices) as Input;
  }

  const output: Partial<Input> = {};

  for (const item in input) {
    const key = item as keyof typeof input;
    const data = input[key];

    if (isObject(data)) {
      output[key] = compileDefaultLangChoices(data);
    } else if (isArray(data)) {
      const result = (
        item === "choices" ?
          data.map((choice) => ({ name: choice as string }))
        : data.map(compileDefaultLangChoices)) as Input[keyof Input];
      output[key] = result;
    } else {
      output[key] = data;
    }
  }

  return output as Input;
}

/**
 * Adds localizations for a given string in multiple languages.
 *
 * @param str - The string to be localized.
 * @param langs - An array of locale identifiers.
 * @returns A map where each key is a locale identifier and the value is the localized string.
 */
function addLocalizations(str: string, langs: Locale[]): LocalizationMap {
  return langs.reduce((total, lang) => ({ ...total, [lang]: str }), {});
}

/**
 * Validates the language configurations provided in the `languages` array.
 *
 * This function checks for duplicate language configurations and ensures that
 * the default language specified in the configuration exists within the provided
 * languages. If any issues are found, appropriate errors are logged.
 *
 * @param languages - An array of `Language` objects to be validated.
 *
 * @throws Will throw an error if duplicate language configurations are found.
 * @throws Will throw an error if the default language is not found in the provided languages.
 */
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
