// POSITIVE = CLEAN (ISSUE-003). Type-only imports are erased at compile time and cannot be
// called, so they must NOT emit a binding name: a test that only annotates with the
// subject's type must not satisfy "calls its subject". Covers `import type { ... }`,
// `import type X`, and an inline `type` specifier. The value import beside the inline
// specifier still emits, and module-path names are unchanged.
import type { Store } from "../src/store.js";
import type StoreConfig from "../src/store-config.js";
import { type StoreOptions, openStore } from "../src/open-store.js";

// expect-no-symbol: Store
// expect-no-symbol: StoreConfig
// expect-no-symbol: StoreOptions
// expect-symbol: openStore
// expect-symbol: store

it("opens a store with typed options", () => {
  const options: StoreOptions = {};
  const s: Store = openStore(options);
  expect(s).toBeDefined();
});
