# Copilot Instructions for HMCTS Playwright Template

## Architecture Overview

This is an **HMCTS Playwright test automation template** following **Page Object Model (POM)** with hierarchical component structure:
- **Base class** (`playwright-e2e/page-objects/base.ts`) - Provides common components to all pages via composition
- **Components** (`playwright-e2e/page-objects/components/`) - Reusable UI sections (headers, case lists) shared across pages
- **Pages** (`playwright-e2e/page-objects/pages/`) - Full page implementations extending `Base`
- **Fixtures** (`playwright-e2e/fixtures.ts`) - Dependency injection system for pages and utilities
- **Utils** (`playwright-e2e/utils/`) - Focused utility classes (validators, config, cookie handlers)

## Key Patterns & Conventions

### Test Organization
- Tests tagged for selective execution: `@a11y`, `@performance`, `@visual`, `@smoke`, `@exui`, `@cui`
- Global setup/teardown (`global.setup.ts`, `global.teardown.ts`) handles authentication and session management
- Performance tests require `@performance` tag AND `lighthousePage` fixture (chromium only)
- **Always import from centralized fixtures**: `import { test, expect } from "../fixtures"` (never from `@playwright/test`)

### Fixture-Based Dependency Injection
```typescript
// Fixtures provide pre-configured page objects and utilities
test("example", async ({ exuiCaseListPage, axeUtils, config, idamPage }) => {
  // All dependencies injected automatically - no manual instantiation
  await exuiCaseListPage.goto();
  await axeUtils.audit();
});
```

### User & Session Management
- Global setup creates sessions for user roles (caseManager, judge) stored in `.sessions/`
- Use `test.use({ storageState: config.users.caseManager.sessionFile })` to select session
- Dynamic citizen users: `await citizenUserUtils.createUser()` returns ephemeral credentials
- IDAM tokens via `idamUtils.generateIdamToken()` for API operations
- Session validation: `SessionUtils.isSessionValid(sessionFile, cookieName)` avoids re-authentication

### Page Object Model Structure
```typescript
// All pages extend Base to inherit common components
export class ExuiCaseListPage extends Base {
  readonly container = this.page.locator("exui-case-home");
  
  constructor(page: Page) {
    super(page); // Provides exuiHeader, exuiCaseListComponent, etc.
  }
  
  async goto() {
    await this.page.goto(config.urls.manageCaseBaseUrl);
    await this.exuiHeader.checkIsVisible();
  }
}
```

## Essential Commands

### Test Execution
```bash
# Browser-specific (excludes a11y, performance, visual by default)
yarn test:chrome
yarn test:firefox  
yarn test:webkit
yarn test:edge
yarn test:tabletchrome
yarn test:tabletwebkit

# Specialized test types
yarn test:a11y              # Accessibility tests with axe-core (chrome only)
yarn test:visual            # Visual regression with snapshots (chromium)
yarn test:update-snapshots  # Update visual baselines
yarn playwright test --grep @performance --project=chromium  # Performance tests
```

### Development & CI
```bash
yarn lint                    # TypeScript + ESLint validation (CI enforced)
yarn setup                   # Install Playwright browsers with dependencies
yarn setup:edge              # Install Edge browser separately
yarn start-container         # Run tests in Docker (reproduces CI environment)
```

## Critical Dependencies

- **`@hmcts/playwright-common`** - HMCTS shared components (`ExuiCaseListComponent`, `IdamPage`, `LighthouseUtils`, `AxeUtils`, `SessionUtils`, `TableUtils`, `BrowserUtils`)
- **Session storage** - `.sessions/` directory contains browser state (cookies) for authenticated users
- **Lighthouse** - Performance testing (chromium-based browsers only)
- **Axe-core** - Accessibility testing via `@axe-core/playwright`

## Configuration Patterns

- **Config centralization**: `playwright-e2e/utils/config.utils.ts` handles all environment variables
- **Environment variables**: Use `getEnvVar(name, fallback?)` for optional, `requireEnvVar(name)` for required
- **Never hardcode**: URLs, credentials, secrets - always use `process.env` or config
- **Browser projects**: Defined in `playwright.config.ts` with `dependencies: ["setup"]` ensuring global setup runs first
- **Test data isolation**: Each test uses unique data to prevent conflicts

## Development Practices & HMCTS Standards

