import type { Option } from "./option.ts";

export class CommandOptionConfig {
  private options: Option[] = [];

  constructor(...options: Option[]) {
    this.options = options.map((option, index) => option.setIndex(index));
  }

  public getOptions(): Option[] {
    return this.options;
  }
}
