import { Subcommand } from "../../classes/subcommand.js";

export default new Subcommand({
  async execute({ helpers }) {
    await helpers.reply({ content: "Test" });
    helpers.startCooldown(7);
  },
});
