import { Config } from "../utils/config.ts";
import { configVerifier } from "./verifiers.ts";
import type { BaseConfigData } from "../types/files.types.ts";

export const config = new Config<BaseConfigData>({
  configPath: "./config.yml",
  configVerification: configVerifier,
});
