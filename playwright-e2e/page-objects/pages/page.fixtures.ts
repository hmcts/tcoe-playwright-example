import { CuiCaseListPage } from "./cui/cui-case-list.po";
import { ExuiCaseDetailsPage } from "./exui/exui-case-details.po";
import { ExuiCaseListPage } from "./exui/exui-case-list.po";
import { IdamPage } from "./idam.po";

export interface PageFixtures {
  exuiCaseDetailsPage: ExuiCaseDetailsPage;
  exuiCaseListPage: ExuiCaseListPage;
  cuiCaseListPage: CuiCaseListPage;
  idamPage: IdamPage;
}

/* Instantiates pages and provides page to the test via use()
 * can also contain steps before or after providing the page
 * this is the same behaviour as a beforeEach/afterEach hook
 */
export const pageFixtures = {
  exuiCaseDetailsPage: async ({ page }, use) => {
    await use(new ExuiCaseDetailsPage(page));
  },
  exuiCaseListPage: async ({ page }, use) => {
    const exuiCaseListPage = new ExuiCaseListPage(page);
    await exuiCaseListPage.goto();
    await use(exuiCaseListPage);
  },
  cuiCaseListPage: async ({ page }, use) => {
    const cuiCaseListPage = new CuiCaseListPage(page);
    await cuiCaseListPage.goto();
    await use(cuiCaseListPage);
  },
  idamPage: async ({ page }, use) => {
    await use(new IdamPage(page));
  },
};
