import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigate(path: string = ''): Promise<void> {
    const hashPath = path.startsWith('#') ? path : `#${path}`;
    await this.page.goto(`/${hashPath}`);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForUrl(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern);
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  // Reusable selector helpers
  protected getByPlaceholder(placeholder: string): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  protected getByRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1]
  ): Locator {
    return this.page.getByRole(role, options);
  }

  protected getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  protected getFormControl(name: string): Locator {
    return this.page.locator(`[formcontrolname="${name}"]`);
  }

  protected getErrorMessages(container?: string): Locator {
    const selector = container
      ? `${container} .error-messages`
      : '.error-messages';
    return this.page.locator(selector).first();
  }

  protected getSuccessMessages(container?: string): Locator {
    const selector = container
      ? `${container} .success-messages`
      : '.success-messages';
    return this.page.locator(selector).first();
  }
}
