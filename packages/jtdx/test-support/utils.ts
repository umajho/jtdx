import { expect } from "vitest";

import "./init";

import {
  CompilationError,
  CompilationOptions,
  CompilationResult,
  compile,
  ValidationError,
} from "../src/mod";
import { Schema } from "../src/types";

export function expectCompilationErrors(
  schema: Schema,
  errors: CompilationError[],
  opts?: {
    compilationOptions: CompilationOptions;
  },
) {
  expect(compile(schema, opts?.compilationOptions))
    .toEqual({ isOk: false, errors });
}

export function expectValidationOk(
  schema: Schema,
  data: any,
  opts?: {
    compilationOptions: CompilationOptions;
  },
) {
  const validator = mustCompile(schema, opts);
  expect(validator.validate(data)).validationToBeOk();
}

export function expectValidationErrors(
  schema: Schema,
  data: any,
  errors: ValidationError[],
  opts?: {
    compilationOptions: CompilationOptions;
  },
) {
  const validator = mustCompile(schema, opts);
  expect(validator.validate(data)).validationToBeNotOk(errors);
}

function mustCompile(schema: Schema, opts?: {
  compilationOptions: CompilationOptions;
}) {
  const compResult = compile(schema, opts?.compilationOptions);
  expect(compResult).compilationToBeOk();
  return (compResult as Extract<CompilationResult, { isOk: true }>).validator;
}
