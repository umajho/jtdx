import { Examples } from "../../../example-support/types";

export default {
  "type(string) : `minLength` & `maxLength`": [
    {
      schema: {
        type: "string",
        "x:checks": { minLength: 3, maxLength: 5 },
      },
      validCases: ["a23"],
      invalidCases: ["a2", "a23456"],
    },
  ],
  "type(string) : `pattern`": [
    {
      schema: {
        type: "string",
        "x:checks": { pattern: "^foo" },
      },
      validCases: ["foo", "foo!!!"],
      invalidCases: ["bar", "!!!foo"],
    },
  ],
  "type(numeric|timestamp) : (`minimum` & `exclusiveMinimum`) & (`maximum` & `exclusiveMaximum`)":
    [
      {
        schema: {
          type: "float64",
          "x:checks": { minimum: 3, maximum: 5 },
        },
        validCases: [3, 3.1, 5],
        invalidCases: [2.9, 5.1],
      },
      {
        schema: {
          type: "float64",
          "x:checks": { exclusiveMinimum: 3 },
        },
        validCases: [3.1],
        invalidCases: [3],
      },
      {
        schema: {
          type: "timestamp",
          "x:checks": {
            minimum: "2000-01-01T00:00:00.00Z",
            exclusiveMaximum: "2100-01-11T00:00:00.00Z",
          },
        },
        validCases: ["2000-01-11T00:00:00.00Z", "2099-12-31T23:59:59.99Z"],
        invalidCases: ["2100-01-11T00:00:00.00Z"],
      },
    ],
  "type(integer) : `multipleOf`": [
    {
      schema: {
        type: "int8",
        "x:checks": { multipleOf: 3 },
      },
      validCases: [3, 6, 0, -9],
      invalidCases: [1, 20],
    },
  ],
  "elements : `minElements` & `maxElements`": [
    {
      schema: {
        elements: { type: "int8" },
        "x:checks": { minElements: 3, maxElements: 5 },
      },
      validCases: [[1, 2, 3]],
      invalidCases: [[1], [1, 2, 3, 4, 5, 6]],
    },
  ],
  "elements(type|enum) : `uniqueElements`": [
    {
      schema: {
        elements: { type: "int16" },
        "x:checks": { uniqueElements: true },
      },
      validCases: [[123, 456]],
      invalidCases: [[123, 123]],
    },
    {
      schema: {
        elements: { enum: ["foo", "bar"] },
        "x:checks": { uniqueElements: true },
      },
      validCases: [["foo", "bar"]],
      invalidCases: [["foo", "foo"]],
    },
  ],
  "properties : `minProperties` & `maxProperties`": [
    {
      schema: {
        properties: { foo: { enum: ["foo"] } },
        optionalProperties: {
          bar: { enum: ["bar"] },
          baz: { enum: ["baz"] },
        },
        "x:checks": { minProperties: 2, maxProperties: 2 },
      },
      validCases: [{ foo: "foo", bar: "bar" }, { foo: "foo", baz: "baz" }],
      invalidCases: [{ foo: "foo" }, { foo: "foo", bar: "bar", baz: "baz" }],
    },
  ],
  "values : `minValues` & `maxValues`": [
    {
      schema: {
        values: { type: "int8" },
        "x:checks": { minValues: 1, maxValues: 2 },
      },
      validCases: [{ foo: 1 }, { foo: 1, bar: 2 }],
      invalidCases: [{}, { foo: 1, bar: 2, baz: 3 }],
    },
  ],
} satisfies Examples;
