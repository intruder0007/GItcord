import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, repoLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { parseCommaSeparated } from '../../utils/validators.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /repo topics
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const name        = interaction.options.getString('name', true);
    const topicsInput = interaction.options.getString('topics', true);
    const topics      = parseCommaSeparated(topicsInput).map((t) => t.toLowerCase().replace(/\s+/g, '-'));
    const { data: user } = await octokit.users.getAuthenticated();

    await octokit.repos.replaceAllTopics({
      owner: user.login,
      repo: name,
      names: topics,
    });

    await interaction.editReply({
      components: successCard({
        title: 'Topics Updated',
        description: `Topics for \`${user.login}/${name}\` have been set to:\n${topics.map((t) => `\`${t}\``).join(', ')}`,
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'repo',
      repoLogCard({
        action:      `${LOG_EMOJIS.repoTopics} Topics Changed`,
        repoName:    `${user.login}/${name}`,
        repoUrl:     `https://github.com/${user.login}/${name}`,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        details:     topics.map((t) => `\`${t}\``).join(', '),
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
