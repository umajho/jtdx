import { CompilationRawError, ValidationRawError } from "../errors";
import {
  DiscriminatorSchema,
  ElementsSchema,
  EmptySchema,
  EnumSchema,
  PropertiesSchema,
  RefSchema,
  Schema,
  TypeSchema,
  ValuesSchema,
} from "../types";

export interface HookOptions {
  pushError: (raw: CompilationRawError) => void;
}

interface SupplementalValidateFunctionOptions {
  pushError: (raw: ValidationRawError) => void;
}

export type SupplementalValidateFunction = (
  v: any,
  opts: SupplementalValidateFunctionOptions,
) => void;

type HookFor<T extends Schema> = (
  schema: T,
  opts: HookOptions,
) => SupplementalValidateFunction | SupplementalValidateFunction[] | void;

export interface Hooks {
  empty: HookFor<EmptySchema>[];
  type: HookFor<TypeSchema>[];
  enum: HookFor<EnumSchema>[];
  elements: HookFor<ElementsSchema>[];
  properties: HookFor<PropertiesSchema>[];
  values: HookFor<ValuesSchema>[];
  discriminator: HookFor<DiscriminatorSchema>[];
  ref: HookFor<RefSchema>[];
}

export type HooksBuilder = ReturnType<typeof createHooksBuilder>["builder"];

export function createHooksBuilder() {
  let hooks: Hooks | null = {
    empty: [],
    type: [],
    enum: [],
    elements: [],
    properties: [],
    values: [],
    discriminator: [],
    ref: [],
  };

  const builder = {
    check<T extends keyof Hooks>(which: T, fn: Hooks[T][number]) {
      // @ts-ignore
      hooks![which].push(fn);
      return builder;
    },
  };

  function build(): Hooks {
    const result = hooks;
    if (!result) throw new Error("Hooks have already been built");
    hooks = null;
    return result!;
  }

  return { builder, build };
}

export function runHooks<
  T extends keyof Hooks,
>(
  hooks: Hooks,
  which: T,
  schema: Parameters<Hooks[T][number]>[0],
  opts: { pushError: (raw: CompilationRawError) => void },
): SupplementalValidateFunction[] | null {
  const hooksForSchema = hooks[which] as HookFor<typeof schema>[];
  const fns = hooksForSchema.flatMap((fn) => fn(schema, opts) ?? []);
  return fns.length ? fns : null;
}

export function runSupplementalValidateFunctions(
  fns: SupplementalValidateFunction[],
  v: any,
  opts: { pushError: (raw: ValidationRawError) => void },
): void {
  for (const fn of fns) {
    fn(v, opts);
  }
}
