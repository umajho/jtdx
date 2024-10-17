import { expect } from "vitest";

import { CompilationError, CompilationOptions, compile } from "../src/mod";
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
