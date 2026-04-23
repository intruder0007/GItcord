import admin from 'firebase-admin';
import { MessageFlags } from 'discord.js';

/** Maps logType string → Firebase field name */
const LOG_TYPE_MAP = {
  repo:    'repo',
  file:    'file',
  branch:  'branch',
  pr:      'pr',
  issue:   'issue',
  collab:  'collab',
  release: 'release',
  auth:    'auth',
};

/**
 * Fetches the guild config from Firebase.
 * @param {string} guildId
 * @returns {Promise<object|null>}
 */
async function getGuildConfig(guildId) {
  const db  = admin.database();
  const ref = db.ref(`guilds/${guildId}`);
  const snap = await ref.once('value');
  return snap.val();
}

/**
 * Sends a Component V2 log message to the correct log channel for the guild.
 *
 * @param {import('discord.js').Client} client     - Discord.js client
 * @param {string}                      guildId    - The guild to log in
 * @param {string}                      logType    - One of: repo|file|branch|pr|issue|collab|release|auth
 * @param {Array}                       components - Component V2 array to send (e.g. from a card factory)
 */
export async function logAction(client, guildId, logType, components) {
  try {
    if (!guildId) {
      console.warn('[LOGGER] logAction called with no guildId — skipping.');
      return;
    }

    const fieldKey = LOG_TYPE_MAP[logType];
    if (!fieldKey) {
      console.warn(`[LOGGER] Unknown logType "${logType}" — skipping.`);
      return;
    }

    // Fetch guild config from Firebase
    const config = await getGuildConfig(guildId);
    if (!config?.logChannels?.[fieldKey]) {
      console.warn(`[LOGGER] No log channel configured for type "${logType}" in guild ${guildId}.`);
      return;
    }

    const channelId = config.logChannels[fieldKey];

    // Resolve the channel from Discord's cache (or fetch it)
    let channel;
    try {
      channel = client.channels.cache.get(channelId) ?? await client.channels.fetch(channelId);
    } catch {
      console.warn(`[LOGGER] Could not resolve channel ${channelId} for guild ${guildId} — channel may have been deleted.`);
      return;
    }

    if (!channel?.isTextBased()) {
      console.warn(`[LOGGER] Channel ${channelId} is not a text channel — skipping.`);
      return;
    }

    // Send the Component V2 message
    await channel.send({
      flags: [MessageFlags.IsComponentsV2],
      components,
    });
  } catch (err) {
    // Never throw — logging must not break the main action
    console.warn(`[LOGGER] logAction failed silently for guild ${guildId}, type ${logType}:`, err.message);
  }
}
