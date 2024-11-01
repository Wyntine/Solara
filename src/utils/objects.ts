import { isObject } from "@wyntine/verifier";

export function removeKey<Data, Key extends keyof Data>(
  data: Data,
  key: Key,
): Omit<Data, Key> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: removed, ...rest } = data;
  return rest;
}

export function removeMultipleKeys<Data, Keys extends keyof Data>(
  data: Data,
  keys: Keys[],
): Omit<Data, Keys> {
  return keys.reduce(
    (total, key) => removeKey(total, key as keyof typeof data) as Data,
    data,
  );
}

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
