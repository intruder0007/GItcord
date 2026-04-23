import { SlashCommandBuilder } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successEmbed } from '../../utils/embeds.js';
import { handleError } from '../../handlers/errorHandler.js';

export const data = new SlashCommandBuilder()
  .setName('repo')
  .setDescription('Repository management commands')
  .addSubcommand((sub) =>
    sub
      .setName('create')
      .setDescription('Create a new GitHub repository')
      .addStringOption((opt) =>
        opt.setName('name').setDescription('Repository name').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('description').setDescription('Repository description')
      )
      .addBooleanOption((opt) =>
        opt.setName('private').setDescription('Make the repository private (default: false)')
      )
      .addBooleanOption((opt) =>
        opt.setName('auto-init').setDescription('Initialize with a README (default: true)')
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('delete')
      .setDescription('Delete a repository (requires confirmation)')
      .addStringOption((opt) =>
        opt.setName('name').setDescription('Repository name').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('List all your repositories')
      .addIntegerOption((opt) =>
        opt.setName('page').setDescription('Page number (default: 1)').setMinValue(1)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('info')
      .setDescription('Show detailed info about a repository')
      .addStringOption((opt) =>
        opt.setName('name').setDescription('Repository name').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('rename')
      .setDescription('Rename a repository')
      .addStringOption((opt) =>
        opt.setName('old-name').setDescription('Current repository name').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('new-name').setDescription('New repository name').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('fork')
      .setDescription("Fork someone else's repository")
      .addStringOption((opt) =>
        opt.setName('owner').setDescription('Owner of the repository to fork').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('repo').setDescription('Repository name to fork').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('visibility')
      .setDescription('Change repository visibility')
      .addStringOption((opt) =>
        opt
          .setName('name')
          .setDescription('Repository name')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('visibility')
          .setDescription('Set to public or private')
          .setRequired(true)
          .addChoices(
            { name: 'Public', value: 'public' },
            { name: 'Private', value: 'private' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('topics')
      .setDescription('Set topics for a repository')
      .addStringOption((opt) =>
        opt.setName('name').setDescription('Repository name').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('topics').setDescription('Comma-separated list of topics').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('star')
      .setDescription('Star a repository')
      .addStringOption((opt) =>
        opt.setName('owner').setDescription('Repository owner').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('repo').setDescription('Repository name').setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('unstar')
      .setDescription('Unstar a repository')
      .addStringOption((opt) =>
        opt.setName('owner').setDescription('Repository owner').setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('repo').setDescription('Repository name').setRequired(true)
      )
  );

// Import subcommand handlers
import { execute as createExec } from './create.js';
import { execute as deleteExec } from './delete.js';
import { execute as listExec } from './list.js';
import { execute as infoExec } from './info.js';
import { execute as renameExec } from './rename.js';
import { execute as forkExec } from './fork.js';
import { execute as visibilityExec } from './visibility.js';
import { execute as topicsExec } from './topics.js';
import { execute as starExec } from './star.js';
import { execute as unstarExec } from './unstar.js';

/**
 * Routes /repo subcommands.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const map = {
    create: createExec,
    delete: deleteExec,
    list: listExec,
    info: infoExec,
    rename: renameExec,
    fork: forkExec,
    visibility: visibilityExec,
    topics: topicsExec,
    star: starExec,
    unstar: unstarExec,
  };
  return map[sub]?.(interaction);
}
