import { Subcommand } from "../../classes/subcommand.js";
import { userDatabase } from "../../handlers/database.js";
import { successEmbed } from "../../utils/embeds.js";
import { removeKey } from "../../utils/objects.js";

export default new Subcommand({
  execute({ helpers, language }) {
    const texts = language.getText("language");
    const userId = helpers.getUser().id;
    userDatabase.set(userId, (data) =>
      data ? removeKey(data, "language") : data,
    );

    return helpers.reply({ embeds: [successEmbed(texts.clear)] });
  },
});
