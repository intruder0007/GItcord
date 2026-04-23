import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord.js';
import { listCard } from './components.js';

const ITEMS_PER_PAGE = 10;
const TIMEOUT_MS = 60_000;

/** In-memory pagination state keyed by interaction.id */
const paginationCache = new Map();

/**
 * Builds the pagination buttons for given page state.
 * @param {string} interactionId
 * @param {number} page
 * @param {number} totalPages
 * @returns {ActionRowBuilder}
 */
function buildPaginationRow(interactionId, page, totalPages) {
  const prev = new ButtonBuilder()
    .setCustomId(`page_prev_${interactionId}`)
    .setLabel('◀ Previous')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page <= 1);

  const next = new ButtonBuilder()
    .setCustomId(`page_next_${interactionId}`)
    .setLabel('Next ▶')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page >= totalPages);

  return new ActionRowBuilder().addComponents(prev, next);
}

/**
 * Sends a Component V2 paginated list reply and manages button interactions.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {string} title - List title
 * @param {string[]} allItems - Full list of formatted string items
 * @param {number} [startPage=1]
 */
export async function sendPaginatedList(interaction, title, allItems, startPage = 1) {
  const totalPages = Math.max(1, Math.ceil(allItems.length / ITEMS_PER_PAGE));
  let page = Math.min(Math.max(startPage, 1), totalPages);

  const getPageItems = (p) => allItems.slice((p - 1) * ITEMS_PER_PAGE, p * ITEMS_PER_PAGE);

  const row = buildPaginationRow(interaction.id, page, totalPages);

  // Component V2: listCard returns [ContainerBuilder], pagination row is a separate top-level component
  const buildComponents = (p) => [
    ...listCard({ title, items: getPageItems(p), page: p, totalPages }),
    ...(totalPages > 1 ? [buildPaginationRow(interaction.id, p, totalPages)] : []),
  ];

  const message = await interaction.editReply({
    flags: [MessageFlags.IsComponentsV2],
    components: buildComponents(page),
  });

  if (totalPages <= 1) return;

  paginationCache.set(interaction.id, { page, totalPages, title, allItems });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: TIMEOUT_MS,
    filter: (i) => i.user.id === interaction.user.id,
  });

  collector.on('collect', async (i) => {
    const state = paginationCache.get(interaction.id);
    if (!state) return collector.stop();

    if (i.customId === `page_prev_${interaction.id}`) state.page = Math.max(1, state.page - 1);
    if (i.customId === `page_next_${interaction.id}`) state.page = Math.min(state.totalPages, state.page + 1);

    paginationCache.set(interaction.id, state);

    await i.update({
      components: buildComponents(state.page),
    });
  });

  collector.on('end', async () => {
    paginationCache.delete(interaction.id);
    try {
      // Disable both buttons on expiry
      const disabledRow = buildPaginationRow(interaction.id, 0, 0);
      const lastState   = paginationCache.get(interaction.id) ?? { page, totalPages, title, allItems };
      await interaction.editReply({
        components: [
          ...listCard({ title, items: getPageItems(page), page, totalPages }),
          disabledRow,
        ],
      });
    } catch (_) { /* message may be deleted */ }
  });
}
