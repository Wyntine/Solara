import { client } from "./client.js";
import { commandLogger } from "../handlers/logger.js";
import { config } from "../handlers/config.js";
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
  InteractionContextType,
  Message,
  PermissionFlagsBits,
  Role,
  User,
  type Channel,
  type InteractionReplyOptions,
  type MessageReplyOptions,
} from "discord.js";
import {
  OptionTypes,
  type CommandHelperOptions,
  type CooldownItem,
  type HelperReplyOptions,
  type OptionDataTypes,
  type OptionParser,
} from "../types/utils.types.js";
import type {
  CombinedInteraction,
  CommandExecuteData,
  CommandInteractionType,
  CommandReplyType,
  CommandType,
  IsExecutableErrorKeys,
  IsExecutableStatus,
  ParsedInput,
  PartialIsExecutableErrors,
} from "../types/files.types.js";
import type { Command } from "../classes/command.js";
import type { Language } from "../classes/language.js";
import { isNumber, isString } from "@wyntine/verifier";
import { getLanguage, getLanguageByCode } from "../handlers/language.js";
import {
  commandExecutionMap,
  cooldowns,
  userDatabase,
} from "../handlers/database.js";
import type { Option } from "../classes/option.js";
import { getInnerObjectValue, mapPlaceholders } from "./objects.js";

export class CommandHelper<Type extends CommandType> {
  public isCooldownSet = false;
  private interaction: CommandInteractionType<Type>;
  private command: Command<Type>;
  private args: string[];
  private language: Language;
  private parsedInput: ParsedInput;

  constructor(options: CommandHelperOptions<Type>) {
    this.args = options.args ?? [];
    this.interaction = options.interaction;
    this.command = options.command;

    const userLanguageData = userDatabase.get(this.getUser().id)?.language;
    const commandLanguageData =
      this.isSlashInteraction() ? this.interaction.locale : undefined;

    this.language =
      userLanguageData ?
        getLanguageByCode(userLanguageData, true)
      : getLanguage(commandLanguageData, true);
    this.parsedInput = this.parseInput(true);
  }

  public getErrorMessage(errorKey: IsExecutableErrorKeys): string | undefined {
    const subcommandPath = this.getSubcommandTextPath();
    const subcommandGroupPath = this.getSubcommandGroupTextPath();

    const langErrorMessages = this.language.getErrorMessage();
    const texts = this.language.getCommandText();

    const messageCandidates = [
      ...[
        subcommandPath ? `${subcommandPath}.errorMessages` : undefined,
        subcommandGroupPath ?
          `${subcommandGroupPath}.errorMessages`
        : undefined,
      ]
        .filter(isString)
        .map((item) => getInnerObjectValue(texts, item)),
      this.command.getTexts().errorMessages,
      langErrorMessages,
    ].filter((item) => item !== undefined) as PartialIsExecutableErrors[];

    for (const candidate of messageCandidates) {
      const message = getInnerObjectValue(candidate, errorKey);

      if (message) return this.replaceErrorMessage(message);
    }

    return;
  }

  public getRemainingCooldownAsMiliseconds(): number | undefined {
    const cooldownData = this.getCommandCooldownData();
    const expirationDate = cooldownData?.expirationDate;
    return expirationDate ? expirationDate - Date.now() : undefined;
  }

  public getRemainingCooldownAsSeconds(): number | undefined {
    const cooldownMiliseconds = this.getRemainingCooldownAsMiliseconds();
    return cooldownMiliseconds ? cooldownMiliseconds / 1000 : undefined;
  }

  public replaceErrorMessage(message: string): string {
    const remainingTime = this.getRemainingCooldownAsSeconds();
    const remainingTimeText =
      remainingTime ?
        remainingTime.toFixed(remainingTime < 10 ? 2 : 0)
      : undefined;
    const replacedValues = mapPlaceholders(["cooldown"], [remainingTimeText]);

    return message.replaceAll(
      /\{\w+\}/g,
      (substr: string) =>
        (substr in replacedValues ?
          replacedValues[substr as keyof typeof replacedValues]
        : undefined) ?? substr,
    );
  }

  public setCooldownChecked(isChecked: boolean): boolean {
    const commandPath = this.getCommandPath();
    const userId = this.getUser().id;

    const cooldownData = cooldowns.get(userId) ?? [];
    const cooldown = cooldownData.find((cd) => cd.commandPath === commandPath);

    if (!cooldown) return true;
    if (isChecked && cooldown.isChecked) return false;

    const otherCooldowns = cooldownData.filter(
      (cd) => cd.commandPath !== cooldown.commandPath,
    );

    cooldowns.set(userId, [...otherCooldowns, { ...cooldown, isChecked }]);
    return true;
  }

