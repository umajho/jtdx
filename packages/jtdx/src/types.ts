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
} & CommonProperties;
export type TypeSchemaType =
  | "boolean"
  | "string"
  | "timestamp"
  | "float32"
  | "float64"
  | "int8"
  | "uint8"
  | "int16"
  | "uint16"
  | "int32"
  | "uint32";

export type EnumSchema = { enum: string[] } & CommonProperties;

export type ElementsSchema = { elements: Schema } & CommonProperties;

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
export type PropertiesSchema = PropertiesSchemaBase & CommonProperties;

export type ValuesSchema = { values: Schema } & CommonProperties;

export type DiscriminatorSchema = {
  discriminator: string;
  mapping: Record<string, PropertiesSchemaBase & CommonProperties<true>>;
} & CommonProperties;

export type RefSchema = { ref: string } & CommonProperties;

export type CommonProperties<IsMapping = false> = {
  metadata?: Record<string, unknown>;
} & (IsMapping extends true ? {} : { nullable?: boolean });
