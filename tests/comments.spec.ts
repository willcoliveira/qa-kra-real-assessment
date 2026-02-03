import { test, expect } from '../src/fixtures/test.fixture';
import { ensureAuthenticated } from '../src/utils/auth.helper';
import {
  generateRandomArticleTitle,
  generateRandomArticleDescription,
  generateRandomArticleBody,
  generateRandomComment,
  generateRandomUsername,
  generateRandomEmail,
} from '../src/utils/testDataGenerator';
import { RegisterPage } from '../src/pages/RegisterPage';

test.describe('Comments', { tag: ['@comments'] }, () => {
  let testUsername: string;
  let testEmail: string;
  let testPassword: string;

  test.beforeAll(async ({ browser }) => {
    // Create a test user for comment tests
    const context = await browser.newContext();
    const page = await context.newPage();

    testUsername = generateRandomUsername('commentuser');
    testEmail = generateRandomEmail('commentuser');
    testPassword = 'Test@123456';

    const registerPage = new RegisterPage(page);
    await registerPage.navigate();
    await registerPage.register(testUsername, testEmail, testPassword);
    await page.waitForURL(/.*#\/login/, { timeout: 10000 });

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, testEmail, testPassword, 'comment-user');
  });

  test('should be able to add a comment to an article', async ({
    page,
    editorPage,
    articlePage,
    profilePage,
  }) => {
    // First create an article
    const title = generateRandomArticleTitle('CommentTest');
    const description = generateRandomArticleDescription();
    const body = generateRandomArticleBody();

    await editorPage.navigate();
    await editorPage.createArticle(title, description, body);

    // Wait for success message
    await expect(page.locator('.editor-page .success-messages')).toBeVisible();

    // Navigate to profile and open the article
    await profilePage.navigate(testUsername);
    await profilePage.waitForProfileLoaded();
    await profilePage.clickArticleByTitle(title);
    await page.waitForURL(/.*#\/article\//, { timeout: 10000 });

    // Add a comment
    await articlePage.waitForArticleLoaded();
    const commentText = generateRandomComment();
    await articlePage.addComment(commentText);

    // Wait for comment to appear
    await page.waitForTimeout(1000);

    // Verify comment is displayed
    const comments = await articlePage.getComments();
    expect(comments).toContain(commentText);
  });

  test('should be able to delete a comment from an article', async ({
    page,
    editorPage,
    articlePage,
    profilePage,
  }) => {
    // First create an article
    const title = generateRandomArticleTitle('DeleteComment');
    const description = generateRandomArticleDescription();
    const body = generateRandomArticleBody();

    await editorPage.navigate();
    await editorPage.createArticle(title, description, body);

    // Wait for success message
    await expect(page.locator('.editor-page .success-messages')).toBeVisible();

    // Navigate to profile and open the article
    await profilePage.navigate(testUsername);
    await profilePage.waitForProfileLoaded();
    await profilePage.clickArticleByTitle(title);
    await page.waitForURL(/.*#\/article\//, { timeout: 10000 });

    // Add a comment
    await articlePage.waitForArticleLoaded();
    const commentText = generateRandomComment();
    await articlePage.addComment(commentText);

    // Wait for comment to appear
    await page.waitForTimeout(1000);

    // Verify comment exists
    let comments = await articlePage.getComments();
    expect(comments).toContain(commentText);

    // Delete the comment
    await articlePage.deleteComment(0);

    // Wait for deletion to process
    await page.waitForTimeout(1000);

    // Verify comment is removed
    comments = await articlePage.getComments();
    expect(comments).not.toContain(commentText);
  });

  test('should display all comments on an article', async ({
    page,
    editorPage,
    articlePage,
    profilePage,
  }) => {
    // First create an article
    const title = generateRandomArticleTitle('MultiComment');
    const description = generateRandomArticleDescription();
    const body = generateRandomArticleBody();

    await editorPage.navigate();
    await editorPage.createArticle(title, description, body);

    // Wait for success message
    await expect(page.locator('.editor-page .success-messages')).toBeVisible();

    // Navigate to profile and open the article
    await profilePage.navigate(testUsername);
    await profilePage.waitForProfileLoaded();
    await profilePage.clickArticleByTitle(title);
    await page.waitForURL(/.*#\/article\//, { timeout: 10000 });

    // Add multiple comments
    await articlePage.waitForArticleLoaded();
    const comment1 = generateRandomComment();
    const comment2 = generateRandomComment();
    const comment3 = generateRandomComment();

    await articlePage.addComment(comment1);
    await page.waitForTimeout(500);
    await articlePage.addComment(comment2);
    await page.waitForTimeout(500);
    await articlePage.addComment(comment3);
    await page.waitForTimeout(1000);

    // Verify all comments are displayed
    const comments = await articlePage.getComments();
    expect(comments).toContain(comment1);
    expect(comments).toContain(comment2);
    expect(comments).toContain(comment3);
    expect(await articlePage.getCommentCount()).toBeGreaterThanOrEqual(3);
  });
});
