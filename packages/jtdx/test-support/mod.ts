import { expect } from "vitest";

import { CompilationResult, ValidationResult } from "../src/compiling/mod";

interface ErrorInOfficialTestSuite {
  schemaPath: (string)[];
  instancePath: (string)[];
}

interface CustomMatchers<_R = unknown> {
  compilationToBeOk(): void;
  validationToBeOk(): void;
  validationToBeNotOk(errors: ErrorInOfficialTestSuite[]): void;
}
declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  compilationToBeOk: (received: CompilationResult) => {
    if (received.isOk) {
      return { message: () => "make tsc happy", pass: true };
    }
    const actualErrors = received.errors;
    return {
      message: () => `Unexpected Errors: ${JSON.stringify(actualErrors)}`,
      pass: false,
    };
  },

  validationToBeOk: (received: ValidationResult) => {
    if (received.isOk) {
      return { message: () => "make tsc happy", pass: true };
    }
    const actualErrors = received.errors;
    return {
      message: () => `Unexpected Errors: ${JSON.stringify(actualErrors)}`,
      pass: false,
    };
  },

  validationToBeNotOk: (
    received: ValidationResult,
    errors: ErrorInOfficialTestSuite[],
  ) => {
    let actualErrors = received.isOk ? [] : received.errors;
    const missedErrors: ErrorInOfficialTestSuite[] = [];
    const hitErrors: ErrorInOfficialTestSuite[] = [];
    for (const error of errors) {
      const oldCount = actualErrors.length;
      actualErrors = actualErrors.filter(
        (e) =>
          !(pathsEqual(e.schemaPath, error.schemaPath) &&
            pathsEqual(e.instancePath, error.instancePath)),
      );
      if (oldCount === actualErrors.length) {
        missedErrors.push(error);
      } else {
        hitErrors.push(error);
      }
    }

    if (missedErrors.length === 0 && actualErrors.length === 0) {
      return { message: () => "make tsc happy", pass: true };
    } else {
      let message =
        "Expected Errors and Actual Errors do not match (- Expected, + Received, ~ Same):\n";
      function makeMessageLine(
        symbol: string,
        error: ErrorInOfficialTestSuite,
        type?: string,
      ) {
        const schemaPathJSON = JSON.stringify(error.schemaPath);
        const instancePathJSON = JSON.stringify(error.instancePath);
        let line = `${symbol} ${schemaPathJSON} ${instancePathJSON}`;
        if (type) {
          line += ` ${type}`;
        }
        return line;
      }
      for (const error of actualErrors) {
        message += `  ${makeMessageLine("+", error, error.raw.type)}\n`;
      }
      for (const error of missedErrors) {
        message += `  ${makeMessageLine("-", error)}\n`;
      }
      for (const error of hitErrors) {
        message += `  ${makeMessageLine("~", error)}\n`;
      }
      return {
        message: () => message,
        pass: false,
      };
    }
  },
});

function pathsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
