import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from 'discord.js';
import admin from 'firebase-admin';
import { successCard, errorCard, ACCENT_COLORS } from '../utils/components.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Create GitHub log channels for this server')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

// ─── Channel Definitions ──────────────────────────────────────────────────────
const LOG_CHANNELS = [
  { key: 'repo',    name: 'repo-logs',    topic: 'Repository events: created, deleted, renamed, forked, visibility, topics, starred' },
  { key: 'file',    name: 'file-logs',    topic: 'File events: created, edited, deleted, read' },
  { key: 'branch',  name: 'branch-logs',  topic: 'Branch events: created, deleted, protected/unprotected' },
  { key: 'pr',      name: 'pr-logs',      topic: 'Pull request events: opened, merged, closed, reviewed' },
  { key: 'issue',   name: 'issue-logs',   topic: 'Issue events: created, closed, assigned, labeled' },
  { key: 'collab',  name: 'collab-logs',  topic: 'Collaborator events: added, removed' },
  { key: 'release', name: 'release-logs', topic: 'Release events: created, deleted' },
  { key: 'auth',    name: 'auth-logs',    topic: 'Auth events: GitHub account linked / unlinked' },
];

/**
 * Checks whether a Discord channel ID still exists and is accessible.
 * @param {import('discord.js').Guild} guild
 * @param {string} channelId
 * @returns {Promise<import('discord.js').GuildChannel|null>}
 */
async function resolveChannel(guild, channelId) {
  try {
    return guild.channels.cache.get(channelId) ?? await guild.channels.fetch(channelId);
  } catch {
    return null;
  }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

  try {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.editReply({
        components: errorCard({ title: 'Server Only', description: 'This command must be used inside a Discord server.' }),
      });
    }

    const db      = admin.database();
    const ref     = db.ref(`guilds/${guild.id}`);
    const snap    = await ref.once('value');
    const existing = snap.val();

    // ── Resolve or create the category ────────────────────────────────────────
    let category = null;
    if (existing?.categoryId) {
      category = guild.channels.cache.get(existing.categoryId) ?? null;
      if (!category) {
        // Category was deleted — will recreate below
        category = null;
      }
    }

    if (!category) {
      category = await guild.channels.create({
        name: '📋 GitHub Logs',
        type: ChannelType.GuildCategory,
      });
    }

    // ── Create / verify each log channel ──────────────────────────────────────
    const logChannels = existing?.logChannels ?? {};
    const created     = [];
    const skipped     = [];

    for (const def of LOG_CHANNELS) {
      const savedId = logChannels[def.key];

      if (savedId) {
        const ch = await resolveChannel(guild, savedId);
        if (ch) {
          skipped.push({ key: def.key, channel: ch });
          continue;
        }
        // Channel was deleted — fall through to recreate
      }

      // Create the channel
      const newCh = await guild.channels.create({
        name: def.name,
        type: ChannelType.GuildText,
        topic: def.topic,
        parent: category.id,
      });

      logChannels[def.key] = newCh.id;
      created.push({ key: def.key, channel: newCh });
    }

    // ── Persist to Firebase ────────────────────────────────────────────────────
    await ref.set({
      categoryId: category.id,
      logChannels,
      setupAt:  new Date().toISOString(),
      setupBy:  interaction.user.id,
    });

    // ── Build success reply ────────────────────────────────────────────────────
    const channelLine = (key, channel) => {
      const icons = {
        repo: '📁', file: '📄', branch: '🌿', pr: '🔀',
        issue: '🐛', collab: '🤝', release: '🚀', auth: '🔗',
      };
      return `${icons[key] ?? '▪️'} **${key.charAt(0).toUpperCase() + key.slice(1)}** → <#${channel.id}>`;
    };

    const allLines = LOG_CHANNELS.map(({ key }) => {
      const entry = [...created, ...skipped].find((e) => e.key === key);
      return entry ? channelLine(key, entry.channel) : `▪️ **${key}** → _(error)_`;
    });

    const hadSkipped = skipped.length > 0;
    const container  = new ContainerBuilder()
      .setAccentColor(ACCENT_COLORS.success)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### ✅ GitHub Logger is ready!')
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `The following log channels are configured under 📋 **GitHub Logs**:\n\n${allLines.join('\n')}`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          hadSkipped
            ? `-# ${created.length} channel(s) created, ${skipped.length} already existed and were kept.`
            : '-# All GitHub actions will be logged automatically.'
        )
      );

    await interaction.editReply({
      components: [container],
    });
  } catch (err) {
    console.error('[SETUP] Error:', err);
    await interaction.editReply({
      components: errorCard({ title: 'Setup Failed', description: `An error occurred: ${err.message}` }),
    });
  }
}
