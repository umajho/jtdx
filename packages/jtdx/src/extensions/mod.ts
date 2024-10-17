import { ExtensionContext } from "../compiling/extension-context";
import { internal } from "../internal/mod";

export * as BreakingExtensions from "./tree-shaking-helper-breaking-extensions";

export type BreakingExtension =
  | { [internal]: (ctx: ExtensionContext) => void }
  | { readonly __tag: unique symbol };
