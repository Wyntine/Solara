import { Subcommand } from "../../classes/subcommand.ts";
import { userDatabase } from "../../handlers/database.ts";
import { successEmbed } from "../../utils/embeds.ts";
import { removeKey } from "../../utils/objects.ts";

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
