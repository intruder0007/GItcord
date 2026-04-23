import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, branchLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;
    const repo   = interaction.options.getString('repo', true);
    const branch = interaction.options.getString('name', true);
    const enable = interaction.options.getBoolean('enable', true);
    const { data: user } = await octokit.users.getAuthenticated();

    if (enable) {
      await octokit.repos.updateBranchProtection({
        owner: user.login, repo, branch,
        required_status_checks: null,
        enforce_admins: true,
        required_pull_request_reviews: { dismiss_stale_reviews: true, required_approving_review_count: 1 },
        restrictions: null,
      });
    } else {
      await octokit.repos.deleteBranchProtection({ owner: user.login, repo, branch });
    }

    await interaction.editReply({
      components: successCard({
        title: `Branch Protection ${enable ? 'Enabled' : 'Disabled'}`,
        description: `Branch **${branch}** in \`${user.login}/${repo}\` is now ${enable ? '🔒 protected' : '🔓 unprotected'}.`,
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'branch',
      branchLogCard({
        action:      `${LOG_EMOJIS.branchProtect} Protection ${enable ? 'Enabled' : 'Disabled'}`,
        repoName:    `${user.login}/${repo}`,
        branchName:  branch,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        details:     enable ? '🔒 Branch is now protected' : '🔓 Branch protection removed',
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
