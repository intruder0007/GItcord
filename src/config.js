'use strict';
import 'dotenv/config';

/**
 * Centralized configuration loaded from environment variables.
 * Throws at startup if any required variable is missing.
 */

/**
 * @param {string} key - Environment variable name
 * @param {string} [fallback] - Optional default value
 * @returns {string}
 */
function required(key, fallback) {
  const val = process.env[key] ?? fallback;
  if (!val) {
    console.error(`[CONFIG] Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return val;
}

export const config = {
  discord: {
    token: required('DISCORD_TOKEN'),
    clientId: required('DISCORD_CLIENT_ID'),
    guildId: process.env.DISCORD_GUILD_ID ?? null,
  },
  github: {
    clientId: required('GITHUB_CLIENT_ID'),
    clientSecret: required('GITHUB_CLIENT_SECRET'),
    redirectUri: required('GITHUB_REDIRECT_URI', 'http://localhost:3000/callback'),
  },
  encryption: {
    key: required('ENCRYPTION_KEY'),
  },
  firebase: {
    databaseUrl: required('FIREBASE_DATABASE_URL'),
    serviceAccountKey: required('FIREBASE_SERVICE_ACCOUNT_KEY'),
  },
  server: {
    port: parseInt(process.env.PORT ?? '3000', 10),
  },
};
