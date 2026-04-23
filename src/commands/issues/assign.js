import { MessageFlags } from 'discord.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { successCard, issueLogCard, LOG_EMOJIS } from '../../utils/components.js';
import { logAction } from '../../utils/logger.js';
import { handleError } from '../../handlers/errorHandler.js';

/**
 * Handles /issue assign — assigns a GitHub user to an issue.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
  try {
    const octokit  = await requireAuth(interaction);
    if (!octokit) return;

    const repo     = interaction.options.getString('repo', true);
    const number   = interaction.options.getInteger('number', true);
    const assignee = interaction.options.getString('assignee', true);

    const { data: user } = await octokit.users.getAuthenticated();
    const { data: issue } = await octokit.issues.addAssignees({
      owner: user.login,
      repo,
      issue_number: number,
      assignees: [assignee],
    });

    await interaction.editReply({
      components: successCard({
        title: 'Assignee Added',
        description: `**${assignee}** has been assigned to issue **#${issue.number}**.`,
        fields: [
          { name: 'Issue', value: `#${issue.number} — ${issue.title}` },
          { name: 'Repo',  value: `${user.login}/${repo}` },
          { name: 'All Assignees', value: issue.assignees.map((a) => `\`${a.login}\``).join(', ') || 'None' },
        ],
      }),
    });

    await logAction(interaction.client, interaction.guildId, 'issue',
      issueLogCard({
        action:      `${LOG_EMOJIS.issueAssign} Assigned`,
        repoName:    `${user.login}/${repo}`,
        issueNumber: issue.number,
        issueTitle:  issue.title,
        issueUrl:    issue.html_url,
        actor:       interaction.user.username,
        actorAvatar: interaction.user.displayAvatarURL(),
        details:     `Assigned to **${assignee}**`,
        timestamp:   new Date().toISOString(),
      })
    );
  } catch (err) {
    await handleError(interaction, err);
  }
}
