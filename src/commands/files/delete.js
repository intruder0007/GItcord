import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, fileLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { confirmAndDelete } from '../repos/delete.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /file delete — fetches SHA automatically, requires confirmation.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo    = interaction.options.getString('repo', true);
    const path    = interaction.options.getString('path', true);
    const message = interaction.options.getString('message', true);
    const { data: user } = await octokit.users.getAuthenticated();

    // Fetch SHA before confirmation
    const { data: existing } = await octokit.repos.getContent({
      owner: user.login,
      repo,
      path,
    });
    const sha = Array.isArray(existing) ? null : existing.sha;
    if (!sha) throw Object.assign(new Error('Path is a directory.'), { status: 422 });

    await confirmAndDelete(interaction, path, async () => {
      await octokit.repos.deleteFile({
        owner: user.login,
        repo,
        path,
        message,
        sha,
      });

      await interaction.editReply({
        components: successCard({
          title: 'File Deleted',
          description: `\`${path}\` has been deleted from **${user.login}/${repo}**.`,
        }),
      });

      await logAction(interaction.client, interaction.guildId, 'file',
        fileLogCard({
          action:        `${LOG_EMOJIS.fileDelete} Deleted`,
          repoName:      `${user.login}/${repo}`,
          filePath:      path,
          actor:         interaction.user.username,
          actorAvatar:   interaction.user.displayAvatarURL(),
          commitMessage: message,
          timestamp:     new Date().toISOString(),
        })
      );
    });
  } catch (err) {
    await handleError(interaction, err);
  }
}