  public getCommandCooldownData(): CooldownItem | undefined {
    const commandPath = this.getCommandPath();
    const userId = this.getUser().id;

    const cooldownData = cooldowns.get(userId) ?? [];
    const cooldown = cooldownData.find((cd) => cd.commandPath === commandPath);

    return cooldown;
  }

  public startCooldown(seconds?: number): void {
    if (this.isCooldownSet) {
      return commandLogger.throw("Cooldown is already set!");
    }

    const commandCooldown = this.getCommandCooldownAsSeconds();

    if (!isNumber(seconds) && !isNumber(commandCooldown)) {
      commandLogger.warn(
        `No command cooldown is set for "${this.getCommandPath()}"`,
      );
      return;
    }

    const cooldownMiliseconds = (seconds ?? commandCooldown)! * 1000;

    if (cooldownMiliseconds <= 0) {
      return commandLogger.throw("Cooldown must be a positive number.");
    }

    const expirationDate = Date.now() + cooldownMiliseconds;
    const commandPath = this.getCommandPath();
    const userId = this.getUser().id;
    const userCooldowns = cooldowns.get(userId) ?? [];
    const newUserCooldowns = [
      ...userCooldowns.filter((path) => path.commandPath !== commandPath),
      { commandPath, expirationDate },
    ];
    cooldowns.set(userId, newUserCooldowns);
    this.isCooldownSet = true;
  }

  /**
   * Checks if a command is executable based on various conditions.
   *
   * @returns `true` if the command is executable, `false` otherwise.
   *
   * The function checks the following conditions:
   * - If the command is a slash command and the interaction is a message, or vice versa.
   * - If the interaction is in a guild and the command has guild access restrictions.
   * - If the command is restricted to certain guilds or excluded from certain guilds.
   * - If the command is developer-only and the user is not a developer.
   * - If the bot or user lacks the necessary permissions to execute the command.
   */
  public isExecutable(): IsExecutableStatus {
    // TODO: Complete command verification.
    // TODO: Add localizations for the error messages.
    const command = this.command;
    const interaction = this.interaction;

    const {
      accessAreas,
      allowedGuilds,
      excludedGuilds,
      developerOnly,
      botPermissions,
      userPermissions,
    } = command.getConfig();

    if (
      (interaction instanceof Message && command.isSlashOnly()) ||
      (interaction instanceof ChatInputCommandInteraction &&
        command.isMessageOnly())
    )
      return { executable: false };

    const author =
      interaction instanceof Message ? interaction.author : interaction.user;

    const developers = config.get().bot.developers;
    const cannotAccess =
      (!accessAreas.includes(InteractionContextType.BotDM) &&
        !interaction.inGuild()) ||
      (interaction.inGuild() &&
        (!accessAreas.includes(InteractionContextType.Guild) ||
          (allowedGuilds.length &&
            !allowedGuilds.includes(interaction.guildId)) ||
          (excludedGuilds.length &&
            excludedGuilds.includes(interaction.guildId)))) ||
      (developerOnly && !developers.includes(author.id));

    if (cannotAccess) return { executable: false };

    const { expirationDate } = this.getCommandCooldownData() ?? {};

    if (expirationDate && expirationDate >= Date.now()) {
      return { executable: false, errorKey: "cooldown" };
    }

    if (interaction.guild) {
      const adminPerm = PermissionFlagsBits.Administrator;
      const botUser = interaction.guild.members.me;

      if (botUser && botPermissions.length) {
        const finalBotPermissions =
          botPermissions.includes(adminPerm) ? [adminPerm] : botPermissions;

        const missingPermissions = finalBotPermissions.filter(
          (permission) => !botUser.permissions.has(permission),
        );

        if (missingPermissions.length) {
          return { executable: false, errorKey: "perms.bot" };
        }
      }

      const user = interaction.member as GuildMember | null;

      if (user && userPermissions.length) {
        const finalUserPermissions =
          userPermissions.includes(adminPerm) ? [adminPerm] : userPermissions;

        const missingPermissions = finalUserPermissions.filter(
          (permission) => !user.permissions.has(permission),
        );

        if (missingPermissions.length) {
          return { executable: false, errorKey: "perms.user" };
        }
      }
    }

    return { executable: true };
  }

