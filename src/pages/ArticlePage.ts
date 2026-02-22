import { Page, Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { TIMEOUTS } from '../utils/timeouts';

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
    await test.step(`Navigate to article "${slug}"`, async () => {
      await super.navigate(`/article/${slug}`);
    });
  }

  async getTitle(): Promise<string> {
    return await test.step('Get article title', async () => {
      return (await this.articleTitle().textContent()) ?? '';
    });
  }

  async getBody(): Promise<string> {
    return await test.step('Get article body', async () => {
      return (await this.articleBody().textContent()) ?? '';
    });
  }

  async getTags(): Promise<string[]> {
    return await test.step('Get article tags', async () => {
      return this.tagList().locator(selectors.tagPill).allTextContents();
    });
  }

  async clickDelete(): Promise<void> {
    await test.step('Click delete article button', async () => {
      await this.deleteButton().click();
    });
  }

  async clickEdit(): Promise<void> {
    await test.step('Click edit article button', async () => {
      await this.editButton().click();
    });
  }

  async clickFollow(): Promise<void> {
    await test.step('Click follow button', async () => {
      await this.followButton().click();
    });
  }

  async clickUnfollow(): Promise<void> {
    await test.step('Click unfollow button', async () => {
      await this.unfollowButton().click();
    });
  }

  async clickFavorite(): Promise<void> {
    await test.step('Click favorite button', async () => {
      await this.favoriteButton().click();
    });
  }

  async clickUnfavorite(): Promise<void> {
    await test.step('Click unfavorite button', async () => {
      await this.unfavoriteButton().click();
    });
  }

  // BUG-007: Comments do not appear immediately after posting - requires page reload
  // The frontend does not update the comments list after a successful POST.
  // Workaround: Reload the page after posting to ensure the comment appears.
  async addComment(text: string): Promise<void> {
    await test.step(`Add comment "${text}"`, async () => {
      await this.commentTextarea().fill(text);
      // BUG-007 workaround: set up response listener before click to avoid race condition
      const responsePromise = this.page.waitForResponse(
        resp => resp.url().includes('/comments') && resp.ok(),
        { timeout: TIMEOUTS.MEDIUM }
      );
      await this.postCommentButton().click();
      await responsePromise;
      await this.page.reload();
      await this.waitForArticleLoaded();
      // Wait for the comment with the text to appear
      await this.page.getByText(text).first().waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
    });
  }

  async deleteComment(index: number = 0): Promise<void> {
    await test.step(`Delete comment at index ${index}`, async () => {
      await this.commentCards().nth(index).locator(selectors.commentDeleteIcon).click();
    });
  }

  async getComments(): Promise<string[]> {
    return await test.step('Get all comments', async () => {
      const count = await this.commentCards().count();
      const comments: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = await this.commentCards().nth(i).locator(selectors.commentText).textContent();
        if (text) {
          comments.push(text.trim());
        }
      }
      return comments;
    });
  }

  async getCommentCount(): Promise<number> {
    return await test.step('Get comment count', async () => {
      return this.commentCards().count();
    });
  }

  async getAuthorUsername(): Promise<string> {
    return await test.step('Get author username', async () => {
      return (await this.authorLink().textContent()) ?? '';
    });
  }

  async clickAuthor(): Promise<void> {
    await test.step('Click author link', async () => {
      await this.authorLink().click();
    });
  }

  async isDeleteButtonVisible(): Promise<boolean> {
    return await test.step('Check if delete button is visible', async () => {
      return this.deleteButton().isVisible();
    });
  }

  async isEditButtonVisible(): Promise<boolean> {
    return await test.step('Check if edit button is visible', async () => {
      return this.editButton().isVisible();
    });
  }

  async waitForArticleLoaded(): Promise<void> {
    await test.step('Wait for article to load', async () => {
      // Wait for title to not be "Loading article..."
      await this.articleTitle().waitFor({ state: 'visible' });
      await this.page.waitForFunction(
        () => {
          const title = document.querySelector('.article-page .banner h1');
          return title && !title.textContent?.includes('Loading');
        },
        { timeout: TIMEOUTS.MEDIUM }
      );
    });
  }
}
