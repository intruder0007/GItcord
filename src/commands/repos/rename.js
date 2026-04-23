import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, repoLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /repo rename
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const oldName = interaction.options.getString('old-name', true);
    const newName = interaction.options.getString('new-name', true);
    const { data: user } = await octokit.users.getAuthenticated();

    const { data: repo } = await octokit.repos.update({
      owner: user.login,
      repo: oldName,
      name: newName,
    });

    await interaction.editReply({
      components: successCard({
        title: 'Repository Renamed',
        description: `\`${user.login}/${oldName}\` → **[${repo.full_name}](${repo.html_url})**`,
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'repo',
      repoLogCard({
        action:      `${LOG_EMOJIS.repoRename} Renamed`,
        repoName:    repo.full_name,
        repoUrl:     repo.html_url,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        details:     `\`${oldName}\` → \`${newName}\``,
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
