import { isNumber } from "@wyntine/verifier";
import { commandLogger } from "../handlers/logger.js";
import type {
  CommandOptionsData,
  CommandOptionsDataWithoutType,
} from "../types/files.types.js";
import { OptionTypes } from "../types/utils.types.js";

export class Option<Type extends OptionTypes = OptionTypes> {
  private settings: CommandOptionsData<Type>;
  private index?: number;

  constructor(settings: CommandOptionsData<Type>) {
    this.settings = settings;
  }

  public setIndex(index: number): this {
    if (isNumber(this.index)) {
      return commandLogger.throw("This option already has an index.");
    }

    this.index = index;
    return this;
  }

  public getIndex(): number {
    if (!isNumber(this.index)) {
      return commandLogger.throw("Index for this option is not set.");
    }

    return this.index;
  }

  public getSettings(): CommandOptionsData<Type> {
    return this.settings;
  }

  public static createStringOption(
    settings?: CommandOptionsDataWithoutType<OptionTypes.String>,
  ): Option<OptionTypes.String> {
    return new Option({ ...settings, type: OptionTypes.String });
  }

  public static createBooleanOption(
    settings?: CommandOptionsDataWithoutType<OptionTypes.Boolean>,
  ): Option<OptionTypes.Boolean> {
    return new Option({ ...settings, type: OptionTypes.Boolean });
  }

  public static createNumberOption(
    settings?: CommandOptionsDataWithoutType<OptionTypes.Number>,
  ): Option<OptionTypes.Number> {
    return new Option({ ...settings, type: OptionTypes.Number });
  }

  public static createIntegerOption(
    settings?: CommandOptionsDataWithoutType<OptionTypes.Integer>,
  ): Option<OptionTypes.Integer> {
    return new Option({ ...settings, type: OptionTypes.Integer });
  }

  public static createChannelOption(
    settings?: CommandOptionsDataWithoutType<OptionTypes.Channel>,
  ): Option<OptionTypes.Channel> {
    return new Option({ ...settings, type: OptionTypes.Channel });
  }

  public static createUserOption(
    settings?: CommandOptionsDataWithoutType<OptionTypes.User>,
  ): Option<OptionTypes.User> {
    return new Option({ ...settings, type: OptionTypes.User });
  }

  public static createRoleOption(
    settings?: CommandOptionsDataWithoutType<OptionTypes.Role>,
  ): Option<OptionTypes.Role> {
    return new Option({ ...settings, type: OptionTypes.Role });
  }

  public static createMemberOption(
    settings?: CommandOptionsDataWithoutType<OptionTypes.Member>,
  ): Option<OptionTypes.Member> {
    return new Option({ ...settings, type: OptionTypes.Member });
  }

  public static createMentionableOption(
    settings?: CommandOptionsDataWithoutType<OptionTypes.Mentionable>,
  ): Option<OptionTypes.Mentionable> {
    return new Option({ ...settings, type: OptionTypes.Mentionable });
  }
}
