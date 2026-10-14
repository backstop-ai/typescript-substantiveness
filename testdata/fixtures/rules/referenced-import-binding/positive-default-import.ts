// POSITIVE = CLEAN (ISSUE-003). A default import emits its local binding name.
import openStore from "../src/open-store.js";

// expect-symbol: openStore

it("opens a store from the default export", () => {
  expect(openStore()).toBeDefined();
});
