import type { Replacer } from "../types/files.types.js";

export function createReplacer<StringSize extends number>(
  text: string,
): Replacer<StringSize> {
  return (...strings) => {
    const strs = strings as unknown as string[];
    return strs.reduce(
      (total, current, index) =>
        total.replaceAll(`{${index.toString()}}`, current),
      text,
    );
  };
}

export function strJoin(strings: string[], joiner = "\n"): string {
  return strings.join(joiner);
}
