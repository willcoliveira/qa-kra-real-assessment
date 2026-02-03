import { test, expect } from '../src/fixtures/test.fixture';
import { generateRandomEmail, generateRandomUsername } from '../src/utils/testDataGenerator';

test.describe('Authentication', { tag: ['@auth'] }, () => {
  test.describe('Sign Up', () => {
    test('should be able to register a new user successfully', async ({
      page,
      registerPage,
      config,
    }) => {
      const username = generateRandomUsername('testuser');
      const email = generateRandomEmail('testuser');
      const password = config.accounts.userA.password;

      await registerPage.navigate();
      await registerPage.register(username, email, password);

      // Verify success message is displayed
      await expect(page.locator('.auth-page .success-messages')).toBeVisible();
      const successMessage = await registerPage.getSuccessMessage();
      expect(successMessage).toContain('Registration successful');

      // Verify redirect to login page
      await page.waitForURL(/.*#\/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/.*#\/login/);
    });

    test('should not be able to register with an existing email', async ({
      page,
      registerPage,
      config,
    }) => {
      // First, register a user
      const username1 = generateRandomUsername('testuser');
      const email = generateRandomEmail('duplicate');
      const password = config.accounts.userA.password;

      await registerPage.navigate();
      await registerPage.register(username1, email, password);
      await page.waitForURL(/.*#\/login/, { timeout: 10000 });

      // Try to register another user with the same email
      const username2 = generateRandomUsername('testuser');
      await registerPage.navigate();
      await registerPage.register(username2, email, password);

      // Verify error message is displayed
      await expect(page.locator('.auth-page .error-messages').first()).toBeVisible();
      const errorMessage = await registerPage.getErrorMessage();
      expect(errorMessage.toLowerCase()).toContain('email');
    });
  });

  test.describe('Login', () => {
    test('should be able to login with valid credentials successfully', async ({
      page,
      registerPage,
      loginPage,
      config,
    }) => {
      // First, register a new user
      const username = generateRandomUsername('logintest');
      const email = generateRandomEmail('logintest');
      const password = config.accounts.userA.password;

      await registerPage.navigate();
      await registerPage.register(username, email, password);
      await page.waitForURL(/.*#\/login/, { timeout: 10000 });

      // Now login with the registered user
      await loginPage.navigate();
      await loginPage.login(email, password);

      // Verify successful login by checking navigation to home page
      await expect(page).toHaveURL(/.*#\/$/);

      // Verify user is logged in by checking for user-specific elements in header
      await expect(page.getByRole('link', { name: 'New Article' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
      await expect(page.getByRole('link', { name: username })).toBeVisible();
    });

    test('should not be able to login with wrong password - expect error message', async ({
      page,
      registerPage,
      loginPage,
      config,
    }) => {
      // First, register a new user
      const username = generateRandomUsername('wrongpass');
      const email = generateRandomEmail('wrongpass');
      const password = config.accounts.userA.password;

      await registerPage.navigate();
      await registerPage.register(username, email, password);
      await page.waitForURL(/.*#\/login/, { timeout: 10000 });

      // Try to login with wrong password
      await loginPage.navigate();
      await loginPage.fillEmail(email);
      await loginPage.fillPassword('WrongPassword123!');
      await loginPage.clickSignIn();

      // Verify error message is displayed
      await expect(page.locator('.auth-page .error-messages').first()).toBeVisible();
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    });

    test('should not be able to login with non-existent email', async ({ page, loginPage }) => {
      const nonExistentEmail = generateRandomEmail('nonexistent');

      await loginPage.navigate();
      await loginPage.fillEmail(nonExistentEmail);
      await loginPage.fillPassword('SomePassword123!');
      await loginPage.clickSignIn();

      // Verify error message is displayed
      await expect(page.locator('.auth-page .error-messages').first()).toBeVisible();
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage.length).toBeGreaterThan(0);
    });
  });
});
