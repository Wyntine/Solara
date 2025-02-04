import { Event } from "../classes/event.js";
import { defaultCommandDetectionEvent } from "../handlers/defaultEvents.js";

export default new Event({
  category: "interactionCreate",
  async execute(interaction) {
    await defaultCommandDetectionEvent(interaction);
  },
});
