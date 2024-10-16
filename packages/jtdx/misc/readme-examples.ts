import { Examples } from "../example-support/types";

import examplesByFeatureFromExtensionXCheck from "../src/extensions/x-checks/mod.examples";

export default {
  "x:checks": examplesByFeatureFromExtensionXCheck,
} satisfies ExamplesByCategory;

type ExamplesByCategory = Record<string, Examples>;
