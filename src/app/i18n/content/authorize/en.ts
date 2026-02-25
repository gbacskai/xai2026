export const AUTHORIZE_EN = `
## What is /authorize?

The \`/authorize\` command connects third-party services (like Google, GitHub, or Microsoft) to your OpenClaw AI agent. Once connected, your agent can interact with these services on your behalf.

---

## How It Works

1. Send \`/authorize\` in your Telegram chat
2. Choose a provider from the buttons (e.g. Google)
3. Your agent receives the request and sends you an authorization link
4. Click the link, sign in to the provider, and grant access
5. The token is delivered to your agent and saved in \`OAUTH.md\`

Your agent can then use the stored token to access the connected service.

---

## Available Providers

The following providers are available out of the box (when configured by the platform):

| Provider | What your agent can do |
|---|---|
| **Google** | Access Google Drive, Gmail, Calendar, and other Google APIs |
| **GitHub** | Read/write repositories, manage issues, pull requests |
| **Microsoft** | Access OneDrive, Outlook, Microsoft 365 APIs |

If a provider button doesn't appear, it means it hasn't been configured yet.

---

## Custom OAuth Apps

Your agent can also connect to **any OAuth provider** using your own app credentials. This is useful when you:

- Want to use your own OAuth app instead of the shared one
- Need to connect to a provider not listed above (e.g. Slack, GitLab, Bitbucket)
- Need specific OAuth scopes for your use case

### How to set up a custom OAuth app

1. **Register an OAuth app** with your provider (e.g. Google Cloud Console, GitHub Developer Settings)

2. **Set the redirect URI** to:
   \`\`\`
   https://router.xaiworkspace.com/oauth/callback
   \`\`\`

3. **Tell your agent** the credentials. Send a message like:
   > Set up OAuth for GitHub with client ID \`your-client-id\` and client secret \`your-client-secret\`

4. Your agent will call the router to generate a state token, build the authorization URL, and send you the link

5. After you authorize, the token is exchanged and saved to \`OAUTH.md\` on your agent's instance

### How it works under the hood

When your agent initiates a custom OAuth flow, it calls the router's \`/oauth/state\` endpoint with your custom \`clientId\`, \`clientSecret\`, and \`tokenUrl\`. The router stores these per-client and uses them when the OAuth provider redirects back to the callback URL.

---

## Security

- **OAuth app secrets never leave the router** -- for global providers, the client secret is stored in AWS Secrets Manager and never sent to your agent's instance
- **Custom credentials are stored per-client** in the database and used only for your token exchange
- **State tokens expire after 10 minutes** to prevent replay attacks
- **Tokens are saved locally** on your agent's instance in \`OAUTH.md\` -- they are not shared with other users

---

## Troubleshooting

| Problem | Solution |
|---|---|
| No provider buttons appear | The platform hasn't configured any OAuth providers yet |
| "Your agent must be running" | Send \`/start\` to wake up your instance first |
| Authorization link doesn't arrive | Your agent may be busy -- wait a moment and try again |
| "State expired" after clicking link | The link expired (10 min). Run \`/authorize\` again |
| Token exchange fails | Check that the redirect URI matches exactly: \`https://router.xaiworkspace.com/oauth/callback\` |
`;
