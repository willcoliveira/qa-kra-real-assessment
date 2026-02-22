import { Page, Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { TIMEOUTS } from '../utils/timeouts';

export const selectors = {
  container: '.profile-page',
  userInfo: '.user-info',
  username: 'h4',
  userImage: '.user-img',
  followButtonPattern: /Follow/,
  unfollowButtonPattern: /Unfollow/,
  editProfileButton: 'Edit Profile Settings',
  articlesToggle: '.articles-toggle',
  navLink: '.nav-link',
  articlePreview: '.article-preview',
  articlePreviewTitle: '.article-preview .preview-link h1',
  previewLink: '.preview-link h1',
};

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private userInfo(): Locator {
    return this.page.locator(selectors.userInfo);
  }

  private profileUsername(): Locator {
    return this.userInfo().locator(selectors.username);
  }

  private profileBio(): Locator {
    return this.userInfo().locator('div').last();
  }

  private profileImage(): Locator {
    return this.userInfo().locator(selectors.userImage);
  }

  private followButton(): Locator {
    return this.userInfo().getByRole('button', { name: selectors.followButtonPattern });
  }

  private unfollowButton(): Locator {
    return this.userInfo().getByRole('button', { name: selectors.unfollowButtonPattern });
  }

  private editProfileButton(): Locator {
    return this.getByRole('button', { name: selectors.editProfileButton });
  }

  private articlesToggle(): Locator {
    return this.page.locator(selectors.articlesToggle);
  }

  private myArticlesTab(): Locator {
    return this.articlesToggle().locator(selectors.navLink).first();
  }

  private favoritedArticlesTab(): Locator {
    return this.articlesToggle().locator(selectors.navLink).last();
  }

  private articlePreviewTitles(): Locator {
    return this.page.locator(selectors.articlePreviewTitle);
  }

  // Actions
  async navigate(username: string): Promise<void> {
    await test.step(`Navigate to profile "${username}"`, async () => {
      await super.navigate(`/profile/${username}`);
    });
  }

  async navigateToMyProfile(): Promise<void> {
    await test.step('Navigate to my profile', async () => {
      await super.navigate('/my-profile');
    });
  }

  async getUsername(): Promise<string> {
    return await test.step('Get profile username', async () => {
      return (await this.profileUsername().textContent()) ?? '';
    });
  }

  async getBio(): Promise<string> {
    return await test.step('Get profile bio', async () => {
      return (await this.profileBio().textContent()) ?? '';
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

  async isFollowButtonVisible(): Promise<boolean> {
    return await test.step('Check if follow button is visible', async () => {
      return this.followButton().isVisible();
    });
  }

  async isUnfollowButtonVisible(): Promise<boolean> {
    return await test.step('Check if unfollow button is visible', async () => {
      return this.unfollowButton().isVisible();
    });
  }

  async clickEditProfile(): Promise<void> {
    await test.step('Click edit profile button', async () => {
      await this.editProfileButton().click();
    });
  }

  async clickMyArticlesTab(): Promise<void> {
    await test.step('Click My Articles tab', async () => {
      await this.myArticlesTab().click();
    });
  }

  async clickFavoritedArticlesTab(): Promise<void> {
    await test.step('Click Favorited Articles tab', async () => {
      await this.favoritedArticlesTab().click();
    });
  }

  async getMyArticles(): Promise<string[]> {
    return await test.step('Get my articles', async () => {
      // Wait for articles to load
      await this.page
        .locator(`${selectors.articlePreview}:has-text("Loading")`)
        .waitFor({ state: 'hidden', timeout: TIMEOUTS.MEDIUM })
        .catch(() => {
          // If no loading indicator, that's fine
        });
      return this.articlePreviewTitles().allTextContents();
    });
  }

  async isArticleVisible(title: string): Promise<boolean> {
    return await test.step(`Check if article "${title}" is visible`, async () => {
      const article = this.page.locator(selectors.previewLink, { hasText: title });
      return article.isVisible();
    });
  }

  async clickArticleByTitle(title: string): Promise<void> {
    await test.step(`Click article "${title}"`, async () => {
      await this.page.locator(selectors.previewLink, { hasText: title }).click();
    });
  }

  async waitForProfileLoaded(): Promise<void> {
    await test.step('Wait for profile to load', async () => {
      await this.profileUsername().waitFor({ state: 'visible', timeout: TIMEOUTS.MEDIUM });
    });
  }

  async getArticleCount(): Promise<number> {
    return await test.step('Get article count', async () => {
      const previews = this.page.locator(`${selectors.articlePreview}:has(.preview-link)`);
      return previews.count();
    });
  }

  // Locator getters for assertions
  getArticlePreviewLocator(): Locator {
    return this.page.locator(selectors.articlePreview);
  }
}
