# Configuration

Out of the box, playwright provides many options for how tests are run, browser config, reporting, debugging etc.

## Playwright Config

The [`playwright.config.ts`](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright.config.ts) file contains all of the playwright specific config. The config included in this template has been modified to include increased timeouts, CI alterations and more browsers/device emulators. These default values are provided as a base and will probably need to be tweaked for your liking.

The [playwright docs](https://playwright.dev/docs/test-configuration) cover all of the configuration options.

## Other Config

There are also instances where you will need extra configuration not explicitly covered in Playwright. These are things like user credentials or URL's. To cover these, we have used a utils class [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/config.utils.ts). This can also follow the typical fixture pattern to allow your config to be accessed a fixture in your tests.

It is generally good practice to keep any sensitive information as an environment variable. These can be easily swapped if needed (e.g. switching from AAT to Demo or a preview environment). The "dotenv" package is used for this, this allows you to specify a `.env` file to store your environment variables (rather than part of your bash profile).

As an example, the file `.env.example` is provided to show what environment variables are required.

The utils class has a [helper function](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/utils/config.utils.ts#L47) to ensure the given environment variable is set when loaded (fail fast rather than wait until the specific variable is accessed).
