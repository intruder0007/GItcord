import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { confirmCard, successCard, infoCard, releaseLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /release delete — deletes a release by tag name after confirmation.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo = interaction.options.getString('repo', true);
    const tag  = interaction.options.getString('tag', true);

    const { data: user } = await octokit.users.getAuthenticated();

    // Find the release by tag
    const { data: release } = await octokit.repos.getReleaseByTag({
      owner: user.login,
      repo,
      tag,
    });

    // Component V2 confirmation prompt
    await interaction.editReply({
      components: confirmCard({
        title: 'Confirm Release Deletion',
        description: `Are you sure you want to delete release **${release.name || tag}** (\`${tag}\`) from **${user.login}/${repo}**?\n\nThis **cannot be undone**.`,
      }),
    });

    try {
      const msg = await interaction.fetchReply();
      const confirmation = await msg.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: 30_000,
      });

      if (confirmation.customId === 'confirm_delete') {
        await octokit.repos.deleteRelease({
          owner: user.login,
          repo,
          release_id: release.id,
        });

        await confirmation.update({
          components: successCard({
            title: 'Release Deleted',
            description: `Release **${release.name || tag}** (\`${tag}\`) has been deleted from **${user.login}/${repo}**.`,
          }),
        });

        await logAction(interaction.client, interaction.guildId, 'release',
          releaseLogCard({
            action:      `${LOG_EMOJIS.releaseDelete} Deleted`,
            repoName:    `${user.login}/${repo}`,
            tagName:     tag,
            releaseName: release.name || tag,
            actor:       interaction.user.username,
            actorAvatar: interaction.user.displayAvatarURL(),
            timestamp:   new Date().toISOString(),
          })
        );
      } else {
        await confirmation.update({
          components: infoCard({ title: 'Cancelled', description: 'Release deletion was cancelled.' }),
        });
      }
    } catch {
      await interaction.editReply({
        components: infoCard({ title: 'Timed Out', description: 'No response received. Deletion cancelled.' }),
      });
    }
  } catch (err) {
    await handleError(interaction, err);
  }
}
