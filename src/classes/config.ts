import { readFileSync, watchFile } from "fs";
import { configVerifier } from "../handlers/verifiers.ts";
import type { BaseConfigData } from "../types/files.types.ts";
import { load } from "js-yaml";
import type { ObjectVerifier } from "@wyntine/verifier";
import { configLogger } from "../handlers/logger.ts";
import { BotData } from "./interfaces/config/BotData.ts";
import { CommandsData } from "./interfaces/config/CommandsData.ts";
import { LogsData } from "./interfaces/config/LogsData.ts";
import { SystemData } from "./interfaces/config/SystemData.ts";

export class Config {
  private path = "./config.yml";
  private verification: ObjectVerifier = configVerifier;
  private data: BaseConfigData | undefined;

  constructor() {
    this.data = this.reloadYaml();

    watchFile(this.path, () => {
      const data = this.reloadYaml();

      if (!data) return;

      this.data = data;
    });
  }

  public get system(): SystemData {
    return new SystemData(this.data?.system);
  }

  public get bot(): BotData {
    return new BotData(this.data?.bot);
  }

  public get commands(): CommandsData {
    return new CommandsData(this.data?.commands);
  }

  public get logs(): LogsData {
    return new LogsData(this.data?.logs);
  }

  private reloadYaml(): BaseConfigData | undefined {
    try {
      const fileData = readFileSync(this.path, "utf-8");
      const yamlData: unknown = load(fileData);
      this.verification.verifyFailOnError(yamlData);
      return yamlData as BaseConfigData;
    } catch (error) {
      configLogger.error(`Config error from ${this.path}:`, error);
      return;
    }
  }
}
