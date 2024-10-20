import type {
  Channel,
  GuildMember,
  InteractionReplyOptions,
  Locale,
  MessageReplyOptions,
  Role,
  User,
} from "discord.js";
import type {
  CombinedInteraction,
  CommandInteractionType,
  CommandType,
} from "./files.types.js";
import type { JsonDatabaseController } from "../handlers/database/controllers/jsonController.js";
import type { YamlDatabaseController } from "../handlers/database/controllers/yamlController.js";
import type { Language } from "../handlers/language.js";
import type { Command } from "../classes/command.js";

export type FixedSizeArray<T, N extends number, R extends T[] = []> =
  R["length"] extends N ? R : FixedSizeArray<T, N, [T, ...R]>;

export interface CommandExecutableCheckOptions {
  command: Command;
  interaction: CombinedInteraction;
}

export interface CommandHelperOptions<Type extends CommandType> {
  interaction: CommandInteractionType<Type>;
  command: Command<Type>;
  language: Language;
  args?: string[];
}

export type HelperReplyOptions<Type extends CommandType> =
  Type extends CommandType.Message ? MessageReplyOptions
  : Type extends CommandType.Slash ? InteractionReplyOptions
  : MessageReplyOptions | InteractionReplyOptions;

export type Nullable<NonNull extends boolean, Data> =
  NonNull extends true ? Data : Data | undefined;

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

export const OptionTypeMap = {
  3: OptionTypes.String,
  4: OptionTypes.Integer,
  5: OptionTypes.Boolean,
  6: OptionTypes.User,
  7: OptionTypes.Channel,
  8: OptionTypes.Role,
  9: OptionTypes.Mentionable,
  10: OptionTypes.Number,
} as const;

export type OptionGetters = AddGetter<OptionTypes>;

export type CapitalizeFirstLetter<T extends string> =
  T extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : T;

export type AddGetter<T> =
  T extends `${infer EnumValue}` ? `get${CapitalizeFirstLetter<EnumValue>}`
  : never;

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
  Type extends DatabaseType.JSON ? FileDatabaseOptions
  : Type extends DatabaseType.YAML ? FileDatabaseOptions
  : never;

export interface FileDatabaseOptions {
  filePath: string;
}

export type DatabaseControllers<Data> =
  | JsonDatabaseController<Data>
  | YamlDatabaseController<Data>;

export type UserDatabase = Partial<Record<string, UserData>>;

export interface UserData {
  language?: Locale;
}

export type StringMap<Data> = Partial<Record<string, Data>>;
