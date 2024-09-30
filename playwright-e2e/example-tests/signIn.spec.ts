import { test, expect } from '@playwright/test';
import SignIn from '../pages/signIn.page'; 

test('Check if the sign-in heading is visible', async ({ page }) => {
  // Initialize the SignIn page object and check is heading is visible
  const signInPage = new SignIn(page);
  await expect(signInPage.heading).toBeVisible();
});
