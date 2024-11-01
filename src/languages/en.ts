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
    owo: {
      name: "owo",
      description: "Manages owo reminders",
      subcommands: [
        {
          name: "list",
          description: "Lists reminders",
        },
        {
          name: "enable",
          description: "Enables selected or all reminders",
          options: [
            {
              name: "reminders",
              description: "Reminders to enable (seperated with spaces)",
            },
          ],
        },
        {
          name: "disable",
          description: "Disables selected or all reminders",
          options: [
            {
              name: "reminders",
              description: "Reminders to disable (seperated with spaces)",
            },
            {
              name: "deneme",
              description: "deneme",
            },
          ],
        },
      ],
    },
    text: {
      name: "text",
      description: "Prints what you write.",
      options: [
        {
          name: "message",
          description: "The message to print",
        },
      ],
    },
    language: {
      name: "language",
      description: "Sets the bot language for you.",
      options: [
        {
          name: "new-lang",
          description: "The language to use",
        },
      ],
    },
    tepki: {
      name: "react",
      description: "Sets the reaction system.",
    },
  },
});
