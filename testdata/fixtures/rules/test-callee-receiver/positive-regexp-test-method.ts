// POSITIVE = CLEAN (ISSUE-002). Must produce ZERO findings.
//
// `forbidden.test(...)` is RegExp.prototype.test, not a test declaration. Before 1.1.3 the
// callee regex accepted any `<receiver>.test`, so this call was reported as a hollow test
// named by its string argument. Only `it`/`test`/`effect`, or a dotted callee whose
// receiver is `it`/`test`, declares a test.
//
// The `test.skip` below locks the other half of the contract: modifiers were never matched
// and the fix must not start matching them, so this hollow-looking skip stays silent.
//
// Import-free for the same reason as hollow-test-ts/positive.ts: to-sarif.sh synthesizes a
// referenced-symbol finding for every (test x import) pair, which would read as a false
// positive here.
it("a test asserting on a RegExp match", () => {
  const forbidden = /export const \w+Tests = \[\]/;
  expect(forbidden.test("export const issueTests = []")).toBe(true);
});

test.skip("a skipped placeholder", () => {});
