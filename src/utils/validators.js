/**
 * Sanitizes a GitHub repository name: alphanumeric, hyphens, underscores, dots only.
 * @param {string} name
 * @returns {string | null} - Sanitized name or null if invalid
 */
export function sanitizeRepoName(name) {
  if (!name || typeof name !== 'string') return null;
  const clean = name.trim();
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(clean)) return null;
  return clean;
}

/**
 * Sanitizes a GitHub username.
 * @param {string} username
 * @returns {string | null}
 */
export function sanitizeUsername(username) {
  if (!username || typeof username !== 'string') return null;
  const clean = username.trim();
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(clean)) return null;
  return clean;
}

/**
 * Sanitizes a file path (no null bytes, no absolute paths).
 * @param {string} path
 * @returns {string | null}
 */
export function sanitizeFilePath(path) {
  if (!path || typeof path !== 'string') return null;
  const clean = path.trim().replace(/^\/+/, '');
  if (clean.includes('\0') || clean.includes('..')) return null;
  if (clean.length > 1000) return null;
  return clean;
}

/**
 * Sanitizes an integer (e.g. issue/PR number).
 * @param {number} num
 * @returns {number | null}
 */
export function sanitizeIssueNumber(num) {
  if (!Number.isInteger(num) || num < 1) return null;
  return num;
}

/**
 * Parses a comma-separated label/topic string into an array.
 * @param {string} input
 * @returns {string[]}
 */
export function parseCommaSeparated(input) {
  if (!input) return [];
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20); // cap at 20 items
}

/**
 * Truncates content to fit within Discord's 2000-character message or 4096 embed description limit.
 * @param {string} content
 * @param {number} [limit=1900]
 * @returns {string}
 */
export function truncateForDiscord(content, limit = 1900) {
  if (!content) return '';
  if (content.length <= limit) return content;
  return content.slice(0, limit - 40) + '\n\n_...content truncated for Discord_';
}
