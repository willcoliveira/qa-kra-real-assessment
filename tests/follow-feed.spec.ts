import { test, expect } from '../src/fixtures/test.fixture';
import { ensureAuthenticated, clearStorageState } from '../src/utils/auth.helper';
import {
  generateRandomArticleTitle,
  generateRandomArticleDescription,
  generateRandomArticleBody,
  generateRandomUsername,
  generateRandomEmail,
} from '../src/utils/testDataGenerator';
import { RegisterPage } from '../src/pages/RegisterPage';
import { LoginPage } from '../src/pages/LoginPage';
import { EditorPage } from '../src/pages/EditorPage';
import { ProfilePage } from '../src/pages/ProfilePage';

test.describe('Follow Feed', { tag: ['@feed'] }, () => {
  let userAUsername: string;
  let userAEmail: string;
  let userAPassword: string;
  let userBUsername: string;
  let userBEmail: string;
  let userBPassword: string;
  let userBArticleTitle: string;

  test.beforeAll(async ({ browser }) => {
    // Create two test users
    const context = await browser.newContext();
    const page = await context.newPage();

    // User A - the follower
    userAUsername = generateRandomUsername('follower');
    userAEmail = generateRandomEmail('follower');
    userAPassword = 'Test@123456';

    const registerPage = new RegisterPage(page);
    await registerPage.navigate();
    await registerPage.register(userAUsername, userAEmail, userAPassword);
    await page.waitForURL(/.*#\/login/, { timeout: 10000 });

    // User B - the one to be followed
    userBUsername = generateRandomUsername('followed');
    userBEmail = generateRandomEmail('followed');
    userBPassword = 'Test@123456';

    await registerPage.navigate();
    await registerPage.register(userBUsername, userBEmail, userBPassword);
    await page.waitForURL(/.*#\/login/, { timeout: 10000 });

    // Login as User B and create an article
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(userBEmail, userBPassword);
    await page.waitForURL(/.*#\/$/, { timeout: 10000 });

    // Create an article as User B
    userBArticleTitle = generateRandomArticleTitle('UserB');
    const editorPage = new EditorPage(page);
    await editorPage.navigate();
    await editorPage.createArticle(
      userBArticleTitle,
      generateRandomArticleDescription(),
      generateRandomArticleBody()
    );

    // Wait for success message
    await expect(page.locator('.editor-page .success-messages')).toBeVisible();

    // Verify article was created by navigating to profile
    const profilePage = new ProfilePage(page);
    await profilePage.navigate(userBUsername);
    await profilePage.waitForProfileLoaded();
    const articles = await profilePage.getMyArticles();
    expect(articles).toContain(userBArticleTitle);

    await context.close();
  });

  test.beforeEach(async () => {
    // Clear storage state for clean test isolation
    clearStorageState('follow-user');
  });

  test('should be able to follow another user from their profile', async ({
    page,
    profilePage,
  }) => {
    // Login as User A
    await ensureAuthenticated(page, userAEmail, userAPassword, 'follow-user');

    // Navigate to User B's profile
    await profilePage.navigate(userBUsername);
    await profilePage.waitForProfileLoaded();

    // Verify follow button is visible
    await expect(
      page.getByRole('button', { name: new RegExp(`Follow ${userBUsername}`) })
    ).toBeVisible();

    // Click follow
    await profilePage.clickFollow();

    // Verify unfollow button appears (indicating successful follow)
    await expect(
      page.getByRole('button', { name: new RegExp(`Unfollow ${userBUsername}`) })
    ).toBeVisible();
  });

  test("should be able to see followed user's article in Your Feed tab", async ({
    page,
    profilePage,
    homePage,
  }) => {
    // Login as User A
    await ensureAuthenticated(page, userAEmail, userAPassword, 'follow-user');

    // First follow User B
    await profilePage.navigate(userBUsername);
    await profilePage.waitForProfileLoaded();

    // Check if already following, if not - follow
    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${userBUsername}`) });
    const unfollowButton = page.getByRole('button', { name: new RegExp(`Unfollow ${userBUsername}`) });

    if (await followButton.isVisible()) {
      await profilePage.clickFollow();
      await expect(unfollowButton).toBeVisible({ timeout: 5000 });
    }

    // Navigate to home page
    await homePage.navigate();
    await page.waitForTimeout(1000);

    // Click on Your Feed tab
    await homePage.clickMyFeed();
    await page.waitForTimeout(2000);

    // Verify User B's article appears in Your Feed
    const articles = await homePage.getArticleTitles();
    expect(articles).toContain(userBArticleTitle);
  });

  test('should be able to unfollow a user', async ({ page, profilePage, homePage }) => {
    // Login as User A
    await ensureAuthenticated(page, userAEmail, userAPassword, 'follow-user');

    // Navigate to User B's profile
    await profilePage.navigate(userBUsername);
    await profilePage.waitForProfileLoaded();

    const followButton = page.getByRole('button', { name: new RegExp(`Follow ${userBUsername}`) });
    const unfollowButton = page.getByRole('button', { name: new RegExp(`Unfollow ${userBUsername}`) });

    // Follow first if not already following
    if (await followButton.isVisible()) {
      await profilePage.clickFollow();
      await expect(unfollowButton).toBeVisible({ timeout: 5000 });
    }

    // Now unfollow
    await profilePage.clickUnfollow();

    // Verify follow button appears again
    await expect(followButton).toBeVisible({ timeout: 5000 });

    // Verify the article no longer appears in Your Feed
    await homePage.navigate();
    await page.waitForTimeout(1000);
    await homePage.clickMyFeed();
    await page.waitForTimeout(2000);

    // Your Feed might show "No articles" or just not include the unfollowed user's articles
    const articles = await homePage.getArticleTitles();
    // After unfollowing, the article should not appear in Your Feed
    expect(articles).not.toContain(userBArticleTitle);
  });
});
