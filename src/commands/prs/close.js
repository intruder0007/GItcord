import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, prLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit     = await requireAuth(interaction);
    if (!octokit) return;
    const repo        = interaction.options.getString('repo', true);
    const pull_number = interaction.options.getInteger('number', true);
    const { data: user } = await octokit.users.getAuthenticated();

    const { data: pr } = await octokit.pulls.update({ owner: user.login, repo, pull_number, state: 'closed' });

    await interaction.editReply({
      components: successCard({
        title: 'Pull Request Closed',
        description: `PR **#${pull_number}** in \`${user.login}/${repo}\` has been closed.`,
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'pr',
      prLogCard({
        action:      `${LOG_EMOJIS.prClose} Closed`,
        repoName:    `${user.login}/${repo}`,
        prNumber:    pull_number,
        prTitle:     pr.title,
        prUrl:       pr.html_url,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        fromBranch:  pr.head?.ref,
        toBranch:    pr.base?.ref,
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
