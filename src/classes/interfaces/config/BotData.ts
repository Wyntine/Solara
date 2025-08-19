import { isArray, isString } from "@wyntine/verifier";
import { configLogger } from "../../../handlers/logger.ts";
import type { BaseConfigBotData } from "../../../types/files.types.ts";
import { Locale } from "discord.js";

const allLocales: string[] = Object.values(Locale);

export class BotData {
  constructor(private data: BaseConfigBotData | undefined) {}

  public get token(): string {
    const token = this.data?.token;

    if (!isString(token))
      return configLogger.throw("No token provided in config.");

    return token;
  }

  public get defaultLanguage(): Locale {
    const language = this.data?.defaultLanguage;

    if (!isString(language))
      return configLogger.throw("No language provided in config.");

    if (!allLocales.includes(language))
      return configLogger.throw("Given language is not available.");

    return language as Locale;
  }

  public get developers(): string[] {
    const developers = this.data?.developers ?? [];

    if (!isArray(developers) || !developers.length)
      return configLogger.throw("No developer id provided in config.");

    if (developers.find<string>((dev) => typeof dev !== "string"))
      return configLogger.throw("Some developer id data is not correct.");

    return developers;
  }
}
