import { requireAuth } from '../../auth/requireAuth.js';
import { infoEmbed, errorEmbed } from '../../utils/embeds.js';
import { truncateForDiscord } from '../../utils/validators.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /file read
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo = interaction.options.getString('repo', true);
    const path = interaction.options.getString('path', true);
    const branch = interaction.options.getString('branch') ?? 'main';
    const { data: user } = await octokit.users.getAuthenticated();

    const { data: fileData } = await octokit.repos.getContent({
      owner: user.login,
      repo,
      path,
      ref: branch,
    });

    if (Array.isArray(fileData)) {
      await interaction.editReply({
        embeds: [errorEmbed('Path Is a Directory', 'The specified path is a directory, not a file.', interaction.user)],
      });
      return;
    }

    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const truncated = truncateForDiscord(content, 1900);
    const ext = path.split('.').pop() || '';

    await interaction.editReply({
      embeds: [
        infoEmbed(
          `📄 ${path}`,
          `\`\`\`${ext}\n${truncated}\n\`\`\``,
          [
            { name: 'Size', value: `${fileData.size} bytes`, inline: true },
            { name: 'SHA', value: `\`${fileData.sha.slice(0, 7)}\``, inline: true },
          ],
          interaction.user
        ),
      ],
    });
  } catch (err) {
    await handleError(interaction, err);
  }
}
