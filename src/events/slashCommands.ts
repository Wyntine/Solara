import { Event } from "../classes/event.ts";
import { defaultCommandDetectionEvent } from "../handlers/defaultEvents.ts";

export default new Event({
  category: "interactionCreate",
  async execute(interaction) {
    await defaultCommandDetectionEvent(interaction);
  },
});
