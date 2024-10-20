import { Command } from "../classes/command.js";
import { CommandType } from "../types/files.types.js";

export default new Command({
  type: CommandType.Combined,
  slashCommandData: (builder) =>
    builder
      .setName("owo")
      .setDescription("Manages owo reminder")
      .addSubcommand((subcommand) =>
        subcommand.setName("list").setDescription("Lists reminders"),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("enable")
          .setDescription("Enables selected or all reminders")
          .addStringOption((reminders) =>
            reminders
              .setName("reminders")
              .setDescription("Reminders to enable (seperated with spaces)")
              .setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("disable")
          .setDescription("Disables selected or all reminders")
          .addStringOption((reminders) =>
            reminders
              .setName("reminders")
              .setDescription("Reminders to disable (seperated with spaces)")
              .setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("on").setDescription("Enables all reminders"),
      )
      .addSubcommand((subcommand) =>
        subcommand.setName("off").setDescription("Disables all reminders"),
      ),
  execute({ helpers }) {
    helpers.useCommandRunners(
      {
        list: () => {
          void helpers.reply({ content: "Used subcommand 'List'" });
        },
      },
      async () => {
        await helpers.reply({ content: "Please give a valid input." });
      },
    );

    // const option = helpers.getStringOption("reminders") ?? "(None)";

    // await helpers.reply({
    //   content: `Inputted reminders: ${option}`,
    // });
  },
});
