// POSITIVE = CLEAN (ISSUE-003). A namespace import emits the namespace binding name.
import * as storeModule from "../src/store.js";

// expect-symbol: storeModule

it("reads through a namespace import", () => {
  expect(storeModule.Store).toBeDefined();
});
