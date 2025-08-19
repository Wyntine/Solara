import type { BaseConfigSystemData } from "../../../types/files.types.ts";
import { configLogger } from "../../../handlers/logger.ts";
import { isBoolean } from "@wyntine/verifier";
import { RegisterOnReloadData } from "./system/RegisterOnReloadData.ts";

export class SystemData {
  constructor(private data: BaseConfigSystemData | undefined) {}

  public get hotReload(): boolean {
    const hotReload = this.data?.hotReload ?? false;

    if (!isBoolean(hotReload))
      return configLogger.throw("Value of 'system.hotReload' is not valid.");

    return hotReload;
  }

  public get registerOnReload(): RegisterOnReloadData {
    return new RegisterOnReloadData(this.data?.registerOnReload);
  }
}
