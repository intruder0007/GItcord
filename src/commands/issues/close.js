import { requireAuth } from '../../auth/requireAuth.js';
import { successEmbed } from '../../utils/embeds.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /issue close — closes an open GitHub issue.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo   = interaction.options.getString('repo', true);
    const number = interaction.options.getInteger('number', true);

    const { data: user } = await octokit.users.getAuthenticated();
    const { data: issue } = await octokit.issues.update({
      owner: user.login,
      repo,
      issue_number: number,
      state: 'closed',
    });

    const embed = successEmbed(
      '🔒 Issue Closed',
      `Issue **#${issue.number}** has been closed.`,
      [
        { name: 'Title', value: issue.title, inline: true },
        { name: 'Repo', value: `${user.login}/${repo}`, inline: true },
        { name: 'URL', value: `[View Issue](${issue.html_url})`, inline: false },
      ],
      interaction.user
    );

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await handleError(interaction, err);
  }
}
