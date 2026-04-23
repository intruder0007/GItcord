import { existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Loads top-level command modules from the commands/ directory.
 * Each command file must export { data, execute }.
 * @returns {Promise<Collection<string, object>>} - Map of command name → command module
 */
export async function loadCommands() {
  const commands = new Collection();
  const commandsPath = join(__dirname, '..', 'commands');

  const loadCommandFile = async (filePath) => {
    try {
      const module = await import(`file://${filePath}`);
      if (!module.data || !module.execute) {
        console.warn(`[COMMANDS] Skipping ${filePath}: missing data or execute export`);
        return;
      }
      const name = module.data.name;
      commands.set(name, module);
      console.log(`[COMMANDS] Loaded: /${name}`);
    } catch (err) {
      console.error(`[COMMANDS] Failed to load ${filePath}:`, err.message);
    }
  };

  const entries = readdirSync(commandsPath);
  for (const entry of entries) {
    const fullPath = join(commandsPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const indexPath = join(fullPath, 'index.js');
      if (existsSync(indexPath)) {
        await loadCommandFile(indexPath);
      }
    } else if (entry.endsWith('.js')) {
      await loadCommandFile(fullPath);
    }
  }

  console.log(`[COMMANDS] Total commands loaded: ${commands.size}`);
  return commands;
}
