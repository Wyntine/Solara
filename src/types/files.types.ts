import type {
  ApplicationCommandOptionAllowedChannelTypes,
  ApplicationCommandOptionChoiceData,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  InteractionContextType,
  InteractionResponse,
  Locale,
  LocalizationMap,
  Message,
} from "discord.js";
import {
  OptionTypes,
  type DeepPartial,
  type FixedSizeArray,
  type ObjectKeyMap,
  type OptionDataTypes,
  type StringMap,
} from "./utils.types.ts";
import type { Command } from "../classes/command.ts";
import type { CommandHelper } from "../utils/commands.ts";
import type { Language } from "../classes/language.ts";
import type { ObjectVerifier } from "@wyntine/verifier";
import type { CommandConfig } from "../classes/commandConfig.ts";
import type { CommandOptionConfig } from "../classes/commandOptions.ts";
import type { Subcommand } from "../classes/subcommand.ts";
import type { SubcommandGroup } from "../classes/subcommandGroup.ts";
import type { Option } from "../classes/option.ts";

//* Events

export type Categories = keyof ClientEvents;

export interface EventOptions<Category extends Categories> {
  category: Category;
  once?: boolean;
  enabled?: boolean;
  execute: EventExecuteFunction<Category>;
}

export type EventExecuteFunction<Category extends Categories> = (
  ...data: ClientEvents[Category]
) => unknown;

//* Commands

// TODO: Add attachment option in the future.

export type IsExecutableStatus = IsExecutableSuccess | IsExecutableFail;

export interface IsExecutableSuccess {
  executable: true;
}

export interface IsExecutableFail {
  executable: false;
  errorKey?: IsExecutableErrorKeys;
}

export type IsExecutableErrorKeys = ObjectKeyMap<IsExecutableErrors>;

export interface IsExecutableErrors {
  perms: {
    bot: string;
    user: string;
  };
  cooldown: string;
  options: {
    maxLength: string;
    minLength: string;
    choices: string;
    minValue: string;
    maxValue: string;
    required: string;
    // TODO: Look from the docs and write channel types according to that
    channelTypes: string;
  };
}

export type PartialIsExecutableErrors = DeepPartial<IsExecutableErrors>;

export type CommandOptionsDataWithoutType<Type extends OptionTypes> = Omit<
  CommandOptionsData<Type>,
  "type"
>;
export type CommandNames = [Default: string, ...Others: CommandName[]];
export type CommandName = [Locale: Locale, Name: string];

export interface ParsedInput {
  options?: ParsedOption[] | undefined;
  subcommand?: Subcommand | undefined;
  subcommandGroup?: SubcommandGroup | undefined;
}

export interface ParsedOption<OptionType extends OptionTypes = OptionTypes> {
  value: OptionDataTypes[OptionType] | undefined;
  option: Option;
}

export interface CommandConfigOptions<Type extends CommandType> {
  type?: Type;
  cooldown?: number;
  userPermissions?: bigint[];
  botPermissions?: bigint[];
  allowedGuilds?: string[];
  excludedGuilds?: string[];
  developerOnly?: boolean;
  enabled?: boolean;
  accessAreas?: InteractionContextType[];
}

export interface CommandOptions<Type extends CommandType> {
  config?: CommandConfig<Type>;
  options?: CommandOptionConfig;
  execute?: CommandExecuteFunction<Type>;
}

export interface SubcommandOptions<Type extends CommandType> {
  config?: CommandConfig<Type>;
  options?: CommandOptionConfig;
  execute: CommandExecuteFunction<Type>;
}

export interface SubcommandGroupOptions<Type extends CommandType> {
  config?: CommandConfig<Type>;
}

