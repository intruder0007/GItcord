import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { confirmCard, successCard, infoCard, repoLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Shared Component V2 confirmation flow for destructive delete actions.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} itemName - Display name of the item being deleted
 * @param {Function} onConfirm - Async callback executed if user confirms
 */
export async function confirmAndDelete(interaction, itemName, onConfirm) {
  await interaction.editReply({
    components: confirmCard({
      title: 'Confirm Deletion',
      description: `Are you sure you want to delete \`${itemName}\`?\n\n**This action cannot be undone.**`,
    }),
  });

  try {
    const reply = await interaction.fetchReply();
    const i = await reply.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 30_000,
      filter: (btn) => btn.user.id === interaction.user.id,
    });

    if (i.customId === 'confirm_delete') {
      await i.update({ components: [] });
      await onConfirm();
    } else {
      await i.update({
        components: infoCard({ title: 'Cancelled', description: 'Deletion was cancelled. No changes were made.' }),
      });
    }
  } catch {
    await interaction.editReply({
      components: infoCard({ title: 'Timed Out', description: 'Action cancelled — no response within 30 seconds.' }),
    });
  }
}

/**
 * Handles /repo delete
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const name = interaction.options.getString('name', true);
    const { data: user } = await octokit.users.getAuthenticated();

    await confirmAndDelete(interaction, `${user.login}/${name}`, async () => {
      await octokit.repos.delete({ owner: user.login, repo: name });

      await interaction.editReply({
        components: successCard({
          title: 'Repository Deleted',
          description: `\`${user.login}/${name}\` has been permanently deleted.`,
        }),
      });

      await logAction(interaction.client, interaction.guildId, 'repo',
        repoLogCard({
          action:      `${LOG_EMOJIS.repoDelete} Deleted`,
          repoName:    `${user.login}/${name}`,
          actor:       interaction.user.username,
          actorAvatar: interaction.user.displayAvatarURL(),
          timestamp:   new Date().toISOString(),
        })
      );
    });
  } catch (err) {
    await handleError(interaction, err);
  }
}
