import { isBoolean } from "@wyntine/verifier";
import type { BaseConfigLogsData } from "../../../types/files.types.ts";
import { configLogger } from "../../../handlers/logger.ts";

export class LogsData {
  constructor(private data: BaseConfigLogsData | undefined) {}

  public getWarn(keyName: string): boolean | undefined {
    return this.getFromData("warn", keyName);
  }

  public getError(keyName: string): boolean | undefined {
    return this.getFromData("error", keyName);
  }

  public getDebug(keyName: string): boolean | undefined {
    return this.getFromData("debug", keyName);
  }

  public getInfo(keyName: string): boolean | undefined {
    return this.getFromData("info", keyName);
  }

  private getFromData(
    objectName: keyof BaseConfigLogsData,
    keyName: string,
  ): boolean | undefined {
    const result = this.data?.[objectName][keyName];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!isBoolean(result) && result !== undefined)
      return configLogger.throw("Given log key's result is not valid.");

    return result;
  }
}
