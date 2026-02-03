import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

interface AccountConfig {
  username: string;
  email: string;
  password: string;
}

interface SettingsConfig {
  timeout: number;
  retries: number;
}

export interface Config {
  baseUrl: string;
  apiUrl: string;
  accounts: {
    userA: AccountConfig;
    userB: AccountConfig;
  };
  settings: SettingsConfig;
}

let configCache: Config | null = null;

export function loadConfig(): Config {
  if (configCache) {
    return configCache;
  }

  const configPath = path.resolve(process.cwd(), 'config/settings.yaml');
  const fileContents = fs.readFileSync(configPath, 'utf-8');
  const config = yaml.parse(fileContents) as Config;

  // Apply environment variable overrides
  if (process.env.BASE_URL) {
    config.baseUrl = process.env.BASE_URL;
  }
  if (process.env.API_URL) {
    config.apiUrl = process.env.API_URL;
  }

  configCache = config;
  return config;
}

export function getConfig(): Config {
  return loadConfig();
}
