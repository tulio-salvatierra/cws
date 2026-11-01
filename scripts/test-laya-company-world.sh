#!/usr/bin/env bash
# Disposable local database only. Start a fresh Supabase Postgres 17 container first.
set -euo pipefail
cd "$(dirname "$0")/.."
DOCKER_BIN="${DOCKER_BIN:-docker}"
LAYA_TEST_CONTAINER="${LAYA_TEST_CONTAINER:-laya-world-verification-20261101}"
export DOCKER_BIN LAYA_TEST_CONTAINER
"$DOCKER_BIN" exec "$LAYA_TEST_CONTAINER" createdb -U postgres laya_verify
run_sql() {
  "$DOCKER_BIN" exec -i "$LAYA_TEST_CONTAINER" psql -X -U postgres -d laya_verify -At -v ON_ERROR_STOP=1 < "$1"
}
run_sql scripts/fixtures/laya-world-prerequisites.sql
for file in supabase/migrations/*_laya_company_world_model.sql supabase/migrations/*_laya_move_choices.sql; do
  run_sql "$file"
done
report=$(mktemp)
trap 'rm -f "$report"' EXIT
for file in supabase/tests/company_world_model_test.sql supabase/tests/laya_world_moves_test.sql supabase/tests/business_decisions_test.sql; do
  run_sql "$file" | tee "$report"
  if rg -q '^not ok|^# Looks like' "$report"; then exit 1; fi
done
run_sql scripts/fixtures/laya-context-loader.sql
node scripts/verify-laya-context.mjs
