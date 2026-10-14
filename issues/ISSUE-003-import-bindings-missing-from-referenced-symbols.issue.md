---
title: "Import Bindings Missing From Referenced Symbols"
schema_version: issue/v1

issue:
  id: ISSUE-003
  title: "Import Bindings Missing From Referenced Symbols"
  type: bug
  status: open
  created: "2026-10-14"
---

# Import Bindings Missing From Referenced Symbols

## Problem

The Q2 referenced-symbol model only emits names derived from the import's module path.
For each test, `ast-grep/to-sarif.sh` pairs the test with two names per import: `modname`
(the module basename, so `'../src/store.js'` becomes `store`) and `subjectname` (the
path below `src/`, joined with `-`). It never emits the names the import actually binds.

The gate's subject join is an exact string match between a test's referenced symbols and
the reduced subject token from the spec (`subject:` or a per-claim subject override). When
a spec names a symbol as its subject, such as `subject: Store` or
`subject: createHandlers`, the join fails even though the test imports that symbol and
calls it. Tests that sit beside their subject are excused by the co-located (samePackage)
path, so the defect shows up when tests live in a separate directory. The result is a
mass of false "test function X does not call package Store" violations.

## Reproduction

1. Create `src/store.ts` exporting `class Store`, and `tests/store.test.ts` containing:

   ```ts
   import { Store } from '../src/store.js';

   it('opens a store', () => {
     const s = new Store();
     expect(s.isOpen()).toBe(true);
   });
   ```

2. Give the spec claim `subject: Store`.
3. Run `ast-grep scan --json --config ast-grep/sgconfig.yml tests/store.test.ts` and pipe
   the output through `ast-grep/to-sarif.sh`.
4. Observe that the `referenced-symbol` results for `opens a store` carry the symbols
   `store` only. No result carries `Store`, so the gate reports that the test does not
   call `Store`.

## Expected Behavior

- Each test also references the binding names its file imports:
  - named specifiers, emitting both the imported name and the local alias for
    `import { A as B }`;
  - default imports (`import A from ...`);
  - namespace imports (`import * as ns from ...`);
  - dynamic imports where the binding is syntactically visible:
    `const ns = await import(...)` and `const { A, B: C } = await import(...)`.
- Type-only imports do not produce binding names (see Decision below).
- The existing module-path names (`modname`, `subjectname` and its aliases) are still
  emitted, so specs that name a module subject keep joining as before.

## Decision: type-only imports are excluded

`import type { T }`, `import type T`, `import type * as ns` and inline
`import { type T }` specifiers do not emit `T` or `ns`. The referenced-symbol model
answers "does this test call its subject?". A type-only import is erased at compile time
and cannot be called, constructed, or otherwise exercised at runtime. Counting it would let
a test that only annotates a variable with the subject's type satisfy the join, which is a
false pass on exactly the check this role exists for. A test that really exercises the
subject imports a value: a class, a factory, or a function. Module-path names stay as they
were for type-only imports, because changing them is a separate back-compat decision.

## Separate observation (not fixed here)

`subjectaliases` in `ast-grep/to-sarif.sh` hard-codes consumer-specific aliases. A subject
starting with `backstop-artifact-` also emits `backstop-artifact-traceability`, and one
starting with `backstop-command-` or `backstop-control-` also emits
`backstop-control-registry`. That bakes one consumer's module layout into a generic pack,
which contradicts the portability rule in the pack description: a pack must never bake a
specific consumer's filesystem layout. It is recorded here and left unchanged, because
removing it changes join results for any consumer that relies on those aliases.

## Scope

This issue covers the new import-binding ast-grep rule, the converter's referenced-symbol
synthesis, the fixtures and validator that prove the behavior, and the pack and ruleset
version fields. It does not change the hollow-test rule, the classification globs, the
`subjectaliases` table, or Backstop core.
