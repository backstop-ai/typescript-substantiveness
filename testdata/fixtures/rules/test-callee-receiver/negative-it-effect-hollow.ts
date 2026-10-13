// NEGATIVE = VIOLATING (ISSUE-002). `it.effect(...)` (@effect/vitest) is a test declaration
// whose receiver is `it`, so the narrowed callee regex must keep recognising it; with no
// assertion-shaped call it is hollow and MUST be reported. Import-free so the only finding
// it can produce is the hollow one.
it.effect("an effect test with no assertions", () => {
  const x = 1;
});
