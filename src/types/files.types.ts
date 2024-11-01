import type {
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  InteractionResponse,
  Locale,
  LocalizationMap,
  Message,
  SlashCommandBooleanOption,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  SlashCommandIntegerOption,
  SlashCommandMentionableOption,
  SlashCommandNumberOption,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandUserOption,
} from "discord.js";
import type { FixedSizeArray, OptionTypes, StringMap } from "./utils.types.js";
import type { ObjectVerifier } from "@wyntine/verifier";
import type { CommandHelper } from "../utils/commands.js";
import type { Command } from "../classes/command.js";
import type { Language } from "../classes/language.js";

//* Events

export interface EventOptions<Category extends keyof ClientEvents> {
  category: Category;
  once?: boolean;
  enabled?: boolean;
  execute: EventExecuteFunction<Category>;
}

export type EventExecuteFunction<Category extends keyof ClientEvents> = (
  ...data: ClientEvents[Category]
) => unknown;

//* Commands

export interface CommandOptions<Type extends CommandType> {
  type: Type;
  slashCommandData?: UseSlashType<Type, SlashBuilder | SlashBuilders>;
  messageCommandData?: UseMessageType<Type, MessageCommandOptions>;
  allowedGuilds?: string[];
  excludedGuilds?: string[];
  developerOnly?: boolean;
  cooldown?: number;
  userPermissions?: bigint[];
  botPermissions?: bigint[];
  enabled?: boolean;
  dmAccess?: boolean;
  guildAccess?: boolean;
  execute: CommandExecuteFunction<Type>;
}

export type CommandExecuteFunction<Type extends CommandType> = (
  executeData: CommandExecuteData<Type>,
) => unknown;

export type CombinedInteraction = ChatInputCommandInteraction | Message;

export interface CommandExecuteData<Type extends CommandType> {
  command: Command<Type>;
  interaction: CommandInteractionType<Type>;
  language: Language;
  client: Client;
  helpers: CommandHelper<Type>;
}

export type SlashBuilders =
  | SlashCommandBuilder
  | SlashCommandSubcommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandGroupBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export type AvailableSlashCommandOptions =
  | SlashCommandSubcommandGroupBuilder
  | SlashCommandSubcommandBuilder
  | OptionBuilders;

export type SlashBuilder = (builder: SlashCommandBuilder) => SlashBuilders;

export interface MessageCommandOptions {
  aliases?: string[];
}

export enum CommandType {
  Slash = "slash",
  Message = "message",
  Combined = "combined",
}

export type CommandInteractionType<Type extends CommandType> =
  Type extends CommandType.Slash ? ChatInputCommandInteraction
  : Type extends CommandType.Message ? Message
  : CombinedInteraction;

export type CommandReplyType<Type extends CommandType> =
  Type extends CommandType.Slash ? InteractionResponse
  : Type extends CommandType.Message ? Message
  : InteractionResponse | Message;

export type UseMessageType<Type extends CommandType, Data> =
  Type extends CommandType.Slash ? never : Data;

export type UseSlashType<Type extends CommandType, Data> =
  Type extends CommandType.Message ? never : Data;

export type OptionMap = Options[] | StringMap<Options[] | StringMap<Options[]>>;

export type CommandRunners<Type extends CommandType> =
  | CommandExecuteFunction<Type>
  | StringMap<
      CommandExecuteFunction<Type> | StringMap<CommandExecuteFunction<Type>>
    >;

// {
//   //* subcommand group
//   test: {
//     test2: ["..."]; //* subcommand group command with options
//     test2: []; //* subcommand group command without options
//   }
//   test: []; //* subcommand without options
//   test: ["..."]; //* subcommand with options
// }

export interface OptionData {
  name: string;
  type: OptionTypes;
}

export type Options = OptionData;

// TODO: Add attachment option in the future.

export type OptionBuilders =
  | SlashCommandRoleOption
  | SlashCommandUserOption
  | SlashCommandNumberOption
  | SlashCommandStringOption
  | SlashCommandBooleanOption
  | SlashCommandChannelOption
  | SlashCommandIntegerOption
  | SlashCommandMentionableOption;

//* Languages

//? Language texts

export interface LanguageOptions<Data> {
  languages: Locale[];
  texts: LanguageTexts;
  commandTexts: StringMap<LanguageCommandTexts<Data>>;
}

export type LanguageOptionsOnlyTexts<Data> = {
  options?: LanguageOptionTextData<Data>[];
} & Data;

export type LanguageOptionTextData<Data> = {
  choices?: Data extends FinalLanguageBaseCommandTexts ?
    Partial<FinalLanguageBaseCommandTexts>[]
  : string[];
} & Data;

export type LanguageSubcommandsOnlyTexts<Data> = {
  subcommands?: LanguageSubcommandTexts<Data>[];
  subcommandGroups?: LanguageSubcommandGroupTexts<Data>[];
} & Data;

export type LanguageSubcommandTexts<Data> = {
  options?: LanguageOptionTextData<Data>[];
} & Data;

export type LanguageSubcommandGroupTexts<Data> = {
  subcommands: LanguageSubcommandTexts<Data>[];
} & Data;

export type LanguageCommandTexts<Data> =
  | LanguageOptionsOnlyTexts<Data>
  | LanguageSubcommandsOnlyTexts<Data>;

//? Language text types

export interface CompiledLanguageBaseCommandTexts {
  name_localizations: LocalizationMap;
  description_localizations: LocalizationMap;
}

export interface LanguageBaseCommandTexts {
  name: string;
  description: string;
}

export interface FinalLanguageBaseCommandTexts
  extends CompiledLanguageBaseCommandTexts,
    LanguageBaseCommandTexts {}

// TODO: Complete langauge and command texts.
export interface LanguageTexts {
  ping: Replacer<1>;
}

// TODO: Add the options data.
/**
 * Attachment: name, description
 * Boolean: name, description
 * Channel: name, description
 * Integer: name, description, choices
 * Mentionable: name, description
 * Number: name, description, choices
 * Role: name, description
 * String: name, description, choices
 * User: name, description
 * Subcommand: name, description, (options)
 * SubcommandGroup: name, description, (options)
 */

export type GetTextResult<Key extends keyof LanguageTexts | undefined> =
  Key extends string ? LanguageTexts[Key] : LanguageTexts;

export type GetCommandTextResult<
  Key extends keyof LanguageCommandTexts<LanguageBaseCommandTexts> | undefined,
> =
  Key extends string ? LanguageCommandTexts<LanguageBaseCommandTexts>[Key]
  : StringMap<LanguageCommandTexts<LanguageBaseCommandTexts>>;

export type Replacer<StringSize extends number> = (
  ...strings: FixedSizeArray<string, StringSize>
) => string;

export type GetLanguageReturn<UseDefault extends boolean> =
  UseDefault extends true ? Language : Language | undefined;

//* Configs

export interface ConfigOptions {
  configPath: string;
  configVerification: ObjectVerifier;
}

export interface BaseConfigData {
  bot: BaseConfigBotData;
  commands: BaseConfigCommandsData;
}

export interface BaseConfigBotData {
  token: string;
  defaultLanguage: string;
  developers: string[];
}

export interface BaseConfigCommandsData {
  defaultPrefix: string;
}
