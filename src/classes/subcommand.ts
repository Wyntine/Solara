import { Message } from "discord.js";
import {
  CommandType,
  type CombinedInteraction,
  type CommandExecuteFunction,
  type SubcommandOptions,
} from "../types/files.types.js";
import type { CommandOptionConfig } from "./commandOptions.js";
import { CommandConfig } from "./commandConfig.js";
import { LanguageCommand } from "./languageCommand.js";
import type { Option } from "./option.js";

export class Subcommand<
  Type extends CommandType = CommandType,
> extends LanguageCommand {
  public execute: CommandExecuteFunction<Type>;

  private config: CommandConfig<Type>;
  private options?: CommandOptionConfig;

  constructor({ options, config, execute }: SubcommandOptions<Type>) {
    super();

    this.config = config ?? new CommandConfig();
    this.execute = execute;
    if (options) this.options = options;
  }

  public getConfig() {
    return this.config;
  }

  public getOptions(): Option[] {
    return this.options?.getOptions() ?? [];
  }

  /**
   * Type guard that checks if the subcommand is combined.
   *
   * @returns true if the subcommand is combined, false otherwise.
   * @see {@link CommandType.Combined}
   */
  public isCombined(): this is Subcommand<CommandType.Combined> {
    return this.getConfig().type === CommandType.Combined;
  }

  /**
   * Type guard that checks if the subcommand is slash only.
   *
   * @returns true if the subcommand is of type Slash, false otherwise
   * @see {@link CommandType.Slash}
   */
  public isSlashOnly(): this is Subcommand<CommandType.Slash> {
    return this.getConfig().type === CommandType.Slash;
  }

  /**
   * Type guard that checks if the subcommand is message only.
   *
   * @returns true if the subcommand is of type Message, false otherwise
   * @see {@link CommandType.Message}
   */
  public isMessageOnly(): this is Subcommand<CommandType.Message> {
    return this.getConfig().type === CommandType.Message;
  }

  public isExecutable(interaction: CombinedInteraction): boolean {
    if (this.isCombined()) return true;

    const executedType =
      interaction instanceof Message ? CommandType.Message : CommandType.Slash;
    return this.getConfig().type === executedType;
  }
}
