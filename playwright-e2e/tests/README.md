# Test Suite Overview

This directory contains end-to-end tests for HMCTS applications using Playwright. Tests are organized by feature area and tagged for selective execution.

## Directory Structure

```
tests/
├── api/                           # API integration tests (see api/README.md)
├── accessibility-example-test.spec.ts  # Accessibility testing with axe-core
├── case-list-casemanager.performance.spec.ts  # Performance/Lighthouse tests
├── case-list-citizen.spec.ts      # Citizen user interface tests
├── case-list-professional.spec.ts # Professional user (solicitor) tests
├── caseworker-divorce-user.spec.ts # Caseworker user provisioning
├── localisation.spec.ts           # Internationalization (i18n) tests
├── multiple-users.spec.ts         # Multi-user/browser scenarios
├── solicitor-user.spec.ts         # Solicitor account management
└── visual-tests.spec.ts           # Visual regression testing
```

## Test Categories

### UI Tests (`@cui`, `@exui`)

Tests for user-facing interfaces across citizen and professional portals.

**Citizen UI Tests** (`@cui`):
- [case-list-citizen.spec.ts](./case-list-citizen.spec.ts) - Case list viewing, Welsh language support
- [accessibility-example-test.spec.ts](./accessibility-example-test.spec.ts) - Accessibility compliance checks

**Professional UI Tests** (`@exui`):
- [case-list-professional.spec.ts](./case-list-professional.spec.ts) - Case search, selection, and navigation

### API Tests (`@api`)

See [api/README.md](./api/README.md) for comprehensive API test documentation.

Subcategories:
- `@security` - Authentication, authorization, token handling, redaction
- `@smoke` - Critical path health checks
- `@refdata` - Reference data validation

### Visual Regression Tests (`@visual`)

**File**: [visual-tests.spec.ts](./visual-tests.spec.ts)

Screenshot comparison tests to detect unintended UI changes:
- Full page screenshots
- Masked element screenshots (hide dynamic content)
- Clipped region screenshots (focus on specific areas)

**Updating Snapshots**:
```bash
npm run build-container && npm run start-container
yarn test:update-snapshots
# Commit updated snapshots to git
```

### Performance Tests (`@performance`)

**File**: [case-list-casemanager.performance.spec.ts](./case-list-casemanager.performance.spec.ts)

Lighthouse-based performance audits:
- Core Web Vitals (LCP, FID, CLS)
- Accessibility scores
- Best practices compliance
- SEO metrics

**Running Performance Tests**:
```bash
yarn playwright test --grep @performance
```

### User Provisioning Tests (`@solicitor`, `@caseworker`)

Tests for creating and managing test users via IDAM:
- [solicitor-user.spec.ts](./solicitor-user.spec.ts) - Solicitor account creation, password changes
- [caseworker-divorce-user.spec.ts](./caseworker-divorce-user.spec.ts) - Caseworker user setup

### Localization Tests (`@localisation`)

**File**: [localisation.spec.ts](./localisation.spec.ts)

Welsh language support validation using the `localeUtils` fixture.

### Multi-User Scenarios (`@multiple-users`)

**File**: [multiple-users.spec.ts](./multiple-users.spec.ts)

Tests involving multiple users accessing the same resources (e.g., case manager and judge viewing the same case).

## Tag Reference

| Tag | Description | Use Case |
|-----|-------------|----------|
| `@api` | All API integration tests | Backend contract testing, data validation |
| `@cui` | Citizen User Interface tests | Public-facing portal tests |
| `@exui` | Expert User Interface tests | Professional user workflows |
| `@visual` | Visual regression tests | UI consistency, screenshot comparison |
| `@a11y` | Accessibility tests | WCAG compliance, screen reader support |
| `@performance` | Performance/Lighthouse tests | Speed, Core Web Vitals, optimization |
| `@smoke` | Critical path tests | Essential functionality, health checks |
| `@security` | Security-focused tests | Auth, redaction, CSRF protection |
| `@solicitor` | Solicitor user tests | Legal professional workflows |
| `@caseworker` | Caseworker user tests | Internal staff workflows |
| `@localisation` | Internationalization tests | Language support (Welsh) |
| `@multiple-users` | Multi-user scenarios | Concurrent access, role interactions |
| `@refdata` | Reference data tests | Static data validation |

## Running Tests

### By Tag
```bash
# All UI tests
yarn playwright test --grep "@cui|@exui"

# Smoke tests only
yarn playwright test --grep @smoke

# All tests except visual and performance
yarn playwright test --grep-invert "@visual|@performance"

# Security tests only
yarn playwright test --grep @security
```

