import { CommandOptionConfig } from "../../classes/commandOptions.ts";
import { Option } from "../../classes/option.ts";
import { Subcommand } from "../../classes/subcommand.ts";

const stringOption = Option.createStringOption();
const options = new CommandOptionConfig(stringOption);

export default new Subcommand({
  options,
  execute({ helpers }) {
    return helpers.reply({ content: "Test" });
  },
});
