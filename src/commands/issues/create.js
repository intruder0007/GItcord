import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, issueLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /issue create — creates a new GitHub issue.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo      = interaction.options.getString('repo', true);
    const title     = interaction.options.getString('title', true);
    const body      = interaction.options.getString('body') ?? '';
    const rawLabels = interaction.options.getString('labels') ?? '';
    const labels    = rawLabels ? rawLabels.split(',').map((l) => l.trim()).filter(Boolean) : [];

    const { data: user } = await octokit.users.getAuthenticated();
    const { data: issue } = await octokit.issues.create({
      owner: user.login,
      repo,
      title,
      body,
      labels,
    });

    await interaction.editReply({
      components: successCard({
        title: 'Issue Created',
        description: `Issue **[#${issue.number} — ${issue.title}](${issue.html_url})** has been opened.`,
        fields: [
          { name: 'Repo',   value: `${user.login}/${repo}` },
          { name: 'Labels', value: labels.length ? labels.join(', ') : 'None' },
        ],
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'issue',
      issueLogCard({
        action:      `${LOG_EMOJIS.issueOpen} Opened`,
        repoName:    `${user.login}/${repo}`,
        issueNumber: issue.number,
        issueTitle:  issue.title,
        issueUrl:    issue.html_url,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        details:     labels.length ? `Labels: ${labels.join(', ')}` : undefined,
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
