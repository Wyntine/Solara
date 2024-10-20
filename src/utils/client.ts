import { Client, IntentsBitField } from "discord.js";

const Intents = IntentsBitField.Flags;

export const client = new Client({
  intents: [
    Intents.Guilds,
    Intents.GuildMessages,
    Intents.GuildMembers,
    Intents.MessageContent,
    Intents.GuildPresences,
  ],
  allowedMentions: {
    parse: [],
  },
});
