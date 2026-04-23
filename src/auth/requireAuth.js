import { Octokit } from '@octokit/rest';
import { getToken } from '../auth/tokenManager.js';
import { wrapWithRateLimiter } from '../utils/rateLimiter.js';
import { errorEmbed } from '../utils/embeds.js';

/**
 * Middleware-like helper that checks if the Discord user has a linked GitHub account.
 * If authenticated, returns an Octokit instance. If not, sends an ephemeral error and returns null.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<Octokit | null>}
 */
export async function requireAuth(interaction) {
  const tokenData = await getToken(interaction.user.id);

  if (!tokenData) {
    const embed = errorEmbed(
      'Not Authenticated',
      'You haven\'t linked your GitHub account yet.\nRun `/github login` to get started.',
      interaction.user
    );
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], flags: 64 });
      }
    } catch (_) { /* ignore */ }
    return null;
  }

  const octokit = new Octokit({ auth: tokenData.accessToken });
  wrapWithRateLimiter(octokit, interaction);
  return octokit;
}
