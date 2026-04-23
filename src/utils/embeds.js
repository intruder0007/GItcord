import { EmbedBuilder } from 'discord.js';

const COLORS = {
  success: 0x2EA44F,
  error: 0xCF222E,
  info: 0x0969DA,
  warning: 0xD1242F,
  amber: 0xFB8500,
};

/**
 * Builds a footer object used on every embed.
 * @param {import('discord.js').User} user - The Discord user
 * @returns {{ text: string, iconURL?: string }}
 */
function buildFooter(user) {
  return {
    text: `GitHub for Discord • @${user?.username ?? 'Unknown'}`,
    iconURL: user?.displayAvatarURL?.() ?? undefined,
  };
}

/**
 * Creates a success embed (green).
 * @param {string} title
 * @param {string} description
 * @param {import('discord.js').APIEmbedField[]} [fields]
 * @param {import('discord.js').User} [user]
 * @returns {EmbedBuilder}
 */
export function successEmbed(title, description, fields = [], user = null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.success)
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();
  if (fields.length) embed.addFields(fields);
  if (user) embed.setFooter(buildFooter(user));
  return embed;
}

/**
 * Creates an error embed (red).
 * @param {string} title
 * @param {string} description
 * @param {import('discord.js').User} [user]
 * @returns {EmbedBuilder}
 */
export function errorEmbed(title, description, user = null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.error)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
  if (user) embed.setFooter(buildFooter(user));
  return embed;
}

/**
 * Creates an info embed (blue).
 * @param {string} title
 * @param {string} description
 * @param {import('discord.js').APIEmbedField[]} [fields]
 * @param {import('discord.js').User} [user]
 * @returns {EmbedBuilder}
 */
export function infoEmbed(title, description, fields = [], user = null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
  if (fields.length) embed.addFields(fields);
  if (user) embed.setFooter(buildFooter(user));
  return embed;
}

/**
 * Creates a warning embed (amber/dark red).
 * @param {string} title
 * @param {string} description
 * @param {import('discord.js').User} [user]
 * @returns {EmbedBuilder}
 */
export function warningEmbed(title, description, user = null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.amber)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setTimestamp();
  if (user) embed.setFooter(buildFooter(user));
  return embed;
}

/**
 * Creates a paginated list embed (blue).
 * @param {string} title
 * @param {string[]} items - Array of formatted strings to display
 * @param {number} page - Current page (1-indexed)
 * @param {number} totalPages
 * @param {import('discord.js').User} [user]
 * @returns {EmbedBuilder}
 */
export function listEmbed(title, items, page, totalPages, user = null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(title)
    .setDescription(items.length ? items.join('\n') : '_Nothing found._')
    .setFooter({ text: `Page ${page} of ${totalPages} • GitHub for Discord` })
    .setTimestamp();
  if (user) {
    embed.setFooter({
      text: `Page ${page} of ${totalPages} • GitHub for Discord • @${user.username}`,
    });
  }
  return embed;
}

/**
 * Creates a GitHub profile embed.
 * @param {object} ghUser - Octokit user object
 * @param {import('discord.js').User} [user] - Discord User
 * @returns {EmbedBuilder}
 */
export function profileEmbed(ghUser, user = null) {
  const fields = [
    { name: '👥 Followers', value: String(ghUser.followers ?? 0), inline: true },
    { name: '📁 Public Repos', value: String(ghUser.public_repos ?? 0), inline: true },
    { name: '🏢 Company', value: ghUser.company || 'N/A', inline: true },
    { name: '📍 Location', value: ghUser.location || 'N/A', inline: true },
    { name: '🔗 Blog', value: ghUser.blog || 'N/A', inline: true },
    { name: '📅 Joined', value: ghUser.created_at ? `<t:${Math.floor(new Date(ghUser.created_at).getTime() / 1000)}:D>` : 'N/A', inline: true },
  ];

  const embed = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(`🐙 ${ghUser.name || ghUser.login}`)
    .setURL(ghUser.html_url)
    .setDescription(ghUser.bio || 'No bio provided.')
    .setThumbnail(ghUser.avatar_url)
    .addFields(fields)
    .setTimestamp();

  if (user) embed.setFooter(buildFooter(user));
  return embed;
}
