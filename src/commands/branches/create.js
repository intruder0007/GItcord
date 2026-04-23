import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, branchLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit    = await requireAuth(interaction);
    if (!octokit) return;
    const repo       = interaction.options.getString('repo', true);
    const name       = interaction.options.getString('name', true);
    const fromBranch = interaction.options.getString('from-branch') ?? 'main';
    const { data: user } = await octokit.users.getAuthenticated();

    // Get the SHA of the source branch
    const { data: ref } = await octokit.git.getRef({ owner: user.login, repo, ref: `heads/${fromBranch}` });
    await octokit.git.createRef({
      owner: user.login, repo,
      ref: `refs/heads/${name}`,
      sha: ref.object.sha,
    });

    await interaction.editReply({
      components: successCard({
        title: 'Branch Created',
        description: `🌿 **${name}** was created from **${fromBranch}** in \`${user.login}/${repo}\`.`,
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'branch',
      branchLogCard({
        action:      `${LOG_EMOJIS.branchCreate} Created`,
        repoName:    `${user.login}/${repo}`,
        branchName:  name,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        details:     `Branched from \`${fromBranch}\``,
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
