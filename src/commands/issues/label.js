import { requireAuth } from '../../auth/requireAuth.js';
import { successEmbed } from '../../utils/embeds.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /issue label — adds labels to a GitHub issue.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo     = interaction.options.getString('repo', true);
    const number   = interaction.options.getInteger('number', true);
    const rawLabels = interaction.options.getString('labels', true);
    const labels   = rawLabels.split(',').map((l) => l.trim()).filter(Boolean);

    const { data: user } = await octokit.users.getAuthenticated();
    const { data: addedLabels } = await octokit.issues.addLabels({
      owner: user.login,
      repo,
      issue_number: number,
      labels,
    });

    const labelNames = addedLabels.map((l) => `\`${l.name}\``).join(', ');
    const embed = successEmbed(
      '🏷️ Labels Added',
      `Labels have been added to issue **#${number}**.`,
      [
        { name: 'Repo', value: `${user.login}/${repo}`, inline: true },
        { name: 'Issue', value: `#${number}`, inline: true },
        { name: 'Added Labels', value: labelNames || 'None', inline: false },
      ],
      interaction.user
    );

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await handleError(interaction, err);
  }
}
