# JTDX

[![NPM Version](https://img.shields.io/npm/v/jtdx)](https://www.npmjs.com/package/jtdx)
[![GitHub Repo stars](https://img.shields.io/github/stars/umajho/jtdx)](https://github.com/umajho/jtdx/)

My personal take on extending JSON Typedef.

## Reasoning

- Why do I need to extend JSON Typedef?
  > I'm working on a project, where users are capable of creating forms from
  > JSON data. JSON Typedef is not expressive enough to fit the requirements.
- Why don't I choose JSON Schema based form builders that already exist, like
  [JSON Forms](https://jsonforms.io/)?
  > - There are so many versions of JSON Schema. It is just hard to tell which
  >   version those libraries are based on and what portion of features they
  >   support.
  > - I don't know how to implement features like lazy loading on top of those
  >   libraries.
  > - Writing separate UI schemas is just an overkill for my use case.
- Why do I prefer JSON Typedef over JSON Schema?
  > - Although JSON Typedef is not as expressive as JSON Schema, it is good
  >   enough for my use case.
  > - The expressiveness of JSON Schema (for example, those compound keywords)
  >   makes it complicated to build a JSON Schema-based form builder. It just
  >   doesn't worth my time.
- Why do I extend JSON Typedef instead of leveraging the `metadata` field it
  already provides?
  > - Supporting features like lazy loading already breaks JSON Typedef.
  >   Enabling these features by putting related stuff in the `metadata` field
  >   just makes that less obvious.
  > - For other features, it is just for consistency.

## Basic Usage

```typescript
import { compile, type RootSchema } from "jtdx";

const schema: RootSchema = { type: "string" };
const compilationResult = compile(schema);
if (!compilationResult.isOk) {
  throw new Error(
    `Compilation failed: ${JSON.stringify(compilationResult.errors)}`,
  );
}
const validator = compilationResult.validator;

const validationResult = validator.validate("Hello, world!");
if (!validationResult.isOk) {
  throw new Error(
    `Validation failed: ${JSON.stringify(validationResult.errors)}`,
  );
}
console.log("Validation succeeded!");
```

## Breaking Extension `(disallow empty mappings)`

```typescript
import { breakingExtensionDisallowEmptyMappings, compile } from "jtdx";

// …

const compilationResult = compile(schema, {
  breakingExtensions: [breakingExtensionDisallowEmptyMappings],
});
```

This will cause the compiler to disallow empty mappings in the schema.

For example, when this extension is enabled, the following schema is invalid,
otherwise it is valid:

```json
{
  "discriminator": "foo",
  "mapping": {}
}
```

## Breaking Extension `(disallow leap seconds)`

```typescript
import { breakingExtensionDisallowLeapSeconds, compile } from "jtdx";

// …

const compilationResult = compile(schema, {
  breakingExtensions: [breakingExtensionDisallowLeapSeconds],
});
```

If this extension is enabled, for a value in the input that is expected to be a
timestamp, even if it is a string that conforms to the RFC 3339 format, it will
still be rejected if its second part is 60.

For example, when this extension is enabled, the following input is considered
invalid against the schema `{ "type": "timestamp" }`:

```json
"1990-12-31T23:59:60Z"
```

## Breaking Extension `x:checks`: extra validation rules mostly borrowed from JSON Schema

```typescript
import { breakingExtensionXChecks, compile } from "jtdx";

// …

const compilationResult = compile(schema, {
  breakingExtensions: [breakingExtensionXChecks],
});
```

> [!NOTE]
>
> Boundable types are: `"timestamp"` or numeric types.
>
> Numeric types are: `"float32"`, `"float64"`, or integer types.
>
> Integer types are: `"int8"`, `uint8"`, `"int16"`, `"uint16"`, `"int32"` or
> `"uint32"`.

### For `Type` form schema where `type` is `"string"`

#### `minLength` & `maxLength`

```insert-examples
x:checks :: type(string) : `minLength` & `maxLength`
```

#### `pattern`

```insert-examples
x:checks :: type(string) : `pattern`
```

### For `Type` form schema where `type` is a boundable type

#### (`minimum` & `exclusiveMinimum`) & (`maximum` & `exclusiveMaximum`)

```insert-examples
x:checks :: type(numeric|timestamp) : (`minimum` & `exclusiveMinimum`) & (`maximum` & `exclusiveMaximum`)
```

### For `Type` form schema where `type` is a ~~numeric~~ integer type

#### `multipleOf`

> [!NOTE]
>
> Currently, `multipleOf` can only be applied to integer types, and its value
> also has to be an integer. That's to avoid meddling with floating-point
> rounding issues for now.

```insert-examples
x:checks :: type(integer) : `multipleOf`
```

### For `Elements` form schema

#### `minElements` & `maxElements`

```insert-examples
x:checks :: elements : `minElements` & `maxElements`
```

### For `Elements` form schema where `elements` is a `Type` or `Enum` form schema

#### `uniqueElements`

```insert-examples
x:checks :: elements(type|enum) : `uniqueElements`
```

### For `Properties` form schema

#### `minProperties` & `maxProperties`

```insert-examples
x:checks :: properties : `minProperties` & `maxProperties`
```

### For `Values` form schema

#### `minValues` & `maxValues`

```insert-examples
x:checks :: values : `minValues` & `maxValues`
```

## Miscellaneous

### On code generation / type inference

If a schema has additional properties used by those breaking extensions (like
`x:checks`), [json-typedef-codegen] will reject it.

An alternative approach is to define schemas in TypeScript and use
[Ajv's `JTDDataType`]:

`pnpm i -D ajv`

```typescript
import { JTDDataType } from "ajv/dist/jtd";

// …

type Data = JTDDataType<typeof schema>;
```

[json-typedef-codegen]: https://github.com/jsontypedef/json-typedef-codegen
[Ajv's `JTDDataType`]: https://ajv.js.org/guide/typescript.html#utility-type-for-jtd-data-type
