import type { ClientEvents } from "discord.js";
import { readClassDirectory } from "../utils/readClassDirectory.js";
import { client } from "../utils/client.js";
import type {
  EventExecuteFunction,
  EventOptions,
} from "../types/files.types.js";
import { eventLogger } from "./logger.js";

export class Event<Category extends keyof ClientEvents = keyof ClientEvents> {
  public category: Category;
  public once: boolean;
  public enabled: boolean;
  public execute: EventExecuteFunction<Category>;

  constructor(eventOptions: EventOptions<Category>) {
    this.category = eventOptions.category;
    this.once = eventOptions.once ?? false;
    this.enabled = eventOptions.enabled ?? true;
    this.execute = eventOptions.execute;
  }

  public disable(): this {
    this.enabled = false;
    return this;
  }

  public enable(): this {
    this.enabled = true;
    return this;
  }

  //* Static methods

  private static events = new Map<keyof ClientEvents, Event[]>();
  private static eventsDir = "events";

  public static getEvents(): Event[] {
    return Array.from(this.events.values()).flat();
  }

  public static getEventCategory<Category extends keyof ClientEvents>(
    category: Category,
  ): Event<Category>[] {
    const events = this.events.get(category) as unknown as
      | Event<Category>[]
      | undefined;
    return events ?? [];
  }

  public static async readEvents(): Promise<Event[]> {
    return await readClassDirectory(Event, this.eventsDir, eventLogger);
  }

  public static async registerEvents(): Promise<void> {
    const events = await this.readEvents();
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
      client.on(category, this.createEventFunction(category, events));
    }
  }

  private static createEventFunction<Category extends keyof ClientEvents>(
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
}
