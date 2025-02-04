import { systemLogger } from "../handlers/logger.js";

/**
 * Executes a provided function once for each pair of corresponding elements in two arrays.
 *
 * @param array1 - The first array of elements.
 * @param array2 - The second array of elements.
 * @param executionFunction - A function to execute on each pair of elements.
 * It receives the current element from the first array, the corresponding element from the second array, and the current index.
 *
 * @throws Will throw an error if the second array is shorter than the first array.
 */
export function crossArrayExecution<Item1, Item2>(
  array1: Item1[],
  array2: Item2[],
  executionFunction: (item1: Item1, item2: Item2, index: number) => unknown,
): void {
  array1.forEach((item1, index) => {
    const secondItem = array2.at(index);

    if (!secondItem) {
      return systemLogger.throw("Second array don't have sufficient length.");
    }

    executionFunction(item1, secondItem, index);
  });
}
