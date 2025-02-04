import { Subcommand } from "../../classes/subcommand.js";
import { userDatabase } from "../../handlers/database.js";
import { getLanguage, getLanguageByCode } from "../../handlers/language.js";
import { isSlashInteraction } from "../../utils/commands.js";
import { infoEmbed } from "../../utils/embeds.js";
import { strJoin } from "../../utils/strings.js";

export default new Subcommand({
  execute({ helpers, language, interaction }) {
    const texts = language.getText("language").info;
    const userId = helpers.getUser().id;
    const userLanguage =
      getLanguageByCode(userDatabase.get(userId)?.language)?.name ??
      texts.notDefined;
    const accountLanguage =
      isSlashInteraction(interaction) ?
        (getLanguage(interaction.locale)?.name ?? texts.unknown)
      : texts.unknown;

    const infoMessage = strJoin([
      texts.displayInfo(language.name),
      texts.accountInfo(accountLanguage),
      texts.userInfo(userLanguage),
    ]);

    return helpers.reply({ embeds: [infoEmbed(infoMessage)] });
  },
});
