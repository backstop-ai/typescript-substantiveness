// POSITIVE = CLEAN (ISSUE-003). Tests often import the subject dynamically after a mock is
// registered. Where the binding is visible in a declaration, it is emitted: a namespace
// binding, destructured names, both sides of a renamed destructure, and an UNAWAITED
// `import(...)` bound to a name (the binding holds the module promise).
it("loads the pipeline after mocking", async () => {
  const mod = await import("../src/pipeline.js");
  const { runPipeline, startRun: begin } = await import("../src/pipeline.js");
  expect(mod).toBeDefined();
  expect(begin(runPipeline)).toBeDefined();
  const pending = import("../src/lazy.js");
  await expect(pending).resolves.toBeDefined();
});

// expect-symbol: mod
// expect-symbol: runPipeline
// expect-symbol: startRun
// expect-symbol: begin
// expect-symbol: pending
