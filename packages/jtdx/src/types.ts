import {
  WithXChecksForElementsSchema,
  WithXChecksForPropertiesSchema,
  WithXChecksForTypeSchema,
  WithXChecksForValuesSchema,
} from "./extensions/x-checks/types";

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

export type EmptySchema = Record<string, never> & SharedProperties;

export type TypeSchema =
  & { type: TypeSchemaType }
  & SharedProperties
  & WithXChecksForTypeSchema;

export const typeSchemaTypeInteger = [
  ...["int8", "uint8", "int16"],
  ...["uint16", "int32", "uint32"],
] as const;
export type TypeSchemaTypeInteger = (typeof typeSchemaTypeInteger)[number];
export const typeSchemaTypeNumeric = [
  ...typeSchemaTypeInteger,
  ...["float32", "float64"],
] as const;
export type TypeSchemaTypeNumeric = (typeof typeSchemaTypeNumeric)[number];
export const typeSchemaTypeBoundable = [
  ...typeSchemaTypeNumeric,
  ...["timestamp"],
] as const;
export type TypeSchemaTypeBoundable = (typeof typeSchemaTypeBoundable)[number];
export type TypeSchemaType =
  | "boolean"
  | "string"
  | TypeSchemaTypeBoundable;

export type EnumSchema = { enum: string[] } & SharedProperties;

export type ElementsSchema =
  & { elements: Schema }
  & SharedProperties
  & WithXChecksForElementsSchema;

export type PropertiesSchemaBase =
  & (
    | {
      properties: Record<string, Schema>;
      optionalProperties?: Record<string, Schema>;
    }
    | { optionalProperties: Record<string, Schema> }
  )
  & { additionalProperties?: boolean }
  & WithXChecksForPropertiesSchema;
// `type PropertiesSchema<IsMapping = false>` results in `Type alias 'Schema'
// circularly references itself`. (TypeScript 5.5.4)
export type PropertiesSchema = PropertiesSchemaBase & SharedProperties;

export type ValuesSchema =
  & { values: Schema }
  & SharedProperties
  & WithXChecksForValuesSchema;

export type DiscriminatorSchema = {
  discriminator: string;
  mapping: Record<string, PropertiesSchemaBase & SharedProperties<true>>;
} & SharedProperties;

export type RefSchema = { ref: string } & SharedProperties;

export type SharedProperties<IsMapping = false> =
  & { metadata?: Record<string, unknown> }
  & (IsMapping extends true ? {} : { nullable?: boolean });
