import { SlashCommandBuilder } from 'discord.js';
import { execute as createExec } from './create.js';
import { execute as listExec }   from './list.js';
import { execute as deleteExec } from './delete.js';

export const data = new SlashCommandBuilder()
  .setName('release')
  .setDescription('Manage GitHub releases')
  .addSubcommand((sub) =>
    sub.setName('create').setDescription('Publish a new GitHub release')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('tag').setDescription('Git tag for the release (e.g. v1.0.0)').setRequired(true))
      .addStringOption((o) => o.setName('name').setDescription('Release title (defaults to tag if omitted)'))
      .addStringOption((o) => o.setName('body').setDescription('Release notes / description'))
      .addBooleanOption((o) => o.setName('prerelease').setDescription('Mark as a pre-release'))
  )
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('List all releases for a repository')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub.setName('delete').setDescription('Delete a release (requires confirmation)')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('tag').setDescription('Tag name of the release to delete').setRequired(true))
  );

/**
 * Routes /release subcommands to their handlers.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const map = { create: createExec, list: listExec, delete: deleteExec };
  return map[sub]?.(interaction);
}
