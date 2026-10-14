// POSITIVE = CLEAN (ISSUE-003). Tests often import the subject dynamically after a mock is
// registered. Where the binding is visible in a declaration, it is emitted: a namespace
// binding, destructured names, and both sides of a renamed destructure.
it("loads the pipeline after mocking", async () => {
  const mod = await import("../src/pipeline.js");
  const { runPipeline, startRun: begin } = await import("../src/pipeline.js");
  expect(mod).toBeDefined();
  expect(begin(runPipeline)).toBeDefined();
});

// expect-symbol: mod
// expect-symbol: runPipeline
// expect-symbol: startRun
// expect-symbol: begin
