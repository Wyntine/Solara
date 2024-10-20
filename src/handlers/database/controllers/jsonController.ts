import { writeFileSync, readFileSync, existsSync } from "fs";
import { ControllerModel, type DataSetter } from "../controllerModel.js";
import { pruneObject } from "../../../utils/objects.js";

export class JsonDatabaseController<Data> implements ControllerModel<Data> {
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

    const newData = JSON.stringify(pruneObject(this.data), undefined, 2);
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
        JSON.parse(readFileSync(this.filePath, "utf8"))
      : (() => {
          writeFileSync(this.filePath, JSON.stringify({}, undefined, 2));
          return {};
        })()) as Data;
    return data;
  }
}
