import { Octokit } from '@octokit/rest';
import { errorEmbed } from './embeds.js';

/**
 * Wraps an Octokit instance with a rate-limit hook.
 * If the rate limit is hit, it responds to the Discord interaction ephemerally
 * and throws an error to stop command execution.
 *
 * @param {Octokit} octokit
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Octokit}
 */
export function wrapWithRateLimiter(octokit, interaction) {
  octokit.hook.wrap('request', async (request, options) => {
    const response = await request(options);

    const remaining = parseInt(response.headers['x-ratelimit-remaining'] ?? '1', 10);
    const resetTs = parseInt(response.headers['x-ratelimit-reset'] ?? '0', 10);

    if (remaining === 0 && resetTs > 0) {
      const resetRelative = `<t:${resetTs}:R>`;
      const embed = errorEmbed(
        'GitHub Rate Limit Reached',
        `You've hit the GitHub API rate limit. It will reset ${resetRelative}.\n\nPlease wait before using more commands.`,
        interaction.user
      );
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [embed], flags: 64 });
        }
      } catch (_) { /* interaction may have expired */ }

      const err = new Error('GitHub API rate limit reached.');
      err.status = 429;
      throw err;
    }

    return response;
  });

  return octokit;
}

/**
 * Checks current rate limit status without making a real API call.
 * @param {Octokit} octokit
 * @returns {Promise<{ remaining: number, limit: number, resetAt: number }>}
 */
export async function getRateLimitStatus(octokit) {
  const { data } = await octokit.rateLimit.get();
  return {
    remaining: data.rate.remaining,
    limit: data.rate.limit,
    resetAt: data.rate.reset,
  };
}
