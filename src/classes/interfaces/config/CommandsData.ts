import { isBoolean, isString } from "@wyntine/verifier";
import { configLogger } from "../../../handlers/logger.ts";
import type { BaseConfigCommandsData } from "../../../types/files.types.ts";

export class CommandsData {
  constructor(private data: BaseConfigCommandsData | undefined) {}

  public get defaultPrefix(): string {
    const defaultPrefix = this.data?.defaultPrefix;

    if (!isString(defaultPrefix))
      return configLogger.throw("No default prefix provided in config.");

    return defaultPrefix;
  }

  public get registerOnStart(): boolean {
    const registerOnStart = this.data?.registerOnStart ?? true;

    if (!isBoolean(registerOnStart))
      return configLogger.throw(
        "Value of 'commands.registerOnStart' is not valid.",
      );

    return registerOnStart;
  }
}
