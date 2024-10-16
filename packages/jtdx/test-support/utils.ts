import { expect } from "vitest";

import { CompilationError, CompilationOptions, compile } from "../src/mod";
import { Schema } from "../src/types";

export function expectError(
  schema: Schema,
  errors: CompilationError[],
  opts?: {
    compilationOptions: CompilationOptions;
  },
) {
  const compOpts = opts?.compilationOptions ?? { extensions: null };

  expect(compile(schema, compOpts)).toEqual({ isOk: false, errors });
}
