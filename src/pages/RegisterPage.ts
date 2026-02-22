import { Page, Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';

export const selectors = {
  container: '.auth-page',
  usernamePlaceholder: 'Username',
  emailPlaceholder: 'Email',
  passwordPlaceholder: 'Password',
  signUpButton: 'Sign up',
  loginLink: 'Have an account?',
};

export class RegisterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private usernameInput(): Locator {
    return this.getByPlaceholder(selectors.usernamePlaceholder);
  }

  private emailInput(): Locator {
    return this.getByPlaceholder(selectors.emailPlaceholder);
  }

  private passwordInput(): Locator {
    return this.getByPlaceholder(selectors.passwordPlaceholder);
  }

  private signUpButton(): Locator {
    return this.getByRole('button', { name: selectors.signUpButton });
  }

  private errorMessages(): Locator {
    return this.getErrorMessages(selectors.container);
  }

  private successMessages(): Locator {
    return this.getSuccessMessages(selectors.container);
  }

  private loginLink(): Locator {
    return this.getByRole('link', { name: selectors.loginLink });
  }

  // Actions
  async navigate(): Promise<void> {
    await test.step('Navigate to register page', async () => {
      await super.navigate('/register');
    });
  }

  async fillUsername(username: string): Promise<void> {
    await test.step('Fill username field', async () => {
      await this.usernameInput().fill(username);
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

  async clickSignUp(): Promise<void> {
    await test.step('Click sign up button', async () => {
      await this.signUpButton().click();
    });
  }

  async register(username: string, email: string, password: string): Promise<void> {
    await test.step('Register new user', async () => {
      await this.fillUsername(username);
      await this.fillEmail(email);
      await this.fillPassword(password);
      await this.clickSignUp();
    });
  }

  async getErrorMessage(): Promise<string> {
    return await test.step('Get error message', async () => {
      await this.errorMessages().waitFor({ state: 'visible' });
      return (await this.errorMessages().textContent()) ?? '';
    });
  }

  async getSuccessMessage(): Promise<string> {
    return await test.step('Get success message', async () => {
      await this.successMessages().waitFor({ state: 'visible' });
      return (await this.successMessages().textContent()) ?? '';
    });
  }

  async isSuccessMessageVisible(): Promise<boolean> {
    return await test.step('Check if success message is visible', async () => {
      return this.successMessages().isVisible();
    });
  }

  async clickLoginLink(): Promise<void> {
    await test.step('Click login link', async () => {
      await this.loginLink().click();
    });
  }

  // Locator getters for assertions
  getSuccessMessagesLocator(): Locator {
    return this.successMessages();
  }

  getErrorMessagesLocator(): Locator {
    return this.errorMessages();
  }
}
