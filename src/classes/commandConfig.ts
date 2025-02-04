import { InteractionContextType } from "discord.js";
import { commandLogger } from "../handlers/logger.js";
import {
  CommandType,
  type CommandConfigOptions,
} from "../types/files.types.js";

export class CommandConfig<Type extends CommandType = CommandType.Combined> {
  public type: Type;
  public cooldown: number;
  public userPermissions: bigint[];
  public botPermissions: bigint[];
  public allowedGuilds: string[];
  public excludedGuilds: string[];
  public developerOnly: boolean;
  public enabled: boolean;
  public accessAreas: InteractionContextType[];

  constructor(
    options: CommandConfigOptions<Type> | undefined = {
      type: CommandType.Combined as Type,
    },
  ) {
    this.type = options.type ?? (CommandType.Combined as Type);

    this.allowedGuilds = options.allowedGuilds ?? [];
    this.excludedGuilds = options.excludedGuilds ?? [];
    this.developerOnly = options.developerOnly ?? false;

    if (options.cooldown) {
      if (options.cooldown < 0)
        commandLogger.throw("Cooldown must be greater than zero.");
      this.cooldown = options.cooldown;
    } else {
      this.cooldown = 0;
    }

    this.userPermissions = options.userPermissions ?? [];
    this.botPermissions = options.botPermissions ?? [];
    this.enabled = options.enabled ?? true;
    this.accessAreas = options.accessAreas ?? [
      InteractionContextType.BotDM,
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ];
  }

  /**
   * Disables the command.
   */
  public disable(): void {
    this.enabled = false;
  }

  /**
   * Enables the command.
   */
  public enable(): void {
    this.enabled = true;
  }
}
