# Global Setup and Teardown

This project demonstrates how to configure **global setup** and **teardown** in Playwright using **project dependencies**. This method ensures that global setup runs before all test projects and can produce useful artifacts such as traces. It also allows for easy teardown once all tests are complete.

## Setup

We use a dedicated project for global setup, named `setup db`, and another for global teardown, named `cleanup db`. This structure ensures that the database or environment is initialized before any tests run and cleaned up afterward.

### Project Dependencies

By using **project dependencies**, the setup project runs first, followed by any dependent test projects. This approach allows you to include the global setup in your Playwright reports and captures traces.

### Configuration Example

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  projects: [
    {
      name: 'setup db',
      testMatch: /global\.setup\.ts/,   // Match the global setup script
      teardown: 'cleanup db',           // Define teardown after all projects
    },
    {
      name: 'cleanup db',
      testMatch: /global\.teardown\.ts/, // Match the global teardown script
    },
    {
      name: 'chromium with db',
      use: { ...devices['Desktop Chrome'] }, // Browser configuration
      dependencies: ['setup db'],            // Project depends on 'setup db'
    },
  ],
});
```

### Setup Test

Create a setup test (`global.setup.ts`) that initializes your database or any other resources.

```ts
// playwright-e2e/helpers/setup-teardown/global.setup.ts
import { test as setup } from '@playwright/test';

setup('create new database', async ({ }) => {
  console.log('creating new database...');
  // Initialize the database
});
```

### Example Test

Here’s an example of a test that runs after the setup is completed:

```ts
// playwright-e2e/example-tests/menu.spec.ts
import { test, expect } from '@playwright/test';

test('menu', async ({ page }) => {
  // Test code that depends on the database
});
```

## Teardown

The teardown project runs after all test projects finish. Use it to clean up any resources initialized during setup.

```ts
// playwright-e2e/helpers/setup-teardown/global.teardown.ts
import { test as teardown } from '@playwright/test';

teardown('delete database', async ({ }) => {
  console.log('deleting test database...');
  // Delete the database
});
```

## More Information

For more examples and detailed instructions, check the [Playwright Global Setup/Teardown Documentation](https://playwright.dev/docs/test-global-setup-teardown).
