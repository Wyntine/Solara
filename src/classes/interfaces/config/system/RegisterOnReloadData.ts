import { isBoolean } from "lodash";
import type { BaseConfigSystemRegisterOnReloadData } from "../../../../types/files.types.ts";
import { configLogger } from "../../../../handlers/logger.ts";

export class RegisterOnReloadData {
  constructor(private data: BaseConfigSystemRegisterOnReloadData | undefined) {}

  public get comamnds(): boolean {
    const comamnds = this.data?.commands ?? false;

    if (!isBoolean(comamnds))
      return configLogger.throw(
        "Value of 'system.registerOnReload.commands' is not valid.",
      );

    return comamnds;
  }

  public get events(): boolean {
    const events = this.data?.events ?? false;

    if (!isBoolean(events))
      return configLogger.throw(
        "Value of 'system.registerOnReload.events' is not valid.",
      );

    return events;
  }
}
