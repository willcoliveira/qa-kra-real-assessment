import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private static readonly CONTAINER = '.auth-page';

  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private emailInput(): Locator {
    return this.getByPlaceholder('Email');
  }

  private passwordInput(): Locator {
    return this.getByPlaceholder('Password');
  }

  private signInButton(): Locator {
    return this.getByRole('button', { name: 'Sign in' });
  }

  private errorMessages(): Locator {
    return this.getErrorMessages(LoginPage.CONTAINER);
  }

  private registerLink(): Locator {
    return this.getByRole('link', { name: 'Need an account?' });
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
