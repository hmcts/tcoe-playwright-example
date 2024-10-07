# Playwright Overview

The intent of this proposal is to create a "golden sample" or "template" that serves as a base for any Playwright projects, with specific consideration given to the current DTS environment. This proposal focuses solely on Playwright, as there is an ongoing effort to migrate from other frameworks to Playwright.

# Considerations

## Tests

When writing tests, the following factors should be taken into account:

- **Test Requirement**: Confirm whether the test is necessary, especially if it's a UI test. It may already be covered at a lower level.
- **Test Descriptions**: Test names should clearly describe what is being tested, and each test should have a clear objective.
- **Assertions**: Tests should contain assertions aimed at proving or disproving the test objective. Tests should run as quickly as possible.
- **Test Isolation**: Each test must be able to run independently. No test should depend on another.
- **Test Data**: Unique test data should be used for each test to avoid conflicts, including data like user profiles.
- **Locators**: Use stable locators, ensuring the application provides element properties that are easily targeted, such as Test IDs or accessibility roles. Avoid relying on CSS classes or traversing the DOM hierarchy to locate elements.

## Project Structure & Page Object Patterns

A traditional **Page Object Model (POM)** is recommended for storing locators and actions related to specific pages. The following pattern is proposed:

- **Elements**: Raw HTML elements (e.g., `p`, `input` tags).
- **Components**: Reusable components that could appear on multiple pages (e.g., a cookie acceptance banner).
- **Pages**: Full pages that can include elements and components, or unique elements specific to that page.

This pattern allows for the reuse of elements and components across different pages, which can be exposed as fixtures. Additionally, "helper" or "util" classes may be necessary for common tasks (e.g., IDAM login).

## Setup & Teardown

Playwright provides various ways to include setup and teardown steps in tests:

- **Global Setup/Teardown**: Actions performed before/after all tests.
- **Before/After Hooks**: Actions before/after individual tests or all tests within a spec.
- **Fixtures**: Reusable setup/teardown steps injected into tests, offering more flexibility than hooks.

## Configuration

Key UI test configuration considerations:

- **Parallelism**: Ability to run tests in parallel with control over concurrent processes.
- **Browsers**: Support for required browsers and viewports (e.g., mobile, tablet).
- **Test Tagging**: Tags to control test execution (e.g., `@a11y` for accessibility tests, `@smoke` for smoke tests).
- **Timeouts**: Timeout limits should only be increased as a last resort.
- **Retries**: Ideally set retries to zero, but the ability to retry flaky tests should be available.
- **Debuggability**: Enable tracing, screenshots, and video recording to assist in debugging issues.
- **Environment**: Flexibility to run tests in different environments and switch between them as needed.

## Non-functional Testing

Non-functional tests, such as **accessibility checks** using libraries like Axe Core, should be easily incorporated into the UI test suite. Basic **Lighthouse** tests should also be considered.

## CI/CD Integration

The template repository should include sample Jenkinsfiles for integration:

- **Build and Run**: A Jenkinsfile to build the project, configure it, run Playwright tests, and generate test reports.
- **Scheduled Tests**: Another Jenkinsfile to schedule nightly tests (e.g., from a `nightly-dev` branch).
- **Sandpit Pipeline**: A pipeline for running tests based on PR changes.
  > **Top tip** :
  > If you have `nightly-dev` branches on your repo for debugging nightly tests, make sure you delete them.
  > They run in the background without being on the build radar, but put additional load on AAT common components during peak times (daily builds).
  > This could delay other daily builds by occupying a Jenkins agent, ultimately costing us a bit of :moneybag:.

## Reporting

We need to generate and view test run reports. Considerations for reporting include:

- Collating multiple reports into a single report.
- Making reports available in Jenkins or other CI systems.
- Handling and retaining test artifacts such as stack traces, screenshots, and videos.

Playwright’s built-in reporter can handle most reporting needs.

# Other Best Practices

Additional best practices for the "golden sample" include:

- **Barrel Files**: Use barrel files to simplify imports.
- **Formatting**: Use a formatter like Prettier for consistency.
- **Linting**: Use a linter like ESLint, and consider custom rules (e.g., using the ESLint Playwright plugin).
- **Dependency Management**: Use Renovate to manage dependencies.
