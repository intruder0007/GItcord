import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, collabLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /collab remove — removes a collaborator from a repository.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit  = await requireAuth(interaction);
    if (!octokit) return;

    const repo     = interaction.options.getString('repo', true);
    const username = interaction.options.getString('username', true);

    const { data: user } = await octokit.users.getAuthenticated();
    await octokit.repos.removeCollaborator({
      owner: user.login,
      repo,
      username,
    });

    await interaction.editReply({
      components: successCard({
        title: 'Collaborator Removed',
        description: `**${username}** has been removed from **${user.login}/${repo}**.`,
        fields: [
          { name: 'Repo',         value: `${user.login}/${repo}` },
          { name: 'Removed User', value: username },
        ],
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'collab',
      collabLogCard({
        action:      `${LOG_EMOJIS.collabRemove} Removed`,
        repoName:    `${user.login}/${repo}`,
        targetUser:  username,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
