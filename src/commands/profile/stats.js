import { SlashCommandSubcommandBuilder } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { infoEmbed } from '../../utils/embeds.js';
import { handleError } from '../../handlers/errorHandler.js';

export const subcommand = new SlashCommandSubcommandBuilder()
  .setName('stats')
  .setDescription('Show your GitHub stats: stars, top languages, and recent activity');

/**
 * Handles /github stats — aggregates repository stats for the authenticated user.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });

  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const { data: user } = await octokit.users.getAuthenticated();

    // Fetch up to 100 repos to calculate aggregated stats
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
      type: 'owner',
    });

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count ?? 0), 0);

    // Language frequency map
    const langMap = {};
    for (const repo of repos) {
      if (repo.language) langMap[repo.language] = (langMap[repo.language] ?? 0) + 1;
    }
    const topLangs = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => `\`${lang}\` (${count} repos)`)
      .join('\n') || 'None';

    const recentRepo = repos[0];

    const fields = [
      { name: '⭐ Total Stars Received', value: String(totalStars), inline: true },
      { name: '🍴 Total Forks', value: String(totalForks), inline: true },
      { name: '📁 Total Repos', value: String(user.public_repos + (user.total_private_repos ?? 0)), inline: true },
      { name: '👥 Followers / Following', value: `${user.followers} / ${user.following}`, inline: true },
      { name: '🏢 Organizations', value: String(user.owned_private_repos ?? 'N/A'), inline: true },
      { name: '💻 Top Languages', value: topLangs, inline: false },
      {
        name: '🕐 Last Active Repo',
        value: recentRepo
          ? `[\`${recentRepo.full_name}\`](${recentRepo.html_url}) — <t:${Math.floor(new Date(recentRepo.pushed_at).getTime() / 1000)}:R>`
          : 'N/A',
        inline: false,
      },
    ];

    await interaction.editReply({
      embeds: [
        infoEmbed(
          `Stats for @${user.login}`,
          `Here's a summary of your GitHub activity:`,
          fields,
          interaction.user
        ).setThumbnail(user.avatar_url),
      ],
    });
  } catch (err) {
    await handleError(interaction, err);
  }
}
