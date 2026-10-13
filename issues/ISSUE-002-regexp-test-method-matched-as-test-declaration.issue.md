---
title: "Regexp Test Method Matched As Test Declaration"
schema_version: issue/v1

issue:
  id: ISSUE-002
  title: "Regexp Test Method Matched As Test Declaration"
  type: bug
  status: closed
  created: "2026-10-13"
  closed: "2026-10-13"

resolved-by: cef444c70358
---

# Regexp Test Method Matched As Test Declaration

## Problem

`hollow-test-ts` and `all-test-names-ts` treat any call whose callee matches
`(^|\.)(it|test|effect)$` as a test declaration. The dotted alternative was meant for
`it.effect(...)` (@effect/vitest), but it accepts ANY receiver. A `RegExp.prototype.test`
call with a string-literal argument, which is common inside assertions, is therefore read
as a test named by that literal. Because the inner call contains no assertion, it is
reported as hollow:

```ts
expect(forbidden.test('export const issueTests = []')).toBe(false);
// -> test 'export const issueTests = []' has no assertions (hollow)
```

The same spurious "test" also enters `all-test-names-ts`, so the converter synthesizes
referenced-symbol findings for it.

## Reproduction

1. Write a test file containing
   `it("r", () => { const re = /x/; expect(re.test('x')).toBe(true); });`.
2. Run `ast-grep scan --json --config ast-grep/sgconfig.yml <file>`.
3. Observe a `hollow-test-ts` finding with `$FN` = `'x'`, plus an extra
   `all-test-names-ts` match.

## Root Cause

The `(^|\.)` prefix anchors only the method name, never the receiver, so
`<anything>.test` / `<anything>.it` / `<anything>.effect` all qualify.

## Fix

Both rules now use the callee regex `^(it|test|effect)$|^(it|test)\.(it|test|effect)$`.
Bare names and `it.`/`test.`-receiver calls match, so `it.effect(...)` still works.
Modifiers such as `test.skip` and `it.only` stay unmatched, as before. Arbitrary-receiver
calls such as `re.test(...)` and `foo.it(...)` no longer match. New claim
`sub-test-callee-receiver-ts` adds fixtures under
`testdata/fixtures/rules/test-callee-receiver/`. The positive (clean) fixture is a real
test that asserts on `re.test(...)`, plus a `test.skip`. The negative fixtures are a hollow
bare `test()` and a hollow `it.effect()`. The positive fixture produces one hollow finding
under the 1.1.2 rules and zero under the fix. Pack is now 1.1.3 and the ruleset is 1.0.2.

## Resolution

Fixed directly in cef444c70358 (light path: no plan). Both rules now accept the dotted callee form only when the receiver is `it` or `test`; new receiver fixtures prove a RegExp `.test(...)` inside an assertion is not a test, while hollow `test()` and `it.effect()` are still reported. `backstop pack test` passes all phases. Released in v1.1.3.
