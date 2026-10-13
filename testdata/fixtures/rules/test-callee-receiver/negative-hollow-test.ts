// NEGATIVE = VIOLATING (ISSUE-002). A bare test() with an empty callback is hollow and
// MUST still be reported after the callee regex was narrowed. Import-free so the only
// finding it can produce is the hollow one.
test("t", () => {});
