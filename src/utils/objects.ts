import { isObject } from "@wyntine/verifier";

export function removeKey<Data, Key extends keyof Data>(
  data: Data,
  key: Key,
): Omit<Data, Key> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: removed, ...rest } = data;
  return rest;
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
