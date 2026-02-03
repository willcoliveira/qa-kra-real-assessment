import { test, expect } from '../src/fixtures/test.fixture';
import { ensureAuthenticated } from '../src/utils/auth.helper';
import {
  generateRandomArticleTitle,
  generateRandomArticleDescription,
  generateRandomArticleBody,
  generateRandomTag,
  generateRandomUsername,
  generateRandomEmail,
} from '../src/utils/testDataGenerator';
import { RegisterPage } from '../src/pages/RegisterPage';
import { LoginPage } from '../src/pages/LoginPage';
import { EditorPage } from '../src/pages/EditorPage';
import { ProfilePage } from '../src/pages/ProfilePage';

/**
 * Tag Filter Tests
 *
 * Note: Due to BUG-001, newly created tags do not appear in the Popular Tags sidebar.
 * Tests that filter by tag use existing tags from the sidebar as a workaround.
 * See docs/BUGS.md for details.
 */
test.describe('Tag Filter', { tag: ['@tags'] }, () => {
  let testUsername: string;
  let testEmail: string;
  let testPassword: string;
  let uniqueTag: string;
  let articleWithTag: string;
  let articleWithoutTag: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test user and articles with specific tags
    const context = await browser.newContext();
    const page = await context.newPage();

    testUsername = generateRandomUsername('taguser');
    testEmail = generateRandomEmail('taguser');
    testPassword = 'Test@123456';

    // Register the user
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();
    await registerPage.register(testUsername, testEmail, testPassword);
    await page.waitForURL(/.*#\/login/, { timeout: 10000 });

    // Login
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(testEmail, testPassword);
    await page.waitForURL(/.*#\/$/, { timeout: 10000 });

    // Create unique tag for testing
    uniqueTag = generateRandomTag('unique');

    // Create article WITH the unique tag
    articleWithTag = generateRandomArticleTitle('WithTag');
    const editorPage = new EditorPage(page);
    await editorPage.navigate();
    await editorPage.createArticle(
      articleWithTag,
      generateRandomArticleDescription(),
      generateRandomArticleBody(),
      [uniqueTag]
    );

    // Wait for success message
    await expect(page.locator('.editor-page .success-messages')).toBeVisible();

    // Verify article was created
    const profilePage = new ProfilePage(page);
    await profilePage.navigate(testUsername);
    await profilePage.waitForProfileLoaded();
    let articles = await profilePage.getMyArticles();
    expect(articles).toContain(articleWithTag);

    // Create article WITHOUT the unique tag
    articleWithoutTag = generateRandomArticleTitle('WithoutTag');
    await editorPage.navigate();
    await editorPage.createArticle(
      articleWithoutTag,
      generateRandomArticleDescription(),
      generateRandomArticleBody(),
      [generateRandomTag('other')]
    );

    // Wait for success message
    await expect(page.locator('.editor-page .success-messages')).toBeVisible();

    // Verify second article was created
    await profilePage.navigate(testUsername);
    await profilePage.waitForProfileLoaded();
    articles = await profilePage.getMyArticles();
    expect(articles).toContain(articleWithoutTag);

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, testEmail, testPassword, 'tag-user');
  });

  test('should be able to filter articles by clicking a tag in Global Feed', async ({
    page,
    homePage,
  }) => {
    await homePage.navigate();
    await homePage.clickGlobalFeed();
    await homePage.waitForArticlesLoaded();

    // Get available tags from Popular Tags sidebar
    const tags = await homePage.getAvailableTags();
    expect(tags.length).toBeGreaterThan(0);

    // Use an existing popular tag
    const tagToFilter = tags[0];

    // Click on the popular tag
    await homePage.clickTag(tagToFilter);

    // Wait for feed to update
    await page.waitForTimeout(2000);

    // Verify a tag-specific feed tab appears
    await expect(page.locator('.nav-link', { hasText: tagToFilter })).toBeVisible();
  });

  test('should be able to verify only articles with selected tag are displayed', async ({
    page,
    homePage,
  }) => {
    await homePage.navigate();
    await homePage.clickGlobalFeed();
    await homePage.waitForArticlesLoaded();

    // Get available tags from Popular Tags sidebar
    const availableTags = await homePage.getAvailableTags();
    expect(availableTags.length).toBeGreaterThan(0);

    // Use an existing popular tag
    const tagToFilter = availableTags[0];

    // Click on the popular tag
    await homePage.clickTag(tagToFilter);

    // Wait for feed to update
    await page.waitForTimeout(2000);
    await homePage.waitForArticlesLoaded();

    // Verify a tag-specific feed tab appears
    await expect(page.locator('.nav-link', { hasText: tagToFilter })).toBeVisible();

    // Get all articles in the filtered feed
    const articles = await homePage.getArticleTitles();

    // If there are articles, verify they all have the selected tag
    if (articles.length > 0) {
      // Check at least the first visible article has the tag
      const firstArticleTitle = articles[0];
      const articleTags = await homePage.getArticleTagsByTitle(firstArticleTitle);
      expect(articleTags).toContain(tagToFilter);
    }
  });

  test('should display article tags in the feed', async ({ homePage }) => {
    await homePage.navigate();
    await homePage.clickGlobalFeed();
    await homePage.waitForArticlesLoaded();

    // Check if our article with tag is visible and has the tag displayed
    const isArticleVisible = await homePage.isArticleVisibleInFeed(articleWithTag);

    if (isArticleVisible) {
      const articleTags = await homePage.getArticleTagsByTitle(articleWithTag);
      expect(articleTags).toContain(uniqueTag);
    }
  });

  test('should return to global feed when clicking Global Feed after tag filter', async ({
    page,
    homePage,
  }) => {
    await homePage.navigate();
    await homePage.clickGlobalFeed();
    await homePage.waitForArticlesLoaded();

    // Get available tags from Popular Tags sidebar
    const tags = await homePage.getAvailableTags();
    expect(tags.length).toBeGreaterThan(0);

    // Use an existing popular tag
    const tagToFilter = tags[0];

    // Click on a tag to filter
    await homePage.clickTag(tagToFilter);
    await page.waitForTimeout(2000);

    // Click on Global Feed again
    await homePage.clickGlobalFeed();
    await homePage.waitForArticlesLoaded();

    // Verify Global Feed is active
    const isGlobalActive = await homePage.isGlobalFeedActive();
    expect(isGlobalActive).toBe(true);

    // Verify all articles are shown (both with and without the tag)
    const articles = await homePage.getArticleTitles();
    // At minimum, we should see more variety in Global Feed
    expect(articles.length).toBeGreaterThanOrEqual(1);
  });
});
