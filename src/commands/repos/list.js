import { requireAuth } from '../../auth/requireAuth.js';
import { sendPaginatedList } from '../../utils/pagination.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /repo list — lists all repositories for the authenticated user with pagination.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });

  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const startPage = interaction.options.getInteger('page') ?? 1;

    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
      type: 'all',
    });

    if (repos.length === 0) {
      await interaction.editReply({ content: 'You have no repositories.' });
      return;
    }

    const items = repos.map((r) => {
      const vis = r.private ? '🔒' : '🌐';
      const lang = r.language ? `\`${r.language}\`` : '`N/A`';
      const stars = r.stargazers_count > 0 ? ` ⭐${r.stargazers_count}` : '';
      return `${vis} **[${r.name}](${r.html_url})**${stars} — ${lang}`;
    });

    await sendPaginatedList(interaction, `📁 Your Repositories (${repos.length} total)`, items, startPage);
  } catch (err) {
    await handleError(interaction, err);
  }
}
