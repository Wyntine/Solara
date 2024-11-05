import { Command } from "../classes/command.js";
import { commandLogger } from "./logger.js";
import { isArray } from "@wyntine/verifier";
import { readClassDirectory } from "../utils/readClassDirectory.js";
/* eslint-disable @typescript-eslint/ban-ts-comment */

/**
 * TODO: Fix type conflicts and remove @ts-ignore
 * TODO - I do not think it is possible because of discord.js typings
 */

import type {
  AvailableSlashCommandOptions,
  FinalLanguageBaseCommandTexts,
  LanguageCommandTexts,
  LanguageOptionTextData,
  LanguageSubcommandGroupTexts,
  LanguageSubcommandTexts,
} from "../types/files.types.js";
import {
  Client,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

let commands: Command[] = [];
const commandsDir = "commands";

export function getCommands(): Command[] {
  return commands;
}

export function getCommand(name: string): Command | undefined {
  return commands.find((command) => command.listAllNames().includes(name));
}

export async function readCommands(): Promise<Command[]> {
  const commandVerification = (
    command: Command,
    loggedPath: string,
  ): boolean => {
    const slashData = command.slashCommandData;
    const isMessageCommand = command.isMessageOnly();

    if (!isMessageCommand && !slashData) {
      commandLogger.warn(
        `Command has missing slash data in "${loggedPath}", creating slash data...`,
      );
      command.slashCommandData = new SlashCommandBuilder();
    }

    command.setCommandPath(loggedPath);
    command.compileLangData();
    command.reloadOptionMap();

    return true;
  };

  return await readClassDirectory(
    Command,
    commandsDir,
    commandLogger,
    commandVerification,
  );
}

export async function registerCommands(client?: Client<true>): Promise<void> {
  const newCommands = await readCommands();
  validateCommandConfigurations(newCommands);

  if (client) {
    const slashCommands = newCommands.reduce<SlashCommandBuilder[]>(
      (total, command) => {
        const { slashCommandData } = command;
        return slashCommandData ? [...total, slashCommandData] : total;
      },
      [],
    );
    await client.application.commands.set(slashCommands);
  }

  commands = newCommands;
}

export function compileSlashCommand<Builder extends SlashCommandBuilder>(
  builder: Builder,
  data: LanguageCommandTexts<FinalLanguageBaseCommandTexts>,
): Builder {
  const newBuilder = compileBaseCommandData(builder, data);
  const options = builder.options as AvailableSlashCommandOptions[];

  let subcommands = options.filter(
    (option) => option instanceof SlashCommandSubcommandBuilder,
  );

  let subcommandGroups = options.filter(
    (option) => option instanceof SlashCommandSubcommandGroupBuilder,
  );

  const subcommandOptions: AvailableSlashCommandOptions[] = [
    ...subcommands,
    ...subcommandGroups,
  ];

  let otherOptions = options.filter(
    (option) => !subcommandOptions.includes(option),
  );

  if (subcommands.length) {
    if (!("subcommands" in data)) {
      return commandLogger.throw("Missing subcommand language data.");
    }

    subcommands = compileSlashCommandSubcommands(subcommands, data.subcommands);
  }

  if (subcommandGroups.length) {
    if (!("subcommandGroups" in data)) {
      return commandLogger.throw("Missing subcommand groups language data.");
    }

    subcommandGroups = compileSlashCommandSubcommandGroups(
      subcommandGroups,
      data.subcommandGroups,
    );
  } else if (otherOptions.length) {
    if (!("options" in data)) {
      return commandLogger.throw("Missing options language data.");
    }

    otherOptions = compileSlashCommandOptions(otherOptions, data.options);
  }

  const finalOptions = [...subcommandGroups, ...subcommands, ...otherOptions];

  // @ts-ignore
  if (finalOptions.length) newBuilder.options = finalOptions;

  return newBuilder;
}

function compileSlashCommandSubcommands(
  subcommands: SlashCommandSubcommandBuilder[],
  languageData: LanguageSubcommandTexts<FinalLanguageBaseCommandTexts>[],
) {
  if (subcommands.length !== languageData.length) {
    return commandLogger.throw("Missing subcommand language data.");
  }

  return subcommands.map((subcommand, index) => {
    const data = languageData.at(index)!;
    return compileSlashCommandSubcommand(subcommand, data);
  });
}

function compileSlashCommandSubcommandGroups(
  subcommandGroups: SlashCommandSubcommandGroupBuilder[],
  languageData: LanguageSubcommandGroupTexts<FinalLanguageBaseCommandTexts>[],
) {
  if (subcommandGroups.length !== languageData.length) {
    return commandLogger.throw("Missing subcommand group language data.");
  }

  return subcommandGroups.map((subcommandGroup, index) => {
    const data = languageData.at(index)!;
    return compileSlashCommandSubcommandGroup(subcommandGroup, data);
  });
}

function compileSlashCommandOptions(
  options: AvailableSlashCommandOptions[],
  languageData: LanguageOptionTextData<FinalLanguageBaseCommandTexts>[],
) {
  if (options.length !== languageData.length) {
    return commandLogger.throw("Missing option language data.");
  }

  return options.map((subcommandGroup, index) => {
    const data = languageData.at(index)!;
    return compileSlashCommandOption(subcommandGroup, data);
  });
}

function compileSlashCommandOption<
  Builder extends AvailableSlashCommandOptions,
>(
  builder: Builder,
  languageData: LanguageOptionTextData<FinalLanguageBaseCommandTexts>,
): Builder {
  const newBuilder = compileBaseCommandData(builder, languageData);

  if (!("choices" in newBuilder) || !isArray(newBuilder.choices))
    return newBuilder;

  const choices = languageData.choices;

  if (!choices || newBuilder.choices.length !== choices.length) {
    return commandLogger.throw("Missing option choice data.");
  }

  // @ts-ignore
  newBuilder.choices = newBuilder.choices.map((choice, index) => {
    const data = choices.at(index)!;
    return { ...choice, ...data };
  });

  return newBuilder;
}

function compileSlashCommandSubcommand<
  Builder extends SlashCommandSubcommandBuilder,
>(
  builder: Builder,
  languageData: LanguageSubcommandTexts<FinalLanguageBaseCommandTexts>,
): Builder {
  const newBuilder = compileBaseCommandData(builder, languageData);

  if (!("options" in newBuilder)) return newBuilder;

  const options = languageData.options;

  if (!options || newBuilder.options.length !== options.length) {
    return commandLogger.throw("Missing options data.");
  }

  // @ts-ignore
  newBuilder.options = compileSlashCommandOptions(
    newBuilder.options as AvailableSlashCommandOptions[],
    options,
  );

  return newBuilder;
}

function compileSlashCommandSubcommandGroup<
  Builder extends SlashCommandSubcommandGroupBuilder,
>(
  builder: Builder,
  languageData: LanguageSubcommandGroupTexts<FinalLanguageBaseCommandTexts>,
): Builder {
  const newBuilder = compileBaseCommandData(builder, languageData);

  if (newBuilder.options.length !== languageData.subcommands.length) {
    return commandLogger.throw("Missing subcommand group data.");
  }

  // @ts-ignore
  newBuilder.options = compileSlashCommandSubcommands(
    newBuilder.options,
    languageData.subcommands,
  );

  return newBuilder;
}

function compileBaseCommandData<
  Builder extends Partial<FinalLanguageBaseCommandTexts>,
>(builder: Builder, data: FinalLanguageBaseCommandTexts): Builder {
  const { name, description, name_localizations, description_localizations } =
    data;

  builder.name = name;
  builder.description = description;
  builder.name_localizations = name_localizations;
  builder.description_localizations = description_localizations;

  return builder;
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
      .map((command) => command.getCommandPath())
      .join(", ");

    return commandLogger.throw(
      `Same command name or aliases (${loggedCommands}) found.`,
    );
  }

  const guildConflicts = commands.filter(
    ({ allowedGuilds, excludedGuilds }) =>
      allowedGuilds.length && excludedGuilds.length,
  );

  if (guildConflicts.length) {
    const loggedCommands = guildConflicts
      .map((command) => command.getCommandPath())
      .join(", ");

    return commandLogger.throw(
      `Some commands use allowed and excluded guilds together (${loggedCommands})`,
    );
  }
}
