import { requireAuth } from '../../auth/requireAuth.js';
import { sendPaginatedList } from '../../utils/pagination.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /release list — lists all GitHub releases for a repository.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo = interaction.options.getString('repo', true);
    const { data: user } = await octokit.users.getAuthenticated();

    const { data: releases } = await octokit.repos.listReleases({
      owner: user.login,
      repo,
      per_page: 100,
    });

    const items = releases.map((r) => {
      const icon = r.prerelease ? '🧪' : '🚀';
      const published = r.published_at
        ? `<t:${Math.floor(new Date(r.published_at).getTime() / 1000)}:d>`
        : 'Draft';
      return `${icon} [**${r.name || r.tag_name}**](${r.html_url}) — \`${r.tag_name}\` — ${published}`;
    });

    await sendPaginatedList(
      interaction,
      `🚀 Releases — ${user.login}/${repo}`,
      items
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
