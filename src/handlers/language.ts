import {
  Locale,
  type APIApplicationCommandOptionChoice,
  type LocalizationMap,
} from "discord.js";
import { readClassDirectory } from "../utils/readClassDirectory.js";
import { languageLogger } from "./logger.js";
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
import { config } from "./config.js";
import { Language } from "../classes/language.js";
import type { StringMap } from "../types/utils.types.js";
import { removeMultipleKeys } from "../utils/objects.js";
import lodash from "lodash";
import { isArray, isObject } from "@wyntine/verifier";

const languagesDir = "languages";

let languages: Language[] = [];
let defaultLang: Language | undefined = undefined;
let commandTextData: StringMap<
  LanguageCommandTexts<FinalLanguageBaseCommandTexts>
> = {};

export function getLanguages(): Language[] {
  return languages;
}

export function getDefaultLang(): Language {
  return defaultLang ?? languageLogger.throw("No default language available.");
}

export function getCommandText(key: string) {
  return commandTextData[key];
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
  commandTextData = compileLangs();
}

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

export function addCommandChoices(
  ...choices: string[]
): APIApplicationCommandOptionChoice<string>[] {
  return choices.map((choice, index) => ({
    name: index.toString(),
    value: choice,
  }));
}

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

function compileCommandTexts(
  data: LanguageCommandTexts<LanguageBaseCommandTexts>,
  langs: Locale[],
): LanguageCommandTexts<CompiledLanguageBaseCommandTexts> {
  if ("options" in data && data.options.length) {
    return compileOptionOnlyTexts(data, langs);
  }

  return compileSubcommandsOnlyTexts(data, langs);
}

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

function addLocalizations(str: string, langs: Locale[]): LocalizationMap {
  return langs.reduce((total, lang) => ({ ...total, [lang]: str }), {});
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
