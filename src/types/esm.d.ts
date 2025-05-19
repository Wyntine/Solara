import type Module from "module";

// TODO: Improve the typings in the future and look deeper into Node.js internal ESM library code.

interface ImportAttributes {
  [key: string]: string;
}

interface ModuleOutputSync {
  readonly __proto__: null;
  readonly module: ModuleWrap;
  readonly namespace?: string | undefined;
}

type ModuleOutputAsync = Promise<Omit<ModuleOutputSync, "namespace">>;

interface ModuleJob {
  readonly importAttributes: ImportAttributes;
  readonly phase: number;
  readonly isMain: boolean;
  readonly inspectBrk: boolean;
  readonly url: string;
  readonly modulePromise: Promise<ModuleWrap>;
  readonly linked: Promise<unknown[]>;
  readonly instantiated: Promise<unknown>;
  readonly module: ModuleWrap;

  public ensurePhase(phase: number): void;
  public runSync(parent): ModuleOutputSync;
  public run(isEntryPoint: boolean): ModuleOutputAsync;
}

interface ModuleRecord {
  readonly javascript: ModuleJob;
}

interface ModuleWrap {
  sourceMapURL?: string | undefined;
  url: string;
}

interface ModuleMap extends Map<string, ModuleRecord> {
  get(specifier: string): ModuleRecord | undefined;
}

declare global {
  interface ImportMeta {
    readonly cache?: ModuleMap;
  }
}

export {};
