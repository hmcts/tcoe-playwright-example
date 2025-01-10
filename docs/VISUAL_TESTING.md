# Visual Testing

Visual testing is essentially comparing an expected screenshot of the page with the actual screenshot of the page. However, there are a few things to consider when using visual tests.

## Recording snapshots

In order to match screenshots, they need to be the same. Therefore things like OS, Browser and viewport need to be consistent when creating the snapshots and when running the tests.
As a solution to this, it's recommended to use Docker to both create the snapshots and run the tests (locally and on CI).

## Which feature to visual test?

Visual tests are better focused on features that are either difficult to automate or do not change a lot.

### Handling dynamic data

Your feature may have dynamic data that could skew visual testing results, fortunately you can use the following options in `toHaveScreenshot()` to mitigate this.

- `clip` - This is essentially choosing a select area to screenshot. You may use this if you have various areas you want to test, but not as a single screenshot/test.
- `mask` - This will mask a given locator(s) and be exempt from the comparison test.
- `maxDiffPixelRatio` - This is the ratio of pixels that can be different, likewise `maxDiffPixels` can be used to provide a number of pixels rather than ratio.
