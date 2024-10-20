import { systemLogger } from "../handlers/logger.js";

export function crossArrayExecution<Item1, Item2>(
  array1: Item1[],
  array2: Item2[],
  executionFunction: (item1: Item1, item2: Item2, index: number) => unknown,
): void {
  array1.forEach((item1, index) => {
    const secondItem = array2.at(index);

    if (!secondItem) {
      return systemLogger.throw("Second array don't have sufficent length.");
    }

    executionFunction(item1, secondItem, index);
  });
}
