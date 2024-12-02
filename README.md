# Playwright Project Template

This repository serves as a template for UI test automation using [Playwright](https://playwright.dev) within HMCTS. It provides an accelerated set up with multiple browser support, environmental config and sensible defaults. You can simply clone this repo if starting from scratch or copy the parts you would like to use in your test own test project.

## Features

- **Cross-browser testing**: Supports Chromium, Firefox, and WebKit.
- **Responsive testing**: Test on different viewports (tablet/desktop).
- **Parallel test execution**: Run tests concurrently for faster feedback.
- **Accessibility tests**: Integrate basic accessibility checks using libraries like Axe Core.
- **Performance tests**: Provides an implementation of Lighthouse which can be used for quick feedback on UI performance.
- **CI/CD ready**: Sample Jenkinsfile included for integrating with your CI pipeline.
- **Test tagging**: Use tags like `@a11y` for accessibility, `@smoke` for smoke tests, and more.

## Project Structure

The repository follows a **Page Object Model (POM)** design pattern, ensuring that locators and actions are well-organized and reusable.

See the [POM docs](https://github.com/hmcts/tcoe-playwright-example/blob/master/docs/PAGE_OBECT_MODEL.md) for more info

```sh
├── tests/                  # Test files
├── page-objects/           # Page objects
├─── components/            # Common components shared across pages
├─── elements/              # Common elements that could be found in a page or in a component
├─── pages/                 # Unique pages that may contain their own locators
├── utils/                  # Utility functions or common tasks (e.g., login, API methods etc)
```

TCoE Best Practices for setting up playwright in your service can be found in the [playwright-e2e/readme.md](https://github.com/hmcts/tcoe-playwright-example/blob/master/docs/BEST_PRACTICE.md).

## Contributing

We all share the responsibility of ensuring this repo is up to date and accurate in terms of best practice. If you would like to contribute you can raise a github issue with the improvement you are suggesting or raise a PR yourself. See the [contribution guide](https://github.com/hmcts/tcoe-playwright-example/blob/master/CONTRIBUTING.md) for more info.

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- Node.js (v14+)
- Yarn

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/your-username/playwright-template.git
cd playwright-template
yarn install
```

### Running Tests

Run all tests using the Playwright test runner:

```bash
yarn playwright test
```

To run a specific test file:

```bash
yarn playwright test tests/specific_test_file.spec.ts
```

To run tests on a specific browser:

```bash
yarn playwright test --project=chrome
yarn playwright test --project=firefox
yarn playwright test --project=webkit
```

### Test Tagging

You can use tags to group tests, for example:

```bash
yarn playwright test --grep @smoke
```

### Debugging Tests

To run tests with tracing, screenshots, and video recording for debugging purposes:

```bash
yarn playwright test --trace on --video on --screenshot on
```

Alternatively, you can use `page.pause()` inside your test whilst in `--headed` mode to pause execution at a specific point.

### Accessibility Tests

Run accessibility checks as part of your tests using Axe Core:

```bash
yarn playwright test --grep @a11y
```

### Running in CI

This project currently provides two sample Jenkinsfile's:

- Jenkinsfile_CNP: (Cloud Native Platform) This provides your typical "merge" pipeline. When you have a PR, this is the pipeline that will run. Currently it runs typechecks and linting (with eslint playwright plugin) checks.
- Jenkinsfile_nightly: This is the nightly pipeline that is sheduled to run daily. This will typically be the tests you choose to run as part of your regression suite. You may choose to not run certain types of tests on a daily basis.
