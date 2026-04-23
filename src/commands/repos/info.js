import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { infoCard } from '../../utils/components.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /repo info — shows detailed info about a specific repository.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const name = interaction.options.getString('name', true);
    const { data: user } = await octokit.users.getAuthenticated();
    const { data: repo } = await octokit.repos.get({ owner: user.login, repo: name });

    const topics   = repo.topics?.length ? repo.topics.map((t) => `\`${t}\``).join(', ') : 'None';
    const lastPush = repo.pushed_at
      ? `<t:${Math.floor(new Date(repo.pushed_at).getTime() / 1000)}:R>`
      : 'Never';

    await interaction.editReply({
      components: infoCard({
        title: `📁 ${repo.full_name}`,
        description: `[View on GitHub](${repo.html_url})\n${repo.description || ''}`,
        fields: [
          { name: '⭐ Stars',         value: String(repo.stargazers_count) },
          { name: '🍴 Forks',         value: String(repo.forks_count) },
          { name: '🐛 Open Issues',   value: String(repo.open_issues_count) },
          { name: '💻 Language',      value: repo.language || 'N/A' },
          { name: '🔒 Visibility',    value: repo.private ? 'Private' : 'Public' },
          { name: '📂 Default Branch',value: repo.default_branch },
          { name: '📄 License',       value: repo.license?.name || 'None' },
          { name: '🕐 Last Push',     value: lastPush },
          { name: '🏷️ Topics',        value: topics },
        ],
      }),
    });
  } catch (err) {
    await handleError(interaction, err);
  }
}
