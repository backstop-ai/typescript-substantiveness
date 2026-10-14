// NEGATIVE = VIOLATING (ISSUE-003). A test that imports its subject only as a type does not
// call it, so the expectation that it references `Store` must FAIL.
import type { Store } from "../src/store.js";

// expect-symbol: Store

it("only annotates with the subject type", () => {
  const s: Store | undefined = undefined;
  expect(s).toBeUndefined();
});
