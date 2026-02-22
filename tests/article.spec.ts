import { test, expect } from '../src/fixtures/test.fixture';
import { ensureAuthenticated } from '../src/utils/auth.helper';
import { TIMEOUTS } from '../src/utils/timeouts';
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
    await page.waitForURL(/.*#\/login/, { timeout: TIMEOUTS.MEDIUM });

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
      await expect(editorPage.getSuccessMessagesLocator()).toBeVisible();
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
      await page.waitForURL(/.*#\/article\//, { timeout: TIMEOUTS.MEDIUM });

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
      await expect(editorPage.getSuccessMessagesLocator()).toBeVisible();

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
      await expect(editorPage.getSuccessMessagesLocator()).toBeVisible();

      // Navigate to profile and open the article
      await profilePage.navigate(testUsername);
      await profilePage.waitForProfileLoaded();
      await profilePage.clickArticleByTitle(originalTitle);
      await page.waitForURL(/.*#\/article\//, { timeout: TIMEOUTS.MEDIUM });

      // Click edit button
      await articlePage.waitForArticleLoaded();
      await articlePage.clickEdit();
      await page.waitForURL(/.*#\/editor\//, { timeout: TIMEOUTS.MEDIUM });

      // Wait for form to be populated with article data
      await expect(async () => {
        const bodyValue = await editorPage.getBody();
        expect(bodyValue.length).toBeGreaterThan(0);
      }).toPass({ timeout: TIMEOUTS.MEDIUM });

      // Edit the article
      const newBody = 'This is the updated body content ' + generateRandomTag();
      const newTag = generateRandomTag('newtag');

      await editorPage.clearBody();
      await editorPage.fillBody(newBody);
      await editorPage.addTag(newTag);
      await editorPage.clickPublish();

      // Wait for success message
      await expect(editorPage.getSuccessMessagesLocator()).toBeVisible();

      // Navigate to the article to verify the update
      await profilePage.navigate(testUsername);
      await profilePage.waitForProfileLoaded();
      await profilePage.clickArticleByTitle(originalTitle);
      await page.waitForURL(/.*#\/article\//, { timeout: TIMEOUTS.MEDIUM });

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
      await expect(editorPage.getSuccessMessagesLocator()).toBeVisible();

      // Navigate to profile and open the article
      await profilePage.navigate(testUsername);
      await profilePage.waitForProfileLoaded();
      await profilePage.clickArticleByTitle(title);
      await page.waitForURL(/.*#\/article\//, { timeout: TIMEOUTS.MEDIUM });

      // Verify article exists
      await articlePage.waitForArticleLoaded();
      const displayedTitle = await articlePage.getTitle();
      expect(displayedTitle).toBe(title);

      // Delete the article
      await articlePage.clickDelete();

      // Verify navigation to home page after deletion
      await page.waitForURL(/.*#\/$/, { timeout: TIMEOUTS.MEDIUM });

      // Verify the article no longer appears in global feed
      await homePage.navigate();
      await homePage.clickGlobalFeed();
      await homePage.waitForArticlesLoaded();

      const articles = await homePage.getArticleTitles();
      expect(articles).not.toContain(title);
    });
  });

  test.describe('Empty State', () => {
    test('should display empty page for new user with no articles', async ({
      browser,
      profilePage,
    }) => {
      // Create a fresh new user with no articles
      const context = await browser.newContext();
      const page = await context.newPage();

      const newUsername = generateRandomUsername('emptyuser');
      const newEmail = generateRandomEmail('emptyuser');
      const newPassword = 'Test@123456';

      // Register new user
      const registerPage = new RegisterPage(page);
      await registerPage.navigate();
      await registerPage.register(newUsername, newEmail, newPassword);
      await page.waitForURL(/.*#\/login/, { timeout: TIMEOUTS.MEDIUM });

      // Login
      const { LoginPage } = await import('../src/pages/LoginPage');
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(newEmail, newPassword);
      await page.waitForURL(/.*#\/$/, { timeout: TIMEOUTS.MEDIUM });

      // Navigate to the new user's profile
      const { ProfilePage } = await import('../src/pages/ProfilePage');
      const newProfilePage = new ProfilePage(page);
      await newProfilePage.navigate(newUsername);
      await newProfilePage.waitForProfileLoaded();

      // Verify empty state message is displayed
      await expect(newProfilePage.getArticlePreviewLocator()).toContainText('No articles are here... yet.');

      await context.close();
    });
  });

  test.describe('Form Validation', () => {
    const generateLongString = (length: number): string => {
      return 'a'.repeat(length);
    };

    test('should display error when title exceeds 120 characters', async ({
      page,
      editorPage,
    }) => {
      const longTitle = generateLongString(121);
      const description = generateRandomArticleDescription();
      const body = generateRandomArticleBody();

      await editorPage.navigate();
      await editorPage.createArticle(longTitle, description, body);

      // Verify error message is displayed
      await expect(editorPage.getErrorMessagesLocator()).toBeVisible();
      const errorMessage = await editorPage.getErrorMessage();
      expect(errorMessage).toContain('Title');
      expect(errorMessage).toContain('120 characters');
    });

    test('should display error when description exceeds 255 characters', async ({
      editorPage,
    }) => {
      const title = generateRandomArticleTitle('Valid');
      const longDescription = generateLongString(256);
      const body = generateRandomArticleBody();

      await editorPage.navigate();
      await editorPage.createArticle(title, longDescription, body);

      // Verify error message is displayed
      await expect(editorPage.getErrorMessagesLocator()).toBeVisible();
      const errorMessage = await editorPage.getErrorMessage();
      expect(errorMessage).toContain('Description');
      expect(errorMessage).toContain('255 characters');
    });

    // BUG-002: TagList validation error displays "[object Object]"
    test('should display proper error when tag exceeds 120 characters', async ({
      editorPage,
    }) => {
      const title = generateRandomArticleTitle('Valid');
      const description = generateRandomArticleDescription();
      const body = generateRandomArticleBody();
      const longTag = generateLongString(121);

      await editorPage.navigate();
      await editorPage.createArticle(title, description, body, [longTag]);

      // Verify error message is displayed
      await expect(editorPage.getErrorMessagesLocator()).toBeVisible();
      const errorMessage = await editorPage.getErrorMessage();

      // BUG-002: This currently shows "[object Object]" instead of the actual error
      // Expected: should contain "120 characters"
      // Actual: contains "[object Object]"
      expect(errorMessage).toContain('Taglist');

      // This assertion documents the bug - it will fail when bug is fixed
      // Remove this and uncomment the next assertion when BUG-002 is resolved
      expect(errorMessage).toContain('[object Object]');
      // expect(errorMessage).toContain('120 characters');
    });

    test('should display multiple validation errors when multiple fields exceed limits', async ({
      editorPage,
    }) => {
      const longTitle = generateLongString(121);
      const longDescription = generateLongString(256);
      const body = generateRandomArticleBody();

      await editorPage.navigate();
      await editorPage.createArticle(longTitle, longDescription, body);

      // Verify error messages are displayed
      await expect(editorPage.getErrorMessagesLocator()).toBeVisible();
      const errorMessage = await editorPage.getErrorMessage();

      // Should contain errors for both fields
      expect(errorMessage).toContain('Title');
      expect(errorMessage).toContain('Description');
    });

    test('should allow article creation at exact character limits', async ({
      editorPage,
      profilePage,
    }) => {
      // Generate unique prefix to avoid duplicate title errors
      const uniquePrefix = Math.random().toString(36).substring(2, 10);
      // Test with exact limits (120 for title, 255 for description)
      // Title: 8 char prefix + 112 'a' chars = 120 total
      const title = uniquePrefix + generateLongString(112);
      const description = generateLongString(255);
      const body = generateRandomArticleBody();

      await editorPage.navigate();
      await editorPage.createArticle(title, description, body);

      // Should succeed - verify success message
      await expect(editorPage.getSuccessMessagesLocator()).toBeVisible();

      // Verify article was created
      await profilePage.navigate(testUsername);
      await profilePage.waitForProfileLoaded();
      const articles = await profilePage.getMyArticles();
      expect(articles).toContain(title);
    });

    test('should display required field errors when submitting with spaces only', async ({
      editorPage,
    }) => {
      // Fill all fields with spaces only
      await editorPage.navigate();
      await editorPage.fillTitle('   ');
      await editorPage.fillDescription('   ');
      await editorPage.fillBody('   ');
      await editorPage.clickPublish();

      // Verify error messages are displayed
      await expect(editorPage.getErrorMessagesLocator()).toBeVisible();
      const errorMessage = await editorPage.getErrorMessage();

      // Should contain errors for all required fields
      expect(errorMessage).toContain('Title');
      expect(errorMessage).toContain('may not be blank');
      expect(errorMessage).toContain('Description');
      expect(errorMessage).toContain('Body');
    });

    test('should display error when creating article with duplicate title', async ({
      editorPage,
    }) => {
      const duplicateTitle = generateRandomArticleTitle('Duplicate');
      const description = generateRandomArticleDescription();
      const body = generateRandomArticleBody();

      // Create first article
      await editorPage.navigate();
      await editorPage.createArticle(duplicateTitle, description, body);
      await expect(editorPage.getSuccessMessagesLocator()).toBeVisible();

      // Try to create second article with same title
      await editorPage.navigate();
      await editorPage.createArticle(duplicateTitle, description, body);

      // Verify error message is displayed
      await expect(editorPage.getErrorMessagesLocator()).toBeVisible();
      const errorMessage = await editorPage.getErrorMessage();
      expect(errorMessage).toContain('Title');
      expect(errorMessage).toContain('article with this title already exists');
    });

    test('should have Publish Article button disabled when required fields are empty', async ({
      editorPage,
    }) => {
      await editorPage.navigate();

      const publishButton = editorPage.getPublishButtonLocator();

      // Button should be visible but disabled when form is empty
      await expect(publishButton).toBeVisible();
      await expect(publishButton).toBeDisabled();

      // Fill only title - button should still be disabled
      await editorPage.fillTitle(generateRandomArticleTitle('Test'));
      await expect(publishButton).toBeDisabled();

      // Fill description - button should still be disabled
      await editorPage.fillDescription(generateRandomArticleDescription());
      await expect(publishButton).toBeDisabled();

      // Fill body - button should now be enabled
      await editorPage.fillBody(generateRandomArticleBody());
      await expect(publishButton).toBeEnabled();
    });
  });
});
