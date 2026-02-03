import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  private static readonly CONTAINER = '.home-page';

  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private feedToggle(): Locator {
    return this.page.locator('.feed-toggle');
  }

  private myFeedTab(): Locator {
    return this.feedToggle().getByText('My Feed');
  }

  private globalFeedTab(): Locator {
    return this.feedToggle().getByText('Global Feed');
  }

  private articlePreviews(): Locator {
    return this.page.locator('.article-preview');
  }

  private articlePreviewTitles(): Locator {
    return this.page.locator('.article-preview .preview-link h1');
  }

  private tagSidebar(): Locator {
    return this.page.locator('.sidebar .tag-list');
  }

  private newArticleLink(): Locator {
    return this.getByRole('link', { name: 'New Article' });
  }

  private settingsLink(): Locator {
    return this.getByRole('link', { name: 'Settings' });
  }

  // Actions
  async navigate(): Promise<void> {
    await super.navigate('/');
  }

  async clickMyFeed(): Promise<void> {
    await this.myFeedTab().click();
  }

  async clickGlobalFeed(): Promise<void> {
    await this.globalFeedTab().click();
  }

  async isMyFeedActive(): Promise<boolean> {
    return this.myFeedTab().evaluate((el) => el.classList.contains('active'));
  }

  async isGlobalFeedActive(): Promise<boolean> {
    return this.globalFeedTab().evaluate((el) => el.classList.contains('active'));
  }

  async getArticleTitles(): Promise<string[]> {
    // Wait for articles to load (either have content or show "No articles")
    await this.page
      .locator('.article-preview h1, .article-preview:has-text("No articles")')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {
        // If timeout, articles might just be empty
      });
    return this.articlePreviewTitles().allTextContents();
  }

  async clickTag(tagName: string): Promise<void> {
    await this.tagSidebar().locator('.tag-pill', { hasText: tagName }).click();
  }

  async getAvailableTags(): Promise<string[]> {
    return this.tagSidebar().locator('.tag-pill').allTextContents();
  }

  async clickArticleByTitle(title: string): Promise<void> {
    await this.page.locator('.preview-link h1', { hasText: title }).click();
  }

  async clickNewArticle(): Promise<void> {
    await this.newArticleLink().click();
  }

  async clickSettings(): Promise<void> {
    await this.settingsLink().click();
  }

  async isArticleVisibleInFeed(title: string): Promise<boolean> {
    const article = this.page.locator('.preview-link h1', { hasText: title });
    return article.isVisible();
  }

  async waitForArticlesLoaded(): Promise<void> {
    // Wait for loading state to disappear
    await this.page
      .locator('.article-preview:has-text("Loading")')
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch(() => {
        // If no loading indicator found, that's fine
      });
  }

  async getArticleTagsByTitle(title: string): Promise<string[]> {
    const articlePreview = this.page.locator('.article-preview', {
      has: this.page.locator('h1', { hasText: title }),
    });
    return articlePreview.locator('.tag-list .tag-pill').allTextContents();
  }
}
