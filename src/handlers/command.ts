import { Client, SlashCommandBuilder } from "discord.js";
import { readClassDirectory } from "../utils/readClassDirectory.js";
import { commandLogger } from "./logger.js";
import { Command } from "../classes/command.js";

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
      commandLogger.error(
        `Combined or slash command has missing slash command data in "${loggedPath}"`,
      );
      return false;
    }

    command.setCommandPath(loggedPath);

    // const fileName = command.getCommandFileName();

    return true;
  };

  return await readClassDirectory(
    Command,
    commandsDir,
    commandLogger,
    commandVerification,
  );
}

export async function registerCommands(client: Client<true>): Promise<void> {
  const newCommands = await readCommands();
  validateCommandConfigurations(newCommands);

  const slashCommands = newCommands.reduce<SlashCommandBuilder[]>(
    (total, command) => {
      const { slashCommandData } = command;
      return slashCommandData ? [...total, slashCommandData] : total;
    },
    [],
  );

  await client.application.commands.set(slashCommands);
  commands = newCommands;
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

  const nameAliasConflicts = commands.filter((command) =>
    command
      .listAllNames()
      .some((text, index, array) => array.indexOf(text) !== index),
  );

  if (nameAliasConflicts.length) {
    const loggedCommands = nameAliasConflicts
      .map((command) => command.getCommandPath())
      .join(", ");

    return commandLogger.throw(
      `Some commands include command name in aliases (${loggedCommands})`,
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
