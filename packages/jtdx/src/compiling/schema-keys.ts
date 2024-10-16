export type GroupedSchemaKeys =
  | GroupedSchemaKeysOf<"empty">
  | GroupedSchemaKeysOf<"type">
  | GroupedSchemaKeysOf<"enum">
  | GroupedSchemaKeysOf<"elements">
  | (GroupedSchemaKeysOf<"properties"> & {
    properties: boolean;
    optionalProperties: boolean;
    additionalProperties?: true;
  })
  | GroupedSchemaKeysOf<"values">
  | (GroupedSchemaKeysOf<"discriminator"> & { mapping?: true })
  | GroupedSchemaKeysOf<"ref">
  | { type: "ambiguous"; schemaFormDiscriminatorKeys: string[] };
type GroupedSchemaKeysOf<T extends string> = {
  type: T;
  shared: { nullable?: true; metadata?: true };
  root: { definitions?: true };
  unrecognized?: string[];
};

export function groupSchemaKeys(
  keys: string[],
  opts: { additionalPropertyNames: Set<string> },
): GroupedSchemaKeys {
  let result: GroupedSchemaKeys | null = null;
  const schemaFormDiscriminatorKeys: string[] = [];
  const restKeys: string[] = [];
  for (const key of keys) {
    if (
      key === "type" || key === "enum" || key === "elements" ||
      key === "properties" || key === "optionalProperties" ||
      key === "values" || key === "discriminator" ||
      key === "ref"
    ) {
      schemaFormDiscriminatorKeys.push(key);
      if (key === "properties" || key === "optionalProperties") {
        if (!result) {
          result = {
            type: "properties",
            properties: key === "properties",
            optionalProperties: key === "optionalProperties",
            shared: {},
            root: {},
          };
        } else if (result.type === "properties") {
          result[key] = true;
        } else {
          result = { type: "ambiguous", schemaFormDiscriminatorKeys };
        }
      } else {
        if (!result) {
          result = { type: key, shared: {}, root: {} };
        } else {
          result = { type: "ambiguous", schemaFormDiscriminatorKeys };
        }
      }
    } else {
      restKeys.push(key);
    }
  }

  if (!result) {
    result = { type: "empty", shared: {}, root: {} };
  } else if (result.type === "ambiguous") return result;

  for (const key of restKeys) {
    if (key === "nullable" || key === "metadata") {
      result.shared[key] = true;
    } else if (key === "definitions") {
      result.root[key] = true;
    } else if (result.type === "properties" && key === "additionalProperties") {
      result.additionalProperties = true;
    } else if (result.type === "discriminator" && key === "mapping") {
      result.mapping = true;
    } else if (opts.additionalPropertyNames.has(key)) {
      continue;
    } else {
      (result.unrecognized ??= []).push(key);
    }
  }

  return result;
}
