import { SlashCommandBuilder } from 'discord.js';
import { execute as createExec } from './create.js';
import { execute as listExec }   from './list.js';
import { execute as closeExec }  from './close.js';
import { execute as assignExec } from './assign.js';
import { execute as labelExec }  from './label.js';

export const data = new SlashCommandBuilder()
  .setName('issue')
  .setDescription('Manage GitHub issues')
  .addSubcommand((sub) =>
    sub.setName('create').setDescription('Open a new issue')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('title').setDescription('Issue title').setRequired(true))
      .addStringOption((o) => o.setName('body').setDescription('Issue description'))
      .addStringOption((o) => o.setName('labels').setDescription('Comma-separated labels'))
  )
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('List issues in a repository')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) =>
        o.setName('state').setDescription('Filter by state')
          .addChoices(
            { name: 'Open', value: 'open' },
            { name: 'Closed', value: 'closed' },
            { name: 'All', value: 'all' }
          )
      )
  )
  .addSubcommand((sub) =>
    sub.setName('close').setDescription('Close an issue')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addIntegerOption((o) => o.setName('number').setDescription('Issue number').setRequired(true).setMinValue(1))
  )
  .addSubcommand((sub) =>
    sub.setName('assign').setDescription('Assign a user to an issue')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addIntegerOption((o) => o.setName('number').setDescription('Issue number').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('assignee').setDescription('GitHub username to assign').setRequired(true))
  )
  .addSubcommand((sub) =>
    sub.setName('label').setDescription('Add labels to an issue')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addIntegerOption((o) => o.setName('number').setDescription('Issue number').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('labels').setDescription('Comma-separated labels to add').setRequired(true))
  );

/**
 * Routes /issue subcommands to their handlers.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const map = {
    create: createExec,
    list:   listExec,
    close:  closeExec,
    assign: assignExec,
    label:  labelExec,
  };
  return map[sub]?.(interaction);
}
