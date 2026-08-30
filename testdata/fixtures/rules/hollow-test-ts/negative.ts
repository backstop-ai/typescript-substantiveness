// NEGATIVE = VIOLATING. A negative fixture carries the violation and MUST trigger the
// rule. This it() has no assertion-shaped call in its callback, so hollow-test-ts matches
// and the converter stamps it substantiveness_role: hollow.
//
// NO IMPORT STATEMENT IS DELIBERATE, for a reason the positive fixture does not share:
// phase3 counts findings across the whole converted SARIF, so an import here would let
// this fixture "trigger" on a synthesized `referenced-symbol` finding even if
// hollow-test-ts stopped matching entirely. Keeping the file import-free means the only
// finding it can produce is the hollow one, so the negative check cannot pass vacuously.
it("a hollow test with spaces in its name", () => {
  const x = 1;
});
