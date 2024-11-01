import type { ClientEvents } from "discord.js";
import type {
  EventExecuteFunction,
  EventOptions,
} from "../types/files.types.js";

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
}
