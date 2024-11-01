import { Locale } from "discord.js";
import { languageLogger } from "../handlers/logger.js";
import type {
  LanguageTexts,
  LanguageOptions,
  GetTextResult,
  LanguageCommandTexts,
  GetCommandTextResult,
  LanguageBaseCommandTexts,
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

  public getText<Key extends keyof LanguageTexts | undefined = undefined>(
    key?: Key,
  ): GetTextResult<Key> {
    return (key ? this.texts[key] : this.texts) as GetTextResult<Key>;
  }

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
