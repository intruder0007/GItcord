import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, repoLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /repo unstar
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const owner = interaction.options.getString('owner', true);
    const repo  = interaction.options.getString('repo', true);

    await octokit.activity.unstarRepoForAuthenticatedUser({ owner, repo });

    await interaction.editReply({
      components: successCard({
        title: 'Repository Unstarred',
        description: `You unstarred **${owner}/${repo}**.`,
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'repo',
      repoLogCard({
        action:      `${LOG_EMOJIS.repoUnstar} Unstarred`,
        repoName:    `${owner}/${repo}`,
        repoUrl:     `https://github.com/${owner}/${repo}`,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
