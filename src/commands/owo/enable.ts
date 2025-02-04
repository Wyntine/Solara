import { CommandOptionConfig } from "../../classes/commandOptions.js";
import { Option } from "../../classes/option.js";
import { Subcommand } from "../../classes/subcommand.js";

const stringOption = Option.createStringOption();
const options = new CommandOptionConfig(stringOption);

export default new Subcommand({
  options,
  execute({ helpers }) {
    return helpers.reply({ content: "Test" });
  },
});
