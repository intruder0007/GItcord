import { requireAuth } from '../../auth/requireAuth.js';
import { sendPaginatedList } from '../../utils/pagination.js';
import { handleError } from '../../handlers/errorHandler.js';

export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;
    const repo = interaction.options.getString('repo', true);
    const state = (interaction.options.getString('state') ?? 'open');
    const { data: user } = await octokit.users.getAuthenticated();

    const { data: prs } = await octokit.pulls.list({ owner: user.login, repo, state, per_page: 100 });

    const stateIcon = { open: '🟢', closed: '🔴', merged: '🟣' };
    const items = prs.map((pr) => {
      const icon = pr.merged_at ? stateIcon.merged : stateIcon[pr.state] ?? '⚪';
      return `${icon} [**#${pr.number}** — ${pr.title}](${pr.html_url}) by \`${pr.user.login}\``;
    });

    await sendPaginatedList(interaction, `🔀 Pull Requests — ${user.login}/${repo} (${state})`, items);
  } catch (err) {
    await handleError(interaction, err);
  }
}
