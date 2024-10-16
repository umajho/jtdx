import fs from "node:fs";
import process from "node:process";
import { parseArgs } from "node:util";
import { dirname, relative } from "node:path";

import stringify from "json-stringify-pretty-compact";

import examplesByCategory from "../misc/readme-examples";

import { Schema } from "../src/types";
type ExamplesCategory = typeof examplesByCategory;

function main(unparsedArgs: string[]): number {
  const args = parseArguments(unparsedArgs);

  const map = buildKeyExamplesMap(examplesByCategory);
  const mapUsage = Object.fromEntries(Object.keys(map).map((key) => [key, 0]));

  const readme = fs.readFileSync(args.inputFile, { encoding: "utf-8" });
  const textInsertPairs = groupArrayByChunk(
    readme.split(/```insert-examples\n(.+)\n```/),
    2,
  );

  let result = "";
  result += "<!-- THIS FILE IS GENERATED. DO NOT EDIT. -->\n";
  const originalPath = relative(dirname(args.outputFile), args.inputFile);
  if (/-->|\.\./.test(originalPath)) throw new Error("?");
  result += `<!-- GENERATED FROM: ${originalPath} -->\n`;

  const missingToInsert: Set<string> = new Set();
  for (const [text, toBeInserted] of textInsertPairs) {
    result += text;
    if (toBeInserted) {
      const examplesToBeInserted = map[toBeInserted];
      if (!examplesToBeInserted) {
        missingToInsert.add(toBeInserted);
      } else {
        result += examplesToBeInserted.join("\n");
        mapUsage[toBeInserted]!++;
      }
    }
  }

  let isSuccessful = true;

  if (missingToInsert.size > 0) {
    isSuccessful = false;
    for (const missing of missingToInsert) {
      console.error(`There is no example for "${missing}" to be inserted!`);
    }
  }
  for (const [key, usage] of Object.entries(mapUsage)) {
    if (usage === 0) {
      console.warn(`"${key}" is not used in the README.`);
    } else if (usage > 1) {
      console.warn(`"${key}" is used ${usage} times in the README.`);
    }
  }

  if (!isSuccessful) return 1;

  fs.writeFileSync(args.outputFile, result);
  return 0;
}

function parseArguments(
  args: string[],
): { inputFile: string; outputFile: string } {
  const { values } = parseArgs({
    args,
    options: {
      inputFile: { type: "string", short: "i" },
      outputFile: { type: "string", short: "o" },
    },
  });
  if (!values.inputFile || !values.outputFile) throw new Error("Unreachable");
  return { // XXX: tsc will complain if `values` is returned directly.
    inputFile: values.inputFile,
    outputFile: values.outputFile,
  };
}

function buildKeyExamplesMap(
  examplesByCategory: ExamplesCategory,
): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  for (
    const [extensionName, examplesByFeature] of //
    Object.entries(examplesByCategory)
  ) {
    for (
      const [featureName, examples] of Object.entries(examplesByFeature)
    ) {
      const name = `${extensionName} :: ${featureName}`;
      map[name] = examples.map((example, i) => renderExample(example, i + 1));
    }
  }

  return map;
}

function renderExample(
  example: { schema: Schema; validCases: any[]; invalidCases: any[] },
  caseNumber: number,
): string {
  const columns = Math.min(
    4,
    Math.max(example.validCases.length, example.invalidCases.length),
  );

  // see <https://gist.github.com/panoply/176101828af8393adc821e49578ac588?permalink_comment_id=4264536#gistcomment-4264536>
  // for the idea of `<th width>`.

  return `
<details open>
<summary>example ${caseNumber}</summary>
<table>
<tr><th colspan="${columns}" width="10000px">Schema</th></tr>
<tr>
<td colspan="${columns}">

\`\`\`json
${stringify(example.schema, { maxLength: 40 })} 
\`\`\`
</td>
</tr>
<tr><th colspan="${columns}">🟢 Valid Cases</th></tr>
${renderCasesAsRows(example.validCases, columns)}
<tr><th colspan="${columns}">🔴 Invalid Cases</th></tr>
${renderCasesAsRows(example.invalidCases, columns)}
</table>
</details>
`.trim();
}

function renderCasesAsRows(cases: any[], columns: number): string {
  const rows = groupArrayByChunk(cases, columns);
  return rows.map((rowCases) => {
    const columnsPerCell = Math.ceil(columns / rowCases.length);
    const columnsForLastCell = (columns % rowCases.length) || columnsPerCell;
    return `
<tr>
${
      rowCases.map((c, i) => {
        const isLastCell = i === rowCases.length - 1;
        const colspan = isLastCell ? columnsForLastCell : columnsPerCell;
        return `
<td${colspan === 1 ? "" : ` colspan="${colspan}"`}>

\`\`\`json
${stringify(c)}
\`\`\`
</td>
`.trim();
      }).join("\n")
    }
</tr>
`.trim();
  }).join("\n");
}

function groupArrayByChunk<T>(arr: T[], n: number): T[][] {
  if (n <= 0) throw new Error("n must be a positive integer");

  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }
  return result;
}

process.exit(main(process.argv.slice(2)));
