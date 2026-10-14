// POSITIVE = CLEAN (ISSUE-003). Checked by testdata/validators/referenced-symbols.sh, not by
// the findings seam: every expectation below must hold.
//
// A test file outside the subject's directory imports its subject by name. The spec names
// the SYMBOL (`subject: Store`), so the test must reference `Store`. Before 1.1.4 only the
// module-path name `store` was emitted and the subject join failed. `store` must still be
// emitted so specs that name the module keep joining.
import { Store } from "../src/store.js";

// expect-symbol: Store
// expect-symbol: store

it("opens a store", () => {
  const s = new Store();
  expect(s.isOpen()).toBe(true);
});
