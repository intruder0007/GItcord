import { SlashCommandBuilder } from 'discord.js';
import { execute as createExec } from './create.js';
import { execute as listExec } from './list.js';
import { execute as mergeExec } from './merge.js';
import { execute as closeExec } from './close.js';
import { execute as reviewExec } from './review.js';

export const data = new SlashCommandBuilder()
  .setName('pr')
  .setDescription('Manage pull requests')
  .addSubcommand((sub) =>
    sub.setName('create').setDescription('Open a new pull request')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('title').setDescription('PR title').setRequired(true))
      .addStringOption((o) => o.setName('head').setDescription('Head branch (your changes)').setRequired(true))
      .addStringOption((o) => o.setName('base').setDescription('Base branch (target)').setRequired(true))
      .addStringOption((o) => o.setName('body').setDescription('PR description'))
  )
  .addSubcommand((sub) =>
    sub.setName('list').setDescription('List pull requests')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addStringOption((o) => o.setName('state').setDescription('Filter by state')
        .addChoices({ name: 'Open', value: 'open' }, { name: 'Closed', value: 'closed' }, { name: 'All', value: 'all' }))
  )
  .addSubcommand((sub) =>
    sub.setName('merge').setDescription('Merge a pull request')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addIntegerOption((o) => o.setName('number').setDescription('PR number').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('method').setDescription('Merge method')
        .addChoices({ name: 'Merge', value: 'merge' }, { name: 'Squash', value: 'squash' }, { name: 'Rebase', value: 'rebase' }))
  )
  .addSubcommand((sub) =>
    sub.setName('close').setDescription('Close a pull request without merging')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addIntegerOption((o) => o.setName('number').setDescription('PR number').setRequired(true).setMinValue(1))
  )
  .addSubcommand((sub) =>
    sub.setName('review').setDescription('Submit a pull request review')
      .addStringOption((o) => o.setName('repo').setDescription('Repository name').setRequired(true))
      .addIntegerOption((o) => o.setName('number').setDescription('PR number').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('event').setDescription('Review type').setRequired(true)
        .addChoices(
          { name: 'Approve', value: 'APPROVE' },
          { name: 'Request Changes', value: 'REQUEST_CHANGES' },
          { name: 'Comment', value: 'COMMENT' }
        ))
      .addStringOption((o) => o.setName('body').setDescription('Review comment body'))
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const map = { create: createExec, list: listExec, merge: mergeExec, close: closeExec, review: reviewExec };
  return map[sub]?.(interaction);
}
