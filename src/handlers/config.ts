import { Config } from "../utils/config.js";
import { configVerifier } from "./verifiers.js";
import type { BaseConfigData } from "../types/files.types.js";

export const config = new Config<BaseConfigData>({
  configPath: "./config.yml",
  configVerification: configVerifier,
});
