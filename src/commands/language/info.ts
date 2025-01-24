import { Subcommand } from "../../classes/subcommand.ts";
import { userDatabase } from "../../handlers/database.ts";
import { infoEmbed } from "../../utils/embeds.ts";
import { strJoin } from "../../utils/strings.ts";

export default new Subcommand({
  execute({ helpers, language }) {
    const texts = language.getText("language").info;
    const userId = helpers.getUser().id;
    const userLanguage = userDatabase.get(userId)?.language ?? texts.notDefined;

    const infoMessage = strJoin([
      texts.displayInfo(language.languages.at(0)!),
      texts.userInfo(userLanguage),
    ]);

    return helpers.reply({ embeds: [infoEmbed(infoMessage)] });
  },
});