> 👉 **First steps**: Familiarise yourself with `docs/BEST_PRACTICE.md` (HMCTS Playwright coding standard) and `docs/CONFIGURATION.md`. Everything below builds on those documents.

### SOLID Principles Implementation

**Single Responsibility Principle (SRP)**
- **Pages**: Handle navigation and expose components only (e.g., `ExuiCaseListPage.goto()`)
- **Components**: Manage specific UI sections (e.g., `ExuiHeaderComponent.checkIsVisible()`)
- **Utils**: Focused single-purpose classes (e.g., `ValidatorUtils` validates formats, `CookieUtils` manages cookies)
- **Anti-pattern**: Avoid multi-purpose classes doing "X and Y" - split them

**Open/Closed Principle (OCP)**
- `Base` class provides extension via composition (components added, not modified)
- Config uses interfaces (`UserCredentials`, `Urls`, `Config`) allowing new implementations without core changes
- Fixtures extend via composition: `baseTest.extend<CustomFixtures>({ ...pageFixtures, ...utilsFixtures })`
- **When adding features**: Extend existing classes or create new ones - don't modify stable abstractions

**Liskov Substitution Principle (LSP)**
- All page objects extend `Base` and are substitutable where `Base` is expected
- Components composable - any component can be injected into any page without breaking contracts

**Interface Segregation Principle (ISP)**
- Fixtures segregated: `PageFixtures` and `UtilsFixtures` - tests import only what they need
- Type definitions focused: `UserCredentials`, `Urls`, `Config` each serve specific purposes
- **Avoid**: Monolithic interfaces - prefer multiple small, focused interfaces

**Dependency Inversion Principle (DIP)**
- Tests depend on fixture abstractions, not concrete implementations
- Page objects receive `Page` via constructor injection, not global state
- Utils instantiated through fixtures, enabling mocking/substitution

### DRY (Don't Repeat Yourself)

**Good DRY Examples:**
- `Base` class eliminates component duplication across all pages
- `config.utils.ts` centralizes environment handling (`getEnvVar`, `requireEnvVar`)
- Data-driven tests: `[{ state: "Submitted" }, { state: "Pending" }].forEach(...)` eliminates test duplication
- `validateDraftTable()` and `validateWelshDraftTable()` in `CuiCaseListComponent` reuse validation logic

**When to Apply DRY:**
- Extract repeated multi-step workflows into helper functions or utils
- Centralize locator patterns in components if used by multiple pages
- Use data-driven tests for parameterized scenarios (state filters, user types, etc.)
- Create validator utils for repeated assertion patterns

**When NOT to Apply DRY:**
- Simple, clear inline setup (e.g., single `goto()` call)
- Assertions verifying different business rules despite similar syntax
- Page-specific locators that coincidentally have similar selectors but represent different elements

### HMCTS-Specific Coding Standards

**Linting & Code Quality**
- ESLint configured with `@hmcts/playwright-common` linting standards
- TypeScript strict mode enforced via `tsconfig.json`
- Playwright-specific rules enabled (locator best practices, await actions)
- **Mandatory**: Run `yarn lint` before every commit - CI enforces this

**Type Safety**
- Always define interfaces for config objects (`UserCredentials`, `Config`)
- Use `type` for simple aliases, `interface` for extensible objects
- **Avoid `any`** - use `unknown` with type guards or define proper types
- Explicit return types on public methods: `async validateDraftTable(): Promise<void>`

**Naming Conventions**
- Page objects: `<Service><Page>Page` (e.g., `ExuiCaseListPage`, `CuiCaseListPage`)
- Components: `<Service><Component>Component` (e.g., `ExuiHeaderComponent`, `CuiCaseListComponent`)
- Utils: `<Purpose>Utils` (e.g., `ValidatorUtils`, `CitizenUserUtils`, `CookieUtils`)
- Test files: `<feature>.<type>.spec.ts` (e.g., `case-list-professional.spec.ts`, `accessibility-example-test.spec.ts`)
- Fixtures: Descriptive camelCase matching purpose (`exuiCaseListPage`, `lighthouseUtils`, `idamPage`)

