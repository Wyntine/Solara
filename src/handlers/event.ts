import { client } from "../utils/client.js";
import { Event } from "../classes/event.js";
import { eventLogger } from "./logger.js";
import { readClassDirectory } from "../utils/readClassDirectory.js";
import type { ClientEvents } from "discord.js";

const eventMap = new Map<keyof ClientEvents, Event[]>();
const eventsDir = "events";

/**
 * Retrieves all events from the event map.
 *
 * @returns {Event[]} An array of all events.
 */
export function getEvents(): Event[] {
  return Array.from(eventMap.values()).flat();
}

/**
 * Retrieves an array of events for a given category.
 *
 * @param category - The category of events to retrieve.
 * @returns An array of events corresponding to the specified category. If no events are found, an empty array is returned.
 */
export function getEventCategory<Category extends keyof ClientEvents>(
  category: Category,
): Event<Category>[] {
  const events = eventMap.get(category) as unknown as
    | Event<Category>[]
    | undefined;
  return events ?? [];
}

/**
 * Reads and returns a list of events.
 *
 * This function reads the events from the specified directory and logs the process.
 *
 * @returns A promise that resolves to an array of Event objects.
 */
export async function readEvents(): Promise<Event[]> {
  return await readClassDirectory(Event, eventsDir, eventLogger);
}

/**
 * Registers events by reading them from a source and categorizing them.
 * The events are then mapped to their respective categories and registered
 * with the client.
 *
 * @returns A promise that resolves when the events are registered.
 */
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

/**
 * Creates an event handler function for a specific category of client events.
 *
 * @param category - The category of the events to handle.
 * @param events - An array of event objects to be filtered and executed.
 * @returns A function that takes event data as arguments and executes the enabled events.
 */
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
