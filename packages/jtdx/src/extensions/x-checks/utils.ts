import {
  TypeSchemaTypeBoundable,
  typeSchemaTypeBoundable,
  TypeSchemaTypeInteger,
  typeSchemaTypeInteger,
  TypeSchemaTypeNumeric,
  typeSchemaTypeNumeric,
} from "../../types";

/**
 * Make TypeScript happy.
 */
export function indexOfEx(arr: readonly string[], value: string): number {
  return arr.indexOf(value);
}

export function isBoundableType(type: string): type is TypeSchemaTypeBoundable {
  return indexOfEx(typeSchemaTypeBoundable, type) >= 0;
}

export function isNumericType(type: string): type is TypeSchemaTypeNumeric {
  return indexOfEx(typeSchemaTypeNumeric, type) >= 0;
}

export function isIntegerType(type: string): type is TypeSchemaTypeInteger {
  return indexOfEx(typeSchemaTypeInteger, type) >= 0;
}

export function take<T extends {}, U extends keyof T>(v: T, key: U): T[U] {
  const x = v[key];
  delete v[key];
  return x;
}

export function isNonNegativeInteger(n: number): boolean {
  return n >= 0 && Number.isInteger(n);
}

export function tryNewRegExp(pattern: string): RegExp | Error {
  try {
    return new RegExp(pattern);
  } catch (e) {
    return e as Error;
  }
}