**Test Design Standards (from BEST_PRACTICE.md)**
- **Clear descriptions**: Business-focused test names describing behavior, not implementation
- **Test isolation**: Each test runs independently - no dependencies between tests
- **Unique test data**: Never share state or data across tests
- **Appropriate tagging**: `@a11y`, `@performance`, `@visual`, `@smoke`, `@exui`, `@cui`
- **Assertions throughout**: Fail fast with clear diagnostics - not just at the end
- **Stable locators**: Test IDs, roles, labels preferred over CSS classes or DOM traversal

**Waiting & Assertions**
- **Avoid implicit waits**: Never use `page.waitForTimeout()` unless absolutely necessary
- **Use explicit assertions**: `expect().toBeVisible()`, `expect.poll()` - they auto-retry with clear errors
- Playwright's actionability checks handle most waiting automatically

**Code Organization**
```
playwright-e2e/
├── page-objects/
│   ├── base.ts              # Abstract base with common components
│   ├── components/          # Reusable UI sections
│   │   ├── exui/           # EXUI-specific (professional users)
│   │   └── cui/            # CUI-specific (citizen users)
│   └── pages/              # Full page implementations
│       ├── page.fixtures.ts # Page fixture registration
│       ├── exui/           # Professional user pages
│       └── cui/            # Citizen user pages
├── tests/                  # Test specifications
├── utils/                  # Helper utilities
│   ├── utils.fixtures.ts  # Utils fixture registration
│   ├── test-data/         # Test data fixtures
│   └── *.utils.ts         # Focused utility classes
└── fixtures.ts            # Centralized fixture composition
```

**Error Handling**
- Use `expect()` assertions for validation - provide clear error messages
- Throw descriptive errors for exceptional cases:
  ```typescript
  throw new Error(`Failed to select case after ${maxAttempts} attempts`);
  ```
- Avoid silent failures - always assert expected outcomes
- Validate data presence before processing (fail fast pattern)

**Documentation Standards**
- JSDoc comments on public methods: purpose, params, return values
- Inline comments only when logic is non-obvious (e.g., workarounds)
- Update `docs/` when introducing new patterns
- Keep `CONTRIBUTING.md` current with workflow changes

## CI/CD & Jenkins Integration

**Jenkins Pipeline** (`Jenkinsfile_CNP`):
- Uses `withNightlyPipeline(type, product, component)` from shared `cnp-jenkins-library`
- Current custom stage: **Lint** (runs `yarn lint` with unstable handling)
- No implicit test execution - must add stages explicitly
- Slack notifications enabled (avoid leaking secrets in messages)

**Adding Test Execution:**
```groovy
stage('Tests') {
  try {
    yarnBuilder.yarn('test:chrome')
  } catch (Error) {
    unstable(message: "${STAGE_NAME} is unstable: " + Error.toString())
  }
}
```

**CI Best Practices:**
- Run `yarn setup` early if using parallel test agents
- Keep PR pipelines fast: smoke/tagged suites only
- Reserve full matrix + performance for nightly
- Reproduce CI locally: `docker-compose.yaml` (`yarn start-container`)
- Test on `nightly-dev` branch before merging to master

### Secrets & Environment Variables (CRITICAL)

**Privacy Rules:**
- **Never commit secrets** or session files containing credentials
- Reference secrets with `process.env.SECRET_NAME` - never log values
- `IDAM_SECRET`, `CASEMANAGER_PASSWORD`, etc. injected by Jenkins/Azure Key Vault
- Tokens (e.g., `CREATE_USER_BEARER_TOKEN`) live only in memory - never serialize/upload
- Session files (`.sessions/*.json`) contain only cookies/state - no raw passwords
- **If adding new secrets**: Document the name only, not values or retrieval mechanisms

## Using HMCTS Components & Utilities

All HMCTS abstractions delivered via fixtures - always import from `../fixtures`:

### Core Utilities (from `@hmcts/playwright-common`)
- **`IdamPage.login(user)`** - Standardized authentication flow
- **`SessionUtils.isSessionValid(sessionFile, cookieName)`** - Skip unnecessary logins in setup
- **`citizenUserUtils.createUser()`** - Ephemeral citizen users (scoped to test only)
- **`lighthouseUtils.audit()`** - Performance audits (requires `@performance` + chromium)
- **`axeUtils.audit({ exclude })`** - Accessibility scan with optional exclusions (selector or array)
- **`cookieUtils.addManageCasesAnalyticsCookie(sessionFile)`** - Stabilize analytics/banner state
- **`tableUtils.mapExuiTable(locator)`** - Parse EXUI tables into structured data
- **`browserUtils.openNewBrowserContext(sessionFile)`** - Multi-user testing

