import { Locale } from "discord.js";
import { languageLogger } from "../handlers/logger.js";
import type {
  LanguageTexts,
  LanguageOptions,
  GetTextResult,
} from "../types/files.types.js";

export class Language {
  public languages: Locale[];
  private texts: LanguageTexts;
  private languagePath: string | undefined;

  constructor(options: LanguageOptions) {
    this.languages = options.languages;
    this.texts = options.texts;
  }

  public getText<Key extends keyof LanguageTexts | undefined = undefined>(
    key?: Key,
  ): GetTextResult<Key> {
    return (key ? this.texts[key] : this.texts) as GetTextResult<Key>;
  }

  public setLanguagePath(languagePath: string): void {
    this.languagePath = languagePath;
  }

  public getLanguagePath(): string {
    if (typeof this.languagePath !== "string") {
      return languageLogger.throw("Language path has not been set.");
    }

    return this.languagePath;
  }
}
