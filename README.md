# GitHub Discord Manager 🤖

A production-grade Discord bot that lets developers manage GitHub repositories entirely through Discord slash commands — optimized for mobile (iOS & Android).

---

## ✨ Features

| Category | Commands |
|---|---|
| **Auth** | `/github login`, `/github logout`, `/github whoami`, `/github stats` |
| **Repos** | `/repo create/delete/list/info/rename/fork/visibility/topics/star/unstar` |
| **Files** | `/file read/create/edit/delete` |
| **Branches** | `/branch list/create/delete/protect` |
| **Pull Requests** | `/pr create/list/merge/close/review` |
| **Issues** | `/issue create/list/close/assign/label` |
| **Collaborators** | `/collab add/remove/list` |
| **Releases** | `/release create/list/delete` |

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Discord**: discord.js v14
- **GitHub API**: @octokit/rest
- **Auth**: GitHub OAuth 2.0 (custom flow)
- **Database**: Firebase Realtime Database (free tier)
- **HTTP**: Express.js (OAuth callback server)

---

## 📋 Prerequisites

- Node.js 20 or later
- A Discord application (Bot)
- A GitHub OAuth App
- A Firebase project with Realtime Database enabled

---

## 🚀 Setup Guide

### Step 1 — Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → give it a name
3. Navigate to **Bot** → click **Add Bot**
4. Under **Token**, click **Reset Token** and copy it → this is your `DISCORD_TOKEN`
5. Copy the **Application ID** from the **General Information** tab → this is your `DISCORD_CLIENT_ID`
6. Under **Bot → Privileged Gateway Intents**, enable **Message Content Intent** (optional, not strictly needed)
7. Invite the bot to your server:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147483648&scope=bot+applications.commands
   ```
   Replace `YOUR_CLIENT_ID` with your application ID.

### Step 2 — Create a GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps → New OAuth App**
3. Fill in:
   - **Application name**: e.g. `GitHub Discord Manager`
   - **Homepage URL**: your deployment URL (or `http://localhost:3000` for dev)
   - **Authorization callback URL**: `http://localhost:3000/callback` (dev) or `https://your-app.railway.app/callback` (prod)
4. Click **Register Application**
5. Copy the **Client ID** → `GITHUB_CLIENT_ID`
6. Click **Generate a new client secret** → copy it → `GITHUB_CLIENT_SECRET`

### Step 3 — Set Up Firebase Realtime Database

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → follow the wizard
3. From the left sidebar: **Build → Realtime Database → Create Database**
   - Choose a region, start in **test mode** (you'll lock it down later)
4. Copy the database URL (e.g. `https://your-project-default-rtdb.firebaseio.com`) → `FIREBASE_DATABASE_URL`
5. Generate a service account key:
   - Go to **Project Settings → Service Accounts**
   - Click **Generate new private key** → download the JSON file
   - Open the file, copy its entire contents, and minify it to a single line:
     ```bash
     node -e "const fs=require('fs'); console.log(JSON.stringify(JSON.parse(fs.readFileSync('your-key.json','utf8'))))"
     ```
   - Paste the single-line JSON as the value of `FIREBASE_SERVICE_ACCOUNT_KEY` in your `.env`

6. **Secure your database rules** (recommended for production):
   ```json
   {
     "rules": {
       ".read": false,
       ".write": false
     }
   }
   ```
   Your service account bypasses these rules, so the bot will still work.

### Step 4 — Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_guild_id_for_dev  # Remove for global production commands

GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/callback

# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=a_64_char_hex_string

FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

PORT=3000
```

### Step 5 — Install Dependencies

```bash
npm install
```

### Step 6 — Register Slash Commands

```bash
npm run deploy-commands
```

> **Development tip**: Set `DISCORD_GUILD_ID` in your `.env` to register commands to a specific server instantly (no 1-hour propagation delay). Remove it for global production deployment.

### Step 7 — Start the Bot

```bash
# Development (with auto-restart on changes)
npm run dev

# Production
npm start
```

You should see:
```
[BOT] Firebase initialized.
[COMMANDS] Loaded: /github
[COMMANDS] Loaded: /repo
...
[OAUTH] Express server listening on port 3000
[BOT] Discord bot is online as YourBot#1234
```

---

## ☁️ Deploying to Railway (Free Tier)

1. Push your code to a GitHub repository
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
3. Select your repository
4. Go to **Variables** and add all values from your `.env` (one by one)
5. Set `GITHUB_REDIRECT_URI` to `https://your-app.up.railway.app/callback`
   - Update this URL in your GitHub OAuth App settings too!
6. Railway auto-detects `npm start` — no extra config needed
7. The **Health Check URL** (`/`) is already built in for Railway's uptime monitor

---

## ☁️ Deploying to Render (Free Tier)

1. Push your code to a GitHub repository
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Set the **Start Command** to `npm start`
5. Add all environment variables under **Environment**
6. Set `GITHUB_REDIRECT_URI` to `https://your-app.onrender.com/callback`

> **Note**: Render free tier spins down after 15 minutes of inactivity. Use an uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping the `/` endpoint every 10 minutes.

---

## 🔐 Security Notes

- Tokens are **AES-256-CBC encrypted** at rest in Firebase
- OAuth state tokens are **single-use** and expire after 10 minutes
- All command responses for errors or sensitive data use `ephemeral: true` — only visible to the invoking user
- Never commit your `.env` file — it's in `.gitignore` by default
- Generate your `ENCRYPTION_KEY` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 🧱 Project Structure

```
src/
├── index.js                  # Bot entry point + graceful shutdown
├── deploy-commands.js        # Slash command registration script
├── config.js                 # Centralized env var config
├── auth/
│   ├── oauthServer.js        # Express OAuth callback server
│   ├── tokenManager.js       # Firebase token CRUD + AES encryption
│   ├── githubOAuth.js        # OAuth URL builder + code exchanger
│   └── requireAuth.js        # Auth middleware for commands
├── commands/
│   ├── github.js             # /github (login/logout/whoami/stats)
│   ├── repos/                # /repo subcommands
│   ├── files/                # /file subcommands
│   ├── branches/             # /branch subcommands
│   ├── prs/                  # /pr subcommands
│   ├── issues/               # /issue subcommands
│   ├── collaborators/        # /collab subcommands
│   └── releases/             # /release subcommands
├── handlers/
│   ├── commandHandler.js     # Dynamic command loader
│   └── errorHandler.js       # GitHub API error mapper
└── utils/
    ├── embeds.js             # Discord embed builders
    ├── pagination.js         # Button-based paginated lists
    ├── validators.js         # Input sanitization
    └── rateLimiter.js        # GitHub API rate limit hook
```

---

## 📝 License

MIT
