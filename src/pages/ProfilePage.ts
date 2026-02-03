import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

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
      .locator(`${selectors.articlePreview}:has-text("Loading")`)
      .waitFor({ state: 'hidden', timeout: 10000 })
      .catch(() => {
        // If no loading indicator, that's fine
      });
    return this.articlePreviewTitles().allTextContents();
  }

  async isArticleVisible(title: string): Promise<boolean> {
    const article = this.page.locator(selectors.previewLink, { hasText: title });
    return article.isVisible();
  }

  async clickArticleByTitle(title: string): Promise<void> {
    await this.page.locator(selectors.previewLink, { hasText: title }).click();
  }

  async waitForProfileLoaded(): Promise<void> {
    await this.profileUsername().waitFor({ state: 'visible', timeout: 10000 });
  }

  async getArticleCount(): Promise<number> {
    const previews = this.page.locator(`${selectors.articlePreview}:has(.preview-link)`);
    return previews.count();
  }

  // Locator getters for assertions
  getArticlePreviewLocator(): Locator {
    return this.page.locator(selectors.articlePreview);
  }
}
