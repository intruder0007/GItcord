import 'dotenv/config';
import { Client, GatewayIntentBits, Events, MessageFlags } from 'discord.js';
import admin from 'firebase-admin';
import { config } from './config.js';
import { startOAuthServer } from './auth/oauthServer.js';
import { loadCommands } from './handlers/commandHandler.js';
import { cleanupExpiredStates } from './auth/tokenManager.js';
import { errorCard } from './utils/components.js';

// ─── Firebase Initialization ──────────────────────────────────────────────────
let serviceAccount;
try {
  serviceAccount = JSON.parse(config.firebase.serviceAccountKey);
} catch {
  console.error('[BOT] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is a valid JSON string.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.firebase.databaseUrl,
});
console.log('[BOT] Firebase initialized.');

// ─── Discord Client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
});

// ─── Load Commands ────────────────────────────────────────────────────────────
const commands = await loadCommands();

// ─── Command Interaction Handler ──────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[BOT] Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[ERROR] ${new Date().toISOString()} — Unhandled error in command /${interaction.commandName}:`, err);
    const components = errorCard({ title: 'Unexpected Error', description: 'An unexpected error occurred. Please try again.' });
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ components, embeds: [], content: null });
      } else {
        await interaction.reply({ components, flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
      }
    } catch { /* ignore secondary errors */ }
  }
});

// ─── Client Ready ─────────────────────────────────────────────────────────────
client.once(Events.ClientReady, (c) => {
  console.log(`[BOT] Discord bot is online as ${c.user.tag}`);
  console.log(`[BOT] Serving ${c.guilds.cache.size} guild(s).`);

  // Start the OAuth state cleanup job (runs every 5 minutes)
  setInterval(async () => {
    try {
      await cleanupExpiredStates();
    } catch (err) {
      console.error('[BOT] OAuth state cleanup failed:', err.message);
    }
  }, 5 * 60 * 1000);
});

// ─── Client Error Handler ─────────────────────────────────────────────────────
client.on(Events.Error, (err) => {
  console.error(`[ERROR] ${new Date().toISOString()} — Discord client error:`, err);
});

// ─── Unhandled Rejection / Exception Guards ───────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[ERROR] ${new Date().toISOString()} — Unhandled Promise Rejection at:`, promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error(`[ERROR] ${new Date().toISOString()} — Uncaught Exception:`, err);
  process.exit(1);
});

// ─── Start OAuth Express Server ───────────────────────────────────────────────
const { server: httpServer } = await startOAuthServer(client);

// ─── Login to Discord ─────────────────────────────────────────────────────────
await client.login(config.discord.token);

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
/**
 * Gracefully shuts down the bot by destroying the Discord client,
 * closing the HTTP server, and deleting the Firebase app.
 */
async function shutdown(signal) {
  console.log(`\n[BOT] Received ${signal}. Shutting down gracefully…`);
  try {
    client.destroy();
    console.log('[BOT] Discord client destroyed.');
  } catch { /* ignore */ }
  try {
    await new Promise((resolve, reject) => httpServer.close((err) => err ? reject(err) : resolve()));
    console.log('[BOT] HTTP server closed.');
  } catch { /* ignore */ }
  try {
    await admin.app().delete();
    console.log('[BOT] Firebase connection closed.');
  } catch { /* ignore */ }
  process.exit(0);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
