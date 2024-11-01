import {
  ChatInputCommandInteraction,
  GuildMember,
  Message,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  User,
  type Channel,
  type InteractionReplyOptions,
  type MessageReplyOptions,
  type ToAPIApplicationCommandOptions,
} from "discord.js";
import { config } from "../handlers/config.js";
import {
  OptionTypeMap,
  OptionTypes,
  type CommandExecutableCheckOptions,
  type CommandHelperOptions,
  type HelperReplyOptions,
  type Nullable,
  type OptionDataTypes,
  type OptionGetters,
  type OptionParser,
  type StringMap,
} from "../types/utils.types.js";
import type {
  CombinedInteraction,
  CommandExecuteFunction,
  CommandInteractionType,
  CommandReplyType,
  CommandRunners,
  CommandType,
  OptionBuilders,
  OptionMap,
  Options,
} from "../types/files.types.js";
import { commandLogger } from "../handlers/logger.js";
import { client } from "./client.js";
import { isArray } from "@wyntine/verifier";
import type { Command } from "../classes/command.js";
import type { Language } from "../classes/language.js";

export function isCommandExecutable({
  command,
  interaction,
}: CommandExecutableCheckOptions): boolean {
  const {
    guildAccess,
    dmAccess,
    allowedGuilds,
    excludedGuilds,
    developerOnly,
  } = command;

  if (
    (interaction instanceof Message && command.isSlashOnly()) ||
    (interaction instanceof ChatInputCommandInteraction &&
      command.isMessageOnly())
  )
    return false;

  const reply = interaction.reply.bind(interaction);
  const author =
    interaction instanceof Message ? interaction.author : interaction.user;

  const developers = config.get().bot.developers;
  const cannotAccess =
    (!dmAccess && !interaction.inGuild()) ||
    (interaction.inGuild() &&
      (!guildAccess ||
        (allowedGuilds.length &&
          !allowedGuilds.includes(interaction.guildId)) ||
        (excludedGuilds.length &&
          excludedGuilds.includes(interaction.guildId)))) ||
    (developerOnly && !developers.includes(author.id));

  if (cannotAccess) return false;

  if (interaction.guild) {
    const adminPerm = PermissionFlagsBits.Administrator;

    const botUser = interaction.guild.members.me;

    if (botUser && command.botPermissions.length) {
      const botPermissions =
        command.botPermissions.includes(adminPerm) ?
          [adminPerm]
        : command.botPermissions;

      const missingPermissions = botPermissions.filter(
        (permission) => !botUser.permissions.has(permission),
      );

      if (missingPermissions.length) {
        // TODO: Add language support for permissions
        void reply("Missing bot permissions.");
        return false;
      }
    }

    const user = interaction.member as GuildMember | null;

    if (user && command.userPermissions.length) {
      const userPermissions =
        command.userPermissions.includes(adminPerm) ?
          [adminPerm]
        : command.userPermissions;

      const missingPermissions = userPermissions.filter(
        (permission) => !user.permissions.has(permission),
      );

      if (missingPermissions.length) {
        // TODO: Add language support for permissions
        void reply("Missing user permissions.");
        return false;
      }
    }
  }

  return true;
}

export class CommandHelper<Type extends CommandType> {
  private interaction: CommandInteractionType<Type>;
  private command: Command<Type>;
  private args: string[];
  private language: Language;

  constructor(options: CommandHelperOptions<Type>) {
    this.args = options.args ?? [];
    this.interaction = options.interaction;
    this.command = options.command;
    this.language = options.language;
  }

  public getUser(): User {
    return (
      this.isMessageInteraction() ? this.interaction.author
      : this.isCommandInteraction() ? this.interaction.user
      : commandLogger.throw("Interaction type could not be determined")
    );
  }

  public getStringOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, string> {
    return this.getOption(OptionTypes.String, optionName, required);
  }

  public getBooleanOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, boolean> {
    return this.getOption(
      OptionTypes.Boolean,
      optionName,
      required,
      booleanParser,
    );
  }

  public getNumberOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, number> {
    return this.getOption(
      OptionTypes.Number,
      optionName,
      required,
      numberParser,
    );
  }

  public getIntegerOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, number> {
    return this.getOption(
      OptionTypes.Integer,
      optionName,
      required,
      integerParser,
    );
  }

  public getChannelOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, Channel> {
    return this.getOption(
      OptionTypes.Channel,
      optionName,
      required,
      channelParser,
    );
  }

  public getUserOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, User> {
    return this.getOption(OptionTypes.User, optionName, required, userParser);
  }

  public getRoleOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, Role> {
    return this.getOption(
      OptionTypes.Role,
      optionName,
      required,
      roleParser(this.interaction),
    );
  }

  public getMemberOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, GuildMember> {
    return this.getOption(
      OptionTypes.Member,
      optionName,
      required,
      memberParser(this.interaction),
    );
  }

  public getMentionableOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, User | Channel | Role | GuildMember> {
    return this.getOption(
      OptionTypes.Mentionable,
      optionName,
      required,
      mentionableParser(this.interaction),
    );
  }

