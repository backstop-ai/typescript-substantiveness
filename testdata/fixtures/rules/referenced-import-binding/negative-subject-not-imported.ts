// NEGATIVE = VIOLATING (ISSUE-003). The validator must FAIL here: the file expects `Store`
// but never imports it. This proves the validator discriminates, so the positives cannot
// pass vacuously.
import { helper } from "./util.js";

// expect-symbol: Store

it("never touches the store", () => {
  expect(helper()).toBe(1);
});
