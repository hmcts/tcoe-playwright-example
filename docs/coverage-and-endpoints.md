# Coverage & Endpoint Reporting (human-friendly)

This template ships two helper scripts to surface what your Playwright API tests actually cover, without digging through artefacts.

## What’s included
- `yarn report:coverage` → reads c8 `coverage-summary.json`, prints a human-readable summary, and writes:
  - `coverage/coverage-summary.txt`
  - `coverage/coverage-summary.json` (normalised rows for dashboards)
- `yarn report:api-endpoints` → scans your Playwright API specs for `apiClient/anonymousClient/client` calls and writes:
  - `coverage/api-endpoints.json` (endpoint, hits, percent of calls)

## How to run locally
1) Produce coverage with your Playwright API suite (e.g. `yarn test:api` with c8, or your own command that writes `coverage/coverage-summary.json`).
2) `yarn report:coverage`
3) `yarn report:api-endpoints`

Override paths if needed:
```bash
COVERAGE_SUMMARY=./path/to/coverage-summary.json \
COVERAGE_SUMMARY_TXT=./path/to/out.txt \
yarn report:coverage

API_TEST_ROOT=./playwright-e2e/tests/api \
API_ENDPOINTS_REPORT=./coverage/api-endpoints.json \
yarn report:api-endpoints
```

## CI wiring (Jenkins sample)
Already added in the sample Jenkinsfiles:
- After tests, run `report:coverage` and `report:api-endpoints`.
- Archive `coverage/coverage-summary.txt` and `coverage/api-endpoints.json`.
This gives the team a quick view of coverage and which endpoints were exercised, without opening the full Playwright report.

## Why we do this
- **Human-friendly**: text summary you can read in the build artefacts pane.
- **Actionable**: endpoint hit list highlights gaps (endpoints with zero calls).
- **Dashboard-ready**: JSON rows can be injected into Odhin/Playwright HTML reports as tabs or tables.
