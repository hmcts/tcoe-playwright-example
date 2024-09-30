import { test as teardown } from '@playwright/test';

teardown('delete database', async ({ }) => {
  console.log('deleting user and case');
  
});