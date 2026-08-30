---
title: "Fixture Polarity And Fixture Scoped Dispatch"
schema_version: issue/v1

issue:
  id: ISSUE-001
  title: "Fixture Polarity And Fixture Scoped Dispatch"
  type: bug
  status: open
  created: "2026-08-30"
---

# Fixture Polarity And Fixture Scoped Dispatch

## Problem

Backstop 0.2.0 fails the tagged `v1.1.1` pack with one phase-3 error,
`semgrep-positive: positive fixture triggered the rule (false positive)`, on rule
`hollow-test-go` / claim `sub-hollow-test-ts`. Two independent defects produce it, and
neither is fixed by the other.

**1. Inverted fixture polarity.** Backstop's contract is that a positive fixture is the
CLEAN example that must produce no findings, and a negative fixture is the VIOLATING
example that must produce at least one (`pkg/packval/phase3.go`: a positive whose engine
run reports `Passed` is recorded as a false positive). The pack shipped the opposite:
`testdata/fixtures/rules/hollow-test-ts/positive.ts` held the hollow test (the violation)
and `negative.ts` held the substantive one (the clean example). This is the same contract
the sibling `backstop-ai/typescript-contracts` pack violated in its own ISSUE-001,
repaired today as `1.4.0`.

**2. The baked `.` scan target made fixture dispatch inert.** The engine declared
`command: ast-grep scan --json .`. On the GATE path that is correct and deliberate — a
`scope_kind: project-wide` engine that declares no `project_target` gets nothing appended,
so the engine must self-target, and the repo-root walk is the portability fix that 1.1.1
shipped. But phase-3 fixture validation appends `--config <rule_path> <fixture_path>` to
that same command, so every fixture run was
`ast-grep scan --json . --config ast-grep/sgconfig.yml <fixture>` — a walk of the whole
pack tree in which the fixture argument was inert. Each fixture run therefore saw BOTH
fixture files. The positive run reported the hollow finding that lives in the other
fixture, and the negative run "triggered" on findings that were not necessarily its own.

Defect 2 alone makes the positive check unpassable no matter how the fixtures are
labelled, because the violating example is always somewhere in the walked tree. Defect 2
also means the negative check was passing VACUOUSLY: `RunEngine` reports
`Passed: len(findings) > 0` over the WHOLE converted SARIF with no filter to the rule
under test, and `ast-grep/to-sarif.sh` synthesizes a `referenced-symbol` finding for every
(test x import) pair in a file. Both shipped fixtures imported from `vitest`, so both
produced findings regardless of the hollow rule.

## Reproduction

1. From a directory OUTSIDE the pack, run
   `backstop pack test /absolute/path/to/typescript-substantiveness` with Backstop 0.2.0
   and ast-grep 0.43.0. Invoking from the pack root (or via any relative path) is a
   separate known tool anomaly that breaks the macOS sandbox and reports exit-126
   convert-script errors; it is not accepted as fixture evidence.
2. Observe `phase3-fixtures: fail` with one `semgrep-positive` error and phases 4-6
   skipped.
3. Run the exact phase-3 argv by hand,
   `ast-grep scan --json . --config ast-grep/sgconfig.yml testdata/fixtures/rules/hollow-test-ts/positive.ts`,
   and observe findings attributed to `negative.ts` as well, with the named fixture
   scanned twice — once via `.` and once via the explicit path.
4. Pipe either fixture's raw ast-grep output through `ast-grep/to-sarif.sh` and observe
   `referenced-symbol` results synthesized from the `vitest` import alone.

## Expected Behavior

- The positive fixture is genuinely clean and its converted SARIF carries ZERO results.
- The negative fixture triggers, and the finding it triggers on is the `hollow` role from
  the rule under test — not a synthesized `referenced-symbol` side-finding.
- A phase-3 fixture run scans the FIXTURE, not the pack tree.
- The gate path keeps the 1.1.1 repo-root walk with an argv equivalent to today's.
- An external-directory `backstop pack test <absolute-pack-path>` reports all six phases
  passing, and `backstop pack check` passes.
- The repaired manifest identifies pack `1.1.2` and ruleset `1.0.1`. No tag and no push
  occur without explicit release authorization.

## Scope

This issue owns the two fixture files, the engine's scan-target declaration, the pack and
ruleset version fields, and the minimal repository config needed to validate its own
artifacts. It does NOT change the hollow-test rule's pattern, the converter's role
synthesis, the classification globs, Backstop core, or consumer lockfiles, and it does not
release a tag.

## Resolution

Fixture contents were rewritten in place so each file matches the polarity its name and
manifest slot declare, and both were made import-free so that the positive emits nothing
at all and the negative can only fire on the hollow rule. The manifest moved the root scan
target out of `command` and into `project_target: "."`, which Backstop appends on the gate
path only.

Verified: per-fixture probes through the real converter return 0 results for the positive
and exactly 1 `hollow` result for the negative; an external-directory
`backstop pack test <absolute-pack-path>` reports all six phases passing;
`backstop pack check` passes; and the 1.1.1 and 1.1.2 gate argv forms were run
side-by-side against the pack tree and returned an identical rule-id multiset, so the gate
path is unchanged.

One pre-existing phase-2 WARNING is deliberately NOT addressed here and remains open:
`exempt-scope-decision` reports that the engine is `scope_kind: project-wide` without
declaring `exempt_from_scope_filter`, so its diff-scoped filtering behaviour is an
unrecorded default. Recording it either way changes how consumer gates treat findings on
untouched files, which is a behavioural decision for the founder rather than part of this
fixture repair.
