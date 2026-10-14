// POSITIVE = CLEAN (ISSUE-003). `import { A as B }` emits BOTH the exported name (what a
// spec names) and the local alias (what the test body calls).
import { createHandlers as makeHandlers } from "../src/handlers.js";

// expect-symbol: createHandlers
// expect-symbol: makeHandlers

it("creates handlers through an alias", () => {
  expect(makeHandlers()).toBeDefined();
});
