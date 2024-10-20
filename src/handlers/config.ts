import type { BaseConfigData } from "../types/files.types.js";
import { Config } from "../utils/config.js";
import { configVerifier } from "./verifiers.js";

export const config = new Config<BaseConfigData>({
  configPath: "./config.yml",
  configVerification: configVerifier,
});
