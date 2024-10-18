<!-- THIS FILE IS GENERATED. DO NOT EDIT. -->
<!-- GENERATED FROM: README.raw.md -->
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
import { BreakingExtensions, compile } from "jtdx";

// …

const compilationResult = compile(schema, {
  breakingExtensions: [BreakingExtensions.disallowEmptyMappings],
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

## Breaking Extension `x:checks`: extra validation rules mostly borrowed from JSON Schema

```typescript
import { BreakingExtensions, compile } from "jtdx";

// …

const compilationResult = compile(schema, {
  breakingExtensions: [BreakingExtensions.xChecks],
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

<details open>
<summary>example 1</summary>
<table>
<tr><th colspan="2" width="10000px">Schema</th></tr>
<tr>
<td colspan="2">

```json
{
  "type": "string",
  "x:checks": {
    "minLength": 3,
    "maxLength": 5
  }
} 
```
</td>
</tr>
<tr><th colspan="2">🟢 Valid Cases</th></tr>
<tr>
<td colspan="2">

```json
"a23"
```
</td>
</tr>
<tr><th colspan="2">🔴 Invalid Cases</th></tr>
<tr>
<td>

```json
"a2"
```
</td>
<td>

```json
"a23456"
```
</td>
</tr>
</table>
</details>

#### `pattern`

<details open>
<summary>example 1</summary>
<table>
<tr><th colspan="2" width="10000px">Schema</th></tr>
<tr>
<td colspan="2">

```json
{
  "type": "string",
  "x:checks": {"pattern": "^foo"}
} 
```
</td>
</tr>
<tr><th colspan="2">🟢 Valid Cases</th></tr>
<tr>
<td>

```json
"foo"
```
</td>
<td>

```json
"foo!!!"
```
</td>
</tr>
<tr><th colspan="2">🔴 Invalid Cases</th></tr>
<tr>
<td>

```json
"bar"
```
</td>
<td>

```json
"!!!foo"
```
</td>
</tr>
</table>
</details>

### For `Type` form schema where `type` is a boundable type

#### (`minimum` & `exclusiveMinimum`) & (`maximum` & `exclusiveMaximum`)

<details open>
<summary>example 1</summary>
<table>
<tr><th colspan="3" width="10000px">Schema</th></tr>
<tr>
<td colspan="3">

```json
{
  "type": "float64",
  "x:checks": {
    "minimum": 3,
    "maximum": 5
  }
} 
```
</td>
</tr>
<tr><th colspan="3">🟢 Valid Cases</th></tr>
<tr>
<td>

```json
3
```
</td>
<td>

```json
3.1
```
</td>
<td>

```json
5
```
</td>
</tr>
<tr><th colspan="3">🔴 Invalid Cases</th></tr>
<tr>
<td colspan="2">

```json
2.9
```
</td>
<td>

```json
5.1
```
</td>
</tr>
</table>
</details>
<details open>
<summary>example 2</summary>
<table>
<tr><th colspan="1" width="10000px">Schema</th></tr>
<tr>
<td colspan="1">

```json
{
  "type": "float64",
  "x:checks": {"exclusiveMinimum": 3}
} 
```
</td>
</tr>
<tr><th colspan="1">🟢 Valid Cases</th></tr>
<tr>
<td>

```json
3.1
```
</td>
</tr>
<tr><th colspan="1">🔴 Invalid Cases</th></tr>
<tr>
<td>

```json
3
```
</td>
</tr>
</table>
</details>
<details open>
<summary>example 3</summary>
<table>
<tr><th colspan="2" width="10000px">Schema</th></tr>
<tr>
<td colspan="2">

```json
{
  "type": "timestamp",
  "x:checks": {
    "minimum": "2000-01-01T00:00:00.00Z",
    "exclusiveMaximum": "2100-01-11T00:00:00.00Z"
  }
} 
```
</td>
</tr>
<tr><th colspan="2">🟢 Valid Cases</th></tr>
<tr>
<td>

```json
"2000-01-11T00:00:00.00Z"
```
</td>
<td>

```json
"2099-12-31T23:59:59.99Z"
```
</td>
</tr>
<tr><th colspan="2">🔴 Invalid Cases</th></tr>
<tr>
<td colspan="2">

```json
"2100-01-11T00:00:00.00Z"
```
</td>
</tr>
</table>
</details>

### For `Type` form schema where `type` is a ~~numeric~~ integer type

#### `multipleOf`

> [!NOTE]
>
> Currently, `multipleOf` can only be applied to integer types, and its value
> also has to be an integer. That's to avoid meddling with floating-point
> rounding issues for now.

<details open>
<summary>example 1</summary>
<table>
<tr><th colspan="4" width="10000px">Schema</th></tr>
<tr>
<td colspan="4">

```json
{
  "type": "int8",
  "x:checks": {"multipleOf": 3}
} 
```
</td>
</tr>
<tr><th colspan="4">🟢 Valid Cases</th></tr>
<tr>
<td>

```json
3
```
</td>
<td>

```json
6
```
</td>
<td>

```json
0
```
</td>
<td>

```json
-9
```
</td>
</tr>
<tr><th colspan="4">🔴 Invalid Cases</th></tr>
<tr>
<td colspan="2">

```json
1
```
</td>
<td colspan="2">

```json
20
```
</td>
</tr>
</table>
</details>

### For `Elements` form schema

#### `minElements` & `maxElements`

<details open>
<summary>example 1</summary>
<table>
<tr><th colspan="2" width="10000px">Schema</th></tr>
<tr>
<td colspan="2">

```json
{
  "elements": {"type": "int8"},
  "x:checks": {
    "minElements": 3,
    "maxElements": 5
  }
} 
```
</td>
</tr>
<tr><th colspan="2">🟢 Valid Cases</th></tr>
<tr>
<td colspan="2">

```json
[1, 2, 3]
```
</td>
</tr>
<tr><th colspan="2">🔴 Invalid Cases</th></tr>
<tr>
<td>

```json
[1]
```
</td>
<td>

```json
[1, 2, 3, 4, 5, 6]
```
</td>
</tr>
</table>
</details>

### For `Elements` form schema where `elements` is a `Type` or `Enum` form schema

#### `uniqueElements`

<details open>
<summary>example 1</summary>
<table>
<tr><th colspan="1" width="10000px">Schema</th></tr>
<tr>
<td colspan="1">

```json
{
  "elements": {"type": "int16"},
  "x:checks": {"uniqueElements": true}
} 
```
</td>
</tr>
<tr><th colspan="1">🟢 Valid Cases</th></tr>
<tr>
<td>

```json
[123, 456]
```
</td>
</tr>
<tr><th colspan="1">🔴 Invalid Cases</th></tr>
<tr>
<td>

```json
[123, 123]
```
</td>
</tr>
</table>
</details>
<details open>
<summary>example 2</summary>
<table>
<tr><th colspan="1" width="10000px">Schema</th></tr>
<tr>
<td colspan="1">

```json
{
  "elements": {"enum": ["foo", "bar"]},
  "x:checks": {"uniqueElements": true}
} 
```
</td>
</tr>
<tr><th colspan="1">🟢 Valid Cases</th></tr>
<tr>
<td>

```json
["foo", "bar"]
```
</td>
</tr>
<tr><th colspan="1">🔴 Invalid Cases</th></tr>
<tr>
<td>

```json
["foo", "foo"]
```
</td>
</tr>
</table>
</details>

### For `Properties` form schema

#### `minProperties` & `maxProperties`

<details open>
<summary>example 1</summary>
<table>
<tr><th colspan="2" width="10000px">Schema</th></tr>
<tr>
<td colspan="2">

```json
{
  "properties": {
    "foo": {"enum": ["foo"]}
  },
  "optionalProperties": {
    "bar": {"enum": ["bar"]},
    "baz": {"enum": ["baz"]}
  },
  "x:checks": {
    "minProperties": 2,
    "maxProperties": 2
  }
} 
```
</td>
</tr>
<tr><th colspan="2">🟢 Valid Cases</th></tr>
<tr>
<td>

```json
{"foo": "foo", "bar": "bar"}
```
</td>
<td>

```json
{"foo": "foo", "baz": "baz"}
```
</td>
</tr>
<tr><th colspan="2">🔴 Invalid Cases</th></tr>
<tr>
<td>

```json
{"foo": "foo"}
```
</td>
<td>

```json
{"foo": "foo", "bar": "bar", "baz": "baz"}
```
</td>
</tr>
</table>
</details>

### For `Values` form schema

#### `minValues` & `maxValues`

<details open>
<summary>example 1</summary>
<table>
<tr><th colspan="2" width="10000px">Schema</th></tr>
<tr>
<td colspan="2">

```json
{
  "values": {"type": "int8"},
  "x:checks": {
    "minValues": 1,
    "maxValues": 2
  }
} 
```
</td>
</tr>
<tr><th colspan="2">🟢 Valid Cases</th></tr>
<tr>
<td>

```json
{"foo": 1}
```
</td>
<td>

```json
{"foo": 1, "bar": 2}
```
</td>
</tr>
<tr><th colspan="2">🔴 Invalid Cases</th></tr>
<tr>
<td>

```json
{}
```
</td>
<td>

```json
{"foo": 1, "bar": 2, "baz": 3}
```
</td>
</tr>
</table>
</details>

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
