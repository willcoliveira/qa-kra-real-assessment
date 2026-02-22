# Page Object Conventions — qa-kra-real-assessment

## Selector Priority

1. **`page.getByRole()`** — Most resilient, recommended for all interactive elements
2. **`page.getByLabel()`** — For form fields with labels
3. **`page.getByText()`** — For visible text content
4. **`page.getByTestId()`** — For `data-testid` attributes (cross-reference source repo)
5. **`page.locator('css-selector')`** — For CSS-based selection
6. **`page.frameLocator('iframe...')`** — For iframe fields (last resort)

**Never use XPath.**

---

## Page Object Class Structure

```typescript
import type { Page, Locator } from '@playwright/test'

import { test, expect } from '@playwright/test'

export class ExamplePage {
  // Always store page reference
  readonly page: Page

  // Locators as readonly class properties
  readonly pageHeading: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    // Define locators in constructor
    this.pageHeading = page.getByRole('heading', { name: 'Example' })
    this.submitButton = page.getByRole('button', { name: 'Submit' })
    this.errorMessage = page.getByTestId('error-message')
  }

  // Methods wrapped in test.step() for trace reporting
  async submit() {
    await test.step('Submit the form', async () => {
      await this.submitButton.click()
    })
  }

  // Assertion methods prefixed with 'expect'
  async expectPageHeading(options?: { timeout?: number }) {
    await test.step('Verify page heading is visible', async () => {
      await expect(this.pageHeading).toBeVisible(options)
    })
  }
}
```

---

## Component Composition

Shared UI elements are modeled as components and composed into page objects:

```typescript
// Component (src/pages/components/basket.ts)
export class Basket {
  readonly page: Page
  readonly orderTotal: Locator

  constructor(page: Page) {
    this.page = page
    this.orderTotal = page.getByTestId('order-total')
  }
}

// Page using component
export class CheckoutPage {
  readonly basketComponent: Basket
  readonly formComponent: CheckoutForm

  constructor(page: Page) {
    this.basketComponent = new Basket(page)
    this.formComponent = new CheckoutForm(page)
  }
}
```

This project uses inheritance (BasePage) instead of composition. All pages extend `BasePage` which provides shared helpers:

| Helper Method | Description |
|---------------|-------------|
| `navigate(path)` | Hash-based navigation (`#/path`) |
| `waitForPageLoad()` | Waits for `domcontentloaded` |
| `waitForUrl(pattern)` | Waits for URL match |
| `getByPlaceholder(text)` | Shorthand for `page.getByPlaceholder()` |
| `getByRole(role, opts)` | Shorthand for `page.getByRole()` |
| `getFormControl(name)` | Selects Angular `[formcontrolname="name"]` elements |
| `getErrorMessages()` | Selects `.error-messages` container |
| `getSuccessMessages()` | Selects `.success-messages` container |

---

## Page Factory Pattern

Use a factory function to lazily instantiate page objects in tests:

```typescript

// Simple factory pattern
function createTestPages(page: Page) {
  return {
    get homePage() { return new HomePage(page) },
    get loginPage() { return new LoginPage(page) },
    get checkoutPage() { return new CheckoutPage(page) },
  }
}

```

This project uses a **custom fixture** instead of a factory function. All page objects are provided via `test.fixture.ts`:

| Fixture | Page Object | Route |
|---------|-------------|-------|
| `loginPage` | `LoginPage` | `#/login` |
| `registerPage` | `RegisterPage` | `#/register` |
| `homePage` | `HomePage` | `#/` |
| `editorPage` | `EditorPage` | `#/editor` |
| `articlePage` | `ArticlePage` | `#/article/{slug}` |
| `profilePage` | `ProfilePage` | `#/profile/{username}` |
| `settingsPage` | `SettingsPage` | `#/settings` |
| `config` | `Config` | N/A (YAML config object) |

---

## Iframe Handling

If your application uses iframes (e.g. payment widgets, embedded forms), use `frameLocator`:

```typescript
// Accessing elements inside an iframe
readonly paymentFrame: FrameLocator
readonly cardNumberField: Locator

constructor(page: Page) {
  this.paymentFrame = page.frameLocator('iframe[title="Payment form"]')
  this.cardNumberField = this.paymentFrame.locator('input[data-fieldtype="cardNumber"]')
}
```

This project does not use iframes. The RealWorld app is a single-page Angular application.

---

## Method Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `goto(url)` | `homePage.goto('/products')` | Navigate to a page |
| `expectXxx()` | `checkoutPage.expectOrderConfirmed()` | Assertions |
| `selectXxx()` | `productPage.selectSize('Large')` | User selections |
| `enterXxx()` | `loginPage.enterEmail('user@test.com')` | Form input |
| `clickXxx()` | `cartPage.clickCheckout()` | Button clicks |
| `waitForXxx()` | `resultsPage.waitForResults()` | Wait for state |

---

## Naming Conventions

- **Page files:** `{PageName}.ts` (PascalCase, in `src/pages/`) — e.g. `LoginPage.ts`, `ArticlePage.ts`
- **Base page:** `BasePage.ts` (in `src/pages/`)
- **Test files:** `{feature}.spec.ts` (in `tests/`) — e.g. `auth.spec.ts`, `article.spec.ts`
- **Fixture file:** `test.fixture.ts` (in `src/fixtures/`)
- **Utils:** `{name}.ts` (in `src/utils/`) — e.g. `auth.helper.ts`, `testDataGenerator.ts`
- **Config:** `config.ts` (in `src/config/`) + `settings.yaml` (in `config/`)
