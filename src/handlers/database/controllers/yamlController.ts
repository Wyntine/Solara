import { dump, load } from "js-yaml";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { pruneObject } from "../../../utils/objects.js";
import { ControllerModel, type DataSetter } from "../controllerModel.js";

export class YamlDatabaseController<Data> implements ControllerModel<Data> {
  private data: Data;
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = this.loadData();
  }

  public getAll(): Data {
    return this.data;
  }

  public get<Key extends keyof Data>(key: Key): Data[Key] {
    return this.data[key];
  }

  public set<Key extends keyof Data>(
    key: Key,
    value: Data[Key] | DataSetter<Data, Key>,
  ): void {
    this.data[key] =
      typeof value === "function" ?
        (value as DataSetter<Data, Key>)(this.data[key])
      : value;

    const newData = dump(pruneObject(this.data), { indent: 2 });

    writeFileSync(this.filePath, newData);
  }

  public overwrite<Key extends keyof Data>(
    key: Key,
    value: Partial<Data[Key]>,
  ): void {
    const newData = { ...this.data[key], ...value };
    this.set(key, newData);
  }

  private loadData(): Data {
    const data = (
      existsSync(this.filePath) ?
        load(readFileSync(this.filePath, "utf8"))
      : (() => {
          writeFileSync(this.filePath, dump({}, { indent: 2 }));
          return {};
        })()) as Data;
    return data;
  }
}
