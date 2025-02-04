import {
  CommandType,
  type SubcommandGroupOptions,
} from "../types/files.types.js";
import { CommandConfig } from "./commandConfig.js";
import { LanguageCommand } from "./languageCommand.js";
import type { Subcommand } from "./subcommand.js";

export class SubcommandGroup<
  Type extends CommandType = CommandType,
> extends LanguageCommand {
  private config?: CommandConfig<Type>;
  private subcommands: Subcommand[] = [];

  constructor({ config }: SubcommandGroupOptions<Type> = {}) {
    super();

    if (config) this.config = config;
  }

  public addSubcommands(subcommands: Subcommand[]): void {
    this.subcommands.push(...subcommands);
  }

  public getSubcommands(): Subcommand[] {
    return this.subcommands;
  }

  public getSubcommand(name: string): Subcommand | undefined {
    return this.subcommands.find((subcommand) => subcommand.hasAnyName(name));
  }

  /**
   * Type guard that checks if the subcommand group is combined.
   *
   * @returns true if the subcommand group is combined, false otherwise.
   * @see {@link CommandType.Combined}
   */
  public isCombined(): this is SubcommandGroup<CommandType.Combined> {
    return this.config?.type === CommandType.Combined;
  }

  /**
   * Type guard that checks if the subcommand group is slash only.
   *
   * @returns true if the subcommand group is of type Slash, false otherwise
   * @see {@link CommandType.Slash}
   */
  public isSlashOnly(): this is SubcommandGroup<CommandType.Slash> {
    return this.config?.type === CommandType.Slash;
  }

  /**
   * Type guard that checks if the subcommand group is message only.
   *
   * @returns true if the subcommand group is of type Message, false otherwise
   * @see {@link CommandType.Message}
   */
  public isMessageOnly(): this is SubcommandGroup<CommandType.Message> {
    return this.config?.type === CommandType.Message;
  }
}
