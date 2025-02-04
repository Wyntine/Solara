import { configLogger } from "../handlers/logger.js";
import { load } from "js-yaml";
import { readFileSync } from "fs";
import { watchFile } from "fs";
import type { ConfigOptions } from "../types/files.types.js";
import type { ObjectVerifier } from "@wyntine/verifier";

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

  /**
   * Retrieves the configuration data.
   *
   * @returns The configuration data.
   * @throws Will throw an error if no configuration data is available.
   */
  public get(): Data {
    if (!this.data) {
      return configLogger.throw("No config data available.");
    }

    return this.data;
  }

  /**
   * Reloads and parses a YAML configuration file.
   *
   * @returns The parsed data from the YAML file, or undefined if an error occurs.
   */
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
