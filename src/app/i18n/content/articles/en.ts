import { LocalizedArticle } from '../../i18n.types';

export const ARTICLES_EN: Record<string, LocalizedArticle> = {
  welcome: {
    title: 'Welcome to xAI Workspace',
    subtitle: 'Your personal AI agent',
    content: `
**xAI Workspace** gives you a dedicated AI agent accessible right inside Telegram — no apps to install, no accounts to create.

## How it works

1. **Start the bot** — Send \`/start\` to begin. You'll get a free trial instantly.
2. **Just chat** — Send any message and your AI agent will respond. It understands context, can help with research, writing, coding, and more.
3. **Your own instance** — Unlike shared AI chatbots, you get a dedicated agent that runs on its own server with persistent memory.

## What makes xAI Workspace different

- **Private** — Your conversations stay on your dedicated instance
- **Persistent** — Your agent remembers context across sessions
- **Powerful** — Powered by Claude, one of the most capable AI models
- **Simple** — It's just Telegram. No new apps, no learning curve
    `,
  },
  'first-steps': {
    title: 'First Steps',
    subtitle: 'Set up your agent in 60 seconds',
    content: `
## 1. Start the bot

Open Telegram and send \`/start\` to **@xAIWorkspaceBot**. Your free trial begins immediately — no credit card needed.

## 2. Wait for provisioning

Your dedicated AI instance takes about 2 minutes to set up. You'll receive a notification when it's ready.

## 3. Send your first message

Just type anything! Try:
- "What can you help me with?"
- "Summarise the latest news about AI"
- "Write a Python script that sorts a list"

## 4. Explore commands

- \`/authorize\` — Connect Google, Microsoft, GitHub and more
- \`/usage\` — Check your token balance
- \`/billing\` — Manage your subscription
- \`/language\` — Change your preferred language
- \`/ssh\` — Connect to your workspace for file access
- \`/help\` — See all available commands
- \`/models\` — Switch between AI models
    `,
  },
  models: {
    title: 'AI Models',
    subtitle: 'Choose the right model for your task',
    content: `
xAI Workspace supports multiple AI models from several providers. Switch between them with \`/models\`.

## Available Models

| Model | Best for |
|-------|----------|
| **Claude Sonnet** | Everyday tasks — fast, capable, balanced |
| **Claude Opus** | Complex reasoning, research, long documents |
| **Claude Haiku** | Quick answers, simple tasks, lowest cost |
| **GPT-4o** | General-purpose, good at structured output |
| **DeepSeek** | Cost-effective reasoning and coding |
| **Gemini** | Multimodal tasks, large context windows |

## Switching models

1. Send \`/models\` in the chat
2. Tap the model you want to use
3. A ✓ appears next to your active model

Your selection persists across sessions. You can switch anytime.

## Token usage

Different models consume tokens at different rates. Opus uses more tokens per response than Haiku. Check your balance with \`/usage\`.
    `,
  },
  'remote-access': {
    title: 'Remote Access',
    subtitle: 'SSH and SFTP access to your workspace',
    content: `
Every xAI Workspace instance is your own dedicated machine. You can connect via SSH or SFTP to manage files, run tools, and customise your environment.

## Getting your key

1. Send \`/ssh\` in the Telegram chat
2. The bot sends you a \`.pem\` key file with connection details
3. Save the file and set permissions before connecting

## SSH — Terminal access

\`\`\`bash
# Set permissions on the key file (required, one-time)
chmod 600 <chatId>-xaiworkspace.pem

# Connect via the bastion host
ssh -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

Replace \`<chatId>\` with your Telegram chat ID (shown in the key filename).

> If you get a "permission denied" error, double-check that you ran \`chmod 600\` on the key file.

## SFTP — File transfer

You can use any SFTP client to upload and download files:

\`\`\`bash
# Command-line SFTP
sftp -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

Or use a graphical client like **FileZilla**, **Cyberduck**, or **WinSCP**:

| Setting | Value |
|---|---|
| **Protocol** | SFTP |
| **Host** | ssh.xaiworkspace.com |
| **Port** | 22 |
| **Username** | xai\`<chatId>\` |
| **Authentication** | Key file (.pem from \`/ssh\`) |

## What you can do

Once connected, your workspace is fully yours:

- **Manage files** — browse, edit, upload, and download documents
- **Monitor activity** — view your agent's logs in real time
- **Install tools** — add any software or runtimes you need
- **Run automations** — set up scheduled tasks or background services
- **Transfer files** — use \`scp\`, \`rsync\`, or SFTP to move files

## If your workspace is still setting up

If your workspace is still being provisioned, the bot will let you know. Wait a couple of minutes and try \`/ssh\` again.

## Security

- All connections go through a **bastion host** — your instance is never directly exposed to the internet
- A unique ed25519 encryption key is generated for each workspace during setup
- Password login is disabled — only your personal key file works
- Root access is restricted for safety
- Your key is stored encrypted in S3 and only delivered to your Telegram chat
    `,
  },
  billing: {
    title: 'Plans & Billing',
    subtitle: 'Subscriptions, tokens, and payments',
    content: `
## Plans

| Plan | Price | Tokens |
|------|-------|--------|
| **Trial** | Free | 50K |
| **Essential** | $100/mo | 750K |
| **Professional** | $300/mo | 3M |
| **Enterprise** | $600/mo | 8M |

## Managing your subscription

Send \`/billing\` to open the billing dashboard where you can:
- View your current plan and renewal date
- Upgrade or downgrade
- Enable auto top-up for extra token packs
- Update your payment method

## Token packs

Running low? Enable **auto top-up** in \`/billing\` to automatically purchase extra tokens when you hit your limit.

## Payment history

Send \`/invoices\` to view all past payments and receipts.
    `,
  },
  productivity: {
    title: 'Productivity Tips',
    subtitle: 'Get the most from your AI agent',
    content: `
## Be specific

Instead of "help me write an email", try:
> "Write a professional email to my client John declining the Friday meeting. Suggest Tuesday or Wednesday instead. Keep it brief and friendly."

## Use context

Your agent remembers the conversation. Build on previous messages:
1. "Analyse this CSV data: ..."
2. "Now create a chart showing the monthly trend"
3. "Add a summary paragraph for the executive team"

## Choose the right model

- **Quick question?** → Haiku (fastest, cheapest)
- **Everyday work?** → Sonnet (default, balanced)
- **Complex analysis?** → Opus (most capable)

Switch with \`/models\`.

## Monitor usage

Check \`/usage\` regularly to track your token consumption. The progress bar shows your monthly allocation.
    `,
  },
  'language-region': {
    title: 'Language & Region',
    subtitle: 'Change language and server location',
    content: `
## Change language

Send \`/language\` to choose from 10 supported languages:

| | |
|---|---|
| 🇬🇧 English | 🇨🇳 中文 |
| 🇪🇸 Español | 🇸🇦 العربية |
| 🇧🇷 Português | 🇩🇪 Deutsch |
| 🇫🇷 Français | 🇯🇵 日本語 |
| 🇷🇺 Русский | 🇮🇳 हिन्दी |

Your language preference is auto-detected from your Telegram settings on first use, but you can change it anytime. All bot messages will appear in your selected language.

## Change region

Send \`/region\` to move your AI instance to a different server region. This can reduce latency if you're closer to another data centre.

Available regions are shown with your current selection highlighted.
    `,
  },
  'privacy-data': {
    title: 'Your Data & Privacy',
    subtitle: 'Access, export, or delete your data',
    content: `
## Privacy controls

xAI Workspace gives you full control over your personal data, directly inside Telegram:

- \`/privacy\` — View the Privacy Policy and Terms of Service
- \`/my_data\` — Export all your personal data as a JSON file
- \`/delete_my_data\` — Permanently delete all your personal data

## What gets exported

The \`/my_data\` command exports:

- Your account details (plan, email, region)
- Payment history
- Usage statistics
- Server instance information

## What gets deleted

The \`/delete_my_data\` command removes:

- Your client record and all account data
- Payment history
- Usage logs and spend tracking
- Your AI instance and all files on it
- Access keys and connection records

This action is **permanent and cannot be undone**. You will be asked to confirm before deletion proceeds.

## Contact

For any privacy questions: privacy@xshopper.com
    `,
  },
  referrals: {
    title: 'Invite Friends',
    subtitle: 'Earn bonus tokens with referrals',
    content: `
## How it works

1. Send \`/invite email@example.com\` to invite a friend
2. You get **200K bonus tokens** instantly for each invite sent
3. When your friend subscribes, you earn an additional referral bonus

## Rules

- Up to **5 invite credits per month**
- Maximum **10 pending** (unused) invites at a time
- The same email cannot be re-invited within **4 weeks**
- The invitee must not already have an xAI Workspace account

## Tracking your invites

Send \`/invites\` to see all your sent invitations with their status:
- **waiting** — invite sent, not yet signed up
- **signed up** — invitee created an account
- **subscribed** — invitee made their first payment (referral bonus earned)
    `,
  },
};
