import { requireAuth } from '../../auth/requireAuth.js';
import { successEmbed } from '../../utils/embeds.js';
import { handleError } from '../../handlers/errorHandler.js';

export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;
    const repo = interaction.options.getString('repo', true);
    const pull_number = interaction.options.getInteger('number', true);
    const merge_method = interaction.options.getString('method') ?? 'merge';
    const { data: user } = await octokit.users.getAuthenticated();

    const { data: result } = await octokit.pulls.merge({
      owner: user.login, repo, pull_number, merge_method,
    });

    await interaction.editReply({
      embeds: [
        successEmbed(
          'Pull Request Merged',
          `PR #${pull_number} has been merged using the **${merge_method}** strategy.`,
          [{ name: '🔗 SHA', value: `\`${result.sha?.slice(0, 7) ?? 'N/A'}\``, inline: true }],
          interaction.user
        ),
      ],
    });
  } catch (err) {
    await handleError(interaction, err);
  }
}
