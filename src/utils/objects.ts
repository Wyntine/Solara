import { isObject } from "@wyntine/verifier";

/**
 * Removes a specified key from an object and returns a new object without that key.
 *
 * @param data - The original object from which the key will be removed.
 * @param key - The key to be removed from the object.
 * @returns A new object without the specified key.
 */
export function removeKey<Data, Key extends keyof Data>(
  data: Data,
  key: Key,
): Omit<Data, Key> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: removed, ...rest } = data;
  return rest;
}

/**
 * Removes multiple keys from an object.
 *
 * @param data - The object from which keys will be removed.
 * @param keys - An array of keys to be removed from the object.
 * @returns A new object with the specified keys removed.
 */
export function removeMultipleKeys<Data, Keys extends keyof Data>(
  data: Data,
  keys: Keys[],
): Omit<Data, Keys> {
  return keys.reduce(
    (total, key) => removeKey(total, key as keyof typeof data) as Data,
    data,
  );
}

/**
 * Recursively prunes an object by removing properties with `undefined`, `null`,
 * or empty objects as values.
 *
 * @param data - The object to be pruned.
 * @returns The pruned object.
 */
export function pruneObject<Data>(data: Data): Data {
  if (!isObject(data)) return data;

  const prunedData: Partial<Data> = {};

  for (const key in data) {
    const value = data[key];

    const lastValue = isObject(value) ? pruneObject(value) : value;

    if (
      value === undefined ||
      value === null ||
      (isObject(value) && Object.keys(value).length === 0)
    ) {
      continue;
    }

    prunedData[key] = lastValue;
  }

  return prunedData as Data;
}

/**
 * Retrieves the value of a nested key within an object.
 *
 * @param data - The object from which to retrieve the value.
 * @param keys - An array of strings representing the path of keys to traverse.
 * @returns The value found at the nested key path, or undefined if any key is not found or the path is invalid.
 */
export function getInnerObjectKey<Output>(
  data: unknown,
  keys: string[],
): Output | undefined {
  let tempData = data;

  for (const key of keys) {
    if (tempData === null || typeof tempData !== "object" || !(key in tempData))
      return;

    const newData: unknown = tempData[key as keyof typeof tempData];

    if (newData === undefined || newData === null) return;

    tempData = newData;
  }

  return tempData as Output;
}
