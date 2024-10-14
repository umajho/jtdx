import { CompilationRawError } from "../errors";
import { DiscriminatorSchema } from "../types";

interface Options {
  pushError: (error: CompilationRawError) => void;
}

export interface Hooks {
  discriminator: ((schema: DiscriminatorSchema, opts: Options) => void)[];
}

export type HooksBuilder = ReturnType<typeof createHooksBuilder>;

export function createHooksBuilder() {
  let hooks: Hooks | null = {
    discriminator: [],
  };

  const builder = {
    check<T extends keyof Hooks>(which: T, fn: Hooks[T][number]) {
      hooks![which].push(fn);
      return builder;
    },

    build(): Hooks {
      const result = hooks;
      if (!result) throw new Error("Hooks have already been built");
      hooks = null;
      return result!;
    },
  };
  return builder;
}
