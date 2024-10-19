import { internal } from "../internal/mod";

import { BreakingExtension } from "./mod";

import { useDisallowEmptyMappings } from "./disallow-empty-mappings";
import { useDisallowLeapSeconds } from "./disallow-leap-seconds";
import { useXChecks } from "./x-checks/mod";

export const disallowEmptyMappings: BreakingExtension = {
  [internal]: useDisallowEmptyMappings,
};

export const disallowLeapSeconds: BreakingExtension = {
  [internal]: useDisallowLeapSeconds,
};

export const xChecks: BreakingExtension = {
  [internal]: useXChecks,
} as BreakingExtension;
