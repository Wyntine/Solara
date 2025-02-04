import { Command } from "../classes/command.js";
import { commandLogger } from "./logger.js";
import {
  baseDir,
  dev,
  readClassFile,
  scriptFileFilter,
} from "../utils/readClassDirectory.js";

import {
  CommandType,
  type CommandOptions,
  type FinalLanguageBaseCommandTexts,
  type LanguageCommandTexts,
} from "../types/files.types.js";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Client,
  CommandInteraction,
  Message,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { config } from "./config.js";
import { OptionCommandTypeMap, type StringMap } from "../types/utils.types.js";
import { join } from "path";
import { readdir } from "fs/promises";
import { CommandConfig } from "../classes/commandConfig.js";
import { Subcommand } from "../classes/subcommand.js";
import { SubcommandGroup } from "../classes/subcommandGroup.js";
import {
  convertToSnakeCase,
  getObjectSize,
  removeKey,
} from "../utils/objects.js";
import { getCommandText } from "./language.js";
import { CommandHelper } from "../utils/commands.js";

let commands: Command[] = [];
const commandsDir = "commands";

const configFileName = `_config.${dev ? "ts" : "js"}`;

export function getCommands(): Command[] {
  return commands;
}

export function getCommand(name: string): Command | undefined {
  return commands.find((command) => command.listAllNames().includes(name));
}

export function createCommand(): Partial<RESTPostAPIChatInputApplicationCommandsJSONBody> {
  return {
    type: ApplicationCommandType.ChatInput,
  } as const;
}

export function createSubcommand() {
  return {
    type: ApplicationCommandOptionType.Subcommand,
  } as const;
}

export function createSubcommandGroup() {
  return {
    type: ApplicationCommandOptionType.SubcommandGroup,
  } as const;
}

export function prepareMessageCommandHelper(
  message: Message,
): CommandHelper<CommandType> | undefined {
  if (message.author.bot) return;

  const prefix = config.get().commands.defaultPrefix;

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  const command = getCommand(commandName);

  if (!command?.getConfig().enabled) return;

  return new CommandHelper({
    command,
    interaction: message,
    args,
  });
}

