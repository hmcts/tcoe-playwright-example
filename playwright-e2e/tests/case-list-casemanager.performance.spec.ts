import { expect, test } from "../fixtures";

/* Because lighthouse has to use a new page to run its tests
 * the new page has to be passed to the test via a fixture (lighthousePage)
 * a caveat of this is that all performance tests must be tagged with @performance
 * also important to note lighthouse is only supported in chromium based browsers
 *
 * to enable parallelisation, the port must also be passed via a worker-scoped fixture (lighthousePort)
 *
 * lighthouseUtils provides the utils class which contains the common audit method
 */

test.describe("EXUI Case List UI Performance Tests - Casemanager @exui @performance", () => {
  test("Example performance test no.1", async ({
    lighthouseUtils,
    exuiCaseListPage,
  }) => {
    await exuiCaseListPage.exuiHeader.checkIsVisible();
    await lighthouseUtils.audit();
  });
  test("Example performance test no.2", async ({
    lighthouseUtils,
    exuiCaseListPage,
  }) => {
    await exuiCaseListPage.exuiHeader.checkIsVisible();
    await lighthouseUtils.audit();
  });
});