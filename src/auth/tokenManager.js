import crypto from 'crypto';
import { config } from '../config.js';
import { getDatabase } from 'firebase-admin/database';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(config.encryption.key, 'hex');

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * @param {string} text - Plaintext to encrypt
 * @returns {{ encrypted: string, iv: string }}
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return { encrypted: encrypted.toString('hex'), iv: iv.toString('hex') };
}

/**
 * Decrypts an AES-256-CBC encrypted string.
 * @param {string} encryptedHex - Hex-encoded encrypted string
 * @param {string} ivHex - Hex-encoded IV
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedHex, ivHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Saves or updates a user's GitHub access token in Firebase.
 * @param {string} discordUserId
 * @param {string} accessToken
 * @param {string} githubUsername
 */
export async function saveToken(discordUserId, accessToken, githubUsername) {
  const db = getDatabase();
  const { encrypted, iv } = encrypt(accessToken);
  await db.ref(`users/${discordUserId}`).set({
    githubUsername,
    encryptedAccessToken: encrypted,
    iv,
    connectedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
  });
}

/**
 * Retrieves and decrypts a user's GitHub access token.
 * @param {string} discordUserId
 * @returns {Promise<{ accessToken: string, githubUsername: string } | null>}
 */
export async function getToken(discordUserId) {
  const db = getDatabase();
  const snap = await db.ref(`users/${discordUserId}`).get();
  if (!snap.exists()) return null;
  const data = snap.val();
  const accessToken = decrypt(data.encryptedAccessToken, data.iv);
  // Update lastUsed timestamp
  await db.ref(`users/${discordUserId}/lastUsed`).set(new Date().toISOString());
  return { accessToken, githubUsername: data.githubUsername };
}

/**
 * Deletes a user's token from the database.
 * @param {string} discordUserId
 */
export async function deleteToken(discordUserId) {
  const db = getDatabase();
  await db.ref(`users/${discordUserId}`).remove();
}

/**
 * Saves an OAuth state token to Firebase with an expiry of 10 minutes.
 * @param {string} state
 * @param {string} discordUserId
 */
export async function saveOAuthState(state, discordUserId) {
  const db = getDatabase();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  await db.ref(`oauthStates/${state}`).set({
    discordUserId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

/**
 * Retrieves and validates an OAuth state token, then deletes it.
 * @param {string} state
 * @returns {Promise<string | null>} - discordUserId or null if invalid/expired
 */
export async function consumeOAuthState(state) {
  const db = getDatabase();
  const snap = await db.ref(`oauthStates/${state}`).get();
  if (!snap.exists()) return null;
  const data = snap.val();
  await db.ref(`oauthStates/${state}`).remove();
  if (new Date(data.expiresAt) < new Date()) return null;
  return data.discordUserId;
}

/**
 * Cleanup job: removes expired OAuth state entries from Firebase.
 * Should be called on a setInterval every 5 minutes.
 */
export async function cleanupExpiredStates() {
  const db = getDatabase();
  const snap = await db.ref('oauthStates').get();
  if (!snap.exists()) return;
  const now = new Date();
  const updates = {};
  snap.forEach((child) => {
    const data = child.val();
    if (new Date(data.expiresAt) < now) {
      updates[child.key] = null;
    }
  });
  if (Object.keys(updates).length > 0) {
    await db.ref('oauthStates').update(updates);
    console.log(`[TOKEN MANAGER] Cleaned up ${Object.keys(updates).length} expired OAuth states.`);
  }
}