  public static defaultExecuteFunction(
    this: void,
    data: CommandExecuteData<CommandType>,
  ): void {
    const { helpers, interaction } = data;
    const { subcommand } = helpers.parseInput();

    const executeData = helpers.prepareRunnerData();

    if (subcommand?.isExecutable(interaction)) {
      subcommand.execute(executeData);
      return;
    }
  }

  public async executeCommand(): Promise<boolean> {
    const commandPath = this.getCommandPath();
    const userId = this.getUser().id;
    const userCommandExecutionMap = commandExecutionMap.get(userId) ?? [];
    const isCommandExecuted = userCommandExecutionMap.includes(commandPath);

    if (isCommandExecuted) return false;

    commandExecutionMap.set(userId, [...userCommandExecutionMap, commandPath]);

    await this.command.execute(this.prepareRunnerData());

    const newUserCommandExecutionMap = commandExecutionMap.get(userId) ?? [];
    const newData = newUserCommandExecutionMap.filter(
      (path) => path !== commandPath,
    );

    if (newData.length === 0) {
      commandExecutionMap.delete(userId);
    } else {
      commandExecutionMap.set(userId, newData);
    }

    return true;
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
      : this.isSlashInteraction() ? this.interaction.user
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
  public getStringOption(
    option: Option<OptionTypes.String>,
  ): string | undefined {
    return this.getOption(option);
  }

  /**
   * Retrieves a boolean option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getBooleanOption(
    option: Option<OptionTypes.Boolean>,
  ): boolean | undefined {
    return this.getOption(option, booleanParser);
  }

  /**
   * Retrieves a number option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getNumberOption(
    option: Option<OptionTypes.Number>,
  ): number | undefined {
    return this.getOption(option, numberParser);
  }

  /**
   * Retrieves an integer option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getIntegerOption(
    option: Option<OptionTypes.Integer>,
  ): number | undefined {
    return this.getOption(option, integerParser);
  }

  /**
   * Retrieves a channel option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getChannelOption(
    option: Option<OptionTypes.Channel>,
  ): Channel | undefined {
    return this.getOption(option, channelParser);
  }

  /**
   * Retrieves a user option from the command options.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getUserOption(option: Option<OptionTypes.User>): User | undefined {
    return this.getOption(option, userParser);
  }

  /**
   * Retrieves a role option from the command interaction.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getRoleOption(option: Option<OptionTypes.Role>): Role | undefined {
    return this.getOption(option, roleParser(this.interaction));
  }

  /**
   * Retrieves a member option from the command interaction.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getMemberOption(
    option: Option<OptionTypes.Member>,
  ): GuildMember | undefined {
    return this.getOption(option, memberParser(this.interaction));
  }

  /**
   * Retrieves a mentionable option from the interaction.
   *
   * @param optionName - The name of the option to retrieve.
   * @param required - Whether the option is required. Defaults to false.
   * @returns The value of the option if it exists, otherwise undefined.
   * @throws Will throw an error if the option is required and not found.
   */
  public getMentionableOption(
    option: Option<OptionTypes.Mentionable>,
  ): User | Channel | Role | GuildMember | undefined {
    return this.getOption(option, mentionableParser(this.interaction));
  }

  /**
   * Retrieves the name of the subcommand from the interaction or command options.
   *
   * @returns The name of the subcommand if found, otherwise undefined.
   * @throws Will throw an error if the option map is not set in the command.
   */
  public getSubcommandName(): string | undefined {
    if (this.isSlashInteraction()) {
      return this.interaction.options.getSubcommand(false) ?? undefined;
    }

    return this.parseMessageInput().subcommand?.getFileName();
  }

  /**
   * Retrieves the name of the subcommand group from the interaction or the command's option map.
   *
   * @returns The name of the subcommand group if found, otherwise undefined.
   * @throws Will throw an error if the option map is not set in the command.
   */
  public getSubcommandGroupName(): string | undefined {
    return this.isSlashInteraction() ?
        (this.interaction.options.getSubcommandGroup(false) ?? undefined)
      : this.parseMessageInput().subcommandGroup?.getFileName();
  }

  public parseInput(override = false): ParsedInput {
    return (
      override ?
        this.isMessageInteraction() ?
          this.parseMessageInput()
        : this.parseSlashInput()
      : this.parsedInput
    );
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
  /**
   * Checks if the current interaction is message command.
   *
   * @returns Returns true if the interaction is an instance of Message, otherwise false.
   */
  public isMessageInteraction(): this is CommandHelper<CommandType.Message> {
    return this.interaction instanceof Message;
  }

  /**
   * Determines if the current interaction is slash command interaction.
   *
   * @returns Returns true if the interaction is an instance of ChatInputCommandInteraction, otherwise false.
   */
  public isSlashInteraction(): this is CommandHelper<CommandType.Slash> {
    return this.interaction instanceof ChatInputCommandInteraction;
  }

  public getCommandCooldownAsSeconds(): number | undefined {
    const { subcommand } = this.parseInput();

    const subcommandCooldown = subcommand?.getConfig().cooldown;
    const commandCooldown = this.command.getConfig().cooldown;

    return [subcommandCooldown, commandCooldown].find(
      (cooldown) => isNumber(cooldown) && cooldown > 0,
    );
  }

  //* Private methods

  private getSubcommandGroupTextPath(extraPath?: string): string | undefined {
    const { subcommandGroup } = this.parseInput();

    const subcommandGroupName = subcommandGroup?.getFileName();

    const names = [
      subcommandGroupName ?
        `subcommandGroups.${subcommandGroupName}`
      : undefined,
      extraPath,
    ].filter(isString);

    return names.length ? names.join(".") : undefined;
  }

  private getSubcommandTextPath(extraPath?: string): string | undefined {
    const { subcommand, subcommandGroup } = this.parseInput();

    const subcommandGroupName = subcommandGroup?.getFileName();
    const subcommandName = subcommand?.getFileName();

    const names = [
      subcommandGroupName ?
        `subcommandGroups.${subcommandGroupName}`
      : undefined,
      subcommandName ? `subcommands.${subcommandName}` : undefined,
      extraPath,
    ].filter(isString);

    return names.length ? names.join(".") : undefined;
  }

  private getCommandPath(): string {
    const { subcommand, subcommandGroup } = this.parseInput();
    const names = [
      this.command.getFileName(),
      subcommandGroup?.getFileName(),
      subcommand?.getFileName(),
    ];
    return names.filter(isString).join(".");
  }

  private parseSlashInput(): ParsedInput {
    if (!this.isSlashInteraction()) {
      return commandLogger.throw(
        "Slash input parsing cannot be used with message interactions.",
      );
    }

    const subcommands = this.command.getSubcommands();
    const subcommandGroups = this.command.getSubcommandGroups();

    const subcommandName = this.getSubcommandName();
    const subcommand =
      subcommandName ?
        (subcommands.find((subcommand) =>
          subcommand.hasAnyName(subcommandName),
        ) ??
        subcommandGroups
          .find((subcommandGroup) =>
            subcommandGroup.getSubcommand(subcommandName),
          )
          ?.getSubcommand(subcommandName))
      : undefined;

    const subcommandGroupName = this.getSubcommandGroupName();
    const subcommandGroup =
      subcommandGroupName ?
        subcommandGroups.find((subcommandGroup) =>
          subcommandGroup.hasAnyName(subcommandGroupName),
        )
      : undefined;

    if (!this.interaction.options.data.length)
      return { subcommandGroup, subcommand };

    const commandOptions =
      subcommand ? subcommand.getOptions() : this.command.getOptions();

    const isSubcommandGroup = !!subcommandGroupName;
    const isSubcommand = !!subcommandName && !subcommandGroupName;

    const optionType =
      isSubcommandGroup ? ApplicationCommandOptionType.SubcommandGroup
      : isSubcommand ? ApplicationCommandOptionType.Subcommand
      : undefined;

    let interactionOptions = this.interaction.options.data.filter((option) =>
      optionType === undefined ? true : optionType === option.type,
    );

    if (isSubcommandGroup) {
      const subcommand = interactionOptions
        .find(
          (option) =>
            option.type === ApplicationCommandOptionType.SubcommandGroup &&
            option.name === subcommandGroupName,
        )
        ?.options?.find(
          (option) =>
            option.type === ApplicationCommandOptionType.Subcommand &&
            option.name === subcommandName,
        );

      interactionOptions = Array.from(subcommand?.options ?? []);
    } else if (isSubcommand) {
      const subcommand = interactionOptions.find(
        (option) =>
          option.type === ApplicationCommandOptionType.Subcommand &&
          option.name === subcommandName,
      );

      interactionOptions = Array.from(subcommand?.options ?? []);
    }

    const options = commandOptions.map((option) => ({
      option,
      value: interactionOptions.find((_, index) => index === option.getIndex())
        ?.value,
    }));

    return {
      subcommandGroup,
      subcommand,
      options,
    };
  }

  private parseMessageInput(): ParsedInput {
    if (this.interaction instanceof ChatInputCommandInteraction) {
      return commandLogger.throw(
        "Message input parsing cannot be used with slash command interactions.",
      );
    }

    const [firstArg, secondArg, ...others] = this.args;

    if (!firstArg) return {};

    const subcommandGroup = this.command
      .getSubcommandGroups()
      .find((subcommandGroup) => subcommandGroup.hasAnyName(firstArg));

    if (subcommandGroup) {
      if (!secondArg) return { subcommandGroup };

      const subcommand = subcommandGroup
        .getSubcommands()
        .find((subcommand) => subcommand.hasAnyName(secondArg));

      if (!subcommand) return { subcommandGroup };

      const commandOptions = subcommand.getOptions();

      const options = commandOptions.map((option, index) => ({
        option,
        value:
          index === others.length - 1 ?
            others.slice(index).join(" ")
          : others.at(index),
      }));

      return { subcommandGroup, subcommand, options };
    }

    const subcommand = this.command
      .getSubcommands()
      .find((subcommand) => subcommand.hasAnyName(firstArg));

    const commandOptions =
      subcommand ? subcommand.getOptions() : this.command.getOptions();

    const commandArgs = subcommand ? [secondArg, ...others] : this.args;
    const options = commandOptions.map((option, index) => ({
      option,
      value:
        index === commandOptions.length - 1 ?
          commandArgs.slice(index).join(" ")
        : commandArgs.at(index),
    }));

    return { subcommand, options };
  }

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
  private getOption<Type extends OptionTypes, Data = OptionDataTypes[Type]>(
    givenOption: Option<Type>,
    optionParser?: OptionParser<Data>,
  ): Data | undefined {
    const options = this.parsedInput.options;
    const optionType = givenOption.getSettings().type;
    const optionIndex = givenOption.getIndex();

    const option = options?.find(
      ({ option }) =>
        option.getIndex() === optionIndex &&
        option.getSettings().type === optionType,
    );

    if (!option) {
      return commandLogger.throw(
        `Command (${this.command.getFilePath()}) do not have proper option mapping.`,
      );
    }

    const finalOption =
      isString(option) && optionType !== OptionTypes.String ?
        optionParser ? optionParser(option)
        : commandLogger.throw(
            `Given option index "${optionIndex.toString()}" of type "${optionType}" in command (${this.command.getFilePath()}) requires a parser.`,
          )
      : (option.value as Data | undefined);

    return finalOption;
  }
}

// TODO: Check API and change verification states
function booleanParser(
  input: string | boolean | undefined,
): boolean | undefined {
  return (
    isString(input) ?
      ["True", "true"].includes(input) ? true
      : ["False", "false"].includes(input) ? false
      : undefined
    : input
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

  const match = /<#!?(\d+)>$/.exec(input)?.[1];

  if (!match) return;

  return client.channels.cache.get(match);
}

function roleParser(interaction: CombinedInteraction) {
  return (input: string | undefined): Role | undefined => {
    if (input === undefined) return;

    const match = /<@&?(\d+)>$/.exec(input)?.[1];

    if (!match) return;

    return interaction.guild?.roles.cache.get(match);
  };
}

function userParser(input: string | undefined): User | undefined {
  if (input === undefined) return;

  const match = /<@!?(\d+)>$/.exec(input)?.[1];

  if (!match) return;

  return client.users.cache.get(match);
}

function memberParser(interaction: CombinedInteraction) {
  return (input: string | undefined): GuildMember | undefined => {
    if (input === undefined) return;

    const match = /<@!?(\d+)>$/.exec(input)?.[1];

    if (!match) return;

    return interaction.guild?.members.cache.get(match);
  };
}

function mentionableParser(interaction: CombinedInteraction) {
  return (input: string | undefined): GuildMember | User | Role | undefined => {
    if (input === undefined) return;

    const match = /<@!?(\d+)>$/.exec(input)?.[1];

    if (!match) return;

    const memberMatch = memberParser(interaction)(match);
    const userMatch = userParser(match);
    const roleMatch = roleParser(interaction)(match);

    return memberMatch ?? userMatch ?? roleMatch;
  };
}
