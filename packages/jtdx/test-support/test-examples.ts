import { beforeEach, describe, expect, it } from "vitest";

import "./init";

import { Examples } from "../example-support/types";

import { RootSchema, Validator } from "../src/mod";

export function testExamplesByFeatureForValidation(
  examplesByFeature: Examples,
  opts: {
    createValidator: (schema: RootSchema) => Validator;
  },
) {
  for (const [featureName, examples] of Object.entries(examplesByFeature)) {
    describe(`Feature: ${featureName}`, () => {
      for (const [i, example] of examples.entries()) {
        describe(`schema ${i + 1}: ${JSON.stringify(example.schema)}`, () => {
          let validator: Validator;
          beforeEach(() => {
            validator = opts.createValidator(example.schema);
          });

          for (const [i, kase] of example.validCases.entries()) {
            it(`valid case ${i + 1}: ${JSON.stringify(kase)}`, () => {
              const result = validator.validate(kase);
              expect(result).validationToBeOk();
            });
          }
          for (const [i, kase] of example.invalidCases.entries()) {
            it(`invalid case ${i + 1}: ${JSON.stringify(kase)}`, () => {
              const result = validator.validate(kase);
              expect(result.isOk).toBe(false);
            });
          }
        });
      }
    });
  }
}