  public getSubcommandName(): string | undefined {
    if (this.interaction instanceof ChatInputCommandInteraction) {
      return this.interaction.options.getSubcommand();
    }

    const optionMap = this.command.optionMap;

    if (!optionMap) {
      return commandLogger.throw(
        `Option map is not set in command (${this.command.getCommandPath()})`,
      );
    }

    if (Array.isArray(optionMap)) return undefined;

    const [firstArg, secondArg] = this.args;

    if (!firstArg || !(firstArg in optionMap)) return undefined;

    const group = optionMap[firstArg]!;

    if (Array.isArray(group)) return firstArg;

    if (!secondArg || !(secondArg in group)) return undefined;

    return secondArg;
  }

  public getSubcommandGroupName(): string | undefined {
    if (this.interaction instanceof ChatInputCommandInteraction) {
      return this.interaction.options.getSubcommandGroup() ?? undefined;
    }

    const optionMap = this.command.optionMap;

    if (!optionMap) {
      return commandLogger.throw(
        `Option map is not set in command (${this.command.getCommandPath()})`,
      );
    }

    if (Array.isArray(optionMap)) return undefined;

    const [firstArg] = this.args;

    if (!firstArg || !(firstArg in optionMap)) return undefined;

    const group = optionMap[firstArg]!;

    if (Array.isArray(group)) return undefined;

    return firstArg;
  }

  public useCommandRunners(
    runners: CommandRunners<Type>,
    onFail?: CommandExecuteFunction<Type>,
  ): void {
    const runnerData = this.prepareRunnerData();
    const status = this.getCommandRunnerStatus(runners, runnerData);

    if (!status && onFail) onFail(runnerData);
  }

  public async reply(
    options: HelperReplyOptions<Type>,
  ): Promise<CommandReplyType<Type>> {
    return (await this.interaction.reply(
      options as InteractionReplyOptions & MessageReplyOptions,
    )) as CommandReplyType<Type>;
  }

  //* Private methods

  private prepareRunnerData() {
    return {
      client,
      interaction: this.interaction,
      command: this.command,
      helpers: this,
      language: this.language,
    };
  }

  private getCommandRunnerStatus(
    runners: CommandRunners<Type>,
    runnerData = this.prepareRunnerData(),
  ): boolean {
    if (typeof runners === "function") {
      runners(runnerData);
      return true;
    }

    const currentSubcommand = this.getSubcommandName();
    const currentSubcommandGroup = this.getSubcommandGroupName();

    if (!currentSubcommand) return false;

    if (currentSubcommandGroup) {
      const subcommandGroup = runners[currentSubcommandGroup];

      if (!subcommandGroup || typeof subcommandGroup === "function")
        return false;

      const subcommandRunner = subcommandGroup[currentSubcommand];

      if (subcommandRunner) {
        subcommandRunner(runnerData);
        return true;
      }
    } else {
      const subcommandRunner = runners[currentSubcommand];

      if (typeof subcommandRunner === "function") {
        subcommandRunner(runnerData);
        return true;
      }
    }

    return false;
  }

  private getOption<
    Type extends OptionTypes,
    Required extends boolean = false,
    Data = OptionDataTypes[Type],
  >(
    optionType: Type,
    optionName: string,
    required?: Required,
    optionParser?: OptionParser<Data>,
  ): Nullable<Required, Data> {
    let option: string | Nullable<Required, Data> | undefined;

    if (this.interaction instanceof Message) {
      const optionMap = this.command.optionMap;

      if (!optionMap) {
        return commandLogger.throw(
          `Option map is not set in command (${this.command.getCommandPath()})`,
        );
      }

      if (!Array.isArray(optionMap)) {
        const [firstArg, secondArg] = this.args;

        if (!firstArg || !(firstArg in optionMap)) {
          option = undefined;
        } else {
          const group = optionMap[firstArg]!;

          if (isArray(group)) {
            option = this.retrieveOption(group, optionName, 1);
          } else {
            if (!secondArg || !(secondArg in group)) {
              option = undefined;
            } else {
              const inlineGroup = group[secondArg]!;

              option = this.retrieveOption(inlineGroup, optionName, 2);
            }
          }
        }
      } else {
        option = this.retrieveOption(optionMap, optionName);
      }
    } else {
      const getter =
        `get${optionType.at(0)?.toLocaleUpperCase() ?? ""}${optionType.slice(1)}` as OptionGetters;
      const getterFunc = this.interaction.options[getter].bind(
        this.interaction.options,
      ) as (
        name: string,
        required?: boolean,
      ) => Nullable<Required, Data> | undefined;
      option = getterFunc(optionName, required);
    }

    const finalOption: Nullable<Required, Data> | undefined =
      typeof option === "string" && optionType !== OptionTypes.String ?
        optionParser ? optionParser(option)
        : commandLogger.throw(
            `Given option "${optionName}" of type "${optionType}" in command (${this.command.getCommandPath()}) requires a parser.`,
          )
      : (option as Nullable<Required, Data> | undefined);

    if (required && finalOption === undefined) {
      return commandLogger.throw(
        `Command (${this.command.getCommandPath()}) requires "${optionType}" option "${optionName}"`,
      );
    }

    return finalOption!;
  }

