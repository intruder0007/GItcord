import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, prLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;
    const repo  = interaction.options.getString('repo', true);
    const title = interaction.options.getString('title', true);
    const head  = interaction.options.getString('head', true);
    const base  = interaction.options.getString('base', true);
    const body  = interaction.options.getString('body') ?? '';
    const { data: user } = await octokit.users.getAuthenticated();

    const { data: pr } = await octokit.pulls.create({ owner: user.login, repo, title, head, base, body });

    await interaction.editReply({
      components: successCard({
        title: 'Pull Request Opened',
        description: `[#${pr.number} — ${pr.title}](${pr.html_url})`,
        fields: [
          { name: '🔀 Head → Base', value: `\`${pr.head.label}\` → \`${pr.base.label}\`` },
          { name: '📊 Status', value: '🟢 Open' },
        ],
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'pr',
      prLogCard({
        action:      `${LOG_EMOJIS.prOpen} Opened`,
        repoName:    `${user.login}/${repo}`,
        prNumber:    pr.number,
        prTitle:     pr.title,
        prUrl:       pr.html_url,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        fromBranch:  head,
        toBranch:    base,
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
