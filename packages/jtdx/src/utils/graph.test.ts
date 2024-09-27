import { describe, expect, it } from "vitest";

import { findCircular } from "./graph";

describe("function findCircular", () => {
  const table: { graph: Record<string, string>; expected: string[][] }[] = [
    { graph: {}, expected: [] },
    { graph: { a: "b" }, expected: [] },
    { graph: { a: "a" }, expected: [["a"]] },
    { graph: { a: "b", b: "c" }, expected: [] },
    { graph: { a: "b", b: "c", c: "a" }, expected: [["a", "b", "c"]] },
    { graph: { a: "b", b: "c", c: "b" }, expected: [["b", "c"]] },
    {
      graph: { a: "b", b: "a", c: "d", d: "c" },
      expected: [["a", "b"], ["c", "d"]],
    },
    {
      graph: { a: "c", b: "c", c: "d", d: "c" },
      expected: [["c", "d"]],
    },
  ];

  for (const [i, { graph, expected }] of table.entries()) {
    it(`case ${i + 1}: ${JSON.stringify(graph)}`, () => {
      const actual = findCircular(graph);
      expect(actual).toEqual(expected);
    });
  }
});