  private retrieveOption(
    optionMap: Options[],
    optionName: string,
    startIndex = 0,
  ): string | undefined {
    const newArgs = this.args.slice(startIndex);
    const optionIndex = optionMap.findIndex(
      (option) => option.name === optionName,
    );

    if (optionIndex === -1) {
      return commandLogger.throw(
        `Command (${this.command.getCommandPath()}) do not have proper option mapping.`,
      );
    }

    return optionIndex === optionMap.length - 1 ?
        newArgs.slice(optionIndex).join(" ")
      : newArgs.at(optionIndex);
  }

  private isMessageInteraction(): this is CommandHelper<CommandType.Message> {
    return this.interaction instanceof Message;
  }

  private isCommandInteraction(): this is CommandHelper<CommandType.Slash> {
    return this.interaction instanceof ChatInputCommandInteraction;
  }
}

// TODO: Create option mapper
export function createOptionMap(
  slashCommandData: SlashCommandBuilder,
): OptionMap {
  const { options, subcommandGroups, subcommands } = groupOptions(
    slashCommandData.options,
  );

  if (options.length) {
    return mapOptions(options);
  }

  const tempOptions: OptionMap = {};

  for (const subcommandGroup of subcommandGroups) {
    const subcommandsList = subcommandGroup.options;
    const tempList: StringMap<Options[]> = {};

    for (const subcommand of subcommandsList) {
      tempList[subcommand.name] = mapOptions(listOptions(subcommand.options));
    }

    tempOptions[subcommandGroup.name] = tempList;
  }

  for (const subcommand of subcommands) {
    tempOptions[subcommand.name] = mapOptions(listOptions(subcommand.options));
  }

  return tempOptions;
}

function mapOptions(options: OptionBuilders[]): Options[] {
  return options.map((option) => ({
    name: option.name,
    type: OptionTypeMap[option.type],
  }));
}

function listOptions(
  options: ToAPIApplicationCommandOptions[],
  excluded: unknown[] = [],
): OptionBuilders[] {
  return options.filter(
    (option) => !excluded.find((opt) => opt === option),
  ) as OptionBuilders[];
}

function groupOptions(slashOptions: ToAPIApplicationCommandOptions[]) {
  const subcommandGroups = slashOptions.filter(
    (option) => option instanceof SlashCommandSubcommandGroupBuilder,
  );

  const subcommands = slashOptions.filter(
    (option) => option instanceof SlashCommandSubcommandBuilder,
  );

  const options = listOptions(slashOptions, [
    ...subcommandGroups,
    ...subcommands,
  ]);

  return {
    subcommandGroups,
    subcommands,
    options,
  };
}

function booleanParser(input: string | undefined): boolean | undefined {
  return (
    input === "True" ? true
    : input === "False" ? false
    : undefined
  );
}

function numberParser(input: string | undefined): number | undefined {
  if (input === undefined) return;

  const parsedNumber = +input;
  return Number.isNaN(parsedNumber) ? undefined : parsedNumber;
}

function integerParser(input: string | undefined): number | undefined {
  const parsedNumber = numberParser(input);
  return parsedNumber && Number.isInteger(parsedNumber) ?
      parsedNumber
    : undefined;
}

function channelParser(input: string | undefined): Channel | undefined {
  if (input === undefined) return;

  const match = input.match(/<#!?(\d+)>$/)?.[1];

  if (!match) return;

  return client.channels.cache.get(match);
}

function roleParser(interaction: CombinedInteraction) {
  return (input: string | undefined): Role | undefined => {
    if (input === undefined) return;

    const match = input.match(/<@&?(\d+)>$/)?.[1];

    if (!match) return;

    return interaction.guild?.roles.cache.get(match);
  };
}

function userParser(input: string | undefined): User | undefined {
  if (input === undefined) return;

  const match = input.match(/<@!?(\d+)>$/)?.[1];

  if (!match) return;

  return client.users.cache.get(match);
}

function memberParser(interaction: CombinedInteraction) {
  return (input: string | undefined): GuildMember | undefined => {
    if (input === undefined) return;

    const match = input.match(/<@!?(\d+)>$/)?.[1];

    if (!match) return;

    return interaction.guild?.members.cache.get(match);
  };
}

function mentionableParser(interaction: CombinedInteraction) {
  return (input: string | undefined): GuildMember | User | Role | undefined => {
    if (input === undefined) return;

    const match = input.match(/<@!?(\d+)>$/)?.[1];

    if (!match) return;

    const memberMatch = memberParser(interaction)(match);
    const userMatch = userParser(match);
    const roleMatch = roleParser(interaction)(match);

    return memberMatch ?? userMatch ?? roleMatch;
  };
}
