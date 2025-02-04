import { createReplacer } from "../utils/strings.js";
import { Language } from "../classes/language.js";
import { Locale } from "discord.js";

export default new Language({
  code: "en",
  name: "English",
  languages: [Locale.EnglishGB, Locale.EnglishUS],
  texts: {
    ping: createReplacer("Bot's latency is **{0}** miliseconds."),
    language: {
      clear: "Language cleared.",
      set: {
        noInput:
          "Please enter the code of the new language that you want to set to.",
        error: "Given language is not found.",
        languages: createReplacer("Available languages: {0}"),
        success: createReplacer("Your language is set to **{0}**"),
      },
      info: {
        unknown: "Unknown",
        notDefined: "Not defined",
        displayInfo: createReplacer("Display language: **{0}**"),
        accountInfo: createReplacer("Account language: **{0}**"),
        userInfo: createReplacer("User defined language: **{0}**"),
      },
    },
  },
  commandTexts: {
    ping: {
      name: "ping",
      description: "Shows bot's latency.",
    },
    owo: {
      name: "owo",
      description: "Manages OwO reminders",
      subcommands: {
        list: {
          name: "list",
          description: "Lists reminders",
        },
        enable: {
          name: "enable",
          description: "Enables selected or all reminders",
          options: [
            {
              name: "reminders",
              description: "Reminders to enable (seperated with spaces)",
            },
          ],
        },
        disable: {
          name: "disable",
          description: "Disables selected or all reminders",
          options: [
            {
              name: "reminders",
              description: "Reminders to disable (seperated with spaces)",
            },
          ],
        },
      },
    },
    language: {
      name: "language",
      description: "Sets the bot language for you.",
      subcommands: {
        clear: {
          name: "clear",
          description: "Clears user-defined display language.",
        },
        info: {
          name: "info",
          description: "Shows language info about the user.",
        },
        set: {
          name: "set",
          description: "Sets new display language for the user.",
          options: [
            {
              name: "new-lang",
              description: "The language to use",
            },
          ],
        },
      },
    },
  },
  errorMessages: {
    // TODO: Use placeholders
    cooldown:
      "You need to wait **{cooldown} seconds** to use the command again.",
  },
});