### Complete Test Example
```typescript
import { test, expect } from "../fixtures";

test.describe("Case list workflow @exui @smoke", () => {
  test.use({
    storageState: config.users.caseManager.sessionFile,
  });

  test("Search and verify case state @smoke", async ({ exuiCaseListPage, tableUtils }) => {
    const state = "Submitted";
    await exuiCaseListPage.exuiCaseListComponent.searchByCaseState(state);
    
    const table = await tableUtils.mapExuiTable(
      exuiCaseListPage.exuiCaseListComponent.caseListTable
    );
    
    table.forEach((row) => {
      expect(row["State"]).toEqual(state);
    });
  });

  test("Accessibility audit @a11y", async ({ exuiCaseListPage, axeUtils }) => {
    await exuiCaseListPage.exuiHeader.checkIsVisible();
    await axeUtils.audit();
  });

  test("Performance baseline @performance", async ({ exuiCaseListPage, lighthouseUtils }) => {
    await exuiCaseListPage.exuiHeader.checkIsVisible();
    await lighthouseUtils.audit();
  });
});
```

### Data-Driven Parameterized Tests
```typescript
// Preferred pattern for testing multiple variations
[
  { state: "Case Issued" },
  { state: "Submitted" },
  { state: "Pending" },
].forEach(({ state }) => {
  test(`Search for case with state: ${state}`, async ({ exuiCaseListPage, tableUtils }) => {
    await exuiCaseListPage.exuiCaseListComponent.searchByCaseState(state);
    const table = await tableUtils.mapExuiTable(
      exuiCaseListPage.exuiCaseListComponent.caseListTable
    );
    table.forEach((row) => {
      expect(row["State"]).toEqual(state);
    });
  });
});
```

## Common Anti-Patterns to Avoid

- ❌ Creating `new Page()` instances directly in tests (breaks fixture lifecycle)
- ❌ Importing from `@playwright/test` instead of `../fixtures`
- ❌ Hardcoding URLs, credentials, test data (use config/test-data files)
- ❌ Logging sensitive data (tokens, passwords) - only masked/sanitized info
- ❌ Repeating login logic (use global setup or fixtures)
- ❌ Duplicate locators across page objects (centralize in components/Base)
- ❌ Long test methods (extract helpers for multi-step workflows)
- ❌ Modifying `Base` class for page-specific needs (use composition)
- ❌ Using `page.waitForTimeout()` instead of assertions
- ❌ Sharing test data or state between tests

## When Extending This Template

1. **New test types**: Add tag-focused scripts (`test:<tag>`) mirroring existing naming convention
2. **New page objects**: Extend `Base`, register in `page.fixtures.ts` for injection
3. **New utilities**: Expose through `utils.fixtures.ts` so they're injectable
4. **Long-running suites**: Gate to specific projects or nightly schedules (not PR pipelines)
5. **New patterns**: Update this file and relevant `docs/` markdown
6. **New components**: Place in appropriate service folder (`exui/` or `cui/`)

## Code Review Checklist

Before submitting PR:
- [ ] All tests pass locally (`yarn playwright test`)
- [ ] Linting passes (`yarn lint`)
- [ ] New page objects extend `Base` and registered in `page.fixtures.ts`
- [ ] New utils exposed through `utils.fixtures.ts`
- [ ] No hardcoded secrets, URLs, or environment-specific values
- [ ] Test descriptions are business-focused and clear
- [ ] Appropriate tags applied (`@a11y`, `@smoke`, etc.)
- [ ] Documentation updated if introducing new patterns
- [ ] Type safety maintained (no `any`, explicit return types)
- [ ] DRY applied appropriately without over-abstraction
- [ ] Changes tested on `nightly-dev` branch pipeline if significant

## Common Gotchas

- Performance tests require BOTH `@performance` tag AND `lighthousePage` fixture
- Visual tests only run on `chromium` project (not chrome/webkit/firefox)
- Session invalidation if manually signing out during tests
- EXUI sessions valid for 8 hours, citizen sessions vary by config
- Docker compose uses host networking - avoid OS-specific assumptions
- Use `determinePage` fixture which auto-selects lighthouse page for `@performance` tests
- Global setup runs once before all projects via `dependencies: ["setup"]`
