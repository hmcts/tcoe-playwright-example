import { expect, test } from "../fixtures"; // Import from the centralized fixtures.ts
import { config } from "../utils";

test.use({
  storageState: config.users.citizen.sessionFile,
});

test("Accessibility example using custom fixture @a11y", async ({
  cuiCaseListPage,
  axeUtils,
}) => {
  await expect(cuiCaseListPage.banner).toBeVisible();
  await axeUtils.audit();
});

test("Accessibility example with exclusions @a11y", async ({
  cuiCaseListPage,
  axeUtils,
}) => {
  await expect(cuiCaseListPage.banner).toBeVisible();
  // Single exclusion
  await axeUtils.audit({
    exclude: "[data-testid='terribleInaccessibleElement']",
  });
  // Multiple exclusions
  await axeUtils.audit({
    exclude: [
      "[data-testid='terribleInaccessibleElement']",
      "#evenWorseElement",
    ],
  });
});
