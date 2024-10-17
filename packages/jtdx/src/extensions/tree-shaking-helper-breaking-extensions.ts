import { internal } from "../internal/mod";

import { BreakingExtension } from "./mod";

import { useDisallowEmptyMappings } from "./disallow-empty-mappings";
import { useXChecks } from "./x-checks/mod";

export const disallowEmptyMappings: BreakingExtension = {
  [internal]: useDisallowEmptyMappings,
};

export const xChecks: BreakingExtension = {
  [internal]: useXChecks,
} as BreakingExtension;
