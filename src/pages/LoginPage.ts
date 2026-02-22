import { Page, Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { TIMEOUTS } from '../utils/timeouts';

export const selectors = {
  container: '.auth-page',
  emailPlaceholder: 'Email',
  passwordPlaceholder: 'Password',
  signInButton: 'Sign in',
  registerLink: 'Need an account?',
};

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private emailInput(): Locator {
    return this.getByPlaceholder(selectors.emailPlaceholder);
  }

  private passwordInput(): Locator {
    return this.getByPlaceholder(selectors.passwordPlaceholder);
  }

  private signInButton(): Locator {
    return this.getByRole('button', { name: selectors.signInButton });
  }

  private errorMessages(): Locator {
    return this.getErrorMessages(selectors.container);
  }

  private registerLink(): Locator {
    return this.getByRole('link', { name: selectors.registerLink });
  }

  // Actions
  async navigate(): Promise<void> {
    await test.step('Navigate to login page', async () => {
      await super.navigate('/login');
    });
  }

  async fillEmail(email: string): Promise<void> {
    await test.step('Fill email field', async () => {
      await this.emailInput().fill(email);
    });
  }

  async fillPassword(password: string): Promise<void> {
    await test.step('Fill password field', async () => {
      await this.passwordInput().fill(password);
    });
  }

  async clickSignIn(): Promise<void> {
    await test.step('Click sign in button', async () => {
      await this.signInButton().click();
    });
  }

  async login(email: string, password: string): Promise<void> {
    await test.step('Login with credentials', async () => {
      await this.fillEmail(email);
      await this.fillPassword(password);
      await this.clickSignIn();
      await this.page.waitForURL(/.*#\/$/, { timeout: TIMEOUTS.MEDIUM });
    });
  }

  async getErrorMessage(): Promise<string> {
    return await test.step('Get error message', async () => {
      await this.errorMessages().waitFor({ state: 'visible' });
      return (await this.errorMessages().textContent()) ?? '';
    });
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await test.step('Check if error message is visible', async () => {
      return this.errorMessages().isVisible();
    });
  }

  async clickRegisterLink(): Promise<void> {
    await test.step('Click register link', async () => {
      await this.registerLink().click();
    });
  }

  // Locator getters for assertions
  getErrorMessagesLocator(): Locator {
    return this.errorMessages();
  }
}
