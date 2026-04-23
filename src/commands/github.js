import { SlashCommandBuilder } from 'discord.js';
import { execute as loginExecute } from './auth/login.js';
import { execute as logoutExecute } from './auth/logout.js';
import { execute as whoamiExecute } from './profile/whoami.js';
import { execute as statsExecute } from './profile/stats.js';

export const data = new SlashCommandBuilder()
  .setName('github')
  .setDescription('Manage your GitHub account')
  .addSubcommand((sub) =>
    sub.setName('login').setDescription('Connect your GitHub account via OAuth')
  )
  .addSubcommand((sub) =>
    sub.setName('logout').setDescription('Disconnect your GitHub account')
  )
  .addSubcommand((sub) =>
    sub.setName('whoami').setDescription('Show your connected GitHub profile')
  )
  .addSubcommand((sub) =>
    sub.setName('stats').setDescription('Show your GitHub stats and top languages')
  );

/**
 * Routes /github subcommands to their respective handlers.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  switch (sub) {
    case 'login': return loginExecute(interaction);
    case 'logout': return logoutExecute(interaction);
    case 'whoami': return whoamiExecute(interaction);
    case 'stats': return statsExecute(interaction);
  }
}
