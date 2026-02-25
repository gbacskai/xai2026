export const PRIVACY_EN = `
## Who We Are

xShopper Pty Ltd ("xShopper", "we", "us") operates the OpenClaw AI service, accessible via Telegram.
Data controller: xShopper Pty Ltd, Australia.
Contact: privacy@xshopper.com

---

## What Personal Data We Collect

When you use OpenClaw AI, we collect:

- **Telegram user identifier** (chat_id) — your unique Telegram ID, used to identify your account throughout the service
- **Email address** — if you register or are invited, we store your email to manage your account and send service communications
- **IP addresses** — your dedicated server instance's IP addresses, used to route your messages
- **Payment data** — subscription amounts, dates, Stripe customer ID, and last 4 digits of payment card (payment card details are held by Stripe, not by us)
- **Token usage data** — daily and monthly AI token consumption
- **AI conversation content** — the messages you send to your AI agent

---

## Why We Process Your Data and the Legal Basis

| Purpose | Legal basis (GDPR Art. 6) |
|---|---|
| Providing the AI agent service (account setup, routing messages, managing your subscription) | Art. 6(1)(b) — performance of a contract |
| Billing and payment processing | Art. 6(1)(b) — performance of a contract |
| Usage monitoring and budget enforcement | Art. 6(1)(b) — performance of a contract |
| Sending service notifications (usage alerts, renewal reminders) | Art. 6(1)(b) — performance of a contract |
| Sending invite emails on your behalf | Art. 6(1)(a) — consent (you initiate the /invite command) |
| Security monitoring and abuse prevention | Art. 6(1)(f) — legitimate interests |

---

## Who We Share Your Data With

We use the following third-party processors to deliver the service:

- **Telegram** (Netherlands) — delivers messages between you and your AI agent
- **Anthropic** (United States) — processes your conversation content to generate AI responses. Transfer mechanism: Standard Contractual Clauses
- **Stripe** (United States) — handles all payment processing. Transfer mechanism: Standard Contractual Clauses / EU-US Data Privacy Framework
- **Neon** (United States) — hosts our database. Transfer mechanism: Standard Contractual Clauses
- **Amazon Web Services** (Australia, ap-southeast-2) — hosts all infrastructure
- **Cloudflare** (Global) — provides DNS services

We do not sell your personal data.

---

## International Transfers

Your AI conversation content is processed by Anthropic in the United States. This transfer is covered by Standard Contractual Clauses. Payment data is processed by Stripe in the United States, covered by the EU-US Data Privacy Framework and Standard Contractual Clauses.

---

## How Long We Keep Your Data

- Account data: retained while your account is active and for 30 days after cancellation
- Payment records: retained for 7 years as required by Australian tax law
- AI conversation content: stored on your dedicated server instance; deleted when your instance is terminated
- Usage logs: retained for 90 days

---

## Your Rights

If you are in the EU/EEA or UK, you have the following rights under GDPR:

- **Right to access** — request a copy of your personal data
- **Right to rectification** — request correction of inaccurate data
- **Right to erasure** — request deletion of your personal data
- **Right to restriction** — request that we limit how we process your data
- **Right to data portability** — receive your data in a structured, machine-readable format
- **Right to object** — object to processing based on legitimate interests

You can exercise several of these rights directly inside Telegram:

- Send \`/my_data\` to export your personal data
- Send \`/delete_my_data\` to request deletion of all your data

For other requests, contact us at privacy@xshopper.com. We will respond within 30 days.

You also have the right to lodge a complaint with your local supervisory authority.

---

## Contact

Privacy enquiries: privacy@xshopper.com
xShopper Pty Ltd, Australia
Australian Trademark No. 1749660 (Class 35)
`;
