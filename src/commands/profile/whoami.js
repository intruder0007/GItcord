import { SlashCommandSubcommandBuilder, MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { infoCard } from '../../utils/components.js';
import { handleError } from '../../handlers/errorHandler.js';

export const subcommand = new SlashCommandSubcommandBuilder()
  .setName('whoami')
  .setDescription('Show your connected GitHub profile');

/**
 * Handles /github whoami — fetches and displays the authenticated GitHub user profile.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const { data: gh } = await octokit.users.getAuthenticated();

    const joined = gh.created_at
      ? `<t:${Math.floor(new Date(gh.created_at).getTime() / 1000)}:D>`
      : 'N/A';

    await interaction.editReply({
      components: infoCard({
        title: `🐙 ${gh.name || gh.login}`,
        description: `[${gh.login}](${gh.html_url})\n${gh.bio || 'No bio provided.'}`,
        fields: [
          { name: '👥 Followers',    value: String(gh.followers ?? 0) },
          { name: '📁 Public Repos', value: String(gh.public_repos ?? 0) },
          { name: '🏢 Company',      value: gh.company || 'N/A' },
          { name: '📍 Location',     value: gh.location || 'N/A' },
          { name: '🔗 Blog',         value: gh.blog || 'N/A' },
          { name: '📅 Joined',       value: joined },
        ],
      }),
    });
  } catch (err) {
    await handleError(interaction, err);
  }
}
