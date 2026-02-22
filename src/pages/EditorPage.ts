import { Page, Locator, test } from '@playwright/test';
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
    await test.step(`Navigate to editor page${slug ? ` for ${slug}` : ''}`, async () => {
      if (slug) {
        await super.navigate(`/editor/${slug}`);
      } else {
        await super.navigate('/editor');
      }
    });
  }

  async fillTitle(title: string): Promise<void> {
    await test.step('Fill article title', async () => {
      await this.titleInput().fill(title);
    });
  }

  async fillDescription(description: string): Promise<void> {
    await test.step('Fill article description', async () => {
      await this.descriptionInput().fill(description);
    });
  }

  async fillBody(body: string): Promise<void> {
    await test.step('Fill article body', async () => {
      await this.bodyTextarea().fill(body);
    });
  }

  async addTag(tag: string): Promise<void> {
    await test.step(`Add tag "${tag}"`, async () => {
      await this.tagInput().fill(tag);
      await this.tagInput().dispatchEvent('change');
    });
  }

  async addTags(tags: string[]): Promise<void> {
    await test.step('Add multiple tags', async () => {
      for (const tag of tags) {
        await this.addTag(tag);
      }
    });
  }

  async clickPublish(): Promise<void> {
    await test.step('Click publish article button', async () => {
      await this.publishButton().click();
    });
  }

  async createArticle(
    title: string,
    description: string,
    body: string,
    tags: string[] = []
  ): Promise<void> {
    await test.step('Create article', async () => {
      await this.fillTitle(title);
      await this.fillDescription(description);
      await this.fillBody(body);
      for (const tag of tags) {
        await this.addTag(tag);
      }
      await this.clickPublish();
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

  async isSuccessMessageVisible(): Promise<boolean> {
    return await test.step('Check if success message is visible', async () => {
      return this.successMessages().isVisible();
    });
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await test.step('Check if error message is visible', async () => {
      return this.errorMessages().isVisible();
    });
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
    return await test.step('Get added tags', async () => {
      return this.tagList().locator(selectors.tagPill).allTextContents();
    });
  }

  async removeTag(tag: string): Promise<void> {
    await test.step(`Remove tag "${tag}"`, async () => {
      await this.tagList().locator(selectors.tagPill, { hasText: tag }).locator(selectors.tagPillClose).click();
    });
  }

  async clearTitle(): Promise<void> {
    await test.step('Clear article title', async () => {
      await this.titleInput().clear();
    });
  }

  async clearBody(): Promise<void> {
    await test.step('Clear article body', async () => {
      await this.bodyTextarea().clear();
    });
  }

  async getTitle(): Promise<string> {
    return await test.step('Get article title value', async () => {
      return (await this.titleInput().inputValue()) ?? '';
    });
  }

  async getDescription(): Promise<string> {
    return await test.step('Get article description value', async () => {
      return (await this.descriptionInput().inputValue()) ?? '';
    });
  }

  async getBody(): Promise<string> {
    return await test.step('Get article body value', async () => {
      return (await this.bodyTextarea().inputValue()) ?? '';
    });
  }
}
