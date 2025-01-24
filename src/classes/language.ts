import { languageLogger } from "../handlers/logger.ts";
import { Locale } from "discord.js";
import type {
  GetCommandTextResult,
  GetErrorMessageReturn,
  GetTextResult,
  IsExecutableErrorKeys,
  LanguageBaseCommandTexts,
  LanguageCommandTexts,
  LanguageOptions,
  LanguageTexts,
  PartialIsExecutableErrors,
} from "../types/files.types.ts";
import type { StringMap } from "../types/utils.types.ts";
import { isString } from "@wyntine/verifier";
import { getInnerObjectValue } from "../utils/objects.ts";

export class Language {
  public languages: Locale[];

  private texts: LanguageTexts;
  private commandTexts: StringMap<
    LanguageCommandTexts<LanguageBaseCommandTexts>
  >;
  private errorMessages: PartialIsExecutableErrors;
  private languagePath: string | undefined;

  constructor(options: LanguageOptions<LanguageBaseCommandTexts>) {
    this.languages = options.languages;
    this.texts = options.texts;
    this.commandTexts = options.commandTexts;
    this.errorMessages = options.errorMessages ?? {};
  }

  /**
   * Retrieves text(s) from the language's text collection.
   *
   * @param key - Optional key to retrieve specific text. If omitted, returns all texts
   * @returns If key is provided, returns the text for that key. Otherwise, returns all texts
   *
   * @example
   * // Get specific text
   * const text = language.getText("welcome");
   *
   * @example
   * // Get all texts
   * const allTexts = language.getText();
   */
  public getText<Key extends keyof LanguageTexts | undefined = undefined>(
    key?: Key,
  ): GetTextResult<Key> {
    return (key ? this.texts[key] : this.texts) as GetTextResult<Key>;
  }

  public getErrorMessage<
    Key extends IsExecutableErrorKeys | undefined = undefined,
  >(key?: Key): GetErrorMessageReturn<Key> {
    return (
      key ?
        getInnerObjectValue(this.errorMessages, key)
      : this.errorMessages) as GetErrorMessageReturn<Key>;
  }

  /**
   * Retrieves command text(s) based on the provided key.
   *
   * @param key - Optional key to retrieve specific command text
   * @returns If key is provided, returns the specific command text. Otherwise, returns all command texts.
   */
  public getCommandText<Key extends string | undefined = undefined>(
    key?: Key,
  ): GetCommandTextResult<Key> {
    if (!key) {
      return this.commandTexts as GetCommandTextResult<Key>;
    }

    const texts = this.commandTexts[key];

    if (!texts) {
      return languageLogger.throw(`Command text for "${key}" not found.`);
    }

    return texts as GetCommandTextResult<Key>;
  }

  /**
   * Sets the path where language files are located.
   *
   * @param languagePath - The file system path pointing to language files
   */
  public setLanguagePath(languagePath: string): void {
    this.languagePath = languagePath;
  }

  /**
   * Retrieves the path where language files are stored.
   *
   * @returns The path to language files
   * @throws If language path has not been set
   */
  public getLanguagePath(): string {
    if (!isString(this.languagePath)) {
      return languageLogger.throw("Language path has not been set.");
    }

    return this.languagePath;
  }
}
