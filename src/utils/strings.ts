import type { Replacer } from "../types/files.types.js";

/**
 * Creates a replacer function that replaces placeholders in the given text with provided strings.
 *
 * @param text - The text containing placeholders in the format `{index}` to be replaced.
 * @returns A function that takes a variable number of strings and replaces the placeholders in the text with these strings.
 */
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

/**
 * Joins an array of strings into a single string with a specified joiner.
 *
 * @param strings - The array of strings to join.
 * @param joiner - The string to use as the separator between each element. Defaults to "\n".
 * @returns The joined string.
 */
export function strJoin(strings: string[], joiner = "\n"): string {
  return strings.join(joiner);
}
