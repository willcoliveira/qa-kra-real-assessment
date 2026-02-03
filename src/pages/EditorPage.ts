import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export const selectors = {
  container: '.editor-page',
  titlePlaceholder: 'Article Title',
  descriptionPlaceholder: "What's this article about?",
  bodyPlaceholder: 'Write your article (in markdown)',
  tagPlaceholder: 'Enter tags',
  publishButton: 'Publish Article',
  tagList: '.tag-list',
  tagPill: '.tag-pill',
  tagPillClose: '.ion-close-round',
};

export class EditorPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private titleInput(): Locator {
    return this.getByPlaceholder(selectors.titlePlaceholder);
  }

  private descriptionInput(): Locator {
    return this.getByPlaceholder(selectors.descriptionPlaceholder);
  }

  private bodyTextarea(): Locator {
    return this.getByPlaceholder(selectors.bodyPlaceholder);
  }

  private tagInput(): Locator {
    return this.getByPlaceholder(selectors.tagPlaceholder);
  }

  private publishButton(): Locator {
    return this.getByRole('button', { name: selectors.publishButton });
  }

  private successMessages(): Locator {
    return this.getSuccessMessages(selectors.container);
  }

  private errorMessages(): Locator {
    return this.getErrorMessages(selectors.container);
  }

  private tagList(): Locator {
    return this.page.locator(`${selectors.container} ${selectors.tagList}`);
  }

  // Actions
  async navigate(slug?: string): Promise<void> {
    if (slug) {
      await super.navigate(`/editor/${slug}`);
    } else {
      await super.navigate('/editor');
    }
  }

  async fillTitle(title: string): Promise<void> {
    await this.titleInput().fill(title);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput().fill(description);
  }

  async fillBody(body: string): Promise<void> {
    await this.bodyTextarea().fill(body);
  }

  async addTag(tag: string): Promise<void> {
    await this.tagInput().fill(tag);
    await this.tagInput().dispatchEvent('change');
  }

  async addTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.addTag(tag);
    }
  }

  async clickPublish(): Promise<void> {
    await this.publishButton().click();
  }

  async createArticle(
    title: string,
    description: string,
    body: string,
    tags: string[] = []
  ): Promise<void> {
    await this.fillTitle(title);
    await this.fillDescription(description);
    await this.fillBody(body);
    for (const tag of tags) {
      await this.addTag(tag);
    }
    await this.clickPublish();
  }

  async getSuccessMessage(): Promise<string> {
    await this.successMessages().waitFor({ state: 'visible' });
    return (await this.successMessages().textContent()) ?? '';
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMessages().waitFor({ state: 'visible' });
    return (await this.errorMessages().textContent()) ?? '';
  }

  async isSuccessMessageVisible(): Promise<boolean> {
    return this.successMessages().isVisible();
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return this.errorMessages().isVisible();
  }

  // Locator getters for assertions
  getSuccessMessagesLocator(): Locator {
    return this.successMessages();
  }

  getErrorMessagesLocator(): Locator {
    return this.errorMessages();
  }

  getPublishButtonLocator(): Locator {
    return this.publishButton();
  }

  async getAddedTags(): Promise<string[]> {
    return this.tagList().locator(selectors.tagPill).allTextContents();
  }

  async removeTag(tag: string): Promise<void> {
    await this.tagList().locator(selectors.tagPill, { hasText: tag }).locator(selectors.tagPillClose).click();
  }

  async clearTitle(): Promise<void> {
    await this.titleInput().clear();
  }

  async clearBody(): Promise<void> {
    await this.bodyTextarea().clear();
  }

  async getTitle(): Promise<string> {
    return (await this.titleInput().inputValue()) ?? '';
  }

  async getDescription(): Promise<string> {
    return (await this.descriptionInput().inputValue()) ?? '';
  }

  async getBody(): Promise<string> {
    return (await this.bodyTextarea().inputValue()) ?? '';
  }
}
