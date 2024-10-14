import { RANGES } from "./consts";
import {
  CompilationError,
  CompilationRawError,
  createCompilationError as makeCompilationError,
  ValidationError,
} from "./errors";
import {
  DiscriminatorSchema,
  ElementsSchema,
  EnumSchema,
  PropertiesSchema,
  RefSchema,
  RootSchema,
  Schema,
  TypeSchema,
  ValuesSchema,
} from "./types";
import { findCircular } from "./utils/graph";
import { jsonTypeOf } from "./utils/jsonTypeOf";
import {
  InternalValidator,
  MappingValidateFunctions,
  PropertyValidateFunctions,
  validateBoolean,
  validateDiscriminator,
  validateElements,
  validateEnum,
  validateFloat,
  validateInteger,
  validateProperties,
  validateRef,
  validateString,
  validateTimestamp,
  validateValues,
  ValidationOptions,
  ValidationOptionsForProperties,
} from "./validating";

export type CompilationOptions = {
  extensions: {
    breaking: {
      "(disallow empty mappings)": boolean;
    } | null;
  } | null;
};

export type CompilationResult =
  | { isOk: true; validator: Validator }
  | { isOk: false; errors: CompilationError[] };

export interface Validator {
  validate: (value: any) => ValidationResult;
}
export type ValidationResult =
  | { isOk: true }
  | { isOk: false; errors: ValidationError[] };

type Dependencies = Record<string, { isAtRoot: boolean }>;

export function compile(
  schema: RootSchema,
  options: CompilationOptions,
): CompilationResult {
  const definitions = {};

  const errors: CompilationError[] = [];
  const dependencies: Dependencies = {}; // NOTE: unused.

  if (jsonTypeOf(schema) === "object" && "definitions" in schema) {
    compileDefinitions(schema.definitions!, { options, definitions, errors });
  }

  const refs = { options, definitions, errors, dependencies };
  const internalValidator = //
    compileSub(schema, [], refs, { type: "root" });
  if (!internalValidator) return { isOk: false, errors };

  const validator: Validator = {
    validate: (value) => {
      const errors: ValidationError[] = [];
      internalValidator.validate(value, [], { errors });

      if (errors.length === 0) return { isOk: true };
      return { isOk: false, errors };
    },
  };

  return { isOk: true, validator };
}

function compileDefinitions(
  definitions: Record<string, Schema>,
  refs: {
    options: CompilationOptions;
    definitions: Record<string, () => InternalValidator["validate"]>;
    errors: CompilationError[];
  },
) {
  function pushError(sp: string[], raw: CompilationRawError) {
    refs.errors.push(makeCompilationError(sp, raw));
  }
  const isDryRun = () => refs.errors.length > 0;

  {
    const t = jsonTypeOf(definitions);
    if (t !== "object") {
      pushError([], {
        type: "DEFINITIONS:NON_OBJECT_DEFINITIONS",
        actualDefinitionsType: t,
      });
      return;
    }
  }

  const validateFns: Record<string, InternalValidator["validate"]> = {};
  for (const name of Object.keys(definitions)) {
    refs.definitions[name] = () => validateFns[name]!;
  }

  const rootDepsGraph: Record<string, string> = {};

  for (const [name, schema] of Object.entries(definitions)) {
    const dependencies: Dependencies = {};
    const subRefs = {
      options: refs.options,
      definitions: refs.definitions,
      errors: refs.errors,
      dependencies,
    };
    const sub = compileSub(schema, ["definitions", name], subRefs, {
      type: "definition_root",
    });
    for (const [to, { isAtRoot }] of Object.entries(dependencies)) {
      if (isAtRoot) {
        if (name in rootDepsGraph) throw new Error("unreachable");
        rootDepsGraph[name] = to;
      }
    }
    if (!isDryRun()) {
      validateFns[name] = sub!.validate;
    }
  }

  const circles = findCircular(rootDepsGraph);
  if (circles.length) {
    for (const circle of circles) {
      pushError([], {
        type: "DEFINITIONS:NOOP_CIRCULAR_REFERENCES_DETECTED",
        definitionsInCycle: circle,
      });
    }
  }
}

