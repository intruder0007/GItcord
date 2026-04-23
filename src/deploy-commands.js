import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Recursively collects all command `data` (SlashCommandBuilder) objects
 * from index.js files in the commands/ directory.
 * Only index.js files at one level of depth are registered as top-level commands.
 * @returns {Promise<object[]>} - Array of JSON-serialized slash command definitions
 */
async function collectCommandData() {
  const commandsPath = join(__dirname, 'commands');
  const entries = readdirSync(commandsPath);
  const commandsJSON = [];

  for (const entry of entries) {
    const fullPath = join(commandsPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Load the index.js from each subdirectory (e.g. commands/repos/index.js)
      const indexPath = join(fullPath, 'index.js');
      try {
        const module = await import(`file://${indexPath}`);
        if (module.data) {
          commandsJSON.push(module.data.toJSON());
          console.log(`[DEPLOY] Queued subcommand group: /${module.data.name}`);
        }
      } catch (err) {
        console.warn(`[DEPLOY] Skipping ${indexPath}: ${err.message}`);
      }
    } else if (entry.endsWith('.js')) {
      // Top-level command files (e.g. commands/github.js)
      try {
        const module = await import(`file://${fullPath}`);
        if (module.data) {
          commandsJSON.push(module.data.toJSON());
          console.log(`[DEPLOY] Queued top-level command: /${module.data.name}`);
        }
      } catch (err) {
        console.warn(`[DEPLOY] Skipping ${fullPath}: ${err.message}`);
      }
    }
  }

  return commandsJSON;
}

async function main() {
  console.log('[DEPLOY] Collecting slash commands…');
  const commandsJSON = await collectCommandData();
  console.log(`[DEPLOY] Total commands to register: ${commandsJSON.length}`);

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    console.log('[DEPLOY] Pushing commands to Discord API…');

    let data;
    if (config.discord.guildId) {
      // Guild-scoped registration (instant, use during development)
      data = await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commandsJSON }
      );
      console.log(`[DEPLOY] ✅ Registered ${data.length} guild command(s) to guild ${config.discord.guildId}.`);
    } else {
      // Global registration (takes up to 1 hour to propagate)
      data = await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commandsJSON }
      );
      console.log(`[DEPLOY] ✅ Registered ${data.length} global command(s).`);
    }
  } catch (err) {
    console.error('[DEPLOY] ❌ Failed to register commands:', err);
    process.exit(1);
  }
}

main();