### By File Pattern
```bash
# All case list tests
yarn playwright test case-list

# All API tests
yarn playwright test tests/api

# Specific file
yarn playwright test tests/visual-tests.spec.ts
```

### Interactive Modes
```bash
# UI mode (recommended for development)
yarn playwright test --ui

# Debug mode (step through tests)
yarn playwright test --debug

# Headed mode (see browser)
yarn playwright test --headed

# Watch mode
yarn playwright test --watch
```

### Reporters
```bash
# HTML report (default)
yarn playwright test && yarn playwright show-report

# List reporter (CI-friendly)
PLAYWRIGHT_DEFAULT_REPORTER=list yarn playwright test

# Multiple reporters
PLAYWRIGHT_REPORTERS=list,html yarn playwright test
```

## Test Naming Conventions

### UI Tests
Follow descriptive action-based naming:
```typescript
test("View cases", async ({ cuiCaseListPage }) => { ... });
test("Navigate to the case list with Welsh language", async ({ ... }) => { ... });
```

### API Tests
Include HTTP status and condition (see [api/README.md](./api/README.md)):
```typescript
test("returns 200 with masked access token when valid credentials provided", ...);
test("returns 200 from readiness endpoint after retrying 503 failures", ...);
```

## Best Practices

### 1. Use Page Object Model
Leverage the `page-objects/` fixtures for maintainability:
```typescript
test("example", async ({ exuiCaseListPage, exuiCaseDetailsPage }) => {
  await exuiCaseListPage.exuiCaseListComponent.searchByCaseName("Smith");
  await exuiCaseListPage.exuiCaseListComponent.selectCaseByIndex(0);
  const caseNumber = await exuiCaseDetailsPage.exuiCaseDetailsComponent.getCaseNumber();
});
```

### 2. Extract Constants
Avoid magic numbers and strings:
```typescript
const CASE_NUMBER_LENGTH = 5;
const DEFAULT_TIMEOUT_MS = 5_000;
```

### 3. Use Appropriate Fixtures
```typescript
test("API call", async ({ createApiClient, logger }) => {
  const api = createApiClient({ baseUrl: config.urls.backend });
  logger.info("Making API call...");
});
```

### 4. Clean Up Resources
Always dispose of resources in `finally` blocks:
```typescript
try {
  const api = createApiClient({ ... });
  await api.get("/endpoint");
} finally {
  await api.dispose();
}
```

### 5. Tag Appropriately
Apply multiple tags for fine-grained filtering:
```typescript
test.describe("Case List Tests - Professional @exui @smoke", () => {
  test("Search & select a case", async ({ ... }) => { ... });
});
```

## Fixtures

Custom fixtures are defined in [../fixtures.ts](../fixtures.ts) and [../utils/utils.fixtures.ts](../utils/utils.fixtures.ts).

### Common Fixtures

| Fixture | Scope | Description |
|---------|-------|-------------|
| `page` | Test | Playwright Page instance |
| `config` | Test | Environment configuration (URLs, credentials) |
| `logger` | Test | Winston logger with test metadata |
| `createApiClient` | Test | Factory for creating ApiClient instances |
| `apiRecorder` | Test | Records API calls for attachments |
| `cookieUtils` | Test | Cookie management utilities |
| `idamUtils` | Test | IDAM authentication utilities |
| `citizenUserUtils` | Test | Citizen user creation/management |
| `professionalUserUtils` | Test | Professional user creation/management |
| `axeUtils` | Test | Accessibility testing with axe-core |
| `lighthouseUtils` | Test | Performance testing with Lighthouse |
| `seedManifest` | Worker | Deterministic test data IDs |

### Page Object Fixtures

All page objects are available as fixtures (see [../page-objects/pages/README.md](../page-objects/pages/README.md)):
- `cuiCaseListPage`, `cuiCaseDetailsPage` (Citizen UI)
- `exuiCaseListPage`, `exuiCaseDetailsPage` (Professional UI)
- `idamPage`, `activateCasePinPage`

## Environment Variables

Key variables for test execution:

### Service URLs
- `MANAGE_CASE_BASE_URL` - Professional UI base URL
- `CITIZEN_UI_BASE_URL` - Citizen UI base URL
- `IDAM_WEB_URL` - IDAM authentication service
- `CCD_DATA_STORE_API_BASE_URL` - Case data API

### Authentication
- `CASE_MANAGER_USERNAME` / `CASE_MANAGER_PASSWORD`
- `JUDGE_USERNAME` / `JUDGE_PASSWORD`
- `S2S_SECRET`, `S2S_MICROSERVICE_NAME`, `S2S_URL`

