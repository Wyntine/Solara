import { isObject } from "@wyntine/verifier";
import type { Dirent } from "fs";
import { readdir } from "fs/promises";
import path from "path";
import type { Logger } from "./logger.js";

export async function readClassDirectory<
  Class extends new (...args: never[]) => InstanceType<Class>,
>(
  fileClassType: Class,
  directory: string,
  logger: Logger,
  verification?: (input: InstanceType<Class>, loggedPath: string) => boolean,
): Promise<InstanceType<Class>[]> {
  const instances: InstanceType<Class>[] = [];

  const basePath = path.join("src", directory);
  const files = (
    await readdir(basePath, {
      withFileTypes: true,
      recursive: true,
    })
  )
    .filter(scriptFileFilter)
    .map(({ name, parentPath }) => ({ name, parentPath }));

  for (const file of files) {
    const filePath = path.join(file.parentPath, file.name);
    const loggedPath = filePath.slice(basePath.length + 1);

    const fileImportPath = `../../${filePath}`;
    const fileImport: unknown = await import(fileImportPath);

    if (!isObject(fileImport) || !("default" in fileImport)) {
      logger.error(`No default export in "${loggedPath}"`);
      continue;
    }

    const classFile = fileImport.default as InstanceType<Class>;

    if (!(classFile instanceof fileClassType)) {
      logger.error(`Wrong class in "${loggedPath}"`);
      continue;
    }

    const result = verification ? verification(classFile, loggedPath) : true;

    if (!result) continue;

    instances.push(classFile);
  }

  return instances;
}

export function scriptFileFilter(this: void, file: Dirent): boolean {
  return (
    file.isFile() && file.name.endsWith(".ts") && !file.name.endsWith(".d.ts")
  );
}