export type CommandExecuteFunction<Type extends CommandType> = (
  this: void,
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

export enum CommandType {
  Slash = "slash",
  Message = "message",
  Combined = "combined",
}

export type CommandInteractionType<Type extends CommandType> =
  Type extends CommandType.Slash
    ? ChatInputCommandInteraction
    : Type extends CommandType.Message
    ? Message
    : CombinedInteraction;

export type CommandReplyType<Type extends CommandType> =
  Type extends CommandType.Slash
    ? InteractionResponse
    : Type extends CommandType.Message
    ? Message
    : InteractionResponse | Message;

export type CommandOptionsData<OptionType extends OptionTypes = OptionTypes> = {
  [OptionTypes.String]: StringOption;
  [OptionTypes.Boolean]: BooleanOption;
  [OptionTypes.Channel]: ChannelOption;
  [OptionTypes.Integer]: IntegerOption;
  [OptionTypes.Mentionable]: MentionableOption;
  [OptionTypes.Number]: NumberOption;
  [OptionTypes.Role]: RoleOption;
  [OptionTypes.User]: UserOption;
  [OptionTypes.Member]: MemberOption;
}[OptionType];

export interface StringOption extends BaseOption<OptionTypes.String> {
  maxLength?: number;
  minLength?: number;
  choices?: string[] | ApplicationCommandOptionChoiceData<string>[];
}

export type BooleanOption = BaseOption<OptionTypes.Boolean>;

export interface ChannelOption extends BaseOption<OptionTypes.Channel> {
  channelTypes?: ApplicationCommandOptionAllowedChannelTypes[];
}

export interface IntegerOption extends BaseOption<OptionTypes.Integer> {
  choices?: number[] | ApplicationCommandOptionChoiceData<number>[];
  minValue?: number;
  maxValue?: number;
}

export type MentionableOption = BaseOption<OptionTypes.Mentionable>;

export interface NumberOption extends BaseOption<OptionTypes.Number> {
  choices?: number[] | ApplicationCommandOptionChoiceData<number>[];
  minValue?: number;
  maxValue?: number;
}

export type RoleOption = BaseOption<OptionTypes.Role>;

export type UserOption = BaseOption<OptionTypes.User>;

export type MemberOption = BaseOption<OptionTypes.Member>;

export interface BaseOption<OptionType extends OptionTypes> {
  type: OptionType;
  required?: boolean;
}

// {
//   //* subcommand group
//   test: {
//     test2: ["..."]; //* subcommand group command with options
//     test2: []; //* subcommand group command without options
//   }
//   test: []; //* subcommand without options
//   test: ["..."]; //* subcommand with options
// }

//* Languages

export type GetErrorMessageReturn<
  Key extends IsExecutableErrorKeys | undefined,
> = Key extends undefined ? PartialIsExecutableErrors : string | undefined;

//? Language texts

export interface LanguageOptions<Data> {
  code: string;
  name: string;
  languages: Locale[];
  texts: LanguageTexts;
  commandTexts: StringMap<LanguageCommandTexts<Data>>;
  errorMessages?: PartialIsExecutableErrors;
}

export type LanguageOptionsOnlyTexts<Data> = {
  options?: LanguageOptionTextData<Data>[];
  errorMessages?: PartialIsExecutableErrors;
} & Data;

export type LanguageOptionTextData<Data> = {
  choices?: Data extends FinalLanguageBaseCommandTexts
    ? Partial<FinalLanguageBaseCommandTexts>[]
    : string[];
} & Data;

export type LanguageSubcommandsOnlyTexts<Data> = {
  subcommands?: StringMap<LanguageSubcommandTexts<Data>>;
  subcommandGroups?: StringMap<LanguageSubcommandGroupTexts<Data>>;
  errorMessages?: PartialIsExecutableErrors;
} & Data;

export type LanguageSubcommandTexts<Data> = {
  options?: LanguageOptionTextData<Data>[];
  errorMessages?: PartialIsExecutableErrors;
} & Data;

export type LanguageSubcommandGroupTexts<Data> = {
  subcommands: StringMap<LanguageSubcommandTexts<Data>>;
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
  language: {
    clear: string;
    set: {
      noInput: string;
      error: string;
      languages: Replacer<1>;
      success: Replacer<1>;
    };
    info: {
      unknown: string;
      notDefined: string;
      accountInfo: Replacer<1>;
      displayInfo: Replacer<1>;
      userInfo: Replacer<1>;
    };
  };
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

export type GetCommandTextResult<Key extends string | undefined> =
  Key extends string
    ? LanguageCommandTexts<LanguageBaseCommandTexts>
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

//? Exported configs

export interface BaseConfigData {
  system: BaseConfigSystemData;
  bot: BaseConfigBotData;
  commands: BaseConfigCommandsData;
  logs: BaseConfigLogsData;
}

export interface BaseConfigSystemData {
  hotReload: boolean;
  registerOnReload: {
    commands: boolean;
    events: boolean;
  };
}

export interface BaseConfigBotData {
  token: string;
  defaultLanguage: string;
  developers: string[];
}

export interface BaseConfigCommandsData {
  defaultPrefix: string;
  registerOnStart: boolean;
}

export interface BaseConfigLogsData {
  warn: StringMap<boolean>;
  error: StringMap<boolean>;
  debug: StringMap<boolean>;
  info: StringMap<boolean>;
}
