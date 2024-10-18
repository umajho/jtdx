import { TypeSchemaTypeNumeric } from "../../types";

export type WithXChecksForTypeSchema =
  | {
    type: "string";
    "x:checks"?:
      & { minLength?: number; maxLength?: number }
      & { pattern?: string };
  }
  | { type: TypeSchemaTypeNumeric; "x:checks"?: { multipleOf?: number } }
  | { type: TypeSchemaTypeNumeric; "x:checks"?: XChecksBounds<number> }
  | { type: "timestamp"; "x:checks"?: XChecksBounds<string> }
  | { type: string };

interface XChecksBounds<T> {
  minimum?: T;
  maximum?: T;
  exclusiveMinimum?: T;
  exclusiveMaximum?: T;
}

export interface WithXChecksForElementsSchema {
  "x:checks"?: {
    minElements?: number;
    maxElements?: number;
    uniqueElements?: boolean;
  };
}

export type WithXChecksForPropertiesSchema = {
  "x:checks"?: { minProperties?: number; maxProperties?: number };
};

export interface WithXChecksForValuesSchema {
  "x:checks"?: { minValues?: number; maxValues?: number };
}
