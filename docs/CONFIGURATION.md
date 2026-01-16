# Configuration

Out of the box, playwright provides many options for how tests are run, browser config, reporting, debugging etc.

## Playwright Config

The [`playwright.config.ts`](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright.config.ts) file contains all of the playwright specific config. The config included in this template has been modified to include increased timeouts, CI alterations and more browsers/device emulators. These default values are provided as a base and will probably need to be tweaked for your liking.

The [playwright docs](https://playwright.dev/docs/test-configuration) cover all of the configuration options.

## Other Config

There are also instances where you will need extra configuration not explicitly covered in Playwright. These are things like user credentials or URL's. To cover these, we have used a utils class [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/config.utils.ts). This can also follow the typical fixture pattern to allow your config to be accessed a fixture in your tests.

It is generally good practice to keep any sensitive information as an environment variable. These can be easily swapped if needed (e.g. switching from AAT to Demo or a preview environment). The "dotenv" package is used for this, this allows you to specify a `.env` file to store your environment variables (rather than part of your bash profile).

As an example, the file `.env.example` is provided to show what environment variables are required. In addition to the existing citizen password (`IDAM_CITIZEN_USER_PASSWORD`), tests that provision professional accounts now rely on `IDAM_SOLICITOR_USER_PASSWORD` and `IDAM_CASEWORKER_DIVORCE_PASSWORD`; if you leave either blank the tooling falls back to `Password12!`, which is surfaced in the test artefacts for convenience.

Service-to-service configuration lives in the same file. From `@hmcts/playwright-common@1.0.38` onwards the `ServiceAuthUtils` fixture no longer requires `S2S_SECRET`; when the value is blank it logs the omission and makes the lease request without a Basic `Authorization` header, which is perfect for stubbed or non-secret-bearing microservices. `S2S_MICROSERVICE_NAME` and `S2S_URL` are still mandatory, and you can control the global setup behaviour with `SKIP_S2S_TOKEN_SETUP` (skip the call entirely) and `ALLOW_S2S_TOKEN_FAILURE` (treat failures as warnings).

Reporter noise can spike quickly on long UI runs, so stdout/stderr tabs default to `only-on-failure` (override with `PW_ODHIN_TEST_OUTPUT=true`). When API telemetry mirroring is enabled the reporter now prints a compact summary by default; control this via `PW_ODHIN_API_STDOUT_MODE` (`summary` or `json`). The summary length is capped by `PW_ODHIN_API_SUMMARY_LINES` (default 50). If you switch to raw JSON, the payload streamed to stdout is capped at `PW_ODHIN_API_STDOUT_KB` (64 KB by default; set it to `0` to disable truncation altogether—doing so risks Odhín running out of memory on large runs). Attachments follow the same principle: `PW_ODHIN_API_ATTACH_KB` (default 256 KB) limits how large the per-test `api-calls.json` artefact can be before it is downgraded to a sanitised or summarised view, while `PW_ODHIN_API_MAX_LOGS` (default 250) and `PW_ODHIN_API_MAX_FIELD_CHARS` (default 4000) cap the total volume of telemetry captured per test. Prefer the summary + attachment defaults unless you absolutely need full JSON inline; only increase the limits once you’ve confirmed the reporter can handle the bigger payload in your environment. Remember that `api-calls.json` is only generated for failed tests, so the stdout summary is your source of truth for passing runs.

Screenshots are automatically captured for failing tests. Videos are disabled to keep runs lean; opt in by setting `PLAYWRIGHT_VIDEO_MODE` to one of Playwright’s recognised values (`retain-on-failure`, `on-first-retry`, `on`, etc.) when you need richer artefacts.

**Odhín usage cheatsheet**

```bash
# Lightweight default (safe for CI)
PLAYWRIGHT_REPORTERS=list,odhin \
PW_ODHIN_API_LOGS=summary \
PW_ODHIN_TEST_OUTPUT=only-on-failure \
PLAYWRIGHT_VIDEO_MODE=off \
yarn playwright test

# Focused rerun with extra telemetry
PW_ODHIN_API_LOGS=all \
PW_ODHIN_API_STDOUT_MODE=json \
PW_ODHIN_API_STDOUT_KB=128 \
PW_ODHIN_API_ATTACH_KB=512 \
PLAYWRIGHT_VIDEO_MODE=retain-on-failure \
PLAYWRIGHT_REPORTERS=list,odhin \
yarn playwright test tests/failing.spec.ts
```

Only use the heavier command when you’re investigating a specific failure. Videos, traces, and raw JSON blobs are processed inline by Odhín, so capturing them for every test/project will eventually hit Node’s string-size limit.

The utils class has a [helper function](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/config.utils.ts#L47) to ensure the given environment variable is set when loaded (fail fast rather than wait until the specific variable is accessed).

If you prefer the shared helper from `@hmcts/playwright-common`, use `ConfigUtils.getEnvVar`:

```ts
import { ConfigUtils } from "@hmcts/playwright-common";

const serviceBaseUrl = ConfigUtils.getEnvVar("SERVICE_BASE_URL");
```

### Env cheatsheet (playwright-common)
- Logging: `LOG_LEVEL`, `LOG_FORMAT`, `LOG_REDACTION`, `LOG_SERVICE_NAME`
- API attachments: `PLAYWRIGHT_DEBUG_API` (`true`/`1` to allow raw bodies in attachments; keep off in CI)
- Retry/breaker inputs: `S2S_RETRY_ATTEMPTS`, `S2S_RETRY_BASE_MS`, `IDAM_RETRY_ATTEMPTS`, `IDAM_RETRY_BASE_MS`
- Workers: `FUNCTIONAL_TESTS_WORKERS`
- Debug: `PWDEBUG` to emit extra Axe logging
