import type { Option } from "./option.js";

export class CommandOptionConfig {
  private options: Option[] = [];

  constructor(...options: Option[]) {
    this.options = options.map((option, index) => option.setIndex(index));
  }

  public getOptions(): Option[] {
    return this.options;
  }
}
