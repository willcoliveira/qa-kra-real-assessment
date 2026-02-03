import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

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
    await super.navigate('/login');
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput().fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput().fill(password);
  }

  async clickSignIn(): Promise<void> {
    await this.signInButton().click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
    await this.page.waitForURL(/.*#\/$/, { timeout: 10000 });
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMessages().waitFor({ state: 'visible' });
    return (await this.errorMessages().textContent()) ?? '';
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return this.errorMessages().isVisible();
  }

  async clickRegisterLink(): Promise<void> {
    await this.registerLink().click();
  }
}
