# Fixtures

[Fixtures](https://playwright.dev/docs/test-fixtures) are flexible reusable hooks that can be used to encapsulate any setup or teardown steps prior to a test and provide any dependencies to a test directly.

## What can fixtures provide?

Fixtures can be used to:

- Provide a page object to a test - [example](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/page-objects/pages/page.fixtures.ts#L29)
- Provide a page object with associated steps - [example](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/page-objects/pages/page.fixtures.ts#L31)
- Provide any custom helpers/utils to a test - [example](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/utils.fixtures.ts#L22)
- Create "worker-scoped" fixtures - [example](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/fixtures.ts#L22)

More examples of fixtures and options are available in the Playwright docs.

## How to use fixtures

To avoid a single fixtures.ts file with every single fixture, they are currently split.

For example, [page fixtures](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/page-objects/pages/page.fixtures.ts) are defined separately. Then in fixtures.ts the [type](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/fixtures.ts#L7) is appended to a common fixtures type and the actual set of fixtures is added to the list of [extended fixtures](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/fixtures.ts#L14).

Finally, for any test using custom fixtures it must import the "test" from the fixtures.ts file e.g. [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/tests/case-list-citizen.spec.ts#L1) and this will allow the page fixture to be available in the test e.g. [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/tests/case-list-citizen.spec.ts#L13)
