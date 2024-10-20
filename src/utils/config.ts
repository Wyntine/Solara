import type { ObjectVerifier } from "@wyntine/verifier";
import { readFileSync } from "fs";
import { load } from "js-yaml";
import { configLogger } from "../handlers/logger.js";
import { watchFile } from "fs";
import type { ConfigOptions } from "../types/files.types.js";

export class Config<Data> {
  private path: string;
  private verification: ObjectVerifier;
  private data: Data | undefined;

  constructor(options: ConfigOptions) {
    this.path = options.configPath;
    this.verification = options.configVerification;
    this.data = this.reloadYaml();

    watchFile(this.path, () => {
      const data = this.reloadYaml();

      if (!data) return;

      this.data = data;
    });
  }

  public get(): Data {
    if (!this.data) {
      return configLogger.throw("No config data available.");
    }

    return this.data;
  }

  private reloadYaml(): Data | undefined {
    try {
      const fileData = readFileSync(this.path, "utf-8");
      const yamlData: unknown = load(fileData);
      this.verification.verifyFailOnError(yamlData);
      return yamlData as Data;
    } catch (error) {
      configLogger.error(`Config error from ${this.path}:`, error);
      return;
    }
  }
}
