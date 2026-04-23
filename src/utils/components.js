import {
  ContainerBuilder,
  TextDisplayBuilder,
  SectionBuilder,
  SeparatorBuilder,
  ThumbnailBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SeparatorSpacingSize,
  MessageFlags,
} from 'discord.js';

// ─── Accent Colors ─────────────────────────────────────────────────────────────
export const ACCENT_COLORS = {
  success: 0x2EA44F,  // GitHub green
  danger:  0xCF222E,  // GitHub red
  info:    0x0969DA,  // GitHub blue
  warning: 0xFB8500,  // amber
  purple:  0x8250DF,  // PR color
  gray:    0x6E7781,  // neutral/closed
};

// ─── Emoji Reference ───────────────────────────────────────────────────────────
export const LOG_EMOJIS = {
  repoCreate:     '📁',
  repoDelete:     '🗑️',
  repoRename:     '✏️',
  repoFork:       '🍴',
  repoVisibility: '🔒',
  repoStar:       '⭐',
  repoUnstar:     '☆',
  repoTopics:     '🏷️',
  fileCreate:     '📄',
  fileEdit:       '📝',
  fileDelete:     '🗂️',
  fileRead:       '👁️',
  branchCreate:   '🌿',
  branchDelete:   '✂️',
  branchProtect:  '🛡️',
  prOpen:         '🔀',
  prMerge:        '✅',
  prClose:        '🚫',
  prReview:       '👁️',
  issueOpen:      '🐛',
  issueClose:     '☑️',
  issueAssign:    '👤',
  collabAdd:      '🤝',
  collabRemove:   '👋',
  releaseCreate:  '🚀',
  releaseDelete:  '💨',
  authLink:       '🔗',
  authUnlink:     '🔓',
};

// ─── Relative Timestamp Helper ─────────────────────────────────────────────────
function relativeTs(ts) {
  const epoch = ts ? Math.floor(new Date(ts).getTime() / 1000) : Math.floor(Date.now() / 1000);
  return `<t:${epoch}:R>`;
}

// ─── Repo Log Card ─────────────────────────────────────────────────────────────
/**
 * @param {{ action: string, repoName: string, repoUrl?: string, actor: string,
 *           actorAvatar?: string, details?: string, timestamp?: string }} opts
 * @returns {ContainerBuilder[]}
 */
