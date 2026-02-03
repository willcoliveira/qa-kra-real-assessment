import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  private static readonly CONTAINER = '.auth-page';

  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private usernameInput(): Locator {
    return this.getByPlaceholder('Username');
  }

  private emailInput(): Locator {
    return this.getByPlaceholder('Email');
  }

  private passwordInput(): Locator {
    return this.getByPlaceholder('Password');
  }

  private signUpButton(): Locator {
    return this.getByRole('button', { name: 'Sign up' });
  }

  private errorMessages(): Locator {
    return this.getErrorMessages(RegisterPage.CONTAINER);
  }

  private successMessages(): Locator {
    return this.getSuccessMessages(RegisterPage.CONTAINER);
  }

  private loginLink(): Locator {
    return this.getByRole('link', { name: 'Have an account?' });
  }

  // Actions
  async navigate(): Promise<void> {
    await super.navigate('/register');
  }

  async fillUsername(username: string): Promise<void> {
    await this.usernameInput().fill(username);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput().fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput().fill(password);
  }

  async clickSignUp(): Promise<void> {
    await this.signUpButton().click();
  }

  async register(username: string, email: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignUp();
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMessages().waitFor({ state: 'visible' });
    return (await this.errorMessages().textContent()) ?? '';
  }

  async getSuccessMessage(): Promise<string> {
    await this.successMessages().waitFor({ state: 'visible' });
    return (await this.successMessages().textContent()) ?? '';
  }

  async isSuccessMessageVisible(): Promise<boolean> {
    return this.successMessages().isVisible();
  }

  async clickLoginLink(): Promise<void> {
    await this.loginLink().click();
  }
}
