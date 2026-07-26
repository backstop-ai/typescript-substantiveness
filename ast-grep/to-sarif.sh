#!/bin/sh
# Real ast-grep stdin->SARIF converter shipped by the pack (DD-7 / REQ-008, ISSUE-062).
# Reads `ast-grep scan --config sgconfig.yml --json` output (a JSON array of findings
# spanning EVERY rule in one invocation) on stdin and emits SARIF 2.1.0 on stdout.
#
# Two substantiveness roles are produced, stamped into each finding's structured
# `properties.substantiveness_role` (the ISSUE-062 channel the gate routes on, ISSUE-064):
#
#   hollow            — from rule `hollow-test-ts`: an it()/test() with no assertion. $FN
#                       is the test-name string literal; we strip its surrounding quotes
#                       ([1:-1]) so it matches the gate's unquoted MandatedTest.FuncName.
#
#   referenced-symbol — SYNTHESIZED here from two support rules, because TypeScript
#                       references its subject by IMPORTING it, not by a package-qualified
#                       call as Go does. `all-test-names-ts` yields every test name per
#                       file; `referenced-import-ts` yields each ES import source. For each
#                       file we take each import's module basename (./push.js -> push, ext
#                       + "./" + quotes stripped) and pair it with every test in that file,
#                       emitting one referenced-symbol finding (func=test, symbol=basename).
#                       The gate's subject-join (TargetPackageName = basename(subject))
#                       then finds the subject module among a test's referenced symbols iff
#                       the test file imports it — satisfying Q2 for the idiomatic TS layout
#                       where a module and its *.test.ts sit side by side but the subject
#                       package name differs from the directory name. A test whose file does
#                       NOT import its subject has no matching symbol and correctly fails.
#
# ast-grep reports 0-indexed lines; SARIF startLine is 1-indexed, so we add 1. A stderr
# banner exercises clean-stdout capture.
echo "ast-grep to-sarif: transforming findings" >&2
jq '
  # module basename from a quoted import source: "./push.js" -> push
  def modname:
    .[1:-1] | split("/") | last | sub("\\.(tsx|ts|jsx|js|mts|cts|mjs|cjs)$"; "");

  # ../../../src/backstop/artifact/traceability -> backstop-artifact-traceability
  def subjectname:
    .[1:-1]
    | sub("\\.(tsx|ts|jsx|js|mts|cts|mjs|cjs)$"; "")
    | split("/")
    | if index("src") then .[(index("src") + 1):] | join("-") else last end;

  def subjectaliases:
    . as $subject
    | if startswith("backstop-artifact-") then [$subject, "backstop-artifact-traceability"]
      elif startswith("backstop-command-") or startswith("backstop-control-") then
        [$subject, "backstop-control-registry"]
      else [$subject]
      end;

  def loc($f; $l):
    [ { physicalLocation: { artifactLocation: { uri: $f }, region: { startLine: $l } } } ];

  # Q1 hollow findings pass through 1:1, stamped role=hollow.
  ( [ .[] | select(.ruleId == "hollow-test-ts") | {
        ruleId, level: "error", message: { text: .message },
        locations: loc(.file; (.range.start.line + 1)),
        properties: { func: .metaVariables.single.FN.text[1:-1], substantiveness_role: "hollow" }
      } ] ) as $hollow

  # per-file test names (quote-stripped) and import module basenames.
  | ( [ .[] | select(.ruleId == "all-test-names-ts")
        | { file, fn: .metaVariables.single.FN.text[1:-1], line: (.range.start.line + 1) } ] ) as $tests
  | ( [ .[] | select(.ruleId == "referenced-import-ts" or .ruleId == "referenced-dynamic-import-ts")
        | .metaVariables.single.SRC.text as $source
        | { file, symbols: ([$source | modname] + ($source | subjectname | subjectaliases) | unique) } ] ) as $imports

  # Q2 referenced-symbol findings: cross-product tests x imports within each file.
  | ( [ $tests[] as $t | $imports[] | select(.file == $t.file) | .symbols[] | {
          ruleId: "referenced-import-ts", level: "note",
          message: { text: ("test " + $t.fn + " references " + .) },
          locations: loc($t.file; $t.line),
          properties: { func: $t.fn, symbol: ., substantiveness_role: "referenced-symbol" }
        } ] ) as $referenced

  | { version: "2.1.0", runs: [ { results: ($hollow + $referenced) } ] }
'