export function repoLogCard({ action, repoName, repoUrl, actor, actorAvatar, details, timestamp }) {
  const isCreate = /creat|fork|star/i.test(action);
  const isDelete = /delet|unstar/i.test(action);
  const accent = isCreate ? ACCENT_COLORS.success : isDelete ? ACCENT_COLORS.danger : ACCENT_COLORS.info;

  const nameDisplay = repoUrl ? `[${repoName}](${repoUrl})` : `**${repoName}**`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### Repository ${action}\n${nameDisplay}`)
    );
  if (actorAvatar) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(actorAvatar));
  }

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  if (details) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(details));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${actor} • ${relativeTs(timestamp)}`)
  );

  return [container];
}

// ─── File Log Card ─────────────────────────────────────────────────────────────
/**
 * @param {{ action: string, repoName: string, filePath: string, actor: string,
 *           actorAvatar?: string, commitMessage?: string, timestamp?: string }} opts
 * @returns {ContainerBuilder[]}
 */
export function fileLogCard({ action, repoName, filePath, actor, actorAvatar, commitMessage, timestamp }) {
  const isCreate = /creat/i.test(action);
  const isDelete = /delet/i.test(action);
  const accent = isCreate ? ACCENT_COLORS.success : isDelete ? ACCENT_COLORS.danger : ACCENT_COLORS.warning;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### File ${action}\n\`${filePath}\` in **${repoName}**`)
    );
  if (actorAvatar) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(actorAvatar));
  }

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  if (commitMessage) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`Commit: ${commitMessage}`)
    );
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${actor} • ${relativeTs(timestamp)}`)
  );

  return [container];
}

// ─── PR Log Card ───────────────────────────────────────────────────────────────
/**
 * @param {{ action: string, repoName: string, prNumber: number|string, prTitle: string,
 *           prUrl?: string, actor: string, actorAvatar?: string,
 *           fromBranch?: string, toBranch?: string, timestamp?: string }} opts
 * @returns {ContainerBuilder[]}
 */
export function prLogCard({ action, repoName, prNumber, prTitle, prUrl, actor, actorAvatar, fromBranch, toBranch, timestamp }) {
  const isMerge  = /merg/i.test(action);
  const isClose  = /clos/i.test(action);
  const accent   = isMerge ? ACCENT_COLORS.info : isClose ? ACCENT_COLORS.gray : ACCENT_COLORS.purple;

  const titleText = prUrl
    ? `### Pull Request ${action}\n[**#${prNumber}** ${prTitle}](${prUrl})`
    : `### Pull Request ${action}\n**#${prNumber}** ${prTitle}`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(titleText));
  if (actorAvatar) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(actorAvatar));
  }

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  if (fromBranch && toBranch) {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`\`${fromBranch}\` → \`${toBranch}\` in **${repoName}**`)
    );
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${actor} • ${relativeTs(timestamp)}`)
  );

  return [container];
}

// ─── Issue Log Card ─────────────────────────────────────────────────────────────
/**
 * @param {{ action: string, repoName: string, issueNumber: number|string, issueTitle: string,
 *           issueUrl?: string, actor: string, actorAvatar?: string,
 *           details?: string, timestamp?: string }} opts
 * @returns {ContainerBuilder[]}
 */
export function issueLogCard({ action, repoName, issueNumber, issueTitle, issueUrl, actor, actorAvatar, details, timestamp }) {
  const isClose  = /clos/i.test(action);
  const accent   = isClose ? ACCENT_COLORS.gray : ACCENT_COLORS.success;

  const titleText = issueUrl
    ? `### Issue ${action}\n[**#${issueNumber}** ${issueTitle}](${issueUrl}) in **${repoName}**`
    : `### Issue ${action}\n**#${issueNumber}** ${issueTitle} in **${repoName}**`;

  const section = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(titleText));
  if (actorAvatar) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(actorAvatar));
  }

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  if (details) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(details));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${actor} • ${relativeTs(timestamp)}`)
  );

  return [container];
}

// ─── Branch Log Card ───────────────────────────────────────────────────────────
/**
 * @param {{ action: string, repoName: string, branchName: string, actor: string,
 *           actorAvatar?: string, details?: string, timestamp?: string }} opts
 * @returns {ContainerBuilder[]}
 */
export function branchLogCard({ action, repoName, branchName, actor, actorAvatar, details, timestamp }) {
  const isDelete  = /delet/i.test(action);
  const isProtect = /protect/i.test(action);
  const accent    = isDelete ? ACCENT_COLORS.danger : isProtect ? ACCENT_COLORS.info : ACCENT_COLORS.success;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### Branch ${action}\n\`${branchName}\` in **${repoName}**`)
    );
  if (actorAvatar) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(actorAvatar));
  }

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));

  if (details) {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(details));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`-# ${actor} • ${relativeTs(timestamp)}`)
  );

  return [container];
}

// ─── Collaborator Log Card ─────────────────────────────────────────────────────
/**
 * @param {{ action: string, repoName: string, targetUser: string, permission?: string,
 *           actor: string, actorAvatar?: string, timestamp?: string }} opts
 * @returns {ContainerBuilder[]}
 */
