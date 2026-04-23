import { requireAuth } from '../../auth/requireAuth.js';
import { sendPaginatedList } from '../../utils/pagination.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /issue list — lists open or closed issues with pagination.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: 64 });
  try {
    const octokit = await requireAuth(interaction);
    if (!octokit) return;

    const repo  = interaction.options.getString('repo', true);
    const state = (interaction.options.getString('state') ?? 'open');

    const { data: user } = await octokit.users.getAuthenticated();
    const { data: issues } = await octokit.issues.listForRepo({
      owner: user.login,
      repo,
      state,
      per_page: 100,
    });

    // GitHub's issues endpoint also returns PRs — filter them out
    const realIssues = issues.filter((i) => !i.pull_request);

    const stateIcon = { open: '🟢', closed: '🔴' };
    const items = realIssues.map((issue) => {
      const icon = stateIcon[issue.state] ?? '⚪';
      const labelStr = issue.labels.map((l) => (typeof l === 'string' ? l : l.name)).join(', ');
      return `${icon} [**#${issue.number}** — ${issue.title}](${issue.html_url})${labelStr ? ` \`${labelStr}\`` : ''}`;
    });

    await sendPaginatedList(
      interaction,
      `📋 Issues — ${user.login}/${repo} (${state})`,
      items
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
