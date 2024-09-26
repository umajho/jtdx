export type JSONType =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "array"
  | "object";

export function jsonTypeOf(v: any): JSONType {
  const t = typeof v;
  switch (t) {
    case "string":
    case "number":
    case "boolean":
      return t;
    case "object":
      if (v === null) return "null";
      if (Array.isArray(v)) return "array";
      return "object";
    default:
      throw new Error("unreachable");
  }
}
