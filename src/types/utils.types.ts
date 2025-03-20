import {
  ApplicationCommandOptionType,
  type Channel,
  type GuildMember,
  type InteractionReplyOptions,
  type MessageReplyOptions,
  type Role,
  type User,
} from "discord.js";
import type { CommandInteractionType, CommandType } from "./files.types.js";

import type { Command } from "../classes/command.js";
import type { JsonDatabaseController } from "../handlers/database/controllers/jsonController.js";
import type { YamlDatabaseController } from "../handlers/database/controllers/yamlController.js";

export interface LogControlKey {
  key: string;
}

export type RequiredStringMap<Map> = Map extends StringMap<infer Type>
  ? Record<string, Type>
  : Map;

export type FixedSizeArray<
  T,
  N extends number,
  R extends T[] = [],
> = R["length"] extends N ? R : FixedSizeArray<T, N, [T, ...R]>;

export interface CommandHelperOptions<Type extends CommandType> {
  interaction: CommandInteractionType<Type>;
  command: Command<Type>;
  args?: string[];
}

export type HelperReplyOptions<Type extends CommandType> =
  Type extends CommandType.Message
    ? MessageReplyOptions
    : Type extends CommandType.Slash
    ? InteractionReplyOptions
    : MessageReplyOptions | InteractionReplyOptions;

export enum OptionTypes {
  Role = "role",
  String = "string",
  User = "user",
  Member = "member",
  Channel = "channel",
  Mentionable = "mentionable",
  Number = "number",
  Boolean = "boolean",
  Integer = "integer",
}

export const OptionCommandTypeMap = {
  [OptionTypes.Boolean]: ApplicationCommandOptionType.Boolean,
  [OptionTypes.String]: ApplicationCommandOptionType.String,
  [OptionTypes.Channel]: ApplicationCommandOptionType.Channel,
  [OptionTypes.Integer]: ApplicationCommandOptionType.Integer,
  [OptionTypes.Mentionable]: ApplicationCommandOptionType.Mentionable,
  [OptionTypes.Number]: ApplicationCommandOptionType.Number,
  [OptionTypes.Role]: ApplicationCommandOptionType.Role,
  [OptionTypes.User]: ApplicationCommandOptionType.User,
  [OptionTypes.Member]: ApplicationCommandOptionType.User,
} as const;

export type CapitalizeFirstLetter<T extends string> =
  T extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : T;

export interface OptionDataTypes {
  [OptionTypes.Role]: Role;
  [OptionTypes.String]: string;
  [OptionTypes.User]: User;
  [OptionTypes.Member]: GuildMember;
  [OptionTypes.Channel]: Channel;
  [OptionTypes.Mentionable]: GuildMember | User | Role;
  [OptionTypes.Number]: number;
  [OptionTypes.Boolean]: boolean;
  [OptionTypes.Integer]: number;
}

export type OptionParser<Data> = (data: string | undefined) => Data | undefined;

export enum DatabaseType {
  JSON = "json",
  YAML = "yaml",
}
export type DatabaseOptions<Type extends DatabaseType> =
  Type extends DatabaseType.JSON
    ? FileDatabaseOptions
    : Type extends DatabaseType.YAML
    ? FileDatabaseOptions
    : never;

export interface FileDatabaseOptions {
  filePath: string;
}

export type DatabaseControllers<Data> =
  | JsonDatabaseController<Data>
  | YamlDatabaseController<Data>;

export type UserDatabase = StringMap<UserData>;
export type CooldownDatabase = StringMap<CooldownData>;

export interface UserData {
  language?: string;
}

export type CooldownData = CooldownItem[];
export interface CooldownItem {
  commandPath: string;
  expirationDate: number;
  isChecked?: boolean;
}

export type StringMap<Data> = Partial<Record<string, Data>>;

export type ObjectKeyMap<
  Obj extends object,
  RequiredObj = DeepRequired<Obj>,
> = {
  [Key in keyof RequiredObj]: Key extends string
    ? RequiredObj[Key] extends object
      ? `${Key}.${ObjectKeyMap<RequiredObj[Key]>}`
      : Key
    : never;
}[keyof RequiredObj];

export type GetItemFromKeyMap<Obj, Key extends string> = Obj extends object
  ? Key extends `${infer FirstKey}.${infer OtherKeys}`
    ? FirstKey extends keyof Obj
      ? Obj[FirstKey] extends object
        ? GetItemFromKeyMap<Obj[FirstKey], OtherKeys>
        : undefined
      : undefined
    : Key extends string
    ? Key extends keyof Required<Obj>
      ? Obj[Key]
      : undefined
    : never
  : Obj;

export type DeepPartial<Obj> = Obj extends object
  ? Obj extends unknown[]
    ? Obj
    : {
        [Key in keyof Obj]?: DeepPartial<Obj[Key]>;
      }
  : Obj;

export type DeepRequired<Obj> = Obj extends object
  ? Obj extends unknown[]
    ? Obj
    : {
        [Key in keyof Obj]-?: DeepRequired<Obj[Key]>;
      }
  : Obj;
