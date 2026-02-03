import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ArticlePage extends BasePage {
  private static readonly CONTAINER = '.article-page';

  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private banner(): Locator {
    return this.page.locator(`${ArticlePage.CONTAINER} .banner`);
  }

  private articleTitle(): Locator {
    return this.banner().locator('h1');
  }

  private articleBody(): Locator {
    return this.page.locator('.article-content markdown');
  }

  private articleMeta(): Locator {
    return this.page.locator('.article-meta').first();
  }

  private deleteButton(): Locator {
    return this.getByRole('button', { name: 'Delete Article' }).first();
  }

  private editButton(): Locator {
    return this.getByText('Edit Article').first();
  }

  private followButton(): Locator {
    return this.articleMeta().getByRole('button', { name: /Follow/ });
  }

  private unfollowButton(): Locator {
    return this.articleMeta().getByRole('button', { name: /Unfollow/ });
  }

  private favoriteButton(): Locator {
    return this.getByRole('button', { name: /Favorite Article/ }).first();
  }

  private unfavoriteButton(): Locator {
    return this.getByRole('button', { name: /Unfavorite Article/ }).first();
  }

  private commentTextarea(): Locator {
    return this.getByPlaceholder('Write a comment...');
  }

  private postCommentButton(): Locator {
    return this.getByRole('button', { name: 'Post Comment' });
  }

  private commentCards(): Locator {
    return this.page.locator('.card:has(.card-text)');
  }

  private tagList(): Locator {
    return this.page.locator('.article-content .tag-list');
  }

  private authorLink(): Locator {
    return this.articleMeta().locator('.author');
  }

  // Actions
  async navigate(slug: string): Promise<void> {
    await super.navigate(`/article/${slug}`);
  }

  async getTitle(): Promise<string> {
    return (await this.articleTitle().textContent()) ?? '';
  }

  async getBody(): Promise<string> {
    return (await this.articleBody().textContent()) ?? '';
  }

  async getTags(): Promise<string[]> {
    return this.tagList().locator('.tag-pill').allTextContents();
  }

  async clickDelete(): Promise<void> {
    await this.deleteButton().click();
  }

  async clickEdit(): Promise<void> {
    await this.editButton().click();
  }

  async clickFollow(): Promise<void> {
    await this.followButton().click();
  }

  async clickUnfollow(): Promise<void> {
    await this.unfollowButton().click();
  }

  async clickFavorite(): Promise<void> {
    await this.favoriteButton().click();
  }

  async clickUnfavorite(): Promise<void> {
    await this.unfavoriteButton().click();
  }

  async addComment(text: string): Promise<void> {
    await this.commentTextarea().fill(text);
    await this.postCommentButton().click();
  }

  async deleteComment(index: number = 0): Promise<void> {
    await this.commentCards().nth(index).locator('.ion-trash-a').click();
  }

  async getComments(): Promise<string[]> {
    const count = await this.commentCards().count();
    const comments: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.commentCards().nth(i).locator('.card-text').textContent();
      if (text) {
        comments.push(text.trim());
      }
    }
    return comments;
  }

  async getCommentCount(): Promise<number> {
    return this.commentCards().count();
  }

  async getAuthorUsername(): Promise<string> {
    return (await this.authorLink().textContent()) ?? '';
  }

  async clickAuthor(): Promise<void> {
    await this.authorLink().click();
  }

  async isDeleteButtonVisible(): Promise<boolean> {
    return this.deleteButton().isVisible();
  }

  async isEditButtonVisible(): Promise<boolean> {
    return this.editButton().isVisible();
  }

  async waitForArticleLoaded(): Promise<void> {
    // Wait for title to not be "Loading article..."
    await this.articleTitle().waitFor({ state: 'visible' });
    await this.page.waitForFunction(
      () => {
        const title = document.querySelector('.article-page .banner h1');
        return title && !title.textContent?.includes('Loading');
      },
      { timeout: 10000 }
    );
  }
}
