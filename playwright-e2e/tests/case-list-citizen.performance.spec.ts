import { expect, test } from "../fixtures";
import { CuiCaseListPage } from "../page-objects/pages";

/* Because lighthouse has to use a new page to run its tests
 * the new page has to be passed to the test via a fixture (lighthousePage)
 * unfortunately, this also means that using any page objects as a fixture will not work
 * so must be instantiated separately instead using lighthousePage
 *
 * to enable parallelisation, the port must also be passed via a fixture (lighthousePort)
 *
 * lighthouseUtils provides the utils class which contains the common audit method
 */

test.describe("Case List UI Performance Tests - Citizen @cui @performance", () => {
  test("Example performance test", async ({
    lighthousePage,
    lighthouseUtils,
    lighthousePort,
  }) => {
    const casePage = new CuiCaseListPage(lighthousePage);
    await casePage.goto();
    await expect(casePage.banner).toBeVisible();
    await lighthouseUtils.audit(lighthousePage, lighthousePort);
  });
  test("Example performance test no.2 ", async ({
    lighthousePage,
    lighthouseUtils,
    lighthousePort,
  }) => {
    const casePage = new CuiCaseListPage(lighthousePage);
    await casePage.goto();
    await expect(casePage.banner).toBeVisible();
    await lighthouseUtils.audit(lighthousePage, lighthousePort);
  });
});
