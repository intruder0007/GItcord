import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, fileLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /file create
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo    = interaction.options.getString('repo', true);
    const path    = interaction.options.getString('path', true);
    const content = interaction.options.getString('content', true);
    const message = interaction.options.getString('message', true);
    const { data: user } = await octokit.users.getAuthenticated();

    const { data: result } = await octokit.repos.createOrUpdateFileContents({
      owner: user.login,
      repo,
      path,
      message,
      content: Buffer.from(content, 'utf8').toString('base64'),
    });

    await interaction.editReply({
      components: successCard({
        title: 'File Created',
        description: `\`${path}\` has been created in **${user.login}/${repo}**.`,
        fields: [
          { name: '📝 Commit', value: `[\`${result.commit.sha.slice(0, 7)}\`](${result.commit.html_url})` },
          { name: '💬 Message', value: message },
        ],
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'file',
      fileLogCard({
        action:        `${LOG_EMOJIS.fileCreate} Created`,
        repoName:      `${user.login}/${repo}`,
        filePath:      path,
        actor:         interaction.user.username,
        actorAvatar:   interaction.user.displayAvatarURL(),
        commitMessage: message,
        timestamp:     new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
