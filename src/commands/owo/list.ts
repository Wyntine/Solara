import { Subcommand } from "../../classes/subcommand.ts";

export default new Subcommand({
  async execute({ helpers }) {
    await helpers.reply({ content: "Test" });
    helpers.startCooldown(7);
  },
});
