import { test } from '../fixtures';

test('login multiple users @login', async ({ getLoggedInPage, config }) => {
  const { page: caseManagerPage } = await getLoggedInPage('caseManager');
  await caseManagerPage.goto(config.urls.citizenUrl);

  const { page: judgePage } = await getLoggedInPage('judge');
  await judgePage.goto(config.urls.manageCaseBaseUrl);
});