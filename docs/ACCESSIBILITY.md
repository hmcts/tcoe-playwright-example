# Automated Accessibility Testing

Ensuring our services are accessible is a legal requirement. This is done through both automated and non-automated methods. To assist with the automated part of this, we use a tool called Axe Core. This is an accessibility engine which can read the HTML of pages and assess it against a set of accessibility rules.

As a reminder: automated accessibility tests can detect some common accessibility problems such as missing or invalid properties. But many accessibility problems can only be discovered through manual testing.

## Axe Core

In this template, an accessibility test can be run by following the example test:
[Example accessibility test](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/tests/accessibility-example-test.spec.ts)

The axe core helper is imported from the playwright common library:
[Axe Core Helper](https://github.com/hmcts/playwright-common/blob/master/src/utils/axe.utils.ts)

Following the fixture pattern, no page is required to be passed to the axe core helper as this already happens when the fixture is instantiated by the test [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/utils.fixtures.ts#L38). The method will also take an element you wish to exclude from the check.

## Best Practice

### Check every element

Accessibiity checks should be happening on _every_ element and not just every page. Therefore if you are writing an accessibiltiy test, you should ensure you also trigger certain features that are not visible by default. A common example of this is error/validation messaging. As this is not part of any happy path through the journey, you should ensure these are triggered prior to running any accessibility checks.

### Check dynamic states

Often in pages there is dynamic content, so you should ensure this content is also in scope when running your accessibility tests. Things like hover or focused states should be considered.

### Soft Assertions

Also, you may choose to integrate accessibility checks into your journey tests (rather than having separate accessibility tests) or you may have tests which test more than one page per test. If you do this, you may also want to consider using [soft assertions](https://playwright.dev/docs/test-assertions#soft-assertions). If one of these fail, it will still mark the test as failed however it will continue test execution. So if it fails on Page 1, it will still continue to Page 2, 3 etc and run assertions which you can view in your report.

## Accessibility Report

The test framework now generates a consolidated HTML accessibility report for all audited pages in each test run.

### How it works:

Accessibility checks are performed using the axeUtils fixture.
After each test, results are automatically combined into a single HTML report and attached to the test run.

### Features:

- Each page’s results appear as a separate section.
- Expand/collapse controls work independently for each section.

### Usage:

Use the axeUtils fixture in your Playwright tests and call await axeUtils.audit() on pages you want to audit.

**For Report Generation**, ensure the axeUtils fixture is included in your test setup. The report will be generated automatically after each test run.
```
axeUtils: async ({ page }, use, testInfo) => {
    const axeUtils = new AxeUtils(page);
    await use(axeUtils);
    await axeUtils.generateReport(testInfo);
  }
  ```
