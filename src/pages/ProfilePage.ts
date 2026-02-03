import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  private static readonly CONTAINER = '.profile-page';

  constructor(page: Page) {
    super(page);
  }

  // Selectors as methods for reusability
  private userInfo(): Locator {
    return this.page.locator('.user-info');
  }

  private profileUsername(): Locator {
    return this.userInfo().locator('h4');
  }

  private profileBio(): Locator {
    return this.userInfo().locator('div').last();
  }

  private profileImage(): Locator {
    return this.userInfo().locator('.user-img');
  }

  private followButton(): Locator {
    return this.userInfo().getByRole('button', { name: /Follow/ });
  }

  private unfollowButton(): Locator {
    return this.userInfo().getByRole('button', { name: /Unfollow/ });
  }

  private editProfileButton(): Locator {
    return this.getByRole('button', { name: 'Edit Profile Settings' });
  }

  private articlesToggle(): Locator {
    return this.page.locator('.articles-toggle');
  }

  private myArticlesTab(): Locator {
    return this.articlesToggle().locator('.nav-link').first();
  }

  private favoritedArticlesTab(): Locator {
    return this.articlesToggle().locator('.nav-link').last();
  }

  private articlePreviewTitles(): Locator {
    return this.page.locator('.article-preview .preview-link h1');
  }

  // Actions
  async navigate(username: string): Promise<void> {
    await super.navigate(`/profile/${username}`);
  }

  async navigateToMyProfile(): Promise<void> {
    await super.navigate('/my-profile');
  }

  async getUsername(): Promise<string> {
    return (await this.profileUsername().textContent()) ?? '';
  }

  async getBio(): Promise<string> {
    return (await this.profileBio().textContent()) ?? '';
  }

  async clickFollow(): Promise<void> {
    await this.followButton().click();
  }

  async clickUnfollow(): Promise<void> {
    await this.unfollowButton().click();
  }

  async isFollowButtonVisible(): Promise<boolean> {
    return this.followButton().isVisible();
  }

  async isUnfollowButtonVisible(): Promise<boolean> {
    return this.unfollowButton().isVisible();
  }

  async clickEditProfile(): Promise<void> {
    await this.editProfileButton().click();
  }

  async clickMyArticlesTab(): Promise<void> {
    await this.myArticlesTab().click();
  }

  async clickFavoritedArticlesTab(): Promise<void> {
    await this.favoritedArticlesTab().click();
  }

  async getMyArticles(): Promise<string[]> {
    // Wait for articles to load
    await this.page
      .locator('.article-preview:has-text("Loading")')
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch(() => {
        // If no loading indicator, that's fine
      });
    return this.articlePreviewTitles().allTextContents();
  }

  async isArticleVisible(title: string): Promise<boolean> {
    const article = this.page.locator('.preview-link h1', { hasText: title });
    return article.isVisible();
  }

  async clickArticleByTitle(title: string): Promise<void> {
    await this.page.locator('.preview-link h1', { hasText: title }).click();
  }

  async waitForProfileLoaded(): Promise<void> {
    await this.profileUsername().waitFor({ state: 'visible', timeout: 10000 });
  }

  async getArticleCount(): Promise<number> {
    const previews = this.page.locator('.article-preview:has(.preview-link)');
    return previews.count();
  }
}
