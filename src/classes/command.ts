import { SlashCommandBuilder } from "discord.js";
import { commandLogger } from "../handlers/logger.js";
import {
  type MessageCommandOptions,
  type CommandExecuteFunction,
  type CommandOptions,
  CommandType,
  type OptionMap,
} from "../types/files.types.js";
import { createOptionMap } from "../utils/commands.js";
import path from "path";

export class Command<Type extends CommandType = CommandType> {
  public type: Type;
  public optionMap?: OptionMap;
  public slashCommandData?: SlashCommandBuilder;
  public messageCommandData?: MessageCommandOptions;
  public allowedGuilds: string[];
  public excludedGuilds: string[];
  public developerOnly: boolean;
  public cooldown = 0;
  public userPermissions: bigint[];
  public botPermissions: bigint[];
  public enabled: boolean;
  public dmAccess: boolean;
  public guildAccess: boolean;
  public execute: CommandExecuteFunction<Type>;

  private commandPath: string | undefined;
  private commandFileName: string | undefined;
  private commandNames: string[] = [];

  constructor(options: CommandOptions<Type>) {
    this.type = options.type;

    if (options.slashCommandData) {
      this.slashCommandData = (
        typeof options.slashCommandData === "function" ?
          options.slashCommandData(new SlashCommandBuilder())
        : options.slashCommandData) as SlashCommandBuilder;

      // TODO: Complete the option map

      this.optionMap = createOptionMap(this.slashCommandData);
    }

    if (options.messageCommandData)
      this.messageCommandData = options.messageCommandData;

    this.allowedGuilds = options.allowedGuilds ?? [];
    this.excludedGuilds = options.excludedGuilds ?? [];
    this.developerOnly = options.developerOnly ?? false;

    if (options.cooldown) {
      if (options.cooldown < 0)
        commandLogger.throw("Cooldown must be greater than zero.");
      this.cooldown = options.cooldown;
    }

    this.userPermissions = options.userPermissions ?? [];
    this.botPermissions = options.botPermissions ?? [];
    this.enabled = options.enabled ?? true;
    this.dmAccess = options.dmAccess ?? false;
    this.guildAccess = options.guildAccess ?? true;
    this.execute = options.execute;
  }

  //* Public methods

  public listAllNames(): string[] {
    return [
      // TODO: Add this functionality -> ...this.getLanguageDataArray().map((lang) => lang.name),
      ...(this.messageCommandData?.aliases ?? []),
      this.slashCommandData?.name,
    ].filter((text) => typeof text === "string");
  }

  public hasAnyName(...names: string[]): boolean {
    const allNames = this.listAllNames();
    return names.some((name) => allNames.includes(name));
  }

  public getCommandPath(): string {
    if (typeof this.commandPath !== "string") {
      return commandLogger.throw("Command path has not been set.");
    }

    return this.commandPath;
  }

  public getCommandFileName(): string {
    if (typeof this.commandFileName !== "string") {
      return commandLogger.throw("Command file name has not been set.");
    }

    return this.commandFileName;
  }

  public disable(): this {
    this.enabled = false;
    return this;
  }

  public enable(): this {
    this.enabled = true;
    return this;
  }

  public isCombined(): this is Command<CommandType.Combined> {
    return this.type === CommandType.Combined;
  }

  public isSlashOnly(): this is Command<CommandType.Slash> {
    return this.type === CommandType.Slash;
  }

  public isMessageOnly(): this is Command<CommandType.Message> {
    return this.type === CommandType.Message;
  }

  public setCommandPath(commandPath: string): void {
    this.commandPath = commandPath;
    this.commandFileName = path.basename(commandPath, ".ts");
  }
}
