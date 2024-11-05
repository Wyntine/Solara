import path from "path";
import { commandLogger } from "../handlers/logger.js";
import { compileSlashCommand } from "../handlers/command.js";
import { createOptionMap } from "../utils/commands.js";
import { getCommandText } from "../handlers/language.js";
import { Locale, SlashCommandBuilder, type LocalizationMap } from "discord.js";
import {
  type MessageCommandOptions,
  type CommandExecuteFunction,
  type CommandOptions,
  CommandType,
  type OptionMap,
  type LanguageCommandTexts,
  type FinalLanguageBaseCommandTexts,
} from "../types/files.types.js";

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

  /**
   * Sets the command texts for different languages.
   *
   * @param texts - The language-specific command texts to be set
   */
  public setCommandTexts(
    texts: LanguageCommandTexts<FinalLanguageBaseCommandTexts>,
  ): void {
    this.commandTexts = texts;
  }

  /**
   * Reloads the option map for this command using its slash command data.
   * If slash command data exists, creates a new option map using the createOptionMap utility.
   */
  public reloadOptionMap(): void {
    const slashData = this.slashCommandData;

    if (slashData) this.optionMap = createOptionMap(slashData);
  }

  /**
   * Retrieves the command texts for the current command.
   *
   * @returns The command texts for different languages
   * @throws If no command texts are found
   */
  public getCommandTexts(): LanguageCommandTexts<FinalLanguageBaseCommandTexts> {
    const texts = this.commandTexts;

    if (!texts) {
      return commandLogger.throw("No command texts found.");
    }

    return texts;
  }

  /**
   * Compiles and sets language-specific data for the command.
   *
   * @throws When command text data is empty
   */
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

  /**
   * Sets the command names for different locales and the default name.
   *
   * @param defaultName - The default name of the command to be used when a locale-specific name is not available
   * @param names - A map of locale-specific command names where keys are locales and values are the localized command names
   */
  public setCommandNames(defaultName: string, names: LocalizationMap): void {
    this.commandNames = Object.entries(names) as [Locale, string][];
    this.defaultName = defaultName;
  }

  /**
   * Returns an array of all command names associated with this command instance.
   * This includes the default name, command names, message command aliases, and slash command name.
   *
   * @returns An array of command names, filtered to include only string values
   */
  public listAllNames(): string[] {
    return [
      this.defaultName,
      ...this.commandNames.map(([, name]) => name),
      ...(this.messageCommandData?.aliases ?? []),
      this.slashCommandData?.name,
    ].filter((text) => typeof text === "string");
  }

  /**
   * Checks if the command has any of the specified names.
   *
   * @param names - Variable number of strings to check against command names
   * @returns True if any of the provided names match any of the command's names, false otherwise
   */
  public hasAnyName(...names: string[]): boolean {
    const allNames = this.listAllNames();
    return names.some((name) => allNames.includes(name));
  }

  /**
   * Gets the command path associated with this command.
   *
   * @returns The command path string if set
   * @throws If command path has not been set
   */
  public getCommandPath(): string {
    if (typeof this.commandPath !== "string") {
      return commandLogger.throw("Command path has not been set.");
    }

    return this.commandPath;
  }

  /**
   * Sets the command path and extracts the command file name without extension.
   *
   * @param commandPath - The full file path of the command.
   */
  public setCommandPath(commandPath: string): void {
    this.commandPath = commandPath;
    this.commandFileName = path.basename(commandPath, ".ts");
  }

  /**
   * Retrieves the command file name.
   *
   * @returns The command file name as a string.
   * @throws If the command file name has not been set.
   */
  public getCommandFileName(): string {
    if (typeof this.commandFileName !== "string") {
      return commandLogger.throw("Command file name has not been set.");
    }

    return this.commandFileName;
  }

  /**
   * Disables the command instance.
   *
   * @returns The current command instance for method chaining.
   */
  public disable(): this {
    this.enabled = false;
    return this;
  }

  /**
   * Enables the command.
   *
   * @returns The command instance for method chaining.
   */
  public enable(): this {
    this.enabled = true;
    return this;
  }

  /**
   * Type guard that checks if the command is of type Combined.
   *
   * @returns True if the command is a Combined command, false otherwise.
   * @see {@link CommandType.Combined}
   */
  public isCombined(): this is Command<CommandType.Combined> {
    return this.type === CommandType.Combined;
  }

  /**
   * Type guard method that checks if the command is a slash command only.
   *
   * @returns True if the command is of type Slash, false otherwise
   * @see {@link CommandType.Slash}
   */
  public isSlashOnly(): this is Command<CommandType.Slash> {
    return this.type === CommandType.Slash;
  }

  /**
   * Type guard method that checks if the command is a message command only.
   *
   * @returns true if the command is of type Message, false otherwise
   * @see {@link CommandType.Message}
   */
  public isMessageOnly(): this is Command<CommandType.Message> {
    return this.type === CommandType.Message;
  }
}