function compileSub(
  schema: Schema,
  /** sp = schema path. */
  spParent: string[],
  refs: {
    options: CompilationOptions;
    definitions: Record<string, () => InternalValidator["validate"] | null>;
    errors: CompilationError[];
    dependencies: Dependencies;
  },
  state?: {
    type?: "root" | "definition_root"; // TODO: "x:lazy_under_root".
    mapping?: {
      discriminator: string;
    };
  },
): InternalValidator | null {
  function pushError(sp: string[], raw: CompilationRawError) {
    refs.errors.push(makeCompilationError(sp, raw));
  }
  const isDryRun = () => refs.errors.length > 0;

  const actualType = jsonTypeOf(schema);
  if (actualType !== "object") {
    pushError(spParent, { type: "SCHEMA_FORM:NOT_OBJECT", actualType });
    return null;
  }

  const groupedKeys = groupKeys(Object.keys(schema));

  if (groupedKeys.type === "ambiguous") {
    pushError(spParent, {
      type: "SCHEMA_FORM:AMBIGUOUS",
      discriminatorKeys: groupedKeys.schemaFormDiscriminatorKeys,
    });
    return null;
  }

  if (state?.mapping) {
    if (groupedKeys.type !== "properties") {
      pushError(spParent, {
        type: "MAPPING:NON_PROPERTIES_SCHEMA_FORM",
        form: groupedKeys.type,
      });
    } else {
      if (
        ("properties" in schema &&
          jsonTypeOf(schema.properties) === "object" &&
          state.mapping.discriminator in schema.properties) ||
        ("optionalProperties" in schema &&
          jsonTypeOf(schema.optionalProperties) === "object" &&
          state.mapping.discriminator in schema.optionalProperties!)
      ) {
        pushError(spParent, {
          type: "MAPPING:DISCRIMINATOR_AS_PROPERTY_KEY",
          discriminator: state.mapping.discriminator,
        });
      }
    }
    if (groupedKeys.shared.nullable) {
      pushError(spParent, { type: "MAPPING:NULLABLE" });
    }
  }
  if (state?.type !== "root") {
    const rootKeys = Object.keys(groupedKeys.root);
    if (rootKeys.length) {
      pushError(spParent, {
        type: "NON_ROOT_SCHEMA:ROOT_ONLY_KEYS",
        keys: rootKeys,
      });
    }
  }
  if (groupedKeys.unrecognized) {
    pushError(spParent, {
      type: "COMMON_SCHEMA:UNRECOGNIZED_KEYS",
      form: groupedKeys.type,
      keys: groupedKeys.unrecognized,
    });
  }

  const opts: ValidationOptions = {};
  if (groupedKeys.shared.nullable) {
    const isNullable = schema.nullable;
    if (isNullable !== undefined) {
      const t = jsonTypeOf(isNullable);
      if (t !== "boolean") {
        pushError(spParent, {
          type: "COMMON_SCHEMA:NON_BOOLEAN_NULLABLE_VALUE",
          actualType: t,
        });
      }
      if (isNullable) {
        opts.isNullable = true;
      }
    }
  }

  switch (groupedKeys.type) {
    case "empty":
      if (isDryRun()) break;
      return ok(() => ({ isOk: true }));
    case "type": {
      const sp = [...spParent, "type"];
      const t = (schema as TypeSchema).type;
      switch (t) {
        case "boolean":
          if (isDryRun()) break;
          return ok((v, ip, refs) => validateBoolean(v, sp, ip, refs, opts));
        case "string":
          if (isDryRun()) break;
          return ok((v, ip, refs) => validateString(v, sp, ip, refs, opts));
        case "timestamp":
          if (isDryRun()) break;
          return ok((v, ip, refs) => validateTimestamp(v, sp, ip, refs, opts));
        case "float32":
        case "float64":
          if (isDryRun()) break;
          return ok((v, ip, refs) => validateFloat(v, t, sp, ip, refs, opts));
        case "int8":
        case "uint8":
        case "int16":
        case "uint16":
        case "int32":
        case "uint32":
          const [min, max] = RANGES[t];

          if (isDryRun()) break;
          return ok((v, ip, refs) =>
            validateInteger(v, t, min, max, sp, ip, refs, opts)
          );
        default:
          if (typeof t === "string") {
            pushError(sp, { type: "TYPE_FORM:UNKNOWN_TYPE", actualType: t });
          } else {
            pushError(sp, {
              type: "TYPE_FORM:NON_STRING_TYPE",
              actualTypeType: jsonTypeOf(t),
            });
          }
          break;
      }
      break;
    }
    case "enum": {
      const sp = [...spParent, "enum"];
      const variants = (schema as EnumSchema).enum;
      if (!Array.isArray(variants)) {
        pushError(sp, {
          type: "ENUM_FORM:NON_ARRAY_ENUM",
          actualEnumType: jsonTypeOf(variants),
        });
        break;
      } else if (variants.length === 0) {
        pushError(sp, { type: "ENUM_FORM:EMPTY_ENUM" });
        break;
      } else if (variants.some((v) => typeof v !== "string")) {
        pushError(sp, { type: "ENUM_FORM:NON_STRING_VARIANTS" });
      }
      const variantSet: Set<string> = new Set();
      const duplicates: string[] = [];
      for (const variant of variants) {
        if (variantSet.has(variant)) {
          duplicates.push(variant);
        } else {
          variantSet.add(variant);
        }
      }
      if (duplicates.length) {
        pushError(sp, {
          type: "ENUM_FORM:DUPLICATE_VARIANTS",
          duplicateVariants: duplicates,
        });
        break;
      }

      if (isDryRun()) break;
      return ok((v, ip, refs) =>
        validateEnum(v, variantSet, sp, ip, refs, opts)
      );
    }
    case "elements": {
      const sp = [...spParent, "elements"];
      const elements = (schema as ElementsSchema).elements;
      const sub = compileSub(elements, sp, refs);

      if (isDryRun()) break;
      const subFn = sub!.validate;
      return ok((v, ip, refs) =>
        validateElements(v, subFn, sp, ip, refs, opts)
      );
    }
    case "properties": {
      const schema_ = schema as PropertiesSchema;
      const opts_: ValidationOptionsForProperties = opts;
      const properties = "properties" in schema_ ? schema_.properties : null;
      const optionalProperties = schema_.optionalProperties ?? null;
      const additionalProperties = schema_.additionalProperties;

      if (state?.mapping?.discriminator !== undefined) {
        opts_.discriminator = state.mapping.discriminator;
      }

      const subs: PropertyValidateFunctions = {};

      const requiredProperties: Set<string> = new Set();
      if (properties !== null) {
        const sp = [...spParent, "properties"];
        const propertiesType = jsonTypeOf(properties);
        if (propertiesType === "object") {
          for (const [key, schema] of Object.entries(properties)) {
            const sub = compileSub(schema, [...sp, key], refs);
            if (!sub) continue;
            subs[key] = sub.validate;
            requiredProperties.add(key);
          }
        } else {
          pushError(sp, {
            type: "PROPERTIES_FORM:NON_OBJECT_PROPERTIES",
            actualPropertiesType: propertiesType,
          });
        }
      }
      if (requiredProperties.size) {
        opts_.requiredProperties = requiredProperties;
      }

      if (optionalProperties !== null) {
        const sp = [...spParent, "optionalProperties"];
        const optionalPropertiesType = jsonTypeOf(optionalProperties);
        if (optionalPropertiesType === "object") {
          const overlappedKeys: string[] = [];
          for (const [key, schema] of Object.entries(optionalProperties)) {
            const sub = compileSub(schema, [...sp, key], refs);
            if (!sub) continue;
            if (requiredProperties.has(key)) {
              overlappedKeys.push(key);
            } else {
              subs[key] = sub.validate;
            }
          }
          if (overlappedKeys.length) {
            pushError(sp, {
              type:
                "PROPERTIES_FORM:OVERLAPPING_REQUIRED_AND_OPTIONAL_PROPERTIES",
              keys: overlappedKeys,
            });
          }
        } else {
          pushError(sp, {
            type: "PROPERTIES_FORM:NON_OBJECT_OPTIONAL_PROPERTIES",
            actualOptionalPropertiesType: optionalPropertiesType,
          });
        }
      }

      if (additionalProperties !== undefined) {
        const sp = [...spParent, "additionalProperties"];
        const additionalPropertiesType = jsonTypeOf(additionalProperties);
        if (additionalPropertiesType !== "boolean") {
          pushError(sp, {
            type: "PROPERTIES_FORM:NON_BOOLEAN_ADDITIONAL_PROPERTIES",
            actualAdditionalPropertiesType: additionalPropertiesType,
          });
        } else if (additionalProperties) {
          opts_.canHoldAdditionalProperties = true;
        }
      }

      if (isDryRun()) break;
      return ok((v, ip, refs) =>
        validateProperties(v, subs, spParent, ip, refs, opts_)
      );
    }
    case "values": {
      const sp = [...spParent, "values"];
      const values = (schema as ValuesSchema).values;
      const sub = compileSub(values, sp, refs);

      if (isDryRun()) break;
      const subFn = sub!.validate;
      return ok((v, ip, refs) => validateValues(v, subFn, sp, ip, refs, opts));
    }
    case "discriminator": {
      const schema_ = schema as DiscriminatorSchema;
      const discriminator = schema_.discriminator;
      const mapping = schema_.mapping;

      if (typeof discriminator !== "string") {
        pushError(spParent, {
          type: "DISCRIMINATOR_FORM:NON_STRING_DISCRIMINATOR",
          actualDiscriminatorType: jsonTypeOf(discriminator),
        });
      }

      if (!groupedKeys.mapping) {
        pushError(spParent, { type: "DISCRIMINATOR_FORM:MISSING_MAPPING" });
        break;
      }
      const tMapping = jsonTypeOf(mapping);
      if (tMapping !== "object") {
        pushError(spParent, {
          type: "DISCRIMINATOR_FORM:NON_OBJECT_MAPPING",
          actualMappingType: tMapping,
        });
        break;
      } else if (
        refs.options.extensions?.breaking?.["(disallow empty mappings)"] &&
        Object.keys(mapping).length === 0
      ) {
        pushError(spParent, { type: "DISCRIMINATOR_FORM:EMPTY_MAPPING" });
        break;
      }

      const subs: MappingValidateFunctions = {};
      const subState = { mapping: { discriminator } };
      const spMapping = [...spParent, "mapping"];
      for (const [key, schema] of Object.entries(mapping)) {
        const sub = compileSub(schema, [...spMapping, key], refs, subState);
        if (!sub) continue;
        subs[key] = sub.validate;
      }

      if (isDryRun()) break;
      return ok((v, ip, refs) =>
        validateDiscriminator(v, discriminator, subs, spParent, ip, refs, opts)
      );
    }
    case "ref": {
      const sp = [...spParent, "ref"];
      const ref = (schema as RefSchema).ref;
      if (typeof ref !== "string") {
        pushError(sp, {
          type: "REF_FORM:NON_STRING_REF",
          actualRefType: jsonTypeOf(ref),
        });
        break;
      }

      if (!(ref in refs.definitions)) {
        pushError(sp, { type: "REF_FORM:NO_DEFINITION", definition: ref });
      }
      refs.dependencies[ref] = {
        isAtRoot: state?.type === "root" || state?.type === "definition_root",
      };

      if (isDryRun()) break;
      const subGetter = refs.definitions[ref]!;
      return ok((v, ip, refs) => validateRef(v, subGetter, ip, refs, opts));
    }
    default:
      groupedKeys satisfies never;
      throw new Error("unreachable");
  }

  return null;
}

type GroupedKeys =
  | GroupedKeysOf<"empty">
  | GroupedKeysOf<"type">
  | GroupedKeysOf<"enum">
  | GroupedKeysOf<"elements">
  | (GroupedKeysOf<"properties"> & {
    properties: boolean;
    optionalProperties: boolean;
    additionalProperties?: true;
  })
  | GroupedKeysOf<"values">
  | (GroupedKeysOf<"discriminator"> & { mapping?: true })
  | GroupedKeysOf<"ref">
  | { type: "ambiguous"; schemaFormDiscriminatorKeys: string[] };
type GroupedKeysOf<T extends string> = {
  type: T;
  shared: { nullable?: true; metadata?: true };
  root: { definitions?: true };
  unrecognized?: string[];
};

function groupKeys(keys: string[]): GroupedKeys {
  let result: GroupedKeys | null = null;
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
    } else {
      (result.unrecognized ??= []).push(key);
    }
  }

  return result;
}

function ok(
  validateFn: InternalValidator["validate"],
): InternalValidator | null {
  return { validate: validateFn };
}
