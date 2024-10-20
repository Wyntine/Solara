import { Locale } from "discord.js";
import { createReplacer } from "../utils/strings.js";
import { Language } from "../classes/language.js";

export default new Language({
  languages: [Locale.EnglishGB, Locale.EnglishUS],
  texts: {
    ping: createReplacer("Bot's latency is **{0}** miliseconds."),
  },
  commandTexts: {
    ping: {
      name: "ping",
      description: "Shows bot's latency.",
    },
  },
});
