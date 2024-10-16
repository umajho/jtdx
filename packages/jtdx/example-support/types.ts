import { RootSchema } from "../src/types";

export type Examples = Record<string, Example[]>;
export interface Example {
  schema: RootSchema;
  validCases: any[];
  invalidCases: any[];
}
