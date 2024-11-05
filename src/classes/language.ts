import { languageLogger } from "../handlers/logger.js";
import { Locale } from "discord.js";
import type {
  GetCommandTextResult,
  GetTextResult,
  LanguageBaseCommandTexts,
  LanguageCommandTexts,
  LanguageOptions,
  LanguageTexts,
} from "../types/files.types.js";
import type { StringMap } from "../types/utils.types.js";

export class Language {
  public languages: Locale[];

  private texts: LanguageTexts;
  private commandTexts: StringMap<
    LanguageCommandTexts<LanguageBaseCommandTexts>
  >;
  private languagePath: string | undefined;

  constructor(options: LanguageOptions<LanguageBaseCommandTexts>) {
    this.languages = options.languages;
    this.texts = options.texts;
    this.commandTexts = options.commandTexts;
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

  /**
   * Retrieves command text(s) based on the provided key.
   *
   * @param key - Optional key to retrieve specific command text
   * @returns If key is provided, returns the specific command text. Otherwise, returns all command texts.
   */
  public getCommandText<
    Key extends
      | keyof LanguageCommandTexts<LanguageBaseCommandTexts>
      | undefined = undefined,
  >(key?: Key): GetCommandTextResult<Key> {
    return (
      key ?
        this.commandTexts[key]
      : this.commandTexts) as GetCommandTextResult<Key>;
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
    if (typeof this.languagePath !== "string") {
      return languageLogger.throw("Language path has not been set.");
    }

    return this.languagePath;
  }
}
