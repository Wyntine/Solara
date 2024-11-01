import { Command } from "../classes/command.js";
import { CommandType } from "../types/files.types.js";

export default new Command({
  type: CommandType.Combined,
  slashCommandData: (builder) =>
    builder
      .addSubcommand((subcommand) => subcommand)
      .addSubcommand((subcommand) =>
        subcommand.addStringOption((reminders) => reminders.setRequired(false)),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .addStringOption((reminders) => reminders.setRequired(false))
          .addBooleanOption((option) => option),
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
