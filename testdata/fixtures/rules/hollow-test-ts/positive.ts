// POSITIVE = CLEAN. Backstop's fixture-polarity contract: a positive fixture is the
// acceptable example and must produce ZERO findings; a finding on it is a false positive
// and fails phase3. This test is substantive — it calls expect(), so hollow-test-ts does
// not match.
//
// NO IMPORT STATEMENT IS DELIBERATE. This pack's engine emits TWO substantiveness roles
// from one ast-grep invocation, and phase3's verdict is `len(findings) > 0` over the
// WHOLE converted SARIF — it is not filtered to the rule under test. to-sarif.sh
// synthesizes a `referenced-symbol` finding for every (test x import) pair in a file, so
// a clean fixture that imported anything would still emit findings and read as a false
// positive. The clean example must be free of EVERY construct the engine reports, not
// merely of the hollow-test violation. `it` is a vitest/jest global, so an import-free
// test file is idiomatic rather than contrived.
it("a substantive test", () => {
  expect(2).toBe(2);
});
