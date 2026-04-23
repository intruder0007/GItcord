import express from 'express';
import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} from 'discord.js';
import { exchangeCodeForToken } from './githubOAuth.js';
import { config } from '../config.js';
import { logAction } from '../utils/logger.js';
import { authLogCard } from '../utils/components.js';

/**
 * Creates and starts the Express server that handles the GitHub OAuth callback.
 * @param {import('discord.js').Client} client - The Discord client (used to DM users)
 * @returns {Promise<{ app: express.Application, server: import('http').Server }>}
 */
export function startOAuthServer(client) {
  const app = express();

  /**
   * Health check endpoint (required by Railway / Render free tier).
   */
  app.get('/', (_req, res) => {
    res.send('GitHub Discord Manager — OAuth server is running.');
  });

  /**
   * GitHub redirects here after the user authorizes the OAuth App.
   * URL: GET /callback?code=xxx&state=yyy
   */
  app.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px">
          <h2>❌ Authorization Denied</h2>
          <p>You declined to connect your GitHub account. You can close this tab.</p>
        </body></html>
      `);
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state parameter.');
    }

    try {
      const result = await exchangeCodeForToken(code, state);

      if (!result) {
        return res.status(400).send(`
          <html><body style="font-family:sans-serif;text-align:center;padding:60px">
            <h2>❌ Authentication Failed</h2>
            <p>Your link may have expired. Please run <strong>/github login</strong> again in Discord.</p>
          </body></html>
        `);
      }

      const avatarUrl = `https://avatars.githubusercontent.com/${result.githubUsername}`;

      // ── Send a Component V2 DM to the user ──────────────────────────────────
      try {
        const discordUser = await client.users.fetch(result.discordUserId);
        const dmContainer = new ContainerBuilder()
          .setAccentColor(0x2EA44F)
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### ✅ GitHub Account Connected\nSuccessfully linked **@${result.githubUsername}** to your Discord account.\n\nYou can now use all \`/repo\`, \`/file\`, \`/pr\`, and other GitHub commands.`
            )
          )
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`-# ${new Date().toLocaleString()}`)
          );

        await discordUser.send({
          flags: [MessageFlags.IsComponentsV2],
          components: [dmContainer],
        });

        // ── Fire auth log to the guild (best-effort, guildId stored during /github login) ──
        if (result.guildId) {
          await logAction(
            client,
            result.guildId,
            'auth',
            authLogCard({
              action: 'Linked',
              discordUsername: discordUser.username,
              githubUsername: result.githubUsername,
              actorAvatar: avatarUrl,
              timestamp: new Date().toISOString(),
            })
          );
        }
      } catch (dmErr) {
        console.warn('[OAUTH SERVER] Could not send DM or auth log:', dmErr.message);
      }

      return res.send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0d1117;color:#e6edf3">
          <h2 style="color:#2ea44f">✅ GitHub Connected!</h2>
          <p>Your GitHub account <strong>@${result.githubUsername}</strong> has been linked.</p>
          <p style="color:#8b949e">You can close this tab and return to Discord.</p>
        </body></html>
      `);
    } catch (err) {
      console.error('[OAUTH SERVER] Callback error:', err);
      return res.status(500).send('Internal server error during authentication.');
    }
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(config.server.port, () => {
      console.log(`[OAUTH] Express server listening on port ${config.server.port}`);
      resolve({ app, server });
    });

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`OAuth server port ${config.server.port} is already in use. Stop the other process or set PORT to a free port that matches GITHUB_REDIRECT_URI.`));
        return;
      }

      reject(err);
    });
  });
}
