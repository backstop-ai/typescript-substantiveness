// POSITIVE = CLEAN (ISSUE-003). Two VALUE imports whose text contains the word `type` but
// are not type-only. The rule finds the `type` keyword by text and excludes an identifier
// and an import_clause whose text is `type`; without those exclusions both lines below
// would be misread as type-only and emit nothing.
//
//   import { type as t }  -> a value export named `type`, aliased `t`: emits type, t
//   import type from ...  -> a default import whose local name is `type`: emits type
import { type as t } from "../src/keywords.js";
import type from "../src/type-default.js";

// expect-symbol: t
// expect-symbol: type

it("uses value imports named type", () => {
  expect(t(type)).toBeDefined();
});
