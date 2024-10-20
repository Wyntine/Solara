import { Locale } from "discord.js";
import { createReplacer } from "../utils/strings.js";
import { Language } from "../classes/language.js";

export default new Language({
  languages: [Locale.Turkish],
  texts: {
    ping: createReplacer("Botun gecikmesi **{0}** milisaniye."),
  },
  commandTexts: {
    ping: {
      name: "gecikme",
      description: "Botun gecikmesini gösterir.",
    },
  },
});