export function prepareSlashCommandHelper(
  interaction: CommandInteraction,
): CommandHelper<CommandType> | undefined {
  if (interaction.user.bot || !interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;

  if (!commandName) return;

  const command = getCommand(commandName);

  if (!command?.getConfig().enabled) return;

  return new CommandHelper({
    command,
    interaction,
  });
}

export async function readCommands(): Promise<Command[]> {
  const commands: Command[] = [];
  const basePath = join(baseDir, commandsDir);
  const files = (await readdir(basePath, { withFileTypes: true })).filter(
    (file) => file.isDirectory() || scriptFileFilter(file),
  );

  for (const file of files) {
    const filePath = join(basePath, file.name);
    const loggedPath = filePath.slice(baseDir.length + 1);

    if (file.isDirectory()) {
      const commandText = getCommandText(file.name);

      if (!commandText) {
        commandLogger.error(
          `No language texts found for command "${loggedPath}"`,
        );
        continue;
      }

      //! Reading subcommands
      const config = await readClassFile(
        CommandConfig,
        join(loggedPath, configFileName),
      );

      if (!config) {
        commandLogger.warn(
          `Invalid or empty command config export in "${loggedPath}"`,
        );
      }

      const subFiles = (
        await readdir(filePath, { withFileTypes: true })
      ).filter(
        (file) =>
          (file.isDirectory() || scriptFileFilter(file)) &&
          file.name !== configFileName,
      );

      const subcommands: Subcommand[] = [];
      const subcommandGroups: SubcommandGroup[] = [];

      for (const subFile of subFiles) {
        const subGroupPath = join(filePath, subFile.name);
        const subGroupImportPath = join(loggedPath, subFile.name);

        if (subFile.isDirectory()) {
          //! Reading subcommand group

          const subcommandGroupText =
            "subcommandGroups" in commandText ?
              commandText.subcommandGroups[
                subFile.name as keyof typeof commandText
              ]
            : undefined;

          if (!subcommandGroupText) {
            commandLogger.error(
              `No language texts found for subcommand group "${loggedPath}"`,
            );
            continue;
          }

          const subcommandGroupConfig = await readClassFile(
            CommandConfig,
            join(subGroupImportPath, configFileName),
          );

          if (!subcommandGroupConfig) {
            commandLogger.warn(
              `Invalid or empty subcommand group config export in "${subGroupImportPath}"`,
            );
          }

          const subGroupFiles = (
            await readdir(subGroupPath, {
              withFileTypes: true,
            })
          ).filter(scriptFileFilter);

          const groupSubcommands: Subcommand[] = [];

          for (const subGroupFile of subGroupFiles) {
            //! Reading subcommands inside subcommand group
            const subGroupSubImportPath = join(
              subGroupImportPath,
              subGroupFile.name,
            );

            const subcommand = await readClassFile(
              Subcommand,
              subGroupSubImportPath,
            );

            if (!subcommand) {
              commandLogger.error(
                `Invalid subcommand export in "${subGroupImportPath}"`,
              );
              continue;
            }

            subcommand.setFilePath(subGroupSubImportPath);
            const subcommandName = subcommand.getFileName();

            const subcommandText =
              subcommandGroupText.subcommands[subcommandName];

            if (!subcommandText) {
              commandLogger.error(
                `No language texts found for subcommand "${loggedPath}"`,
              );
              continue;
            }

            subcommand.setLangData(subcommandText);
            groupSubcommands.push(subcommand);
          }

          if (!groupSubcommands.length) {
            commandLogger.warn(
              `No suitable subcommands found in "${subGroupImportPath}"`,
            );
            continue;
          }

          const subcommandGroupInput =
            subcommandGroupConfig ? { config: subcommandGroupConfig } : {};

          const subcommandGroup = new SubcommandGroup(subcommandGroupInput);
          subcommandGroup.addSubcommands(groupSubcommands);
          subcommandGroup.setLangData(subcommandGroupText);
        } else {
          //! Reading subcommand
          const subcommand = await readClassFile(
            Subcommand,
            subGroupImportPath,
          );

          if (!subcommand) {
            commandLogger.error(
              `Invalid subcommand export in "${subGroupImportPath}"`,
            );
            continue;
          }

          subcommand.setFilePath(subGroupImportPath);
          const subcommandName = subcommand.getFileName();

          const subcommandText =
            "subcommands" in commandText ?
              commandText.subcommands[subcommandName]
            : undefined;

          if (!subcommandText) {
            commandLogger.error(
              `No language texts found for subcommand "${loggedPath}"`,
            );
            continue;
          }

          subcommand.setLangData(subcommandText);
          subcommands.push(subcommand);
        }
      }

      const commandInput: CommandOptions<CommandType> = {
        ...(config ? { config } : {}),
      };

      const command = new Command(commandInput);

      command.addSubcommandGroups(subcommandGroups);
      command.addSubcommands(subcommands);

      command.setFilePath(loggedPath);
      command.setLangData();
      commands.push(command);
    } else {
      const command = await readClassFile(Command, loggedPath);

      if (!command) {
        commandLogger.error(`Invalid command export in "${loggedPath}"`);
        continue;
      }

      command.setFilePath(loggedPath);
      command.setLangData();
      commands.push(command);
    }
  }

  return commands;
}

export async function registerCommands(): Promise<number> {
  commands = await readCommands();
  return commands.length;
}

export async function registerSlashCommands(
  client?: Client<true>,
): Promise<void> {
  validateCommandConfigurations(commands);

  if (client && config.get().commands.registerOnStart) {
    const slashCommands = commands.reduce<
      RESTPostAPIChatInputApplicationCommandsJSONBody[]
    >((total, command) => {
      const slashCommandData = compileCommand(command);
      return slashCommandData ? [...total, slashCommandData] : total;
    }, []);
    await client.application.commands.set(slashCommands);
    commandLogger.info(
      `${slashCommands.length.toString()} slash commands registered.`,
    );
  } else {
    commandLogger.warn(
      "Slash commands are not registered. Set commands.registerOnStart to true in the config to register slash commands.",
    );
  }
}

export function compileCommand(
  command: Command,
): RESTPostAPIChatInputApplicationCommandsJSONBody | undefined {
  if (command.isMessageOnly()) return;

  const texts = command.getTexts();
  const newBuilder = compileBaseCommandData(createCommand(), texts);

  if ("options" in texts) {
    return compileCommandOptions(newBuilder, command, texts.options);
  }

  const options = [];

  if ("subcommands" in texts) {
    options.push(...compileSubcommands(command, texts.subcommands));
  }

  if ("subcommandGroups" in texts) {
    options.push(...compileSubcommandGroups(command, texts.subcommandGroups));
  }

  return options.length ? { ...newBuilder, options } : newBuilder;
}

function compileSubcommandGroups(
  command: Command,
  languageSubcommandGroups: StringMap<
    LanguageCommandTexts<FinalLanguageBaseCommandTexts>
  >,
) {
  const subcommandGroups = command.getSubcommandGroups();
  const languageSubcommandGroupsLength = Object.keys(
    languageSubcommandGroups,
  ).length;

  if (subcommandGroups.length !== languageSubcommandGroupsLength) {
    return commandLogger.throw(
      "Missing or different subcommand group language data.",
    );
  }

  if (!subcommandGroups.length) return [];

  const finalSubcommandGroups = [];

  for (const subcommandGroup of subcommandGroups) {
    const finalSubcommandGroup = compileSubcommandGroup(
      subcommandGroup,
      languageSubcommandGroups,
    );
    finalSubcommandGroups.push(finalSubcommandGroup);
  }

  return finalSubcommandGroups;
}

function compileSubcommandGroup(
  subcommandGroup: SubcommandGroup,
  languageSubcommandGroups: StringMap<
    LanguageCommandTexts<FinalLanguageBaseCommandTexts>
  >,
) {
  const subcommandGroupName = subcommandGroup.getFileName();

  if (!(subcommandGroupName in languageSubcommandGroups)) {
    return commandLogger.throw(
      `Missing language data for subcommand "${subcommandGroupName}"`,
    );
  }

  const languageSubcommandGroup =
    languageSubcommandGroups[subcommandGroupName]!;
  const newBuilder = compileBaseCommandData(
    createSubcommandGroup(),
    languageSubcommandGroup,
  );

  const subcommands = [];

  if ("subcommands" in languageSubcommandGroup) {
    subcommands.push(
      ...compileSubcommands(
        subcommandGroup,
        languageSubcommandGroup.subcommands,
      ),
    );
  }

  return subcommands.length ?
      { ...newBuilder, options: subcommands }
    : newBuilder;
}

function compileSubcommands(
  command: Command | SubcommandGroup,
  languageSubcommands: StringMap<
    LanguageCommandTexts<FinalLanguageBaseCommandTexts>
  >,
) {
  const subcommands = command.getSubcommands();
  const languageSubcommandsLength = getObjectSize(languageSubcommands);

  if (subcommands.length !== languageSubcommandsLength) {
    return commandLogger.throw(
      "Missing or different subcommand language data.",
    );
  }

  if (!subcommands.length) return [];

  const finalSubcommands = [];

  for (const subcommand of subcommands) {
    const finalSubcommand = compileSubcommand(subcommand, languageSubcommands);
    finalSubcommands.push(finalSubcommand);
  }

  return finalSubcommands;
}

function compileSubcommand(
  subcommand: Subcommand,
  languageSubcommands: StringMap<
    LanguageCommandTexts<FinalLanguageBaseCommandTexts>
  >,
) {
  const subcommandName = subcommand.getFileName();

  if (!(subcommandName in languageSubcommands)) {
    return commandLogger.throw(
      `Missing language data for subcommand "${subcommandName}"`,
    );
  }

  const languageSubcommand = languageSubcommands[subcommandName]!;
  const newBuilder = compileBaseCommandData(
    createSubcommand(),
    languageSubcommand,
  );

  if ("options" in languageSubcommand) {
    return compileCommandOptions(
      newBuilder,
      subcommand,
      languageSubcommand.options,
    );
  }

  return newBuilder;
}

function compileCommandOptions<Builder extends object>(
  builder: Builder,
  command: Command | Subcommand,
  languageOptions: LanguageCommandTexts<FinalLanguageBaseCommandTexts>[],
): Builder {
  const options = command.getOptions();
  const optionsLength = getObjectSize(options);
  const languageOptionsLength = getObjectSize(languageOptions);

  if (optionsLength !== languageOptionsLength) {
    return commandLogger.throw(
      "Missing or different option language/config data.",
    );
  }

  const finalOptions = options.map((option, index) => {
    const languageOption = removeKey(languageOptions[index]!, "errorMessages");
    const commandOption = option.getSettings();

    const finalChoices =
      "choices" in commandOption ?
        "choices" in languageOption ?
          (languageOption.choices as { name: string }[]).map(
            ({ name }, index) => ({
              name,
              value: commandOption.choices![index]!,
            }),
          )
        : commandOption.choices.map((choice) => ({
            name: choice,
            value: choice,
          }))
      : [];

    return convertToSnakeCase({
      ...commandOption,
      ...languageOption,
      ...(finalChoices.length ? { choices: finalChoices } : {}),
      type: OptionCommandTypeMap[commandOption.type],
    });
  });

  return finalOptions.length ? { ...builder, options: finalOptions } : builder;
}

function compileBaseCommandData<Builder>(
  builder: Builder,
  data: FinalLanguageBaseCommandTexts,
): Builder & FinalLanguageBaseCommandTexts {
  const { name, description, name_localizations, description_localizations } =
    data;

  return {
    ...builder,
    name,
    description,
    name_localizations,
    description_localizations,
  };
}

function validateCommandConfigurations(commands: Command[]): void {
  const nameConflicts = commands.filter((command, index) => {
    const names = command.listAllNames();
    const matchIndex = commands.findIndex(
      (cmd, i) => cmd.hasAnyName(...names) && i !== index,
    );
    return matchIndex !== -1;
  });

  if (nameConflicts.length) {
    const loggedCommands = nameConflicts
      .map((command) => command.getFilePath())
      .join(", ");

    return commandLogger.throw(
      `Same command name or aliases (${loggedCommands}) found.`,
    );
  }

  const guildConflicts = commands.filter((command) => {
    const { allowedGuilds, excludedGuilds } = command.getConfig();
    return allowedGuilds.length && excludedGuilds.length;
  });

  if (guildConflicts.length) {
    const loggedCommands = guildConflicts
      .map((command) => command.getFilePath())
      .join(", ");

    return commandLogger.throw(
      `Some commands use allowed and excluded guilds together (${loggedCommands})`,
    );
  }
}
