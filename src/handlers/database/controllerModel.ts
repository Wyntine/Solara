export abstract class ControllerModel<Data> {
  public abstract getAll(): Data;
  public abstract get<Key extends keyof Data>(key: Key): Data[Key];
  public abstract set<Key extends keyof Data>(
    key: Key,
    value: Data[Key] | DataSetter<Data, Key>,
  ): void;
  public abstract overwrite<Key extends keyof Data>(
    key: Key,
    value: Partial<Data[Key]>,
  ): void;
}

export type DataSetter<Data, Key extends keyof Data> = (
  data: Data[Key],
) => Data[Key];
