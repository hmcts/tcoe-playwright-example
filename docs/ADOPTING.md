# Adopting this template in your service

This template is set up against Private Law (PRL) in AAT. There are two ways to use it.

> **TCoE recommends keeping your tests in your app's code repo.** 

Keeping tests in the app repo means:

- **Tests run on every PR** against the preview environment, so failures are caught before merge, not in a nightly run.
- **A feature and its tests go in the same PR**, and are reviewed together.
- **Tests are versioned with the code they test**, so a branch, release or rollback always has the matching tests.
- **The team that changes the app owns its tests**, rather than a separate test repo falling out of date.

The two options:

- **[Inside your app repo](#inside-your-app-repo-recommended) (recommended)**: add the tests to your service's own repo, next to the application code.
- **[A standalone test repo](#standalone-test-repo)**: copy the template into its own repo. Keep this for end-to-end journeys that cross several services, such as citizen to caseworker hand-offs, with their regression running nightly.

If you need both, keep your service's smoke and functional tests in the app repo, and put only the cross-service journeys in a separate repo.

Whichever you choose, finish with [Configure it for your service](#configure-it-for-your-service).

## Inside your app repo (recommended)

This is the setup TCoE recommends.

### 1. Folder layout

Put the test code in its own top-level folder so it stays separate from the app:

```sh
your-app/
├── src/                    # application code (unchanged)
├── playwright-e2e/         # copied from this template
│   ├── fixtures.ts
│   ├── global.setup.ts
│   ├── page-objects/
│   ├── tests/
│   ├── utils/
│   └── tsconfig.json       # test-only TypeScript config (see step 4)
├── playwright.config.ts
└── package.json
```

You don't need `scripts/cleanup-playwright.mjs`. It only matters when you're developing against a locally linked copy of `@hmcts/playwright-common`.

### 2. Dependencies

Add the test packages as **devDependencies**, so they aren't installed in your production image:

```bash
yarn add -D @playwright/test @hmcts/playwright-common @axe-core/playwright dotenv
# optional, only if you use them:
yarn add -D odhin-reports-playwright lighthouse playwright-lighthouse get-port winston
```

### 3. Scripts the HMCTS pipeline runs

The CNP pipeline (`withPipeline` from [cnp-jenkins-library](https://github.com/hmcts/cnp-jenkins-library)) runs yarn scripts by name after it deploys your app. Map them to Playwright tags, for example:

```json
"scripts": {
  "test:e2e:install": "playwright install chromium --with-deps",
  "test:smoke": "yarn test:e2e:install && playwright test --grep @smoke --project=chrome",
  "test:functional": "yarn test:e2e:install && playwright test --grep-invert '@a11y|@visual|@performance' --project=chrome",
  "test:a11y": "yarn test:e2e:install && playwright test --grep @a11y --project=chrome",
  "test:fullfunctional": "yarn test:e2e:install && playwright test --project=chrome --project=firefox --project=webkit"
}
```

Your existing `test` script should keep running your unit tests only. Check the version of cnp-jenkins-library you use for the exact script names it calls.

### 4. Keep the test config separate from the app config

- **TypeScript:** your app's `tsconfig.json` probably only includes `src/`. Give the tests their own `playwright-e2e/tsconfig.json`, based on this repo's [`tsconfig.json`](../tsconfig.json), and type-check it with `tsc -p playwright-e2e/tsconfig.json` in your `lint` script.
- **Unit test runners:** Jest or Vitest may try to run `playwright-e2e/**/*.spec.ts` as unit tests. Exclude the folder, e.g. with `testPathIgnorePatterns: ["/playwright-e2e/"]` in Jest or `exclude: ["playwright-e2e/**"]` in Vitest.
- **ESLint:** add the Playwright rules from `LintingConfig.playwright` to your app's ESLint config, limited to `files: ["playwright-e2e/**/*.ts"]`. This repo's [`eslint.config.mjs`](../eslint.config.mjs) shows how.
- **ES modules:** this template uses `"type": "module"`, and `import.meta.url` appears in `playwright.config.ts` and `utils/config.utils.ts`. If your app uses CommonJS, replace those lines with paths that don't depend on the module type, such as `path.resolve(process.cwd(), ".sessions")`.

### 5. Test the environment the pipeline deployed

The pipeline sets `TEST_URL` to the URL of the environment it has just deployed (a preview environment on PRs, AAT on `master`). Read it in `config.utils.ts` and fall back to a local URL:

```ts
citizenUrl: process.env.TEST_URL || "http://localhost:3000",
```

That way the same tests run against `yarn start` locally, preview on a PR and AAT after merge.

### 6. Secrets and reports in your Jenkinsfile

In your app's `Jenkinsfile_CNP`, load the test secrets and publish the reports after the functional test stages:

```groovy
withPipeline(type, product, component) {
  loadVaultSecrets(secrets)   // same shape as the secrets map in Jenkinsfile_nightly

  afterAlways('functionalTest:preview') {
    publishHTML([
      allowMissing: true,
      alwaysLinkToLastBuild: true,
      keepAll: true,
      reportDir: 'playwright-report',
      reportFiles: 'index.html',
      reportName: 'Playwright Functional Tests (preview)'
    ])
  }
}
```

Set `PLAYWRIGHT_REPORTERS=dot,html,junit` in the pipeline environment so the reports are produced. See [CI.md](./CI.md) for more on reporters and publishing.

### 7. Ignore test output

Add these to your app's `.gitignore`:

```gitignore
.env
.sessions/
playwright-report/
test-results/
functional-output/
```

### 8. Configure and check it

1. Follow [Configure it for your service](#configure-it-for-your-service).
2. Start your app locally, then run `yarn lint` and `yarn test:smoke` against it.

## Standalone test repo

1. **Copy what you need.** The minimum is `playwright.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `package.json` (scripts and devDependencies), `.env.example` and `playwright-e2e/` (`fixtures.ts`, `global.setup.ts`, `global.teardown.ts`, `utils/` and `page-objects/base.ts`). Add the Jenkinsfiles, `scripts/` and `docs/` if you want them.
2. **Configure it** by following [Configure it for your service](#configure-it-for-your-service).
3. **Check it works:** run `yarn setup`, `yarn lint`, then `yarn test:chrome`. Make sure `.env` and `.sessions/` stay out of git (they're already in `.gitignore`).

## Configure it for your service

These steps apply to both routes.

1. **Point it at your secrets.**
   - In `package.json`, change `"load-secrets": "yarn get-secrets prl-aat"` to your own Key Vault (add the script if your app repo doesn't have it).
   - In your Jenkinsfiles, replace the `prl-${env}` vault and its secret names, and set `product`, `component` and `channel` to your team's values. In an app repo that's your `Jenkinsfile_CNP`; in a standalone repo it's `Jenkinsfile_nightly` and `Jenkinsfile_nightly_parallel`.
   - Tag each Key Vault secret with `"e2e": "<ENV_VAR_NAME>"` so `get-secrets` picks it up.
2. **Set your environment variables** (in `.env` locally, from Key Vault in CI):
   - `CLIENT_ID`: your IDAM OAuth2 client (the template uses `prl-cos-api`).
   - `IDAM_SECRET`: the secret for that client.
   - `S2S_MICROSERVICE_NAME` (and `S2S_SECRET` if your gateway needs it).
   - Credentials for each user your tests sign in as (the template has `CASEMANAGER_*` and `JUDGE_*`).
   - The URLs you test against. In an app repo, `TEST_URL` covers your own app (see [step 5](#5-test-the-environment-the-pipeline-deployed)). Otherwise set `MANAGE_CASES_BASE_URL`, `CITIZEN_FRONTEND_BASE_URL` and the IDAM/S2S URLs if you aren't testing AAT, or if your citizen UI isn't `privatelaw.aat.platform.hmcts.net`.
3. **Update users and URLs.** In `playwright-e2e/utils/config.utils.ts`, change `config.users` to your roles and `config.urls` to your defaults. Then update `global.setup.ts` so it signs in those users.
4. **Delete the examples that don't apply to you.** That includes:
   - The PRL citizen journeys (`case-list-citizen.spec.ts`, `activate-case-pin.po.ts`, `cui/` page objects).
   - The divorce caseworker and solicitor provisioning specs, if you don't create users.
   - The `tests/api/` demos (`circuit-breaker/`, `parallel-sweep`, `status-profile`) and `data/seed-manifest.json`, if you don't need them.
   - Any visual snapshots, which need regenerating with `yarn test:update-snapshots` anyway.

See [CONFIGURATION.md](./CONFIGURATION.md) for more on config and environment variables, and [CI.md](./CI.md) for the Jenkins pipelines.
