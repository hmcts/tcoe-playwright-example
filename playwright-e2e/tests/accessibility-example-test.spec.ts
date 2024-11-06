import { expect, test } from "../fixtures"; // Import from the centralized fixtures.ts

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
