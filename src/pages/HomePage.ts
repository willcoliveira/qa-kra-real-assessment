import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export const selectors = {
  container: '.home-page',
  feedToggle: '.feed-toggle',
  myFeedTab: 'My Feed',
  globalFeedTab: 'Global Feed',
  articlePreview: '.article-preview',
  articlePreviewTitle: '.article-preview .preview-link h1',
  previewLink: '.preview-link h1',
  tagSidebar: '.sidebar .tag-list',
  tagPill: '.tag-pill',
  newArticleLink: 'New Article',
  settingsLink: 'Settings',
};

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private feedToggle(): Locator {
    return this.page.locator(selectors.feedToggle);
  }

  private myFeedTab(): Locator {
    return this.feedToggle().getByText(selectors.myFeedTab);
  }

  private globalFeedTab(): Locator {
    return this.feedToggle().getByText(selectors.globalFeedTab);
  }

  private articlePreviews(): Locator {
    return this.page.locator(selectors.articlePreview);
  }

  private articlePreviewTitles(): Locator {
    return this.page.locator(selectors.articlePreviewTitle);
  }

  private tagSidebar(): Locator {
    return this.page.locator(selectors.tagSidebar);
  }

  private newArticleLink(): Locator {
    return this.getByRole('link', { name: selectors.newArticleLink });
  }

  private settingsLink(): Locator {
    return this.getByRole('link', { name: selectors.settingsLink });
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
      .locator(`${selectors.articlePreview} h1, ${selectors.articlePreview}:has-text("No articles")`)
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .catch(() => {
        // If timeout, articles might just be empty
      });
    return this.articlePreviewTitles().allTextContents();
  }

  async clickTag(tagName: string): Promise<void> {
    await this.tagSidebar().locator(selectors.tagPill, { hasText: tagName }).click();
  }

  async getAvailableTags(): Promise<string[]> {
    return this.tagSidebar().locator(selectors.tagPill).allTextContents();
  }

  async clickArticleByTitle(title: string): Promise<void> {
    await this.page.locator(selectors.previewLink, { hasText: title }).click();
  }

  async clickNewArticle(): Promise<void> {
    await this.newArticleLink().click();
  }

  async clickSettings(): Promise<void> {
    await this.settingsLink().click();
  }

  async isArticleVisibleInFeed(title: string): Promise<boolean> {
    const article = this.page.locator(selectors.previewLink, { hasText: title });
    return article.isVisible();
  }

  async waitForArticlesLoaded(): Promise<void> {
    // Wait for loading state to disappear
    await this.page
      .locator(`${selectors.articlePreview}:has-text("Loading")`)
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch(() => {
        // If no loading indicator found, that's fine
      });
  }

  async getArticleTagsByTitle(title: string): Promise<string[]> {
    const articlePreview = this.page.locator(selectors.articlePreview, {
      has: this.page.locator('h1', { hasText: title }),
    });
    return articlePreview.locator(`.tag-list ${selectors.tagPill}`).allTextContents();
  }
}
