import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, repoLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /repo visibility
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const name       = interaction.options.getString('name', true);
    const visibility = interaction.options.getString('visibility', true);
    const { data: user } = await octokit.users.getAuthenticated();

    await octokit.repos.update({
      owner: user.login,
      repo: name,
      private: visibility === 'private',
    });

    const icon = visibility === 'private' ? '🔒' : '🌐';

    await interaction.editReply({
      components: successCard({
        title: 'Visibility Updated',
        description: `\`${user.login}/${name}\` is now **${icon} ${visibility}**.`,
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'repo',
      repoLogCard({
        action:      `${LOG_EMOJIS.repoVisibility} Visibility Changed`,
        repoName:    `${user.login}/${name}`,
        repoUrl:     `https://github.com/${user.login}/${name}`,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        details:     `Changed to **${icon} ${visibility}**`,
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
