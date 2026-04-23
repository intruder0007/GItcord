import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, branchLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { confirmAndDelete } from '../repos/delete.js';
import { handleError } from '../../handlers/errorHandler.js';

export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;
    const repo = interaction.options.getString('repo', true);
    const name = interaction.options.getString('name', true);
    const { data: user } = await octokit.users.getAuthenticated();

    await confirmAndDelete(interaction, `branch: ${name}`, async () => {
      await octokit.git.deleteRef({ owner: user.login, repo, ref: `heads/${name}` });

      await interaction.editReply({
        components: successCard({
          title: 'Branch Deleted',
          description: `🌿 **${name}** has been deleted from \`${user.login}/${repo}\`.`,
        }),
      });

      await logAction(interaction.client, interaction.guildId, 'branch',
        branchLogCard({
          action:      `${LOG_EMOJIS.branchDelete} Deleted`,
          repoName:    `${user.login}/${repo}`,
          branchName:  name,
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
