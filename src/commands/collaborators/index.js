import { SlashCommandBuilder } from 'discord.js';
import { execute as addExec }    from './add.js';
import { execute as removeExec } from './remove.js';
import { execute as listExec }   from './list.js';

export const data = new SlashCommandBuilder()
  .setName('collab')
  .setDescription('Manage repository collaborators')
  .addSubcommand((sub) =>
    sub.setName('add').setDescription('Add a collaborator to a repository')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('username').setDescription('GitHub username to add').setRequired(true))
      .addStringOption((o) =>
        o.setName('permission').setDescription('Permission level (default: push)')
          .addChoices(
            { name: 'Pull (read-only)', value: 'pull' },
            { name: 'Push (read & write)', value: 'push' },
            { name: 'Maintain', value: 'maintain' },
            { name: 'Admin', value: 'admin' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub.setName('remove').setDescription('Remove a collaborator from a repository')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('username').setDescription('GitHub username to remove').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('List all collaborators on a repository')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
  );

/**
 * Routes /collab subcommands to their handlers.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const map = { add: addExec, remove: removeExec, list: listExec };
  return map[sub]?.(interaction);
}
