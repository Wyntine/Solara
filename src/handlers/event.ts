import type { ClientEvents } from "discord.js";
import { readClassDirectory } from "../utils/readClassDirectory.js";
import { client } from "../utils/client.js";
import { eventLogger } from "./logger.js";
import { Event } from "../classes/event.js";

const eventMap = new Map<keyof ClientEvents, Event[]>();
const eventsDir = "events";

export function getEvents(): Event[] {
  return Array.from(eventMap.values()).flat();
}

export function getEventCategory<Category extends keyof ClientEvents>(
  category: Category,
): Event<Category>[] {
  const events = eventMap.get(category) as unknown as
    | Event<Category>[]
    | undefined;
  return events ?? [];
}

export async function readEvents(): Promise<Event[]> {
  return await readClassDirectory(Event, eventsDir, eventLogger);
}

export async function registerEvents(): Promise<void> {
  const events = await readEvents();
  const eventCategoryMap = events.reduce<Map<keyof ClientEvents, Event[]>>(
    (total, event) => {
      const category = event.category;
      const oldEvents = total.get(category) ?? [];

      total.set(category, [...oldEvents, event]);
      return total;
    },
    new Map(),
  );

  for (const [category, events] of eventCategoryMap) {
    client.on(category, createEventFunction(category, events));
  }
}

export function createEventFunction<Category extends keyof ClientEvents>(
  category: Category,
  events: Event<Category>[],
) {
  return (...data: ClientEvents[Category]) => {
    const enabledEvents = events.filter(
      (event) => event.category === category && event.enabled,
    );

    for (const event of enabledEvents) {
      if (event.once) event.disable();
      event.execute(...data);
    }
  };
}
