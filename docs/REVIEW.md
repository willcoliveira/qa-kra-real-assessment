# QA KRA Real Assessment - Technical Review

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Tech Stack](#2-tech-stack)
- [3. Architecture & Design Decisions](#3-architecture--design-decisions)
  - [3.1 Why Playwright](#31-why-playwright)
  - [3.2 Page Object Model](#32-page-object-model)
  - [3.3 Custom Fixtures](#33-custom-fixtures)
  - [3.4 Authentication Strategy](#34-authentication-strategy)
  - [3.5 Test Data Generation](#35-test-data-generation)
  - [3.6 Configuration System](#36-configuration-system)
  - [3.7 Two-Project Test Separation](#37-two-project-test-separation)
  - [3.8 Test Tagging & Selective Execution](#38-test-tagging--selective-execution)
  - [3.9 Bug Handling Strategy](#39-bug-handling-strategy)
  - [3.10 CI/CD Pipeline](#310-cicd-pipeline)
  - [3.11 Code Quality Tooling](#311-code-quality-tooling)
  - [3.12 Developer Experience (Makefile)](#312-developer-experience-makefile)
- [4. Test Coverage Summary](#4-test-coverage-summary)
- [5. Trade-offs Made](#5-trade-offs-made)
- [6. Critical Review: What Could Be Done Better](#6-critical-review-what-could-be-done-better)
  - [6.1 P0 - No API Layer for Test Setup/Teardown](#61-p0---no-api-layer-for-test-setupteardown)
  - [6.2 P0 - Hardcoded Sleeps (waitForTimeout)](#62-p0---hardcoded-sleeps-waitfortimeout)
  - [6.3 P1 - No Test Data Cleanup](#63-p1---no-test-data-cleanup)
  - [6.4 P1 - Test Interdependency in follow-feed](#64-p1---test-interdependency-in-follow-feed)
  - [6.5 P2 - Unused Config Accounts](#65-p2---unused-config-accounts)
  - [6.6 P2 - Inline Page Object Instantiation Breaks Fixture Pattern](#66-p2---inline-page-object-instantiation-breaks-fixture-pattern)
  - [6.7 P2 - Missing Network-Level Assertions](#67-p2---missing-network-level-assertions)
  - [6.8 P2 - No Retry Logic in Session Restoration](#68-p2---no-retry-logic-in-session-restoration)
  - [6.9 P3 - Reporter Configuration Could Be Richer](#69-p3---reporter-configuration-could-be-richer)
  - [6.10 P3 - No Accessibility or Performance Testing](#610-p3---no-accessibility-or-performance-testing)
- [7. Improvement Priority Matrix](#7-improvement-priority-matrix)

---

## 1. Project Overview

This is an end-to-end test automation framework built with **Playwright + TypeScript** targeting a **RealWorld** application (Angular frontend + Django REST API backend). The application under test is a Medium-like blogging platform (conduit clone) with articles, comments, tags, user profiles, and follow/feed features.

The AUT runs via Docker Compose as a git submodule (`realworld-django-rest-framework-angular/`), keeping the test framework and the application fully decoupled.

### Project Structure

```
qa-kra-real-assessment/
├── .github/workflows/tests.yml          # CI/CD pipeline
├── config/settings.yaml                  # Test configuration (URLs, accounts)
├── docs/
│   ├── BUGS.md                           # Documented bug findings (7 bugs)
│   └── REVIEW.md                         # This document
├── src/
│   ├── config/config.ts                  # YAML config loader with env overrides
│   ├── pages/                            # Page Object Model
│   │   ├── BasePage.ts                   # Abstract base with shared helpers
│   │   ├── LoginPage.ts
│   │   ├── RegisterPage.ts
│   │   ├── HomePage.ts
│   │   ├── EditorPage.ts
│   │   ├── ArticlePage.ts
│   │   ├── ProfilePage.ts
│   │   └── SettingsPage.ts
│   ├── fixtures/test.fixture.ts          # Custom Playwright fixtures (DI layer)
│   └── utils/
│       ├── auth.helper.ts                # Session caching & management
│       └── testDataGenerator.ts          # Random test data factories
├── tests/                                # Test specifications (29 tests)
│   ├── auth.spec.ts                      # 7 tests  - register, login, logout
│   ├── article.spec.ts                   # 15 tests - CRUD + form validation
│   ├── comments.spec.ts                  # 3 tests  - add, delete, multiple
│   ├── follow-feed.spec.ts              # 3 tests  - follow, feed, unfollow
│   └── tags.spec.ts                      # 4 tests  - filter, display, navigation
├── playwright.config.ts                  # Playwright settings (projects, reporters)
├── Dockerfile                            # Test container image
├── Makefile                              # Developer workflow shortcuts
├── tsconfig.json                         # TypeScript with path aliases
├── .eslintrc.json                        # ESLint + playwright plugin
└── .prettierrc                           # Code formatting rules
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Test Framework | @playwright/test | 1.50.0 |
| Language | TypeScript | 5.3.3 |
| Runtime | Node.js | 20 (pinned via .nvmrc) |
| Config Parser | yaml | 2.3.4 |
| Linting | ESLint + @typescript-eslint + eslint-plugin-playwright | 8.57.0 |
| Formatting | Prettier | 3.2.5 |
| Containerization | Docker (Playwright base image v1.58.1-jammy) | - |
| CI/CD | GitHub Actions | - |

---

## 3. Architecture & Design Decisions

### 3.1 Why Playwright

Playwright was chosen over Cypress or Selenium for specific technical reasons visible in the codebase:

- **Native `storageState` support** - Used in `auth.helper.ts` for session caching (`page.context().storageState({ path })`)
- **Multi-browser from a single API** - `playwright.config.ts:3` switches browsers via `BROWSER` env var without code changes
- **Built-in parallelism** - `fullyParallel: true` with configurable workers (4 local, 2 CI)
- **Project-based test separation** - Two projects (`authenticated`/`unauthenticated`) at `playwright.config.ts:40-49`
- **First-class TypeScript** - No transpilation plugins, native support

### 3.2 Page Object Model

The framework uses a **classical POM with inheritance**, not composition.

**BasePage** (`src/pages/BasePage.ts`) provides:
- `navigate(path)` with hash-routing awareness - auto-prepends `#` because the Angular app uses hash-based routing (line 7)
- Protected locator factory methods (`getByPlaceholder`, `getByRole`, `getByText`, `getFormControl`) wrapping Playwright's built-in locators through the base class
- Reusable error/success message locators with optional container scoping (lines 43-55)

**Key design patterns in page objects:**

1. **Exported selectors constant** (e.g., `EditorPage.ts:4-14`) - Selectors are externalized as plain objects, separate from the class, enabling reuse outside the page object

2. **Dual API surface** - Private methods return `Locator` for internal use, while public `getPublishButtonLocator()` re-exposes them for test assertions. This allows `await expect(editorPage.getPublishButtonLocator()).toBeDisabled()` without needing dedicated boolean methods for every assertion state

3. **Composite actions** - `createArticle()` (`EditorPage.ts:90`) orchestrates fill + tag + publish in one call

4. **`protected` access on base helpers** - Child pages inherit locator helpers but don't expose raw `page` to tests. However, `page` is still available via fixtures for one-off assertions. This is a pragmatic compromise over pure encapsulation.

### 3.3 Custom Fixtures

`src/fixtures/test.fixture.ts` is the dependency injection layer. Instead of each test instantiating page objects manually, they declare what they need:

```typescript
test('should create article', async ({ editorPage, profilePage, config }) => { ... });
```

Every test gets fresh page object instances (per-test, not shared). The `config` fixture loads YAML once and caches. Both `test` and `expect` are re-exported from this fixture file, creating a single control point for the test runner. Every spec imports from `'../src/fixtures/test.fixture'` rather than `'@playwright/test'` directly.

### 3.4 Authentication Strategy

`src/utils/auth.helper.ts` implements a session caching layer:

1. `ensureAuthenticated(page, email, password, userId)` is called in `beforeEach` hooks
2. Checks for a cached session file at `storage/auth-{userId}.json`
3. File must be less than 30 minutes old (`SESSION_MAX_AGE_MS`)
4. Validates the cached session contains a valid JWT token in localStorage (lines 76-84)
5. If valid: loads session by navigating to `/`, setting localStorage via `page.evaluate()`, and reloading
6. If invalid/expired: performs full login via LoginPage and saves new session via `page.context().storageState()`

**Why not use Playwright's built-in `storageState` project dependency?** Because follow/feed tests need two different users (`userId: 'follow-user'` vs `'article-user'`). The standard pattern assumes one authenticated state per project. The custom approach supports N users with independent session lifecycles.

`clearStorageState()` is used in `follow-feed.spec.ts:78` to force fresh login for tests needing clean state.

### 3.5 Test Data Generation

`src/utils/testDataGenerator.ts` produces random but identifiable data:

- Every function takes an optional `prefix`: `generateRandomUsername('follower')` produces `follower-a8x2k9p1`
- Data is self-documenting in logs and screenshots - you can trace which test created what
- Random suffixes prevent collisions across parallel workers

Tests create their own users in `beforeAll` hooks rather than using pre-seeded accounts. Each spec file operates on its own user for full isolation during parallel execution.

### 3.6 Configuration System

Three layers:

1. **`config/settings.yaml`** - Base config (URLs, test accounts, timeouts)
2. **`playwright.config.ts`** - Framework settings (workers, retries, reporters)
3. **Environment variables** - Override layer (`BASE_URL`, `API_URL`, `BROWSER`, `CI`)

The `config.ts` loader caches parsed YAML (`configCache`) so repeated `loadConfig()` calls don't re-read the file. Environment variables override YAML values for CI flexibility.

### 3.7 Two-Project Test Separation

`playwright.config.ts:40-49`:
- **`authenticated`** project: runs everything EXCEPT `auth.spec.ts`
- **`unauthenticated`** project: runs ONLY `auth.spec.ts`

Auth tests (register, login, logout) cannot assume a logged-in state, while all other tests start authenticated. Separation at the project level avoids mixing auth setup logic.

### 3.8 Test Tagging & Selective Execution

Each `test.describe` uses Playwright's `tag` option (`{ tag: ['@articles'] }`, etc.) mapped to npm scripts:

```
npm run test:auth     → playwright test --grep @auth
npm run test:articles → playwright test --grep @articles
npm run test:comments → playwright test --grep @comments
npm run test:feed     → playwright test --grep @feed
npm run test:tags     → playwright test --grep @tags
```

### 3.9 Bug Handling Strategy

Seven bugs were discovered and documented in `docs/BUGS.md`. Tests work around them rather than skipping:

- **BUG-002** (`article.spec.ts:289-313`): Explicitly asserts the buggy behavior (`[object Object]`) as a regression anchor. When fixed, the test fails, signaling the developer to update the assertion.
- **BUG-001** (`tags.spec.ts`): Uses existing popular tags from the sidebar instead of newly created tags.
- **BUG-005** (`article.spec.ts`): Navigates to profile page manually after publish instead of relying on auto-redirect.
- **BUG-007** (`ArticlePage.ts:136-145`): Reloads the page after posting a comment to ensure it appears.

Each workaround is commented with the bug reference.

### 3.10 CI/CD Pipeline

`.github/workflows/tests.yml`:

1. Starts the application via `docker compose up -d` with 30s startup sleep
2. Caches Playwright browsers by `package-lock.json` hash (~300MB saved per run)
3. Runs full suite with `npm test`
4. Uploads HTML report as artifact (7-day retention)
5. Tears down via `docker compose down` in `if: always()` block
6. Concurrency control (`cancel-in-progress: true`) prevents stale runs

CI-specific config differences: 2 workers (vs 4), 2 retries (vs 0), traces off (vs on-first-retry), flat report directory (vs date-stamped).

### 3.11 Code Quality Tooling

- **ESLint** with `eslint-plugin-playwright`: `no-focused-tests` (error), `no-skipped-tests` (warn). Warn for skips is intentional - notice them without breaking CI for known bugs.
- **Prettier**: 100-char line width, single quotes, trailing commas.
- **`.nvmrc`** pinning Node 20.

### 3.12 Developer Experience (Makefile)

Complete workflow abstraction:
- `make run-all` - start app, run tests, open report
- `make docker-test` - run tests in Docker (matching CI)
- `make clean-all` - tear down everything
- `make test-auth`, `make test-articles`, etc. - selective suite execution

---

## 4. Test Coverage Summary

| Suite | Tests | Coverage Area |
|-------|-------|---------------|
| `auth.spec.ts` | 7 | Register (success + duplicate), Login (valid/invalid/non-existent), Logout |
| `article.spec.ts` | 15 | Create, Read, Edit, Delete, Empty state, 8 form validation scenarios |
| `comments.spec.ts` | 3 | Add comment, Delete comment, Display multiple comments |
| `follow-feed.spec.ts` | 3 | Follow user, Verify feed, Unfollow user |
| `tags.spec.ts` | 4 | Filter by tag, Verify filtered content, Display tags, Return to global feed |
| **Total** | **29** | |

---

## 5. Trade-offs Made

| Decision | Rationale | Alternative Considered |
|----------|-----------|----------------------|
| File-based session caching over Playwright's global setup | Multi-user support needed for follow/feed tests | Global setup is simpler but limits to one user |
| `beforeAll` user registration per spec | Full test isolation, no shared state | Pre-seeded DB is faster but fragile |
| `waitForTimeout` in some tests | Workaround for BUG-007 and async UI issues | `waitForSelector`/`waitForResponse` is better but app doesn't always provide reliable indicators |
| Hash-routing awareness in BasePage | App uses Angular hash routing (`/#/`) | Could hardcode, but `navigate()` with auto-prefix is cleaner |
| Asserting buggy behavior (BUG-002) | Regression anchor + documentation | `test.skip()` hides the test entirely |
| Pure E2E approach (no API setup) | Tests exercise the real user flow | API setup would be faster and more reliable |
| YAML config over `.env` | Structured data (nested accounts, settings) | `.env` is simpler but flat |
| Separate `unauthenticated` project | Clean separation of auth vs feature tests | Conditional `beforeEach` would be messier |

---

## 6. Critical Review: What Could Be Done Better

### 6.1 P0 - No API Layer for Test Setup/Teardown

**This is the single biggest architectural gap. It cascades into almost every other problem.**

#### The Problem

Every spec file uses UI interactions for test preconditions (user registration, article creation, login). This is code that is **not what the test is actually testing**.

`follow-feed.spec.ts:24-75` has a 50-line `beforeAll` that does 12 UI navigation steps just to create 2 users and 1 article. `tags.spec.ts:31-96` has a 66-line `beforeAll` to register a user, login, and create 2 articles with verification.

Total across all spec files: **~150 lines of UI-based setup** doing things that could be API calls.

#### The Impact

**Flakiness multiplication.** Each UI step is a potential flake point. `follow-feed.spec.ts` has ~12 navigation/wait steps in `beforeAll`. If each has a 1% flake chance, there's an ~11% chance setup fails before any test runs.

**Debugging noise.** When `comments.spec.ts` fails, is it the comment feature or the registration page that broke? With UI setup, you can't tell from the test name alone.

**Bypassed fixture system.** `beforeAll` hooks manually instantiate page objects:

```typescript
// follow-feed.spec.ts:28-68 (bypasses fixture system)
const registerPage = new RegisterPage(page);
const loginPage = new LoginPage(page);
const editorPage = new EditorPage(page);
const profilePage = new ProfilePage(page);
```

**Dynamic imports as workaround.** `article.spec.ts:230-237` uses `await import(...)` because tests that spin up their own `browser.newContext()` can't use fixtures.

**Execution time.** A UI register takes ~3-5 seconds vs ~100ms via API. Multiplied across 4 spec files with parallel execution, this adds ~15-30 seconds to every run.

#### The Missed Signal

`config/settings.yaml:2` defines `apiUrl: "http://localhost:8000/api"` but it is **never used anywhere in the codebase**. The URL is loaded, exported through the config system, and completely unused. This suggests it was planned but never implemented.

#### What It Should Look Like

```typescript
// src/utils/api.helper.ts
class ApiHelper {
  constructor(private baseUrl: string) {}

  async createUser(data: { username, email, password }): Promise<UserResponse>
  // POST /api/users

  async login(email, password): Promise<{ token: string }>
  // POST /api/users/login

  async createArticle(token, data): Promise<ArticleResponse>
  // POST /api/articles

  async createComment(token, slug, body): Promise<CommentResponse>
  // POST /api/articles/:slug/comments

  async followUser(token, username): Promise<void>
  // POST /api/profiles/:username/follow

  async deleteArticle(token, slug): Promise<void>
  // DELETE /api/articles/:slug
}
```

This would reduce `follow-feed.spec.ts` setup from 50 lines to ~6:

```typescript
test.beforeAll(async () => {
  const userA = await api.createUser({ prefix: 'follower' });
  const userB = await api.createUser({ prefix: 'followed' });
  const tokenB = await api.login(userB.email, userB.password);
  userBArticle = await api.createArticle(tokenB, {
    title: generateRandomArticleTitle('UserB'),
  });
});
```

---

### 6.2 P0 - Hardcoded Sleeps (waitForTimeout)

There are **9 instances** of `waitForTimeout` across test files:

| File | Line | Duration | Purpose |
|------|------|----------|---------|
| `article.spec.ts` | 137 | 1000ms | Wait for editor form to populate |
| `comments.spec.ts` | 101 | 1000ms | Wait for comment to appear |
| `comments.spec.ts` | 111 | 1000ms | Wait for deletion to process |
| `comments.spec.ts` | 148 | 500ms | Between posting comments |
| `comments.spec.ts` | 150 | 500ms | Between posting comments |
| `comments.spec.ts` | 152 | 1000ms | After last comment |
| `follow-feed.spec.ts` | 130 | 1000ms | After navigation |
| `follow-feed.spec.ts` | 134 | 2000ms | After clicking feed tab |
| `follow-feed.spec.ts` | 166-168 | 3000ms | Same pattern repeated |

**Total hardcoded sleep: ~11 seconds per full run.**

Some are BUG-007 workarounds (comments), but others have better alternatives:

```typescript
// follow-feed.spec.ts - CURRENT (2s sleep)
await homePage.clickMyFeed();
await page.waitForTimeout(2000);

// BETTER - wait for actual API response
await homePage.clickMyFeed();
await page.waitForResponse('**/api/articles/feed**');

// article.spec.ts:137 - CURRENT (1s sleep for form population)
await page.waitForTimeout(1000);

// BETTER - wait for actual content
await expect(editorPage.getTitleLocator()).not.toHaveValue('');
```

Note: `waitForArticlesLoaded()` already exists in `HomePage.ts:114-122` but isn't used consistently. Follow-feed tests use timeout waits instead.

---

### 6.3 P1 - No Test Data Cleanup

Tests create users, articles, and comments but **never clean them up**. There is no `afterAll` or `afterEach` teardown anywhere.

**Consequences:**
- Database accumulates garbage across runs
- Running the suite repeatedly against the same environment floods the Global Feed
- Tag tests become less reliable as more articles appear (pagination hides expected results)
- The "delete article" test verifies the article isn't in the global feed, but with hundreds of articles from previous runs it might not be on the first page anyway

**With an API helper, cleanup is straightforward:**

```typescript
test.afterAll(async () => {
  await api.deleteArticle(token, articleSlug);
});
```

---

### 6.4 P1 - Test Interdependency in follow-feed

The three tests in `follow-feed.spec.ts` have a hidden sequential dependency:

1. `should be able to follow another user` - follows User B
2. `should see followed user's article in Your Feed` - assumes follow from test 1
3. `should be able to unfollow a user` - assumes follow state exists

Tests 2 and 3 have defensive checks:

```typescript
if (await followButton.isVisible()) {
  await profilePage.clickFollow();
}
```

This **masks failures** - if the follow action is broken, test 2 silently re-follows and passes. You never know if test 1 actually worked.

**Root cause:** `beforeEach` calls `clearStorageState('follow-user')` which clears the browser session, but doesn't clear the follow state on the server. Tests are half-isolated (fresh session) but half-coupled (server-side state persists).

**Fix with API helper:**

```typescript
test('should see followed user article in Your Feed', async ({ page, homePage }) => {
  await api.followUser(tokenA, userBUsername);  // explicit precondition
  // ...test only asserts the feed behavior
});
```

---

### 6.5 P2 - Unused Config Accounts

`settings.yaml` defines `userA` and `userB` with hardcoded credentials. Looking at actual usage:

- `auth.spec.ts:15` uses `config.accounts.userA.password` only as a password string reference
- **No other test uses `config.accounts` at all**

Every test creates its own users with `generateRandomUsername()`. The predefined accounts are dead configuration that confuses new developers into thinking tests depend on these accounts existing in the database.

**Recommendation:** Either remove the unused accounts or wire them into an API-based setup where pre-existing accounts serve as the foundation for test data.

---

### 6.6 P2 - Inline Page Object Instantiation Breaks Fixture Pattern

The `Empty State` test (`article.spec.ts:210-246`) opens a new browser context and manually creates page objects:

```typescript
const registerPage = new RegisterPage(page);
const { LoginPage } = await import('../src/pages/LoginPage');
const loginPage = new LoginPage(page);
const { ProfilePage } = await import('../src/pages/ProfilePage');
const newProfilePage = new ProfilePage(page);
```

This breaks the abstraction the fixture system provides and uses **dynamic imports** (`await import(...)`) which is unusual for Playwright tests.

**Better approach - custom fixture:**

```typescript
// In test.fixture.ts
freshUser: async ({ browser }, use) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const user = await api.createUser({ prefix: 'fresh' });
  await use({ page, user, context });
  await context.close();
},
```

---

### 6.7 P2 - Missing Network-Level Assertions

Tests only assert on UI state (visible text, DOM elements). There's no interception of API requests/responses. Playwright's `page.route()` and `page.waitForResponse()` could:

- Verify correct API endpoints were called (e.g., POST to `/api/articles` on publish)
- Assert response status codes (201 for create, 200 for update)
- Catch cases where UI shows success but API returned an error
- Replace several `waitForTimeout` calls with `waitForResponse`

**Example for the delete article test:**

```typescript
const deleteResponse = page.waitForResponse('**/api/articles/**');
await articlePage.clickDelete();
const response = await deleteResponse;
expect(response.status()).toBe(204);
```

---

### 6.8 P2 - No Retry Logic in Session Restoration

`auth.helper.ts:27-47` loads a cached session by setting localStorage and reloading, but **never verifies the session is valid server-side**. If the JWT expired on the backend (independent of the 30-minute file TTL), the file passes `isStorageStateValid()` (it contains a token string) but the app shows a logged-out state.

**More robust approach:**

```typescript
await page.reload();
try {
  await page.waitForSelector('[href="#/settings"]', { timeout: 5000 });
} catch {
  // Session invalid server-side - force re-login
  fs.unlinkSync(storagePath);
  return ensureAuthenticated(page, email, password, userId);
}
```

---

### 6.9 P3 - Reporter Configuration Could Be Richer

The framework uses `list` + `html` reporters only. Additions for a mature CI pipeline:

- **`junit` reporter** - Most CI systems (Jenkins, GitLab, Azure DevOps) parse JUnit XML for test trend dashboards
- **`blob` reporter** - Playwright's merge-friendly format for sharded CI runs
- **`github` reporter** - Integrates directly with the GitHub PR checks tab (already using GitHub Actions)

---

### 6.10 P3 - No Accessibility or Performance Testing

The framework tests functionality but captures nothing about:

- **Accessibility** - Could integrate `@axe-core/playwright` for a11y scanning during existing test runs (zero extra navigation cost, just add checks after page loads in page objects)
- **Performance baselines** - No capture of page load times or API response times, even though tests already navigate every page

---

## 7. Improvement Priority Matrix

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| **P0** | Add API helper for setup/teardown | Cuts test time ~60%, eliminates setup flakiness, simplifies every spec file (~150 lines removed) | Medium - build `ApiHelper` class, refactor all `beforeAll` hooks |
| **P0** | Replace `waitForTimeout` with proper waits | Removes ~11s of hardcoded sleeps, reduces flakiness | Low - replace 9 instances with `waitForResponse`/`waitForSelector` |
| **P1** | Add test data cleanup (afterAll/afterEach) | Prevents DB bloat, improves reliability over repeated runs | Low - add `afterAll` hooks using API helper |
| **P1** | Fix test interdependency in follow-feed | Tests become truly independent, no masked failures | Low - use API to set preconditions per test |
| **P2** | Remove or use config accounts | Reduces confusion for new developers | Trivial |
| **P2** | Fix inline page object instantiation | Consistent fixture usage across all tests | Low - create custom fixtures for multi-context tests |
| **P2** | Add network-level assertions | Stronger assertions, better debugging, fewer timeout waits | Medium - add `waitForResponse` patterns |
| **P2** | Add session restoration verification | Prevents silent auth failures | Low - add post-reload check |
| **P3** | Add JUnit/GitHub reporters | Better CI integration and test dashboards | Trivial - config change |
| **P3** | Add accessibility checks | High value at low cost during existing test runs | Low - add axe-core dependency + checks |
