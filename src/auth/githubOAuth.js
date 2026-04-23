import crypto from 'crypto';
import { config } from '../config.js';
import { saveOAuthState, consumeOAuthState, saveToken } from './tokenManager.js';
import { Octokit } from '@octokit/rest';

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

const SCOPES = [
  'repo',
  'delete_repo',
  'read:user',
  'user:follow',
  'admin:repo_hook',
  'read:org',
].join(' ');

/**
 * Generates a secure random state token and stores it in Firebase.
 * @param {string} discordUserId
 * @returns {Promise<string>} - The generated state token
 */
export async function generateAuthUrl(discordUserId) {
  const state = crypto.randomBytes(32).toString('hex');
  await saveOAuthState(state, discordUserId);

  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.redirectUri,
    scope: SCOPES,
    state,
  });

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Exchanges an OAuth authorization code for an access token.
 * Validates the state token before proceeding.
 * @param {string} code - GitHub OAuth authorization code
 * @param {string} state - State token from the callback URL
 * @returns {Promise<{ discordUserId: string, accessToken: string, githubUsername: string } | null>}
 */
export async function exchangeCodeForToken(code, state) {
  const discordUserId = await consumeOAuthState(state);
  if (!discordUserId) {
    console.warn('[OAUTH] Invalid or expired state token:', state);
    return null;
  }

  // Exchange code for access_token
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code,
      redirect_uri: config.github.redirectUri,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    console.error('[OAUTH] Token exchange failed:', data);
    return null;
  }

  // Fetch GitHub user to get username
  const octokit = new Octokit({ auth: data.access_token });
  const { data: ghUser } = await octokit.users.getAuthenticated();

  await saveToken(discordUserId, data.access_token, ghUser.login);

  return {
    discordUserId,
    accessToken: data.access_token,
    githubUsername: ghUser.login,
  };
}

/**
 * Revokes a GitHub OAuth token via the GitHub API.
 * @param {string} accessToken - The token to revoke
 */
export async function revokeToken(accessToken) {
  try {
    const credentials = Buffer.from(
      `${config.github.clientId}:${config.github.clientSecret}`
    ).toString('base64');

    await fetch(
      `https://api.github.com/applications/${config.github.clientId}/token`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      }
    );
  } catch (err) {
    console.warn('[OAUTH] Token revocation error (non-fatal):', err.message);
  }
}
