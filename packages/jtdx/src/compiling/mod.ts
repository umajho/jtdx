import { RANGES } from "../consts";
import {
  CompilationError,
  CompilationRawError,
  createCompilationError as makeCompilationError,
  ValidationError,
} from "../errors";
import { BreakingExtension } from "../extensions/mod";
import {
  DiscriminatorSchema,
  ElementsSchema,
  EmptySchema,
  EnumSchema,
  PropertiesSchema,
  RefSchema,
  RootSchema,
  Schema,
  TypeSchema,
  ValuesSchema,
} from "../types";
import { findCircular } from "../utils/graph";
import { jsonTypeOf } from "../utils/jsonTypeOf";
import {
  InternalValidator,
  MappingValidateFunctions,
  PropertyValidateFunctions,
  validateBoolean,
  validateDiscriminator,
  validateElements,
  validateEmpty,
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
} from "../validating";
import { createExtensionContext } from "./extension-context";
import { Hooks, runHooks } from "./hooks";
import { GroupedSchemaKeys, groupSchemaKeys } from "./schema-keys";

export interface CompilationOptions {
  breakingExtensions?: BreakingExtension[];
}

interface InternalCompilationOptions extends CompilationOptions {
  hooks: Hooks;
  additionalPropertyNames: Set<string>;
}

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
  opts?: CompilationOptions,
): CompilationResult {
  const { hooks, additionalPropertyNames } = (() => {
    const { context, finalize } = createExtensionContext();
    for (const ext of opts?.breakingExtensions ?? []) {
      ext.__unstable__(context);
    }
    return finalize();
  })();

  const iOpts: InternalCompilationOptions = {
    ...opts,
    hooks,
    additionalPropertyNames,
  };

  const definitions: Record<string, () => InternalValidator["validate"]> = {};

  const errors: CompilationError[] = [];
  const dependencies: Dependencies = {}; // NOTE: unused.

  if (jsonTypeOf(schema) === "object" && "definitions" in schema) {
    const refs: CompileDefinitionsReferences = {
      options: iOpts,
      definitions,
      errors,
    };
    compileDefinitions(schema.definitions!, refs);
  }

  const refs: CompileSubReferences = {
    options: iOpts,
    definitions,
    errors,
    dependencies,
  };
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

interface CompileDefinitionsReferences {
  options: InternalCompilationOptions;
  definitions: Record<string, () => InternalValidator["validate"]>;
  errors: CompilationError[];
}

function compileDefinitions(
  definitions: Record<string, Schema>,
  refs: CompileDefinitionsReferences,
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
    const subRefs: CompileSubReferences = { ...refs, dependencies };
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

interface CompileSubReferences {
  options: InternalCompilationOptions;
  definitions: Record<string, () => InternalValidator["validate"]>;
  errors: CompilationError[];
  dependencies: Dependencies;
}
interface CompileSubState {
  type?: "root" | "definition_root"; // TODO: "x:lazy_under_root".
  mapping?: {
    discriminator: string;
  };
}

function compileSub(
  s: Schema,
  /** sp = schema path. */
  spParent: string[],
  references: CompileSubReferences,
  state?: CompileSubState,
): InternalValidator | null {
  function pushError(sp: string[], raw: CompilationRawError) {
    references.errors.push(makeCompilationError(sp, raw));
  }
  const isDryRun = () => references.errors.length > 0;

  const actualType = jsonTypeOf(s);
  if (actualType !== "object") {
    pushError(spParent, { type: "SCHEMA_FORM:NOT_OBJECT", actualType });
    return null;
  }

  const groupedKeys = groupSchemaKeys(Object.keys(s), references.options);

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
        ("properties" in s &&
          jsonTypeOf(s.properties) === "object" &&
          state.mapping.discriminator in s.properties) ||
        ("optionalProperties" in s &&
          jsonTypeOf(s.optionalProperties) === "object" &&
          state.mapping.discriminator in s.optionalProperties!)
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

  const validationOptions: ValidationOptions = {};
  if (groupedKeys.shared.nullable) {
    const isNullable = s.nullable;
    if (isNullable !== undefined) {
      const t = jsonTypeOf(isNullable);
      if (t !== "boolean") {
        pushError(spParent, {
          type: "COMMON_SCHEMA:NON_BOOLEAN_NULLABLE_VALUE",
          actualType: t,
        });
      }
      if (isNullable) {
        validationOptions.isNullable = true;
      }
    }
  }

  const deeperOpts = {
    references,
    ...(state && { state }),
    pushError,
    isDryRun,
    validationOptions,
  };

  switch (groupedKeys.type) {
    case "empty":
      return compileSchemaOfEmpty(s as EmptySchema, spParent, deeperOpts);
    case "type":
      return compileSchemaOfType(s as TypeSchema, spParent, deeperOpts);
    case "enum":
      return compileSchemaOfEnum(s as EnumSchema, spParent, deeperOpts);
    case "elements":
      return compileSchemaOfElements(s as ElementsSchema, spParent, deeperOpts);
    case "properties":
      return compileSchemaOfProperties(
        s as PropertiesSchema,
        spParent,
        deeperOpts,
      );
    case "values":
      return compileSchemaOfValues(s as ValuesSchema, spParent, deeperOpts);
    case "discriminator":
      return compileSchemaOfDiscriminator(s as DiscriminatorSchema, spParent, {
        ...deeperOpts,
        groupedKeys,
      });
    case "ref":
      return compileSchemaOfRef(s as RefSchema, spParent, deeperOpts);
    default:
      groupedKeys satisfies never;
      throw new Error("unreachable");
  }
}

function compileSchemaOfEmpty(
  schema: EmptySchema,
  spParent: string[],
  opts: {
    references: CompileSubReferences;
    pushError: (sp: string[], raw: CompilationRawError) => void;
    isDryRun: () => boolean;
    validationOptions: ValidationOptions;
  },
) {
  const sp = spParent;

  const supFns = runHooks(
    opts.references.options.hooks,
    "empty",
    schema,
    { pushError: (raw) => opts.pushError(sp, raw) },
  );
  if (supFns) {
    opts.validationOptions.supplementalValidateFunctions = supFns;
  }

  if (opts.isDryRun()) return null;
  return ok((v, ip, refs) =>
    validateEmpty(v, sp, ip, refs, opts.validationOptions)
  );
}

function compileSchemaOfType(
  schema: TypeSchema,
  spParent: string[],
  opts: {
    references: CompileSubReferences;
    pushError: (sp: string[], raw: CompilationRawError) => void;
    isDryRun: () => boolean;
    validationOptions: ValidationOptions;
  },
): InternalValidator | null {
  const sp = [...spParent, "type"];

  const supFns = runHooks(
    opts.references.options.hooks,
    "type",
    schema,
    { pushError: (raw) => opts.pushError(sp, raw) },
  );
  if (supFns) {
    opts.validationOptions.supplementalValidateFunctions = supFns;
  }

  const t = schema.type; // workaround tsc narrowing.
  switch (t) {
    case "boolean":
      if (opts.isDryRun()) break;
      return ok((v, ip, refs) =>
        validateBoolean(v, sp, ip, refs, opts.validationOptions)
      );
    case "string":
      if (opts.isDryRun()) break;
      return ok((v, ip, refs) =>
        validateString(v, sp, ip, refs, opts.validationOptions)
      );
    case "timestamp":
      if (opts.isDryRun()) break;
      return ok((v, ip, refs) =>
        validateTimestamp(v, sp, ip, refs, opts.validationOptions)
      );
    case "float32":
    case "float64":
      if (opts.isDryRun()) break;
      return ok((v, ip, refs) =>
        validateFloat(v, t, sp, ip, refs, opts.validationOptions)
      );
    case "int8":
    case "uint8":
    case "int16":
    case "uint16":
    case "int32":
    case "uint32":
      if (opts.isDryRun()) break;
      const [min, max] = RANGES[t];
      return ok((v, ip, refs) =>
        validateInteger(v, t, min, max, sp, ip, refs, opts.validationOptions)
      );
    default:
      if (typeof t === "string") {
        opts.pushError(sp, {
          type: "TYPE_FORM:UNKNOWN_TYPE",
          actualType: t,
        });
      } else {
        opts.pushError(sp, {
          type: "TYPE_FORM:NON_STRING_TYPE",
          actualTypeType: jsonTypeOf(t),
        });
      }
  }
  return null;
}

function compileSchemaOfEnum(
  schema: EnumSchema,
  spParent: string[],
  opts: {
    references: CompileSubReferences;
    pushError: (sp: string[], raw: CompilationRawError) => void;
    isDryRun: () => boolean;
    validationOptions: ValidationOptions;
  },
): InternalValidator | null {
  const sp = [...spParent, "enum"];
  const variants = schema.enum;
  if (!Array.isArray(variants)) {
    opts.pushError(sp, {
      type: "ENUM_FORM:NON_ARRAY_ENUM",
      actualEnumType: jsonTypeOf(variants),
    });
    return null;
  } else if (variants.length === 0) {
    opts.pushError(sp, { type: "ENUM_FORM:EMPTY_ENUM" });
    return null;
  } else if (variants.some((v) => typeof v !== "string")) {
    opts.pushError(sp, { type: "ENUM_FORM:NON_STRING_VARIANTS" });
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
    opts.pushError(sp, {
      type: "ENUM_FORM:DUPLICATE_VARIANTS",
      duplicateVariants: duplicates,
    });
    return null;
  }

  const supFns = runHooks(
    opts.references.options.hooks,
    "enum",
    schema,
    { pushError: (raw) => opts.pushError(sp, raw) },
  );
  if (supFns) {
    opts.validationOptions.supplementalValidateFunctions = supFns;
  }

  if (opts.isDryRun()) return null;
  return ok((v, ip, refs) =>
    validateEnum(v, variantSet, sp, ip, refs, opts.validationOptions)
  );
}

function compileSchemaOfElements(
  schema: ElementsSchema,
  spParent: string[],
  opts: {
    references: CompileSubReferences;
    pushError: (sp: string[], raw: CompilationRawError) => void;
    isDryRun: () => boolean;
    validationOptions: ValidationOptions;
  },
): InternalValidator | null {
  const sp = [...spParent, "elements"];

  const supFns = runHooks(
    opts.references.options.hooks,
    "elements",
    schema,
    { pushError: (raw) => opts.pushError(sp, raw) },
  );
  if (supFns) {
    opts.validationOptions.supplementalValidateFunctions = supFns;
  }

  const sub = compileSub(schema.elements, sp, opts.references);

  if (opts.isDryRun()) return null;
  const subFn = sub!.validate;
  return ok((v, ip, refs) =>
    validateElements(v, subFn, sp, ip, refs, opts.validationOptions)
  );
}

function compileSchemaOfProperties(
  schema: PropertiesSchema,
  spParent: string[],
  opts: {
    references: CompileSubReferences;
    state?: CompileSubState;
    pushError: (sp: string[], raw: CompilationRawError) => void;
    isDryRun: () => boolean;
    validationOptions: ValidationOptions;
  },
): InternalValidator | null {
  const vOpts: ValidationOptionsForProperties = opts.validationOptions;
  const properties = "properties" in schema ? schema.properties : null;
  const optionalProperties = schema.optionalProperties ?? null;
  const additionalProperties = schema.additionalProperties;

  if (opts.state?.mapping?.discriminator !== undefined) {
    vOpts.discriminator = opts.state.mapping.discriminator;
  }

  const subsToCompile: Record<string, () => ReturnType<typeof compileSub>> = {};

  const requiredProperties: Set<string> = new Set();
  if (properties !== null) {
    const sp = [...spParent, "properties"];
    const propertiesType = jsonTypeOf(properties);
    if (propertiesType === "object") {
      for (const [key, schema] of Object.entries(properties)) {
        subsToCompile[key] = () =>
          compileSub(schema, [...sp, key], opts.references);
        requiredProperties.add(key);
      }
    } else {
      opts.pushError(sp, {
        type: "PROPERTIES_FORM:NON_OBJECT_PROPERTIES",
        actualPropertiesType: propertiesType,
      });
    }
  }
  if (requiredProperties.size) {
    vOpts.requiredProperties = requiredProperties;
  }

  if (optionalProperties !== null) {
    const sp = [...spParent, "optionalProperties"];
    const optionalPropertiesType = jsonTypeOf(optionalProperties);
    if (optionalPropertiesType === "object") {
      const overlappedKeys: string[] = [];
      for (const [key, schema] of Object.entries(optionalProperties)) {
        subsToCompile[key] = () =>
          compileSub(schema, [...sp, key], opts.references);
        if (requiredProperties.has(key)) {
          overlappedKeys.push(key);
        }
      }
      if (overlappedKeys.length) {
        opts.pushError(sp, {
          type: "PROPERTIES_FORM:OVERLAPPING_REQUIRED_AND_OPTIONAL_PROPERTIES",
          keys: overlappedKeys,
        });
      }
    } else {
      opts.pushError(sp, {
        type: "PROPERTIES_FORM:NON_OBJECT_OPTIONAL_PROPERTIES",
        actualOptionalPropertiesType: optionalPropertiesType,
      });
    }
  }

  if (additionalProperties !== undefined) {
    const sp = [...spParent, "additionalProperties"];
    const additionalPropertiesType = jsonTypeOf(additionalProperties);
    if (additionalPropertiesType !== "boolean") {
      opts.pushError(sp, {
        type: "PROPERTIES_FORM:NON_BOOLEAN_ADDITIONAL_PROPERTIES",
        actualAdditionalPropertiesType: additionalPropertiesType,
      });
    } else if (additionalProperties) {
      vOpts.canHoldAdditionalProperties = true;
    }
  }

  const spSelf = [
    ...spParent,
    (!Object.keys(subsToCompile).length || vOpts.requiredProperties)
      ? "properties"
      : "optionalProperties",
  ];

  const supFns = runHooks(
    opts.references.options.hooks,
    "properties",
    schema,
    { pushError: (raw) => opts.pushError(spSelf, raw) },
  );
  if (supFns) {
    opts.validationOptions.supplementalValidateFunctions = supFns;
  }

  const subs: PropertyValidateFunctions = {};
  for (const [key, compile] of Object.entries(subsToCompile)) {
    const sub = compile();
    if (!sub) continue;
    subs[key] = sub.validate;
  }

  if (opts.isDryRun()) return null;
  return ok((v, ip, refs) =>
    validateProperties(v, subs, spParent, spSelf, ip, refs, vOpts)
  );
}

function compileSchemaOfValues(
  schema: ValuesSchema,
  spParent: string[],
  opts: {
    references: CompileSubReferences;
    pushError: (sp: string[], raw: CompilationRawError) => void;
    isDryRun: () => boolean;
    validationOptions: ValidationOptions;
  },
): InternalValidator | null {
  const sp = [...spParent, "values"];
  const values = (schema as ValuesSchema).values;

  const supFns = runHooks(
    opts.references.options.hooks,
    "values",
    schema,
    { pushError: (raw) => opts.pushError(sp, raw) },
  );
  if (supFns) {
    opts.validationOptions.supplementalValidateFunctions = supFns;
  }

  const sub = compileSub(values, sp, opts.references);

  if (opts.isDryRun()) return null;
  const subFn = sub!.validate;
  return ok((v, ip, refs) =>
    validateValues(v, subFn, sp, ip, refs, opts.validationOptions)
  );
}

function compileSchemaOfDiscriminator(
  schema: DiscriminatorSchema,
  spParent: string[],
  opts: {
    references: CompileSubReferences;
    groupedKeys: Extract<GroupedSchemaKeys, { type: "discriminator" }>;
    pushError: (sp: string[], raw: CompilationRawError) => void;
    isDryRun: () => boolean;
    validationOptions: ValidationOptions;
  },
) {
  const sp = [...spParent, "discriminator"];

  const discriminator = schema.discriminator;
  const mapping = schema.mapping;

  if (typeof discriminator !== "string") {
    opts.pushError(sp, {
      type: "DISCRIMINATOR_FORM:NON_STRING_DISCRIMINATOR",
      actualDiscriminatorType: jsonTypeOf(discriminator),
    });
  }

  if (!opts.groupedKeys.mapping) {
    opts.pushError(sp, { type: "DISCRIMINATOR_FORM:MISSING_MAPPING" });
    return null;
  }
  const tMapping = jsonTypeOf(mapping);
  if (tMapping !== "object") {
    opts.pushError(sp, {
      type: "DISCRIMINATOR_FORM:NON_OBJECT_MAPPING",
      actualMappingType: tMapping,
    });
    return null;
  }

  const supFns = runHooks(
    opts.references.options.hooks,
    "discriminator",
    schema,
    { pushError: (raw) => opts.pushError(sp, raw) },
  );
  if (supFns) {
    opts.validationOptions.supplementalValidateFunctions = supFns;
  }

  const subs: MappingValidateFunctions = {};
  const subState = { mapping: { discriminator } };
  const spMapping = [...spParent, "mapping"];
  for (const [key, schema] of Object.entries(mapping)) {
    const sp = [...spMapping, key];
    const sub = compileSub(schema, sp, opts.references, subState);
    if (!sub) continue;
    subs[key] = sub.validate;
  }

  if (opts.isDryRun()) return null;
  const vOpts = opts.validationOptions;
  return ok((v, ip, refs) =>
    validateDiscriminator(v, discriminator, subs, spParent, ip, refs, vOpts)
  );
}

function compileSchemaOfRef(
  schema: RefSchema,
  spParent: string[],
  opts: {
    references: CompileSubReferences;
    state?: CompileSubState;
    pushError: (sp: string[], raw: CompilationRawError) => void;
    isDryRun: () => boolean;
    validationOptions: ValidationOptions;
  },
) {
  const sp = [...spParent, "ref"];
  const ref = schema.ref;
  if (typeof ref !== "string") {
    opts.pushError(sp, {
      type: "REF_FORM:NON_STRING_REF",
      actualRefType: jsonTypeOf(ref),
    });
    return null;
  }

  if (!(ref in opts.references.definitions)) {
    opts.pushError(sp, { type: "REF_FORM:NO_DEFINITION", definition: ref });
  }
  opts.references.dependencies[ref] = {
    isAtRoot: opts.state?.type === "root" ||
      opts.state?.type === "definition_root",
  };

  const supFns = runHooks(
    opts.references.options.hooks,
    "ref",
    schema,
    { pushError: (raw) => opts.pushError(sp, raw) },
  );
  if (supFns) {
    opts.validationOptions.supplementalValidateFunctions = supFns;
  }

  if (opts.isDryRun()) return null;
  const subGetter = opts.references.definitions[ref]!;
  return ok((v, ip, refs) =>
    validateRef(v, subGetter, sp, ip, refs, opts.validationOptions)
  );
}

function ok(
  validateFn: InternalValidator["validate"],
): InternalValidator | null {
  return { validate: validateFn };
}
