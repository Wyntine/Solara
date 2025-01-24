import {
  type CommandExecuteFunction,
  type CommandOptions,
  CommandType,
} from "../types/files.types.ts";
import { Subcommand } from "./subcommand.ts";
import type { SubcommandGroup } from "./subcommandGroup.ts";
import type { CommandOptionConfig } from "./commandOptions.ts";
import { CommandConfig } from "./commandConfig.ts";
import { CommandHelper } from "../utils/commands.ts";
import { LanguageCommand } from "./languageCommand.ts";
import type { Option } from "./option.ts";

export class Command<
  Type extends CommandType = CommandType,
> extends LanguageCommand {
  public execute: CommandExecuteFunction<Type>;

  private config: CommandConfig<Type>;
  private options?: CommandOptionConfig;
  private subcommands: Subcommand[] = [];
  private subcommandGroups: SubcommandGroup[] = [];

  constructor({ options, config, execute }: CommandOptions<Type>) {
    super();
    this.config = config ?? new CommandConfig();

    if (options) this.options = options;

    this.execute =
      execute ??
      (CommandHelper.defaultExecuteFunction as unknown as CommandExecuteFunction<Type>);
  }

  public getOptions(): Option[] {
    return this.options?.getOptions() ?? [];
  }

  public getConfig() {
    return this.config;
  }

  public addSubcommands(subcommands: Subcommand[]): void {
    this.subcommands.push(...subcommands);
  }

  public addSubcommandGroups(subcommandGroups: SubcommandGroup[]): void {
    this.subcommandGroups.push(...subcommandGroups);
  }

  public getSubcommands(): Subcommand[] {
    return this.subcommands;
  }

  public getSubcommandGroups(): SubcommandGroup[] {
    return this.subcommandGroups;
  }

  /**
   * Type guard that checks if the command is combined.
   *
   * @returns true if the command is combined, false otherwise.
   * @see {@link CommandType.Combined}
   */
  public isCombined(): this is Command<CommandType.Combined> {
    return this.getConfig().type === CommandType.Combined;
  }

  /**
   * Type guard that checks if the command is slash only.
   *
   * @returns true if the command is of type Slash, false otherwise
   * @see {@link CommandType.Slash}
   */
  public isSlashOnly(): this is Command<CommandType.Slash> {
    return this.getConfig().type === CommandType.Slash;
  }

  /**
   * Type guard that checks if the command is message only.
   *
   * @returns true if the command is of type Message, false otherwise
   * @see {@link CommandType.Message}
   */
  public isMessageOnly(): this is Command<CommandType.Message> {
    return this.getConfig().type === CommandType.Message;
  }
}
