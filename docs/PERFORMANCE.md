# Performance testing with Lighthouse

Lighthouse is an automated tool that can help to improve the qualtiy of web pages. Specifically, it includes performance tooling to identify UI slowness. It also includes detection of best practices and accessibility which have been enabled in this template.

Important: This is about UI performance testing and is purely **client side**. Therefore, this does not need a specific test environment and has no touch point with API's/BE services.

## How to run lighthouse on a page

### Creating a utils class

It can be helpful to keep your own helper/util class as is done [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/lighthouse.utils.ts).

Lighthouse requires thresholds to be set, these can be easily configured as part of this class or if specified when calling the audit method, can be overwriten. Lighthouse can also accept some optional configuration based on viewport/type of device. In this template, this is defaulted to a desktop device.

The set up of lighthouse is slightly complicated compared to others, however the steps are explained below.

### Setting up fixtures

Lighthouse uses the Chrome Debugger Protocol (CDP) to work. This requires the browser to be enabled with a port configured for CDP. Therefore, the first fixture required is to generate a port number. This template uses the "get-port" package for this. See [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/fixtures.ts#L17).
We want to be able to run our performance tests in parallel, so this lighthouse port must be scoped as a "worker" fixture. Meaning it will only be created per worker process. E.g. 4 workers = 4 port numbers.

Next, we need to create the browser instance with CDP (and the port) enabled. See [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/utils.fixtures.ts#L40). The chromium instance is created with the debugging port using the lighthousePort fixture. For efficiency, the browser session cookies are also injected at this point to bypass log in. The page object from the newly created browser context is then provided to the test.

A fixture is also needed for the util class and instantiated with the other lighthousePage and lighthousePort fixtures. See [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/utils.fixtures.ts#L35).

Lastly, to allow your page objects to work with the newly created browser context, the page object fixtures need to be aware of the lighthousePage. Therefore like [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/page-objects/pages/page.fixtures.ts#L21) if your test tags include "@performance" we are providing the lighthousePage, otherwise the normal page.

### Creating a test

In order to use these fixtures, you can now create a test like [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/tests/case-list-citizen.performance.spec.ts#L18). This allows you to use your util class and page objects without any other configuration or conflict.

## Understanding results

Lighthouse will generate a HTML report along with a treemap. See [here](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) for more info on performance scoring. The report will give you various scores based on the metrics collected and provide explanations of the issues.
