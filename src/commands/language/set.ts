import { CommandOptionConfig } from "../../classes/commandOptions.ts";
import { Option } from "../../classes/option.ts";
import { Subcommand } from "../../classes/subcommand.ts";
import { getLanguageByCode, getLanguages } from "../../handlers/language.ts";
import { errorEmbed, successEmbed } from "../../utils/embeds.ts";
import { strJoin } from "../../utils/strings.ts";
import { userDatabase } from "../../handlers/database.ts";

const languageOption = Option.createStringOption({
  required: true,
  choices: getLanguages().map((language) => ({
    name: language.name,
    value: language.code,
  })),
  maxLength: 3,
  minLength: 2,
});

const options = new CommandOptionConfig(languageOption);

export default new Subcommand({
  options,
  execute({ helpers, language }) {
    const texts = language.getText("language").set;
    const userId = helpers.getUser().id;
    const newLanguage = helpers.getStringOption(languageOption);

    if (!newLanguage) {
      return helpers.reply({ embeds: [errorEmbed(texts.noInput)] });
    }

    const detectedLanguage = getLanguageByCode(newLanguage);

    if (!detectedLanguage) {
      const allLanguages = getLanguages()
        .map((language) => language.code)
        .join(", ");
      const errorMessage = strJoin([
        texts.error,
        texts.languages(allLanguages),
      ]);

      return helpers.reply({ embeds: [errorEmbed(errorMessage)] });
    }

    const successMessage = detectedLanguage.getText("language").set.success;

    userDatabase.overwrite(userId, { language: newLanguage });
    return helpers.reply({
      embeds: [successEmbed(successMessage(detectedLanguage.name))],
    });
  },
});