### Test Configuration
- `FUNCTIONAL_TESTS_WORKERS` - Parallel worker count
- `PWDEBUG` - Enable Playwright debug mode
- `PLAYWRIGHT_DEFAULT_REPORTER` - Default reporter (list, dot, html)
- `PLAYWRIGHT_REPORTERS` - Multiple reporters (comma-separated)

### API Telemetry
- `PLAYWRIGHT_DEBUG_API` - Include raw request/response bodies
- `PLAYWRIGHT_ATTACH_API_LOGS` - Attach API logs to reports
- `PLAYWRIGHT_STDOUT_API_LOGS` - Emit logs to stdout

See [../utils/config.utils.ts](../utils/config.utils.ts) for complete list.

## Debugging Tests

### Visual Inspection
```bash
# Open UI mode
yarn playwright test --ui

# Run with browser visible
yarn playwright test --headed --project=chromium
```

### Traces
Traces are captured on first retry and failure (configured in `playwright.config.ts`):
```bash
# View trace
yarn playwright show-trace trace.zip
```

### API Logs
When tests fail, API call logs are automatically attached to the HTML report:
```bash
yarn playwright test
yarn playwright show-report
# Click on failed test → Attachments → api-calls.json
```

### Breakpoints
Use `await page.pause()` to stop execution:
```typescript
test("debug example", async ({ page }) => {
  await page.goto("https://example.com");
  await page.pause(); // Opens Playwright Inspector
});
```

## CI/CD Integration

### Jenkins
See [Jenkinsfile_nightly](../../Jenkinsfile_nightly) for scheduled runs.

### GitHub Actions
Example workflow:
```yaml
- name: Install dependencies
  run: yarn install --frozen-lockfile
- name: Install Playwright browsers
  run: yarn playwright install --with-deps
- name: Run tests
  run: yarn playwright test --grep @smoke
- name: Upload report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Accessibility Testing

Use `axeUtils` fixture to scan pages:
```typescript
test("Accessibility example @a11y", async ({ page, axeUtils }) => {
  await page.goto(config.urls.citizenUrl);
  
  // Run scan
  await axeUtils.checkAxe();
  
  // Report generated automatically at end of test
});
```

**Excluding Elements**:
```typescript
await axeUtils.checkAxe({ exclude: [[".third-party-widget"]] });
```

## Visual Regression Testing

### Workflow
1. Write test with `expect(page).toHaveScreenshot()`
2. First run generates baseline screenshots
3. Subsequent runs compare against baselines
4. Update baselines: `yarn test:update-snapshots`

### Masking Dynamic Content
```typescript
await expect(page).toHaveScreenshot({
  mask: [page.locator(".timestamp"), page.locator(".random-id")],
});
```

### Clipping Regions
```typescript
const boundingBox = await page.locator(".main-content").boundingBox();
await expect(page).toHaveScreenshot({
  clip: boundingBox!,
});
```

## Performance Testing

Lighthouse audits run against headless Chrome:
```typescript
test("Example performance test @performance", async ({ page, lighthouseUtils }) => {
  await page.goto(config.urls.manageCaseBaseUrl);
  
  const report = await lighthouseUtils.audit({
    performance: 80,  // Minimum score thresholds
    accessibility: 90,
  });
  
  // Report saved as HTML artifact
});
```

## Troubleshooting

### Tests Failing Locally
1. Ensure containers are running: `npm run start-container`
2. Check environment variables in `.env` or `local.env`
3. Verify session files exist in `functional-output/`
4. Run with headed mode to observe: `--headed`

### Flaky Tests
- Increase timeouts for slow environments
- Add explicit waits: `await page.waitForLoadState("networkidle")`
- Check for race conditions in async operations
- Use `test.retry(2)` for known-flaky tests (sparingly)

### Session Expired Errors
Re-run global setup to regenerate session files:
```bash
yarn playwright test --project=setup
```

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Apply appropriate tags
3. Use page object fixtures
4. Add JSDoc comments for complex logic
5. Extract magic numbers to constants
6. Update this README if introducing new patterns

## References

- **Playwright Docs**: https://playwright.dev
- **API Tests**: [api/README.md](./api/README.md)
- **Best Practices**: [../docs/BEST_PRACTICE.md](../docs/BEST_PRACTICE.md)
- **Fixtures Guide**: [../docs/FIXTURES.md](../docs/FIXTURES.md)
- **Page Objects**: [../docs/PAGE_OBECT_MODEL.md](../docs/PAGE_OBECT_MODEL.md)
- **Configuration**: [../docs/CONFIGURATION.md](../docs/CONFIGURATION.md)
