import { expect, test } from "../fixtures"; // Import from the centralized fixtures.ts

test('example using custom fixture', async ({ cuiCaseListPage, makeAxeBuilder }) => {
  await expect(cuiCaseListPage.banner).toBeVisible();
  // Use the makeAxeBuilder to perform an accessibility scan
  const accessibilityScanResults = await makeAxeBuilder()
    .include('#specific-element-under-test')
    .analyze();
  // Expect no accessibility violations
  expect(accessibilityScanResults.violations).toEqual([]);
});
