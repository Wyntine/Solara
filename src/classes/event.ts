import type {
  EventExecuteFunction,
  EventOptions,
} from "../types/files.types.js";

import type { ClientEvents } from "discord.js";

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

  /**
   * Disables the event.
   *
   * @returns The event instance for method chaining
   */
  public disable(): this {
    this.enabled = false;
    return this;
  }

  /**
   * Enables the event instance.
   *
   * @returns The current event instance for method chaining
   */
  public enable(): this {
    this.enabled = true;
    return this;
  }
}
