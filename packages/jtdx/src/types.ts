export type Schema =
  | EmptySchema
  | TypeSchema
  | EnumSchema
  | ElementsSchema
  | PropertiesSchema
  | ValuesSchema
  | DiscriminatorSchema
  | RefSchema;

export type SchemaType =
  | "empty"
  | "type"
  | "enum"
  | "elements"
  | "properties"
  | "values"
  | "discriminator"
  | "ref";

export type RootSchema = Schema & {
  definitions?: Record<string, Schema>;
};

export type EmptySchema = Record<string, never>;

export type TypeSchema = {
  type: TypeSchemaType;
} & SharedProperties;
export type TypeSchemaType =
  | "boolean"
  | "string"
  | "timestamp"
  | "float32"
  | "float64"
  | TypeSchemaTypeInteger;
export type TypeSchemaTypeInteger =
  | "int8"
  | "uint8"
  | "int16"
  | "uint16"
  | "int32"
  | "uint32";

export type EnumSchema = { enum: string[] } & SharedProperties;

export type ElementsSchema = { elements: Schema } & SharedProperties;

export type PropertiesSchemaBase =
  & (
    | {
      properties: Record<string, Schema>;
      optionalProperties?: Record<string, Schema>;
    }
    | { optionalProperties: Record<string, Schema> }
  )
  & { additionalProperties?: boolean };
// `type PropertiesSchema<IsMapping = false>` results in `Type alias 'Schema'
// circularly references itself`. (TypeScript 5.5.4)
export type PropertiesSchema = PropertiesSchemaBase & SharedProperties;

export type ValuesSchema = { values: Schema } & SharedProperties;

export type DiscriminatorSchema = {
  discriminator: string;
  mapping: Record<string, PropertiesSchemaBase & SharedProperties<true>>;
} & SharedProperties;

export type RefSchema = { ref: string } & SharedProperties;

export type SharedProperties<IsMapping = false> = {
  metadata?: Record<string, unknown>;
} & (IsMapping extends true ? {} : { nullable?: boolean });
