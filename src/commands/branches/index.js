import { SlashCommandBuilder } from 'discord.js';
import { execute as listExec } from './list.js';
import { execute as createExec } from './create.js';
import { execute as deleteExec } from './delete.js';
import { execute as protectExec } from './protect.js';

export const data = new SlashCommandBuilder()
  .setName('branch')
  .setDescription('Manage repository branches')
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('List all branches in a repository')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('create')
      .setDescription('Create a new branch')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('name').setDescription('New branch name').setRequired(true))
      .addStringOption((o) => o.setName('from-branch').setDescription('Base branch (default: main)'))
  )
  .addSubcommand((sub) =>
    sub
      .setName('delete')
      .setDescription('Delete a branch (requires confirmation)')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('name').setDescription('Branch name').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('protect')
      .setDescription('Enable or disable branch protection rules')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('name').setDescription('Branch name').setRequired(true))
      .addBooleanOption((o) => o.setName('enable').setDescription('Enable protection (true) or disable (false)').setRequired(true))
  );

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const map = { list: listExec, create: createExec, delete: deleteExec, protect: protectExec };
  return map[sub]?.(interaction);
}
