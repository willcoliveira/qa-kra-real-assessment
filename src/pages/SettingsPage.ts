import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

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
    await super.navigate('/settings');
  }

  async fillProfileImage(url: string): Promise<void> {
    await this.profileImageInput().fill(url);
  }

  async fillUsername(username: string): Promise<void> {
    await this.usernameInput().fill(username);
  }

  async fillBio(bio: string): Promise<void> {
    await this.bioTextarea().fill(bio);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput().fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput().fill(password);
  }

  async clickUpdate(): Promise<void> {
    await this.updateButton().click();
  }

  async clickLogout(): Promise<void> {
    await this.logoutButton().click();
  }

  async getSuccessMessage(): Promise<string> {
    await this.successMessages().waitFor({ state: 'visible' });
    return (await this.successMessages().textContent()) ?? '';
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMessages().waitFor({ state: 'visible' });
    return (await this.errorMessages().textContent()) ?? '';
  }

  async getUsername(): Promise<string> {
    return (await this.usernameInput().inputValue()) ?? '';
  }

  async getEmail(): Promise<string> {
    return (await this.emailInput().inputValue()) ?? '';
  }

  async getBio(): Promise<string> {
    return (await this.bioTextarea().inputValue()) ?? '';
  }

  async waitForSettingsLoaded(): Promise<void> {
    await this.updateButton().waitFor({ state: 'visible', timeout: 10000 });
  }
}
