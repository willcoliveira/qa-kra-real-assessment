# Project Conventions — qa-kra-real-assessment

## Constitution-Style Rules

### MUST

1. **MUST** import `test` from your custom fixture file, NOT from `@playwright/test` (if using custom fixtures)
2. **MUST** use web-first assertions (`await expect(locator).toBeVisible()`) — never one-shot checks (`expect(await locator.isVisible()).toBe(true)`)
3. **MUST** use named timeout constants instead of hardcoded numbers
4. **MUST** wrap page object methods in `test.step()` for trace reporting
5. **MUST** use POM pattern — locators as readonly class properties, methods for interactions
6. **MUST** use short inner timeouts inside `toPass` blocks (e.g. `{ timeout: 1_000 }` for inner assertions when outer `toPass` has `{ timeout: 30_000 }`)
7. **MUST** clean up test resources in `afterEach` hooks (cancel orders, release reservations, etc.)
8. **MUST** tag tests appropriately for CI filtering

9. **MUST** import `test, expect` from `../src/fixtures/test.fixture` — never from `@playwright/test`
10. **MUST** use `generateRandom*` helpers from `src/utils/testDataGenerator.ts` for all dynamic test data
11. **MUST** use `ensureAuthenticated()` from `src/utils/auth.helper.ts` in `beforeEach` for authenticated tests
12. **MUST** use `config` fixture for account credentials — never hardcode emails/passwords inline
13. **MUST** register fresh users in `beforeAll` for test isolation (use `RegisterPage` directly)

### SHOULD

1. **SHOULD** use `test.step()` in test specs for complex multi-step assertions
2. **SHOULD** prefer `getByRole()` over `getByTestId()` over CSS selectors
3. **SHOULD** cross-reference the source application repo for selectors and component structure
4. **SHOULD** add comments explaining non-obvious timeouts or workarounds
5. **SHOULD** use descriptive test names that explain the user journey, not the implementation
6. **SHOULD** keep test data in dedicated data files, not inline in tests
7. **SHOULD** use `{ exact: true }` for `getByText()` / `getByRole()` when the text could match multiple elements
8. **SHOULD** prefer positive assertions (`toBeHidden()`, `toBeDisabled()`) over negated ones (`.not.toBeVisible()`, `.not.toBeEnabled()`)
9. **SHOULD** use semantic timeout names that match the operation:
   - `SHORT` (5s) — quick visibility checks
   - `MEDIUM` (10s) — standard interactions
   - `LONG` (15s) — slow-loading elements (iframes, heavy pages)
   - `ACTION` (30s) — action timeouts
   - `EXTENDED` (60s) — retryable operations (toPass, polling)

10. **SHOULD** use `BasePage` helper methods (`getByPlaceholder`, `getByRole`, `getFormControl`) instead of raw `page.locator()`
11. **SHOULD** use hash-based navigation (`#/path`) since the app uses Angular hash routing
12. **SHOULD** use `waitForURL(/.*#\/expected-path/)` after navigation actions

### WON'T

1. **WON'T** use XPath selectors (fragile, hard to read)
2. **WON'T** use `page.waitForTimeout()` for synchronization (use `expect().toBeVisible()` or `waitFor()` instead)
3. **WON'T** use hardcoded credentials in test files (use env vars via `.env` or CI secrets)
4. **WON'T** take full-page screenshots in tests (use Playwright's `screenshot: 'only-on-failure'` config)
5. **WON'T** use `test.only()` or `test.skip()` in committed code (CI uses `forbidOnly: true`)
6. **WON'T** commit `.env` files or expose secrets in traces
7. **WON'T** duplicate test coverage already handled by unit/component tests in the source repo
8. **WON'T** use magic number timeouts — always use named constants
9. **WON'T** use `{ force: true }` on actions — if users can't click it, the test shouldn't force it
10. **WON'T** use `networkidle` in `goto()` or `waitForLoadState()` — wait for a user-visible element instead
11. **WON'T** add redundant waits before auto-wait actions (e.g. `waitFor({ state: 'visible' })` before `.click()`)
12. **WON'T** use deprecated APIs (`waitForNavigation`, `Promise.all` with navigation) — use `waitForURL()` or web-first assertions
13. **WON'T** use `page.evaluate()` / `page.addInitScript()` as workarounds for test issues — fix through real UI interactions
14. **WON'T** return new page objects from POM action methods — actions return `Promise<void>`, let the test decide what page to use next
15. **WON'T** write custom retry/polling loops — use `toPass()` or `expect.poll()` instead

16. **WON'T** use static test accounts from `config/settings.yaml` for write operations — always register fresh users to avoid conflicts
17. **WON'T** store credentials in test files — use `config` fixture or `testDataGenerator`

---

## File Organization Rules

### Test Files

```
tests/{feature}.spec.ts
```

- One file per feature area: `auth.spec.ts`, `article.spec.ts`, `comments.spec.ts`, `follow-feed.spec.ts`, `tags.spec.ts`
- One `test.describe()` per file with tags in the describe title (e.g. `{ tag: ['@articles'] }`)
- Nested `test.describe()` blocks for sub-features (e.g. Write Article, Edit Article, Delete Article)
- Two Playwright projects: `authenticated` (all except auth) and `unauthenticated` (auth only)

### Page Objects

```
src/pages/BasePage.ts              # Base class with shared helpers
src/pages/{PageName}.ts            # Page objects (PascalCase, no .page suffix)
```

### Helpers & Utils

```
src/fixtures/test.fixture.ts       # Custom test fixture (all page objects + config)
src/utils/auth.helper.ts           # Session management with storage state caching
src/utils/testDataGenerator.ts     # Random data generators (username, email, article, tags)
src/config/config.ts               # YAML config loader with env var overrides
config/settings.yaml               # Test accounts, URLs, settings
```

---

## Test Data Management

| Type | Location | Examples |
|------|----------|---------|
| Test accounts | `config/settings.yaml` | `userA`, `userB` with email/password |
| Random users | `src/utils/testDataGenerator.ts` | `generateRandomUsername()`, `generateRandomEmail()` |
| Random articles | `src/utils/testDataGenerator.ts` | `generateRandomArticleTitle()`, `generateRandomArticleBody()` |
| Random tags | `src/utils/testDataGenerator.ts` | `generateRandomTag()`, `generateRandomTags(count)` |
| Session cache | `storage/auth-{userId}.json` | Cached JWT sessions (30-min TTL) |

---

## CI/CD Conventions

- **Workers:** 2 on CI, 4 locally
- **Retries:** 2 on CI, 0 locally
- **Trace:** Off on CI, on-first-retry locally
- **Reporter:** List + HTML (date-stamped folders locally)
- **Screenshots:** Only on failure
- **Timeout:** 60s test, 10s expect, 15s action, 30s navigation
- **App stack:** Docker Compose (`make app-up`) runs Django backend + Angular frontend
- **Env vars:** `BASE_URL`, `BROWSER`, `CI`

---

## ESLint — Playwright Plugin Rules

`eslint-plugin-playwright` is recommended with `plugin:playwright/recommended` enabled. Key rules:

| Rule | Recommended Status | Rationale |
|------|--------|-----------|
| `playwright/no-wait-for-timeout` | enabled | Catches hardcoded waits |
| `playwright/no-force-option` | enabled | Catches force:true |
| `playwright/no-page-pause` | enabled | Catches leftover debug pauses |
| `playwright/no-conditional-in-test` | evaluate | May need to disable if tests use legitimate conditionals |
| `playwright/expect-expect` | evaluate | May give false positives with `test.step()` patterns |
