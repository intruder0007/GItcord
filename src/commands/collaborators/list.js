import { requireAuth } from '../../auth/requireAuth.js';
import { sendPaginatedList } from '../../utils/pagination.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /collab list — lists all collaborators on a repository.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo = interaction.options.getString('repo', true);
    const { data: user } = await octokit.users.getAuthenticated();

    const { data: collaborators } = await octokit.repos.listCollaborators({
      owner: user.login,
      repo,
    });

    const permissionIcon = { admin: '🔑', maintain: '🔧', push: '✏️', pull: '👁️' };
    const items = collaborators.map((collab) => {
      const perm = collab.permissions;
      let role = 'pull';
      if (perm?.admin) role = 'admin';
      else if (perm?.maintain) role = 'maintain';
      else if (perm?.push) role = 'push';
      const icon = permissionIcon[role] ?? '👤';
      return `${icon} \`${collab.login}\` — **${role}**`;
    });

    await sendPaginatedList(
      interaction,
      `👥 Collaborators — ${user.login}/${repo}`,
      items
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
