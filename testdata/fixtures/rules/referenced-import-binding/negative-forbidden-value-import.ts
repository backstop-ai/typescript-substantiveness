// NEGATIVE = VIOLATING (ISSUE-003). The validator must FAIL here, and ONLY on its
// `expect-no-symbol` check: `Store` is a value import, so it IS referenced, while every
// `expect-symbol` line is satisfied. This proves the expect-no-symbol check is live (the
// type-only positive relies on it).
import { Store } from "../src/store.js";

// expect-symbol: store
// expect-no-symbol: Store

it("constructs a store", () => {
  expect(new Store()).toBeDefined();
});
