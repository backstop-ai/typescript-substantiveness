#!/bin/sh
# Phase-3 validator for the referenced-symbol claims (ISSUE-003).
#
# WHY A VALIDATOR AND NOT THE FINDINGS SEAM. Phase 3's engine verdict is
# `len(findings) > 0` over the whole converted SARIF. Any fixture with a test and an import
# produces referenced-symbol results, so the findings seam cannot tell `Store` from `store`
# or from nothing useful. This validator runs the pack's real engine (ast-grep with
# ast-grep/sgconfig.yml) and real converter (ast-grep/to-sarif.sh) on ONE fixture, then
# checks the exact symbols against expectations written in the fixture:
#
#   // expect-symbol: Store      every test in the file must reference symbol `Store`
#   // expect-no-symbol: Store   no test in the file may reference symbol `Store`
#
# Exit 0 means every expectation holds (a positive fixture). Any unmet expectation exits 1
# (a negative fixture must do this). A fixture with no tests or no expectations exits 2,
# so a typo can never make a POSITIVE pass vacuously.
#
# THE GUARANTEE IS ONE-SIDED. Core's phase-3 negative seam accepts ANY non-zero exit, so a
# negative fixture is also "triggered" by exit 2 (vacuous) or by a failure to run at all
# (ast-grep or jq missing, a converter crash). Phase 3 alone cannot tell those from a real
# unmet expectation. Each negative fixture's verdict line (MISSING:/UNEXPECTED:) must be
# confirmed by running this script on it directly.
set -eu

if [ "$#" -ne 1 ]; then
  echo "usage: referenced-symbols.sh <fixture.ts>" >&2
  exit 2
fi
fixture=$1
pack_root=$(cd "$(dirname "$0")/../.." && pwd)

raw=$(ast-grep scan --json --config "$pack_root/ast-grep/sgconfig.yml" "$fixture")
sarif=$(printf '%s' "$raw" | sh "$pack_root/ast-grep/to-sarif.sh" 2>/dev/null)

expect=$(sed -n 's|^// expect-symbol: *\([^ ]*\) *$|\1|p' "$fixture")
expect_no=$(sed -n 's|^// expect-no-symbol: *\([^ ]*\) *$|\1|p' "$fixture")

verdict=$(jq -n -r \
  --argjson raw "$raw" \
  --argjson sarif "$sarif" \
  --arg expect "$expect" \
  --arg expect_no "$expect_no" '
  def lines: split("\n") | map(select(length > 0));
  ($expect | lines) as $want
  | ($expect_no | lines) as $forbid
  | [ $raw[] | select(.ruleId == "all-test-names-ts") | .metaVariables.single.FN.text[1:-1] ]
    | unique as $tests
  | [ $sarif.runs[0].results[]
      | select(.properties.substantiveness_role == "referenced-symbol")
      | { func: .properties.func, symbol: .properties.symbol } ] as $refs
  | if ($tests | length) == 0 then "FAIL-VACUOUS: fixture declares no tests"
    elif ($want | length) + ($forbid | length) == 0 then "FAIL-VACUOUS: fixture declares no expectations"
    else
      ( [ $tests[] as $t | $want[] as $s
          | select(([ $refs[] | select(.func == $t and .symbol == $s) ] | length) == 0)
          | "MISSING: test \"\($t)\" does not reference \($s)" ]
        + [ $refs[] as $r | $forbid[] as $s | select($r.symbol == $s)
          | "UNEXPECTED: test \"\($r.func)\" references \($s)" ] ) as $errs
      | if ($errs | length) == 0 then "OK" else ($errs | join("\n")) end
    end
')

echo "$verdict"
case $verdict in
  OK) exit 0 ;;
  FAIL-VACUOUS*) exit 2 ;;
  *) exit 1 ;;
esac
