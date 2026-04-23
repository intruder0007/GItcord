import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard } from '../../utils/components.js';
import { repoLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /repo create
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const name        = interaction.options.getString('name', true);
    const description = interaction.options.getString('description') ?? '';
    const isPrivate   = interaction.options.getBoolean('private') ?? false;
    const autoInit    = interaction.options.getBoolean('auto-init') ?? true;

    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
      auto_init: autoInit,
    });

    await interaction.editReply({
      components: successCard({
        title: 'Repository Created',
        description: `**[${repo.full_name}](${repo.html_url})** has been created successfully.`,
        fields: [
          { name: '🔒 Visibility',      value: repo.private ? 'Private' : 'Public' },
          { name: '📂 Default Branch',  value: repo.default_branch },
          { name: '🌐 Clone URL',       value: `\`${repo.clone_url}\`` },
        ],
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'repo',
      repoLogCard({
        action:      `${LOG_EMOJIS.repoCreate} Created`,
        repoName:    repo.full_name,
        repoUrl:     repo.html_url,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        details:     `Visibility: **${repo.private ? 'Private' : 'Public'}** • Default branch: \`${repo.default_branch}\``,
        timestamp:   repo.created_at,
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