export function collabLogCard({ action, repoName, targetUser, permission, actor, actorAvatar, timestamp }) {
  const isRemove = /remov/i.test(action);
  const accent   = isRemove ? ACCENT_COLORS.danger : ACCENT_COLORS.success;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### Collaborator ${action}\n**${targetUser}** ${isRemove ? 'removed from' : 'added to'} **${repoName}**` +
        (permission && !isRemove ? `\nPermission: \`${permission}\`` : '')
      )
    );
  if (actorAvatar) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(actorAvatar));
  }

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${actor} • ${relativeTs(timestamp)}`)
    );

  return [container];
}

// ─── Release Log Card ──────────────────────────────────────────────────────────
/**
 * @param {{ action: string, repoName: string, tagName: string, releaseName?: string,
 *           actor: string, actorAvatar?: string, timestamp?: string }} opts
 * @returns {ContainerBuilder[]}
 */
export function releaseLogCard({ action, repoName, tagName, releaseName, actor, actorAvatar, timestamp }) {
  const isDelete = /delet/i.test(action);
  const accent   = isDelete ? ACCENT_COLORS.danger : ACCENT_COLORS.success;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### Release ${action}\n**${releaseName || tagName}** (\`${tagName}\`) in **${repoName}**`
      )
    );
  if (actorAvatar) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(actorAvatar));
  }

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${actor} • ${relativeTs(timestamp)}`)
    );

  return [container];
}

// ─── Auth Log Card ─────────────────────────────────────────────────────────────
/**
 * @param {{ action: string, discordUsername: string, githubUsername: string,
 *           actorAvatar?: string, timestamp?: string }} opts
 * @returns {ContainerBuilder[]}
 */
export function authLogCard({ action, discordUsername, githubUsername, actorAvatar, timestamp }) {
  const isUnlink = /unlink|logout|disconnect/i.test(action);
  const accent   = isUnlink ? ACCENT_COLORS.danger : ACCENT_COLORS.success;

  const section = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### GitHub Account ${action}\nDiscord: **${discordUsername}**\nGitHub: **@${githubUsername}**`
      )
    );
  if (actorAvatar) {
    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(actorAvatar));
  }

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addSectionComponents(section)
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`-# ${relativeTs(timestamp)}`)
    );

  return [container];
}

// ─── Generic Reply Cards ───────────────────────────────────────────────────────

/**
 * Success reply card (green).
 * @param {{ title: string, description: string, fields?: {name:string,value:string}[] }} opts
 * @returns {ContainerBuilder[]}
 */
export function successCard({ title, description, fields = [] }) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLORS.success)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ✅ ${title}\n${description}`));

  if (fields.length) {
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    const fieldLines = fields.map((f) => `**${f.name}**: ${f.value}`).join('\n');
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(fieldLines));
  }

  return [container];
}

/**
 * Error reply card (red, ephemeral).
 * @param {{ title: string, description: string }} opts
 * @returns {ContainerBuilder[]}
 */
export function errorCard({ title, description }) {
  return [
    new ContainerBuilder()
      .setAccentColor(ACCENT_COLORS.danger)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ❌ ${title}\n${description}`)
      ),
  ];
}

/**
 * Confirmation card with Confirm / Cancel buttons (for destructive actions).
 * Returns [ContainerBuilder, ActionRowBuilder] — spread both into the `components` array.
 * ActionRows cannot be nested inside ContainerBuilder; they must sit at the top level.
 * @param {{ title: string, description: string }} opts
 * @returns {Array}
 */
export function confirmCard({ title, description }) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLORS.warning)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ⚠️ ${title}\n${description}`)
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm_delete')
      .setLabel('🗑️ Confirm Delete')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('cancel_delete')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );

  // ActionRows must be at the top-level components array, not nested in a Container
  return [container, row];
}

/**
 * Paginated list card (blue).
 * @param {{ title: string, items: string[], page: number, totalPages: number }} opts
 * @returns {ContainerBuilder[]}
 */
export function listCard({ title, items, page, totalPages }) {
  const content = items.length ? items.join('\n') : '_Nothing found._';
  return [
    new ContainerBuilder()
      .setAccentColor(ACCENT_COLORS.info)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${title}\n${content}`)
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Page ${page} of ${totalPages}`)
      ),
  ];
}

/**
 * Info / neutral card (blue).
 * @param {{ title: string, description: string, fields?: {name:string,value:string}[] }} opts
 * @returns {ContainerBuilder[]}
 */
export function infoCard({ title, description, fields = [] }) {
  const container = new ContainerBuilder()
    .setAccentColor(ACCENT_COLORS.info)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ℹ️ ${title}\n${description}`));

  if (fields.length) {
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small));
    const fieldLines = fields.map((f) => `**${f.name}**: ${f.value}`).join('\n');
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(fieldLines));
  }

  return [container];
}

// Re-export flags helper so callers don't need a separate import
export { MessageFlags };
