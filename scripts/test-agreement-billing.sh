#!/usr/bin/env bash
# Disposable local database only. Synthetic tests; no hosted database access.
set -euo pipefail
cd "$(dirname "$0")/.."
DOCKER_BIN="${DOCKER_BIN:-docker}"
AGREEMENT_TEST_CONTAINER="${AGREEMENT_TEST_CONTAINER:-cws-agreement-billing-verification-20261104}"
IMAGE="public.ecr.aws/supabase/postgres:17.11.0.011"
DB_PASSWORD="$(uuidgen)"

if "$DOCKER_BIN" container inspect "$AGREEMENT_TEST_CONTAINER" >/dev/null 2>&1; then
  echo "Refusing to reuse existing container: $AGREEMENT_TEST_CONTAINER" >&2
  exit 1
fi
cleanup() { "$DOCKER_BIN" rm -f "$AGREEMENT_TEST_CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

"$DOCKER_BIN" run -d --rm --name "$AGREEMENT_TEST_CONTAINER" -e POSTGRES_PASSWORD="$DB_PASSWORD" "$IMAGE" >/dev/null
for _ in {1..60}; do
  if "$DOCKER_BIN" exec "$AGREEMENT_TEST_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
"$DOCKER_BIN" exec "$AGREEMENT_TEST_CONTAINER" pg_isready -U postgres >/dev/null
"$DOCKER_BIN" exec "$AGREEMENT_TEST_CONTAINER" createdb -U postgres agreement_billing_verify

run_sql() { "$DOCKER_BIN" exec -i "$AGREEMENT_TEST_CONTAINER" psql -X -U postgres -d agreement_billing_verify -At -v ON_ERROR_STOP=1 < "$1"; }
run_sql scripts/fixtures/agreement-billing-prerequisites.sql
run_sql supabase/migrations/20261011214948_client_service_agreements.sql
run_sql supabase/migrations/20261104205413_agreement_billing_start_date.sql
report="$(run_sql supabase/tests/agreement_billing_start_test.sql)"
printf '%s\n' "$report"
if rg -q '^not ok|^# Looks like' <<< "$report"; then exit 1; fi
