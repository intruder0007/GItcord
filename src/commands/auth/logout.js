import { SlashCommandSubcommandBuilder, MessageFlags } from 'discord.js';
import { getToken, deleteToken } from '../../auth/tokenManager.js';
import { revokeToken } from '../../auth/githubOAuth.js';
import { successCard, errorCard, authLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

export const subcommand = new SlashCommandSubcommandBuilder()
  .setName('logout')
  .setDescription('Disconnect your GitHub account from this bot');

/**
 * Handles /github logout — revokes GitHub token and removes it from the database.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

  try {
    const tokenData = await getToken(interaction.user.id);
    if (!tokenData) {
      return interaction.editReply({
        components: errorCard({
          title: 'Not Logged In',
          description: 'You have no GitHub account connected.',
        }),
      });
    }

    const { githubUsername } = tokenData;

    // Revoke token on GitHub's side first
    await revokeToken(tokenData.accessToken);

    // Delete from database
    await deleteToken(interaction.user.id);

    await interaction.editReply({
      components: successCard({
        title: 'Disconnected',
        description:
          `Your GitHub account **@${githubUsername}** has been unlinked.\n\n` +
          'All stored tokens have been securely deleted and revoked.',
      }),
    });

    // Fire auth log
    await logAction(
      interaction.client,
      interaction.guildId,
      'auth',
      authLogCard({
        action:          `${LOG_EMOJIS.authUnlink} Unlinked`,
        discordUsername: interaction.user.username,
        githubUsername,
        actorAvatar:     `https://avatars.githubusercontent.com/${githubUsername}`,
        timestamp:       new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
