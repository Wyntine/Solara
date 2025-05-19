import { isArray, isObject } from "@wyntine/verifier";
import type {
  GetItemFromKeyMap,
  ObjectKeyMap,
  RequiredStringMap,
  StringMap,
} from "../types/utils.types.ts";

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

export function convertToSnakeCase(obj: StringMap<unknown>) {
  const tempObj: StringMap<unknown> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = key.split("").reduce((total, current) => {
      const isLowerCase = current.toLowerCase() === current;
      return isLowerCase
        ? `${total}${current}`
        : `${total}_${current.toLowerCase()}`;
    }, "");

    tempObj[newKey] = value;
  }

  return tempObj;
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
      (isObject(value) && getObjectSize(value) === 0)
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
 * @param key - A string representing the path of keys to traverse. Splitted with dots ("a.b")
 * @returns The value found at the nested key path, or undefined if any key is not found or the path is invalid.
 */
export function getInnerObjectValue<
  Obj extends object,
  Key extends ObjectKeyMap<Obj>,
>(data: Obj, key: Key): GetItemFromKeyMap<Obj, Key> {
  let tempData: unknown = data;
  const keys = key.split(".");

  return (() => {
    for (const key of keys) {
      if (!isObject(tempData) || !(key in tempData)) return;

      const newData: unknown = tempData[key as keyof typeof tempData];

      if (newData === undefined || newData === null) return;

      tempData = newData;
    }

    return tempData;
  })() as GetItemFromKeyMap<Obj, Key>;
}

export function mapObject<Obj extends Record<string, unknown>, ReturnType>(
  obj: Obj,
  func: <Key extends keyof Obj>(value: Obj[Key], key: Key) => ReturnType,
): StringMap<ReturnType> {
  const tempObj: StringMap<ReturnType> = {};

  for (const key in obj) {
    const value = obj[key];
    tempObj[key] = func(value, key);
  }

  return tempObj;
}

export function findInObject<Obj extends Record<string, unknown>>(
  obj: Obj,
  func: <Key extends keyof Obj>(value: Obj[Key], key: Key) => boolean,
): Parameters<typeof func>[0] | undefined {
  for (const key in obj) {
    const value = obj[key];
    const result = func(value, key);

    if (result) return value;
  }

  return;
}

export function getObjectSize(obj: object): number {
  return isArray(obj) ? obj.length : Object.keys(obj).length;
}

export function isNonNullable(
  input: unknown,
): input is NonNullable<typeof input> {
  return input !== null && input !== undefined;
}

export function mapObjectToArray<
  Obj extends Record<string, unknown>,
  PureReturnType = RequiredStringMap<Obj>[keyof RequiredStringMap<Obj>],
  MappedReturnType = PureReturnType,
>(
  obj: Obj,
  mapper?: (
    data: [key: string, value: PureReturnType],
    index: number,
  ) => MappedReturnType,
): MappedReturnType[] {
  const mappedObject = Object.entries(obj) as [string, PureReturnType][];
  return (
    mapper ? mappedObject.map(mapper) : mappedObject.map(([, value]) => value)
  ) as MappedReturnType[];
}
export function mapPlaceholders<Key extends string>(
  items: Key[],
  values?: (string | undefined)[],
): Partial<Record<`{${Key}}`, string | undefined>> {
  return items.reduce((total, current, index) => {
    const value = values ? values[index] : undefined;
    return { ...total, [`{${current}}`]: value };
  }, {});
}
