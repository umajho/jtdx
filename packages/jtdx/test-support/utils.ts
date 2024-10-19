import { expect } from "vitest";

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

export function expectValidationErrors(
  schema: Schema,
  data: any,
  errors: ValidationError[],
  opts?: {
    compilationOptions: CompilationOptions;
  },
) {
  const compResult = compile(schema, opts?.compilationOptions);
  expect(compResult).compilationToBeOk();
  const validator =
    (compResult as Extract<CompilationResult, { isOk: true }>).validator;

  expect(validator.validate(data)).toEqual({ isOk: false, errors });
}
