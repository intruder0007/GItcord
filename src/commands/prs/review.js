import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, prLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit     = await requireAuth(interaction);
    if (!octokit) return;
    const repo        = interaction.options.getString('repo', true);
    const pull_number = interaction.options.getInteger('number', true);
    const event       = interaction.options.getString('event', true);
    const body        = interaction.options.getString('body') ?? '';
    const { data: user } = await octokit.users.getAuthenticated();

    await octokit.pulls.createReview({ owner: user.login, repo, pull_number, event, body });

    const eventLabel = {
      APPROVE:         '✅ Approved',
      REQUEST_CHANGES: '🔄 Changes Requested',
      COMMENT:         '💬 Commented',
    };

    await interaction.editReply({
      components: successCard({
        title: 'Review Submitted',
        description: `${eventLabel[event] ?? event} on PR **#${pull_number}** in \`${user.login}/${repo}\`.`,
        fields: body ? [{ name: '💬 Review Body', value: body.slice(0, 1000) }] : [],
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'pr',
      prLogCard({
        action:      `${LOG_EMOJIS.prReview} Reviewed (${eventLabel[event] ?? event})`,
        repoName:    `${user.login}/${repo}`,
        prNumber:    pull_number,
        prTitle:     `PR #${pull_number}`,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
