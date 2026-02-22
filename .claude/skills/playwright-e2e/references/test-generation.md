# Test Generation Skill — qa-kra-real-assessment

## File Structure

```
tests/                             # Test specs ({feature}.spec.ts)
src/pages/                         # Page objects (PascalCase: LoginPage.ts)
src/fixtures/test.fixture.ts       # Custom fixture (provides all page objects + config)
src/utils/auth.helper.ts           # Session management (ensureAuthenticated)
src/utils/testDataGenerator.ts     # Random data generators
src/config/config.ts               # YAML config loader
config/settings.yaml               # Test accounts, URLs, settings
```

---

## Test Spec Template

```typescript
import { test, expect } from '../src/fixtures/test.fixture'
import { ensureAuthenticated } from '../src/utils/auth.helper'
import { generateRandomUsername, generateRandomEmail } from '../src/utils/testDataGenerator'

test.describe('Feature Name', { tag: ['@feature'] }, () => {
  let testEmail: string
  let testPassword: string

  test.beforeAll(async ({ browser }) => {
    // Register a fresh test user
    const context = await browser.newContext()
    const page = await context.newPage()
    const { RegisterPage } = await import('../src/pages/RegisterPage')
    const registerPage = new RegisterPage(page)

    testEmail = generateRandomEmail('feature')
    testPassword = 'Test@123456'
    await registerPage.navigate()
    await registerPage.register(generateRandomUsername('feature'), testEmail, testPassword)
    await page.waitForURL(/.*#\/login/, { timeout: 10000 })
    await context.close()
  })

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, testEmail, testPassword, 'feature-user')
  })

  test('should complete the user journey', async ({ page, homePage }) => {
    await homePage.navigate()
    await homePage.waitForArticlesLoaded()
    await expect(page.getByText('Global Feed')).toBeVisible()
  })
})
```

---

## Critical Import Rules

### Import from custom fixture (NEVER from `@playwright/test`)

```typescript
import { test, expect } from '../src/fixtures/test.fixture'
import { ensureAuthenticated } from '../src/utils/auth.helper'
import { generateRandomUsername, generateRandomEmail } from '../src/utils/testDataGenerator'
```

---

## Page Object Conventions

### Class Structure

```typescript
import type { Page, Locator } from '@playwright/test'

import { test } from '@playwright/test'

export class ExamplePage {
  readonly page: Page
  readonly heading: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Example' })
    this.submitButton = page.getByRole('button', { name: 'Submit' })
  }

  async goto(path: string) {
    await test.step(`Navigate to ${path}`, async () => {
      await this.page.goto(path)
    })
  }

  async submit() {
    await test.step('Submit the form', async () => {
      await this.submitButton.click()
    })
  }
}
```

### Selector Priority

1. `page.getByRole()` — Most resilient, recommended
2. `page.getByLabel()` — For form fields
3. `page.getByText()` — For visible text
4. `page.getByTestId()` — For `data-testid` attributes
5. `page.locator('css')` — For CSS selectors (last resort)

### Component Composition

Pages contain component instances:

```typescript
export class CheckoutPage {
  readonly header: Header
  readonly cart: Cart

  constructor(page: Page) {
    this.header = new Header(page)
    this.cart = new Cart(page)
  }
}
```

---

## Page Factory

Page objects are provided via the custom fixture — destructure them in the test signature:

```typescript
test('should do something', async ({
  page,
  loginPage,
  homePage,
  editorPage,
  articlePage,
  profilePage,
  settingsPage,
  config,
}) => {
  // Pages are already instantiated, no factory needed
  await editorPage.navigate()
})
```

For authenticated tests, call `ensureAuthenticated()` in `beforeEach`:

```typescript
test.beforeEach(async ({ page }) => {
  await ensureAuthenticated(page, testEmail, testPassword, 'user-id')
})
```

---

## Form Filling Patterns

For reliable form input, especially in iframes or dynamic forms:

```typescript
// Standard fill
await page.getByLabel('Email').fill('user@example.com')

// For fields that need sequential typing (e.g. masked inputs)
await page.getByLabel('Phone').pressSequentially('5551234567')

// For unreliable fields, use a fill-and-verify pattern:
async function fillAndVerify(locator: Locator, value: string, fieldName: string) {
  await locator.fill(value)
  await expect(locator).toHaveValue(value, { timeout: 5_000 })
}
```

---

## Fixture-Provided Values

| Fixture | Type | Scope | Description |
|---------|------|-------|-------------|
| `page` | `Page` | test | Browser page (built-in) |
| `browser` | `Browser` | worker | Browser instance (built-in) |
| `loginPage` | `LoginPage` | test | Login form interactions |
| `registerPage` | `RegisterPage` | test | Registration form interactions |
| `homePage` | `HomePage` | test | Home feed, global/your feed, tags |
| `editorPage` | `EditorPage` | test | Article editor (create/edit) |
| `articlePage` | `ArticlePage` | test | Article view, comments, delete |
| `profilePage` | `ProfilePage` | test | User profile, My Articles, Favorited |
| `settingsPage` | `SettingsPage` | test | User settings, logout |
| `config` | `Config` | test | YAML config (accounts, URLs, settings) |

---

## Tags Reference

| Tag | Scope | Used In |
|-----|-------|---------|
| `@auth` | Authentication tests (login, register, logout) | `unauthenticated` project |
| `@articles` | Article CRUD (create, edit, delete, validation) | `authenticated` project |
| `@comments` | Comment interactions | `authenticated` project |
| `@feed` | Follow/feed functionality | `authenticated` project |
| `@tags` | Tags feature | `authenticated` project |
