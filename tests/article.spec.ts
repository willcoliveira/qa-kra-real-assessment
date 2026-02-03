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

test.describe('Article Management', { tag: ['@articles'] }, () => {
  let testUsername: string;
  let testEmail: string;
  let testPassword: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test user for article tests
    const context = await browser.newContext();
    const page = await context.newPage();

    testUsername = generateRandomUsername('articleuser');
    testEmail = generateRandomEmail('articleuser');
    testPassword = 'Test@123456';

    const registerPage = new RegisterPage(page);
    await registerPage.navigate();
    await registerPage.register(testUsername, testEmail, testPassword);
    await page.waitForURL(/.*#\/login/, { timeout: 10000 });

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, testEmail, testPassword, 'article-user');
  });

  test.describe('Write Article', () => {
    test('should be able to create a new article with title, description, body and tags', async ({
      page,
      editorPage,
      profilePage,
      articlePage,
    }) => {
      const title = generateRandomArticleTitle('Test');
      const description = generateRandomArticleDescription();
      const body = generateRandomArticleBody();
      const tags = [generateRandomTag(), generateRandomTag()];

      await editorPage.navigate();
      await editorPage.createArticle(title, description, body, tags);

      // Wait for success message (app stays on editor page after publish)
      await expect(page.locator('.editor-page .success-messages')).toBeVisible();
      const successMessage = await editorPage.getSuccessMessage();
      expect(successMessage).toContain('Published successfully');

      // Navigate to profile to verify the article was created
      await profilePage.navigate(testUsername);
      await profilePage.waitForProfileLoaded();

      // Verify article appears in My Articles
      const articles = await profilePage.getMyArticles();
      expect(articles).toContain(title);

      // Click on the article to verify it opens correctly
      await profilePage.clickArticleByTitle(title);
      await page.waitForURL(/.*#\/article\//, { timeout: 10000 });

      // Wait for article to load and verify title
      await articlePage.waitForArticleLoaded();
      const displayedTitle = await articlePage.getTitle();
      expect(displayedTitle).toBe(title);
    });

    test('should be able to verify the article appears in My Articles list', async ({
      page,
      editorPage,
      profilePage,
    }) => {
      const title = generateRandomArticleTitle('MyArticle');
      const description = generateRandomArticleDescription();
      const body = generateRandomArticleBody();

      // Create an article
      await editorPage.navigate();
      await editorPage.createArticle(title, description, body);

      // Wait for success message
      await expect(page.locator('.editor-page .success-messages')).toBeVisible();

      // Navigate to profile and check My Articles
      await profilePage.navigate(testUsername);
      await profilePage.waitForProfileLoaded();
      await profilePage.clickMyArticlesTab();

      // Verify article appears in the list
      const articles = await profilePage.getMyArticles();
      expect(articles).toContain(title);
    });
  });

  test.describe('Edit Article', () => {
    test('should be able to edit an existing article body and tags', async ({
      page,
      editorPage,
      profilePage,
      articlePage,
    }) => {
      // First create an article
      const originalTitle = generateRandomArticleTitle('Original');
      const originalDescription = generateRandomArticleDescription();
      const originalBody = generateRandomArticleBody();
      const originalTag = generateRandomTag('original');

      await editorPage.navigate();
      await editorPage.createArticle(originalTitle, originalDescription, originalBody, [
        originalTag,
      ]);

      // Wait for success message
      await expect(page.locator('.editor-page .success-messages')).toBeVisible();

      // Navigate to profile and open the article
      await profilePage.navigate(testUsername);
      await profilePage.waitForProfileLoaded();
      await profilePage.clickArticleByTitle(originalTitle);
      await page.waitForURL(/.*#\/article\//, { timeout: 10000 });

      // Click edit button
      await articlePage.waitForArticleLoaded();
      await articlePage.clickEdit();
      await page.waitForURL(/.*#\/editor\//, { timeout: 10000 });

      // Wait for form to be populated with article data
      await page.waitForTimeout(1000);

      // Edit the article
      const newBody = 'This is the updated body content ' + generateRandomTag();
      const newTag = generateRandomTag('newtag');

      await editorPage.clearBody();
      await editorPage.fillBody(newBody);
      await editorPage.addTag(newTag);
      await editorPage.clickPublish();

      // Wait for success message
      await expect(page.locator('.editor-page .success-messages')).toBeVisible();

      // Navigate to the article to verify the update
      await profilePage.navigate(testUsername);
      await profilePage.waitForProfileLoaded();
      await profilePage.clickArticleByTitle(originalTitle);
      await page.waitForURL(/.*#\/article\//, { timeout: 10000 });

      // Verify the article body was updated
      await articlePage.waitForArticleLoaded();
      const displayedBody = await articlePage.getBody();
      expect(displayedBody).toContain('updated body content');
    });
  });

  test.describe('Delete Article', () => {
    test('should be able to delete an article successfully', async ({
      page,
      editorPage,
      articlePage,
      profilePage,
      homePage,
    }) => {
      const title = generateRandomArticleTitle('ToDelete');
      const description = generateRandomArticleDescription();
      const body = generateRandomArticleBody();

      // Create an article
      await editorPage.navigate();
      await editorPage.createArticle(title, description, body);

      // Wait for success message
      await expect(page.locator('.editor-page .success-messages')).toBeVisible();

      // Navigate to profile and open the article
      await profilePage.navigate(testUsername);
      await profilePage.waitForProfileLoaded();
      await profilePage.clickArticleByTitle(title);
      await page.waitForURL(/.*#\/article\//, { timeout: 10000 });

      // Verify article exists
      await articlePage.waitForArticleLoaded();
      const displayedTitle = await articlePage.getTitle();
      expect(displayedTitle).toBe(title);

      // Delete the article
      await articlePage.clickDelete();

      // Verify navigation to home page after deletion
      await page.waitForURL(/.*#\/$/, { timeout: 10000 });

      // Verify the article no longer appears in global feed
      await homePage.navigate();
      await homePage.clickGlobalFeed();
      await homePage.waitForArticlesLoaded();

      const articles = await homePage.getArticleTitles();
      expect(articles).not.toContain(title);
    });
  });
});
