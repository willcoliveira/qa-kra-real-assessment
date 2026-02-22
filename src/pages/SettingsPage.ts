import { Page, Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { TIMEOUTS } from '../utils/timeouts';

export const selectors = {
  container: '.settings-page',
  profileImagePlaceholder: 'URL of profile picture',
  usernamePlaceholder: 'Username',
  bioPlaceholder: 'Short bio about you',
  emailPlaceholder: 'Email',
  passwordPlaceholder: 'New Password',
  updateButton: 'Update Settings',
  logoutButton: 'Or click here to logout.',
};

export class SettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private profileImageInput(): Locator {
    return this.getByPlaceholder(selectors.profileImagePlaceholder);
  }

  private usernameInput(): Locator {
    return this.getByPlaceholder(selectors.usernamePlaceholder);
  }

  private bioTextarea(): Locator {
    return this.getByPlaceholder(selectors.bioPlaceholder);
  }

  private emailInput(): Locator {
    return this.getByPlaceholder(selectors.emailPlaceholder);
  }

  private passwordInput(): Locator {
    return this.getByPlaceholder(selectors.passwordPlaceholder);
  }

  private updateButton(): Locator {
    return this.getByRole('button', { name: selectors.updateButton });
  }

  private logoutButton(): Locator {
    return this.getByRole('button', { name: selectors.logoutButton });
  }

  private successMessages(): Locator {
    return this.getSuccessMessages(selectors.container);
  }

  private errorMessages(): Locator {
    return this.getErrorMessages(selectors.container);
  }

  // Actions
  async navigate(): Promise<void> {
    await test.step('Navigate to settings page', async () => {
      await super.navigate('/settings');
    });
  }

  async fillProfileImage(url: string): Promise<void> {
    await test.step('Fill profile image URL', async () => {
      await this.profileImageInput().fill(url);
    });
  }

  async fillUsername(username: string): Promise<void> {
    await test.step('Fill username field', async () => {
      await this.usernameInput().fill(username);
    });
  }

  async fillBio(bio: string): Promise<void> {
    await test.step('Fill bio field', async () => {
      await this.bioTextarea().fill(bio);
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

  async clickUpdate(): Promise<void> {
    await test.step('Click update settings button', async () => {
      await this.updateButton().click();
    });
  }

  async clickLogout(): Promise<void> {
    await test.step('Click logout button', async () => {
      await this.logoutButton().click();
    });
  }

  async getSuccessMessage(): Promise<string> {
    return await test.step('Get success message', async () => {
      await this.successMessages().waitFor({ state: 'visible' });
      return (await this.successMessages().textContent()) ?? '';
    });
  }

  async getErrorMessage(): Promise<string> {
    return await test.step('Get error message', async () => {
      await this.errorMessages().waitFor({ state: 'visible' });
      return (await this.errorMessages().textContent()) ?? '';
    });
  }

  async getUsername(): Promise<string> {
    return await test.step('Get username value', async () => {
      return (await this.usernameInput().inputValue()) ?? '';
    });
  }

  async getEmail(): Promise<string> {
    return await test.step('Get email value', async () => {
      return (await this.emailInput().inputValue()) ?? '';
    });
  }

  async getBio(): Promise<string> {
    return await test.step('Get bio value', async () => {
      return (await this.bioTextarea().inputValue()) ?? '';
    });
  }

  async waitForSettingsLoaded(): Promise<void> {
    await test.step('Wait for settings to load', async () => {
      await this.updateButton().waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
    });
  }
}
