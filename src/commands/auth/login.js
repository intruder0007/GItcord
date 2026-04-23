import { SlashCommandSubcommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateAuthUrl } from '../../auth/githubOAuth.js';
import { infoCard } from '../../utils/components.js';

export const subcommand = new SlashCommandSubcommandBuilder()
  .setName('login')
  .setDescription('Connect your GitHub account via OAuth');

/**
 * Handles /github login
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

  const authUrl = await generateAuthUrl(interaction.user.id);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🔗 Connect GitHub')
      .setStyle(ButtonStyle.Link)
      .setURL(authUrl)
  );

  await interaction.editReply({
    components: [
      ...infoCard({
        title: 'Connect Your GitHub Account',
        description:
          'Click the button below to authorize this bot.\n\n' +
          '**Permissions requested:**\n' +
          '• Read/write repositories\n' +
          '• Manage issues, PRs, files, and branches\n' +
          '• Read your profile\n\n' +
          '_This link expires in 10 minutes._',
      }),
      row,
    ],
  });
}
