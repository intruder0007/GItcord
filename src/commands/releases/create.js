import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, releaseLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /release create — publishes a new GitHub release.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit    = await requireAuth(interaction);
    if (!octokit) return;

    const repo       = interaction.options.getString('repo', true);
    const tag        = interaction.options.getString('tag', true);
    const name       = interaction.options.getString('name') ?? tag;
    const body       = interaction.options.getString('body') ?? '';
    const prerelease = interaction.options.getBoolean('prerelease') ?? false;

    const { data: user } = await octokit.users.getAuthenticated();
    const { data: release } = await octokit.repos.createRelease({
      owner: user.login,
      repo,
      tag_name: tag,
      name,
      body,
      prerelease,
    });

    await interaction.editReply({
      components: successCard({
        title: prerelease ? '🧪 Pre-release Created' : '🚀 Release Published',
        description: `**${release.name}** has been published for **${user.login}/${repo}**.`,
        fields: [
          { name: 'Tag',        value: `\`${release.tag_name}\`` },
          { name: 'Pre-release', value: prerelease ? 'Yes' : 'No' },
          { name: 'URL',        value: `[View Release](${release.html_url})` },
        ],
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'release',
      releaseLogCard({
        action:      `${LOG_EMOJIS.releaseCreate} Created`,
        repoName:    `${user.login}/${repo}`,
        tagName:     tag,
        releaseName: name,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        timestamp:   release.created_at,
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
