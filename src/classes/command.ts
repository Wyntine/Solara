import { Locale, SlashCommandBuilder, type LocalizationMap } from "discord.js";
import { commandLogger } from "../handlers/logger.js";
import {
  type MessageCommandOptions,
  type CommandExecuteFunction,
  type CommandOptions,
  CommandType,
  type OptionMap,
  type LanguageCommandTexts,
  type FinalLanguageBaseCommandTexts,
} from "../types/files.types.js";
import { createOptionMap } from "../utils/commands.js";
import path from "path";
import { getCommandText } from "../handlers/language.js";
import { compileSlashCommand } from "../handlers/command.js";

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
  private commandNames: [Locale, string][] = [];
  private defaultName: string | undefined;
  private commandTexts:
    | LanguageCommandTexts<FinalLanguageBaseCommandTexts>
    | undefined;

  constructor(options: CommandOptions<Type>) {
    this.type = options.type;

    if (options.slashCommandData) {
      this.slashCommandData = (
        typeof options.slashCommandData === "function" ?
          options.slashCommandData(new SlashCommandBuilder())
        : options.slashCommandData) as SlashCommandBuilder;
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

  public setCommandTexts(
    texts: LanguageCommandTexts<FinalLanguageBaseCommandTexts>,
  ): void {
    this.commandTexts = texts;
  }

  public reloadOptionMap(): void {
    const slashData = this.slashCommandData;

    if (slashData) this.optionMap = createOptionMap(slashData);
  }

  public getCommandTexts(): LanguageCommandTexts<FinalLanguageBaseCommandTexts> {
    const texts = this.commandTexts;

    if (!texts) {
      return commandLogger.throw("No command texts found.");
    }

    return texts;
  }

  public compileLangData(): void {
    const commandName = this.getCommandFileName();
    const commandTexts = getCommandText(commandName);

    if (!commandTexts) {
      return commandLogger.throw(
        `Empty command text data on command '${commandName}'`,
      );
    }

    this.setCommandTexts(commandTexts);
    this.setCommandNames(commandTexts.name, commandTexts.name_localizations);

    if (!this.slashCommandData) return;

    this.slashCommandData = compileSlashCommand(
      this.slashCommandData,
      commandTexts,
    );
  }

  public setCommandNames(defaultName: string, names: LocalizationMap): void {
    this.commandNames = Object.entries(names) as [Locale, string][];
    this.defaultName = defaultName;
  }

  public listAllNames(): string[] {
    return [
      this.defaultName,
      ...this.commandNames.map(([, name]) => name),
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
