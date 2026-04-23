import { requireAuth } from '../../auth/requireAuth.js';
import { sendPaginatedList } from '../../utils/pagination.js';
import { handleError } from '../../handlers/errorHandler.js';

export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;
    const repo = interaction.options.getString('repo', true);
    const { data: user } = await octokit.users.getAuthenticated();
    const { data: branches } = await octokit.repos.listBranches({ owner: user.login, repo, per_page: 100 });
    const items = branches.map((b) => `🌿 **${b.name}**${b.protected ? ' 🔒' : ''} — \`${b.commit.sha.slice(0, 7)}\``);
    await sendPaginatedList(interaction, `🌿 Branches in ${user.login}/${repo}`, items);
  } catch (err) {
    await handleError(interaction, err);
  }
}
