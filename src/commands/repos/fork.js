import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, repoLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /repo fork
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const owner = interaction.options.getString('owner', true);
    const repo  = interaction.options.getString('repo', true);

    const { data: fork } = await octokit.repos.createFork({ owner, repo });

    await interaction.editReply({
      components: successCard({
        title: 'Repository Forked',
        description: `**[${fork.full_name}](${fork.html_url})** has been created as a fork of \`${owner}/${repo}\`.`,
        fields: [{ name: '🌐 Clone URL', value: `\`${fork.clone_url}\`` }],
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'repo',
      repoLogCard({
        action:      `${LOG_EMOJIS.repoFork} Forked`,
        repoName:    fork.full_name,
        repoUrl:     fork.html_url,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        details:     `Forked from \`${owner}/${repo}\``,
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
