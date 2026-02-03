import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class EditorPage extends BasePage {
  private static readonly CONTAINER = '.editor-page';

  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private titleInput(): Locator {
    return this.getByPlaceholder('Article Title');
  }

  private descriptionInput(): Locator {
    return this.getByPlaceholder("What's this article about?");
  }

  private bodyTextarea(): Locator {
    return this.getByPlaceholder('Write your article (in markdown)');
  }

  private tagInput(): Locator {
    return this.getByPlaceholder('Enter tags');
  }

  private publishButton(): Locator {
    return this.getByRole('button', { name: 'Publish Article' });
  }

  private successMessages(): Locator {
    return this.getSuccessMessages(EditorPage.CONTAINER);
  }

  private errorMessages(): Locator {
    return this.getErrorMessages(EditorPage.CONTAINER);
  }

  private tagList(): Locator {
    return this.page.locator(`${EditorPage.CONTAINER} .tag-list`);
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

  async getAddedTags(): Promise<string[]> {
    return this.tagList().locator('.tag-pill').allTextContents();
  }

  async removeTag(tag: string): Promise<void> {
    await this.tagList().locator('.tag-pill', { hasText: tag }).locator('.ion-close-round').click();
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
