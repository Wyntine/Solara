import { databaseLogger } from "../logger.js";
import { existsSync, mkdirSync } from "fs";
import { JsonDatabaseController } from "./controllers/jsonController.js";
import { YamlDatabaseController } from "./controllers/yamlController.js";
import {
  DatabaseType,
  type DatabaseControllers,
  type DatabaseOptions,
} from "../../types/utils.types.js";
import { ControllerModel, type DataSetter } from "./controllerModel.js";

export class Database<Data, Type extends DatabaseType>
  implements ControllerModel<Data>
{
  private type: Type;
  private controller: DatabaseControllers<Data>;

  constructor(type: Type, options: DatabaseOptions<Type>) {
    this.type = type;
    this.controller = this.createController(options);
  }

  public getAll(): Data {
    return this.controller.getAll();
  }

  public get<Key extends keyof Data>(key: Key): Data[Key] {
    return this.controller.get(key);
  }

  public set<Key extends keyof Data>(
    key: Key,
    value: Data[Key] | DataSetter<Data, Key>,
  ): void {
    this.controller.set(key, value);
  }

  public overwrite<Key extends keyof Data>(
    key: Key,
    value: Partial<Data[Key]>,
  ): void {
    this.controller.overwrite(key, value);
  }

  private createController(
    options: DatabaseOptions<Type>,
  ): DatabaseControllers<Data> {
    return (
      this.type === DatabaseType.JSON ?
        new JsonDatabaseController<Data>(options.filePath)
      : this.type === DatabaseType.YAML ?
        new YamlDatabaseController<Data>(options.filePath)
      : databaseLogger.throw("Not implemented")
    );
  }
}

/**
 * Checks if the database folder exists, and creates it if it doesn't.
 * The folder will be created in the current working directory under "./databases".
 *
 * @throws {Error} May throw an error if the process lacks write permissions for the directory.
 */
export function checkDatabaseFolder(): void {
  if (!existsSync("./databases")) mkdirSync("./databases");
}
