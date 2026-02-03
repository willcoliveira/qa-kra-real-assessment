import * as fs from 'fs';
import * as path from 'path';
import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const STORAGE_DIR = 'storage';
const SESSION_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

function getStoragePath(userId: string): string {
  return path.join(STORAGE_DIR, `auth-${userId}.json`);
}

export async function ensureAuthenticated(
  page: Page,
  email: string,
  password: string,
  userId: string = 'default'
): Promise<void> {
  const storagePath = getStoragePath(userId);

  // Ensure storage directory exists
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  // Check if valid storage state exists
  if (isStorageStateValid(storagePath)) {
    // Load existing session
    const storageState = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));

    // Set localStorage items from storage state
    if (storageState.origins && storageState.origins.length > 0) {
      await page.goto('/');
      for (const origin of storageState.origins) {
        for (const item of origin.localStorage) {
          await page.evaluate(
            ([key, value]) => {
              localStorage.setItem(key, value);
            },
            [item.name, item.value]
          );
        }
      }
      // Reload to apply the session
      await page.reload();
    }
    return;
  }

  // No valid session - perform login
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login(email, password);

  // Wait for navigation to complete
  await page.waitForURL(/.*#\/$/, { timeout: 15000 });

  // Save new session
  await page.context().storageState({ path: storagePath });
}

function isStorageStateValid(storagePath: string): boolean {
  try {
    if (!fs.existsSync(storagePath)) return false;

    const stats = fs.statSync(storagePath);
    const fileAge = Date.now() - stats.mtimeMs;

    // Check if file is too old
    if (fileAge > SESSION_MAX_AGE_MS) return false;

    // Check if file has valid content
    const content = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));

    // Check for JWT token in localStorage
    if (content.origins && content.origins.length > 0) {
      for (const origin of content.origins) {
        const hasToken = origin.localStorage?.some(
          (item: { name: string; value: string }) =>
            item.name === 'jwtToken' && item.value && item.value.length > 0
        );
        if (hasToken) return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function clearStorageState(userId: string = 'default'): void {
  const storagePath = getStoragePath(userId);
  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath);
  }
}

export function clearAllStorageStates(): void {
  if (fs.existsSync(STORAGE_DIR)) {
    const files = fs.readdirSync(STORAGE_DIR);
    for (const file of files) {
      if (file.startsWith('auth-') && file.endsWith('.json')) {
        fs.unlinkSync(path.join(STORAGE_DIR, file));
      }
    }
  }
}
