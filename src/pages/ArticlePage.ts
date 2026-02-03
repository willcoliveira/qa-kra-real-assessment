import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export const selectors = {
  container: '.article-page',
  banner: '.banner',
  title: 'h1',
  articleContent: '.article-content markdown',
  articleMeta: '.article-meta',
  deleteButton: 'Delete Article',
  editButton: 'Edit Article',
  followButtonPattern: /Follow/,
  unfollowButtonPattern: /Unfollow/,
  favoriteButtonPattern: /Favorite Article/,
  unfavoriteButtonPattern: /Unfavorite Article/,
  commentPlaceholder: 'Write a comment...',
  postCommentButton: 'Post Comment',
  commentCard: '.card:has(.card-text)',
  commentText: '.card-text',
  commentDeleteIcon: '.ion-trash-a',
  tagList: '.article-content .tag-list',
  tagPill: '.tag-pill',
  authorLink: '.author',
};

export class ArticlePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private banner(): Locator {
    return this.page.locator(`${selectors.container} ${selectors.banner}`);
  }

  private articleTitle(): Locator {
    return this.banner().locator(selectors.title);
  }

  private articleBody(): Locator {
    return this.page.locator(selectors.articleContent);
  }

  private articleMeta(): Locator {
    return this.page.locator(selectors.articleMeta).first();
  }

  private deleteButton(): Locator {
    return this.getByRole('button', { name: selectors.deleteButton }).first();
  }

  private editButton(): Locator {
    return this.getByText(selectors.editButton).first();
  }

  private followButton(): Locator {
    return this.articleMeta().getByRole('button', { name: selectors.followButtonPattern });
  }

  private unfollowButton(): Locator {
    return this.articleMeta().getByRole('button', { name: selectors.unfollowButtonPattern });
  }

  private favoriteButton(): Locator {
    return this.getByRole('button', { name: selectors.favoriteButtonPattern }).first();
  }

  private unfavoriteButton(): Locator {
    return this.getByRole('button', { name: selectors.unfavoriteButtonPattern }).first();
  }

  private commentTextarea(): Locator {
    return this.getByPlaceholder(selectors.commentPlaceholder);
  }

  private postCommentButton(): Locator {
    return this.getByRole('button', { name: selectors.postCommentButton });
  }

  private commentCards(): Locator {
    return this.page.locator(selectors.commentCard);
  }

  private tagList(): Locator {
    return this.page.locator(selectors.tagList);
  }

  private authorLink(): Locator {
    return this.articleMeta().locator(selectors.authorLink);
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
    return this.tagList().locator(selectors.tagPill).allTextContents();
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

  // BUG-007: Comments do not appear immediately after posting - requires page reload
  // The frontend does not update the comments list after a successful POST.
  // Workaround: Reload the page after posting to ensure the comment appears.
  async addComment(text: string): Promise<void> {
    await this.commentTextarea().fill(text);
    await this.postCommentButton().click();
    // Wait briefly then reload to ensure comment is displayed (BUG-007 workaround)
    await this.page.waitForTimeout(500);
    await this.page.reload();
    await this.waitForArticleLoaded();
    // Wait for the comment with the text to appear
    await this.page.getByText(text).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async deleteComment(index: number = 0): Promise<void> {
    await this.commentCards().nth(index).locator(selectors.commentDeleteIcon).click();
  }

  async getComments(): Promise<string[]> {
    const count = await this.commentCards().count();
    const comments: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await this.commentCards().nth(i).locator(selectors.commentText).textContent();
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
