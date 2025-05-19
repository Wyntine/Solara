import { Subcommand } from "../../classes/subcommand.ts";
import { userDatabase } from "../../handlers/database.ts";
import { getLanguage, getLanguageByCode } from "../../handlers/language.ts";
import { isSlashInteraction } from "../../utils/commands.ts";
import { infoEmbed } from "../../utils/embeds.ts";
import { strJoin } from "../../utils/strings.ts";

export default new Subcommand({
  execute({ helpers, language, interaction }) {
    const texts = language.getText("language").info;
    const userId = helpers.getUser().id;
    const userLanguage =
      getLanguageByCode(userDatabase.get(userId)?.language)?.name ??
      texts.notDefined;
    const accountLanguage = isSlashInteraction(interaction)
      ? getLanguage(interaction.locale)?.name ?? texts.unknown
      : texts.unknown;

    const infoMessage = strJoin([
      texts.displayInfo(language.name),
      texts.accountInfo(accountLanguage),
      texts.userInfo(userLanguage),
    ]);

    return helpers.reply({ embeds: [infoEmbed(infoMessage)] });
  },
});
