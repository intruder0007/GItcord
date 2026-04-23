import { MessageFlags } from 'discord.js';
import { errorCard } from '../utils/components.js';

const STATUS_MESSAGES = {
  401: 'GitHub token expired. Please run `/github login` again.',
  403: "You don't have permission for this action on GitHub.",
  404: 'Resource not found. Check the repo name and try again.',
  422: null, // dynamic — uses error.message
  429: 'GitHub API rate limit reached. Please wait before retrying.',
};

/**
 * Handles errors from Octokit API calls and Discord interactions.
 * Maps GitHub HTTP status codes to user-friendly messages.
 * Always replies ephemerally using Component V2.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {Error & { status?: number }} error
 */
export async function handleError(interaction, error) {
  const timestamp = new Date().toISOString();
  console.error(`[ERROR] [${timestamp}]`, {
    command: interaction.commandName,
    user: interaction.user.tag,
    error: error.message,
    stack: error.stack,
  });

  const status = error.status;
  let description;

  if (status) {
    if (STATUS_MESSAGES[status] !== undefined) {
      description = STATUS_MESSAGES[status] ?? `GitHub rejected this request: ${error.message}`;
    } else if (status >= 500) {
      description = 'GitHub is having issues right now. Try again later.';
    } else {
      description = `Unexpected error (${status}): ${error.message}`;
    }
  } else {
    description = error.message || 'An unexpected error occurred.';
  }

  const components = errorCard({ title: 'Command Failed', description });

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ components, embeds: [] });
    } else {
      await interaction.reply({
        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
        components,
      });
    }
  } catch (replyErr) {
    console.error(`[ERROR] Failed to send error card:`, replyErr.message);
  }
}
