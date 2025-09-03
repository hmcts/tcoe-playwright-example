# Visual Testing

Visual testing in playwright is the process of comparing an expected screenshot of the page with the actual screenshot of the page. However, there are a few things to consider when using visual tests.

## Recording snapshots

In order to match screenshots, they need to be the same. Therefore things like OS, Browser and viewport need to be consistent when creating the snapshots and when running the tests. This is also reflected in the way playwright names the screenshots (although you can choose your own names/rename the generated screenshots).
As a solution to this, it's recommended to use Docker to both create the snapshots and run the tests (locally and on CI).

To create and run the docker container you need to run the command `yarn start-container`. This will build the docker image using the [`Dockerfile`](https://github.com/hmcts/tcoe-playwright-example/blob/master/Dockerfile) _and_ start the docker container using the [`docker-compose.yaml`](https://github.com/hmcts/tcoe-playwright-example/blob/master/docker-compose.yaml).

Once the docker container is running you can run tests in it the same way you would through a standard terminal.

You may also have some UI changes to your service, in which you will need to re-generate any snapshots. Playwright provides a `--update-snapshots` flag to do this.

## Which features to visual test?

Visual tests are better focused on features that are difficult to automate, where the UI is not consistently changing or where the UI is considered critical to the usage of the service.

### Handling dynamic data

Your feature may have dynamic data that could skew visual testing results, fortunately you can use the following options in `toHaveScreenshot()` to mitigate this.

- `clip` - This will choose a select area to screenshot. Useful if you do not want to test the whole page.
- `mask` - This will mask a given locator(s) and be exempt from the comparison test.
- `maxDiffPixelRatio` - This is the ratio of pixels that can be different, likewise `maxDiffPixels` can be used to provide a number of pixels rather than ratio.

See examples in the [tests](https://github.com/hmcts/tcoe-playwright-example/blob/master/playwright-e2e/tests/visual-tests.spec.ts) and the [playwright docs](https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-2) for other options.
