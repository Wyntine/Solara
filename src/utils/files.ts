import { join } from "path";
import { getConfig } from "../handlers/config.ts";
import { baseDir } from "../globals.ts";
import { systemLogger } from "../handlers/logger.ts";

/**
 * @param importPath - The path of the imported path related to the source directory of the project
 */
export async function reloadFile<Output>(importPath: string): Promise<Output> {
  const { system: { hotReload = false } = {} } = getConfig();

  const absoluteImportPath = join(baseDir, importPath);
  const now = Date.now();

  const finalImportPath =
    hotReload && !import.meta.cache
      ? `${absoluteImportPath}?t=${now}`
      : absoluteImportPath;

  if (hotReload && import.meta.cache) {
    const filePath = import.meta.resolve(absoluteImportPath);
    import.meta.cache.delete(filePath);
  }

  return await import(finalImportPath);
}

export function checkHotReloadStatus(): void {
  const { system: { hotReload = false } = {} } = getConfig();

  if (hotReload && !import.meta.cache) {
    systemLogger.warn(
      { key: "hotReloadWithoutPatch" },
      "Hot reload is enabled, but you do not have custom Node.js build. This may cause memory leaks when your bot is running for a long time.",
    );
  }
}
