import { SlashCommandBuilder } from 'discord.js';
import { execute as readExec } from './read.js';
import { execute as createExec } from './create.js';
import { execute as editExec } from './edit.js';
import { execute as deleteExec } from './delete.js';

export const data = new SlashCommandBuilder()
  .setName('file')
  .setDescription('Manage files in your repositories')
  .addSubcommand((sub) =>
    sub
      .setName('read')
      .setDescription('Read a file from a repository')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('path').setDescription('File path (e.g. src/index.js)').setRequired(true))
      .addStringOption((o) => o.setName('branch').setDescription('Branch name (default: main)'))
  )
  .addSubcommand((sub) =>
    sub
      .setName('create')
      .setDescription('Create a new file in a repository')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('path').setDescription('File path').setRequired(true))
      .addStringOption((o) => o.setName('content').setDescription('File content').setRequired(true))
      .addStringOption((o) => o.setName('message').setDescription('Commit message').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('edit')
      .setDescription('Edit an existing file in a repository')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('path').setDescription('File path').setRequired(true))
      .addStringOption((o) => o.setName('content').setDescription('New file content').setRequired(true))
      .addStringOption((o) => o.setName('message').setDescription('Commit message').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName('delete')
      .setDescription('Delete a file from a repository (requires confirmation)')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('path').setDescription('File path').setRequired(true))
      .addStringOption((o) => o.setName('message').setDescription('Commit message').setRequired(true))
  );

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const map = { read: readExec, create: createExec, edit: editExec, delete: deleteExec };
  return map[sub]?.(interaction);
}
