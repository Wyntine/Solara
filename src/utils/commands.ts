import { client } from "./client.js";
import { commandLogger } from "../handlers/logger.js";
import { config } from "../handlers/config.js";
import { isArray } from "@wyntine/verifier";
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
import type { Command } from "../classes/command.js";
import type { Language } from "../classes/language.js";

/**
 * Checks if a command is executable based on various conditions.
 *
 * @param options - The options for checking command executability.
 * @param options.command - The command to check.
 * @param options.interaction - The interaction that triggered the command.
 * @returns `true` if the command is executable, `false` otherwise.
 *
 * The function checks the following conditions:
 * - If the command is a slash command and the interaction is a message, or vice versa.
 * - If the interaction is in a guild and the command has guild access restrictions.
 * - If the command is restricted to certain guilds or excluded from certain guilds.
 * - If the command is developer-only and the user is not a developer.
 * - If the bot or user lacks the necessary permissions to execute the command.
 */
export function isCommandExecutable(
  options: CommandExecutableCheckOptions,
): boolean {
  const { command, interaction } = options;

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

  /**
   * Retrieves the user associated with the current interaction.
   *
   * Depending on the type of interaction, this method returns the appropriate user:
   * - If the interaction is a message interaction, it returns the author of the message.
   * - If the interaction is a command interaction, it returns the user who issued the command.
   * - If the interaction type cannot be determined, it throws an error.
   *
   * @returns The user associated with the current interaction.
   * @throws Will throw an error if the interaction type cannot be determined.
   */
  public getUser(): User {
    return (
      this.isMessageInteraction() ? this.interaction.author
      : this.isCommandInteraction() ? this.interaction.user
      : commandLogger.throw("Interaction type could not be determined.")
    );
  }

  /**
   * Retrieves a string option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getStringOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, string> {
    return this.getOption(OptionTypes.String, optionName, required);
  }

  /**
   * Retrieves a boolean option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
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

  /**
   * Retrieves a number option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
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

  /**
   * Retrieves an integer option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
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

  /**
   * Retrieves a channel option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
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

  /**
   * Retrieves a user option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getUserOption<Required extends boolean = false>(
    optionName: string,
    required?: Required,
  ): Nullable<Required, User> {
    return this.getOption(OptionTypes.User, optionName, required, userParser);
  }

  /**
   * Retrieves a role option from the command interaction.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
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

  /**
   * Retrieves a member option from the command interaction.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
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

  /**
   * Retrieves a mentionable option from the interaction.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
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

  /**
   * Retrieves the name of the subcommand from the interaction or command options.
   *
   * @returns The name of the subcommand if found, otherwise undefined.
   * @throws Will throw an error if the option map is not set in the command.
   */
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

  /**
   * Retrieves the name of the subcommand group from the interaction or the command's option map.
   *
   * @returns The name of the subcommand group if found, otherwise undefined.
   * @throws Will throw an error if the option map is not set in the command.
   */
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

  /**
   * Executes the provided command runners with the prepared runner data.
   * If the command runners fail, the optional onFail callback is invoked.
   *
   * @param runners - The command runners to execute.
   * @param onFail - Optional callback function to execute if the command runners fail.
   */
  public useCommandRunners(
    runners: CommandRunners<Type>,
    onFail?: CommandExecuteFunction<Type>,
  ): void {
    const runnerData = this.prepareRunnerData();
    const status = this.getCommandRunnerStatus(runners, runnerData);

    if (!status && onFail) onFail(runnerData);
  }

  /**
   * Sends a reply to an interaction.
   *
   * @param options - The options for the reply, including content and other parameters.
   * @returns A promise that resolves to the reply of the specified type.
   */
  public async reply(
    options: HelperReplyOptions<Type>,
  ): Promise<CommandReplyType<Type>> {
    return (await this.interaction.reply(
      options as InteractionReplyOptions & MessageReplyOptions,
    )) as CommandReplyType<Type>;
  }

  //* Private methods

  /**
   * Prepares and returns the data required for running a command.
   *
   * @returns An object containing the following properties:
   * - `client`: The client instance.
   * - `interaction`: The interaction instance associated with the command.
   * - `command`: The command to be executed.
   * - `helpers`: A reference to the current instance of the class containing helper methods.
   * - `language`: The language setting for the command execution.
   */
  private prepareRunnerData() {
    return {
      client,
      interaction: this.interaction,
      command: this.command,
      helpers: this,
      language: this.language,
    };
  }

  /**
   * Determines the status of a command runner and executes it if available.
   *
   * @param runners - An object containing command runners or a function.
   * @param runnerData - Optional data prepared for the runner. Defaults to the result of `prepareRunnerData()`.
   * @returns `true` if a command runner was found and executed, otherwise `false`.
   */
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

  /**
   * Retrieves an option from the interaction or command option map.
   *
   * @param optionType - The type of the option.
   * @param optionName - The name of the option.
   * @param required - Whether the option is required.
   * @param optionParser - A parser function for the option.
   * @returns The retrieved option or throws an error if required and not found.
   *
   * @throws Will throw an error if the option map is not set in the command.
   * @throws Will throw an error if the required option is not found.
   * @throws Will throw an error if a parser is required but not provided.
   */
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

  /**
   * Retrieves the value of a specified option from the command arguments.
   *
   * @param optionMap - An array of option objects that define the available options.
   * @param optionName - The name of the option to retrieve.
   * @param startIndex - The index to start searching for the option in the arguments. Defaults to 0.
   * @returns The value of the specified option as a string, or `undefined` if the option is not found.
   * @throws Will throw an error if the option mapping is not found in the command.
   */
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

  /**
   * Checks if the current interaction is message command.
   *
   * @returns Returns true if the interaction is an instance of Message, otherwise false.
   */
  private isMessageInteraction(): this is CommandHelper<CommandType.Message> {
    return this.interaction instanceof Message;
  }

  /**
   * Determines if the current interaction is slash command interaction.
   *
   * @returns Returns true if the interaction is an instance of ChatInputCommandInteraction, otherwise false.
   */
  private isCommandInteraction(): this is CommandHelper<CommandType.Slash> {
    return this.interaction instanceof ChatInputCommandInteraction;
  }
}

// TODO: Create option mapper
/**
 * Creates a mapping of command options based on the provided SlashCommandBuilder data.
 *
 * @param slashCommandData - The SlashCommandBuilder instance containing command structure and options
 * @returns An OptionMap object containing mapped command options:
 *          - If the command has direct options, returns a direct mapping of those options
 *          - For subcommand groups, returns a nested structure mapping group name -> subcommand name -> options
 *          - For individual subcommands, returns a mapping of subcommand name -> options
 *
 * @example
 * const command = new SlashCommandBuilder()
 *   .setName('example')
 *   .addSubcommandGroup(group =>
 *     group.setName('group')
 *          .addSubcommand(sub =>
 *            sub.setName('sub')
 *               .addStringOption(opt => opt.setName('option'))))
 *
 * const optionMap = createOptionMap(command);
 * // Results in: { group: { sub: { option: [options] } } }
 */
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
