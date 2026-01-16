# Playwright Project Template

The below is best practice advice pertaining to Playwright automation frameworks (and the concepts this template aims to follow).

# Considerations

## Tests

When writing tests, the following factors should be taken into account:

- **Test Requirement**: Confirm whether the test is necessary, especially if it's a UI test. It may already be covered at a lower level.
- **Test Descriptions**: Test names should clearly describe intent (what, when, expected outcome). Aim for names that "scream intent" so failures are self-explanatory.
  - Pattern: `action + condition + expected outcome`.
  - Include the system or boundary when useful (e.g., `API`, `UI`, `auth`).
  - Prefer "does X when Y" or "returns Z for Y" over generic phrases.
  - Example: `returns 401 with auth error body when token is missing`.
- **Assertions**: Tests should contain assertions aimed at proving or disproving the test objective. Ensure assertions are present in key areas and thoughout your test to avoid red herrings (e.g. if a test is failing because an element is not found - is that because the previous step failed or is it legitimately not present) - [assertions guide](http://playwright.dev/docs/test-assertions)
- **Test Isolation**: Each test must be able to run independently. No test should depend on another.
- **Test Data**: Unique test data should be used for each test to avoid conflicts, including data like user profiles.
- **Locators**: Use stable locators, ensuring the application provides element properties that are easily targeted, such as Test IDs or accessibility roles. Avoid relying on CSS classes or traversing the DOM hierarchy to locate elements (these can easily change).

### Waiting

There are times where a test script might have to wait. There are a few options for doing this:

- Implicit waits (e.g. `page.waitForTimeout(5000)`) - Avoid these where possible, there are limited cases where these might be useful/required.
- Explicit waits (e.g. `expect().toBeVisible()` and `expect.poll`) - Use a polling approach to ensure the condition you are waiting for is achieved and if not provide a clear error pointing to the failure location. The majority of assertions will auto-retry, see assertion guide above.

Playwright also has a list of actionability checks for various types of actions: [actionability matrix](https://playwright.dev/docs/actionability)

## Project Structure & Page Object Patterns

A **Page Object Model (POM)** is recommended for storing locators and actions related to specific pages. In this template following pattern is proposed:

- **Elements**: Raw HTML elements (e.g., `p`, `input` tags).
- **Components**: Reusable components that could appear on multiple pages (e.g., a cookie acceptance banner).
- **Pages**: Full pages that can include elements and components, or unique elements specific to that page.

This pattern allows for the reuse of elements and components across different pages, which can be exposed as fixtures. Additionally, "helper" or "util" classes may be necessary for common tasks (e.g., IDAM login).

See the [PAGE_OBJECT_MODEL.md](https://github.com/hmcts/tcoe-playwright-example/blob/master/docs/PAGE_OBJECT_MODEL.md) for more info.

## Setup & Teardown

Playwright provides various ways to include setup and teardown steps in tests:

- **Global Setup/Teardown**: Actions performed before/after all tests.
- **Before/After Hooks**: Actions before/after individual tests or all tests within a spec.
- **Fixtures**: Reusable setup/teardown steps injected into tests, offering more flexibility than hooks. See [FIXTURES.md](https://github.com/hmcts/tcoe-playwright-example/blob/master/docs/FIXTURES.md)

## Configuration

Often in our projects, we need to rely on configuration values. Playwright provides good configuration out-of-the-box:

- **Parallelism**: Ability to run tests in parallel with control over concurrent processes.
- **Browsers**: Support for required browsers and viewports (e.g., mobile, tablet).
- **Test Tagging**: Tags to control test execution (e.g., `@a11y` for accessibility tests, `@smoke` for smoke tests).
- **Timeouts**: Timeout limits should only be increased as a last resort.
- **Retries**: Ideally set retries to zero, but the ability to retry flaky tests should be available.
- **Debuggability**: Enable tracing, screenshots, and video recording to assist in debugging issues.
- **Environment**: Flexibility to run tests in different environments and switch between them as needed.

In addition to this, we also use a utility class to aid with additional configuration such as users. See [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/config.utils.ts). It's best practice to use environment variables for potentially sensitive information.
More info on configuration: In addition to this, we also use a utility class to aid with additional configuration such as users. See [CONFIGURATION.md](https://github.com/hmcts/tcoe-playwright-example/blob/master/docs/CONFIGURATION.md).

## Non-functional Testing

Also included in this template are implementations for supporting non-functional tests. Such as Axe Core (accessibility) and Lighthouse (UI performance). It's important to note however with regards to accessibility manual testing is still required as the automated checks only cover around 40% of issues.

You can also choose to run Lighthouse tests on your page - however the Performance Team is also now running some UI automated tests therefore you should consider if there is any duplication prior to writing these tests.

[Accessibility Docs](https://github.com/hmcts/tcoe-playwright-example/blob/master/docs/ACCESSIBILITY.md)
[Performance Docs](https://github.com/hmcts/tcoe-playwright-example/blob/master/docs/PERFORMANCE.md)

## CI/CD Integration

There is currently a few sample Jenkinsfile's that can be used and modified as required. Currently our testing environments are limited to a [auto-shutdown](https://hmcts.github.io/cloud-native-platform/environments/auto-shutdown.html) schedule and thus you should ensure that you choose a suitable time to run your nightly tests. You may also want to consider peak times to avoid (e.g. 9am).

See [CI.md](https://github.com/hmcts/tcoe-playwright-example/blob/master/docs/CI.md).

- **Build and Run**: A Jenkinsfile to build the project, configure it, run Playwright tests, and generate test reports.
- **Scheduled Tests**: Another Jenkinsfile to schedule nightly tests (e.g., from a `nightly-dev` branch).
- **Sandpit Pipeline**: A pipeline for running tests based on PR changes.
  > **Top tip** :
  > If you have `nightly-dev` branches on your repo for debugging nightly tests, make sure you delete them.
  > They run in the background without being on the build radar, but put additional load on AAT common components during peak times (daily builds).
  > This could delay other daily builds by occupying a Jenkins agent, ultimately costing us a bit of :moneybag:.

## Reporting

This template wires Playwright reporters through `resolveReporters()` in `playwright.config.ts`. You can mix and match them via environment variables:

- **Default console output** – `PLAYWRIGHT_DEFAULT_REPORTER` falls back to `list` locally and `dot` on CI. Override on demand.
- **HTML report** – `PLAYWRIGHT_REPORTERS=list,html` writes `playwright-report/index.html`. Control behaviour with `PLAYWRIGHT_HTML_OUTPUT` and `PLAYWRIGHT_HTML_OPEN`.
- **JUnit XML** – add `junit` to the reporter list for CI-friendly XML (`PLAYWRIGHT_JUNIT_OUTPUT` for custom path).
- **Odhín** – `PLAYWRIGHT_REPORTERS=list,odhin` produces a rich HTML dashboard in `test-results/odhin-report`. Tune with `PW_ODHIN_*` variables (`PW_ODHIN_TEST_FOLDER`, `PW_ODHIN_START_SERVER`, etc.).

See the root `README.md` or `agents.md` for a quick reference on command examples and environment mappings.

# Other Best Practices

- **Barrel Files**: Use barrel files to simplify imports.
- **Formatting**: Use a formatter like Prettier for consistency.
- **Linting**: Use a linter like ESLint, and consider custom rules (e.g., using the ESLint Playwright plugin).
- **Dependency Management**: Use Renovate to manage dependencies.

There are examples of each of the above in this repository.
