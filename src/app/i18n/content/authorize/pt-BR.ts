export const AUTHORIZE_PT_BR = `
## O que é /authorize?

O comando \`/authorize\` conecta serviços de terceiros (como Google, GitHub ou Microsoft) ao seu agente OpenClaw AI. Uma vez conectado, seu agente pode interagir com esses serviços em seu nome.

---

## Como Funciona

1. Envie \`/authorize\` no seu chat do Telegram
2. Escolha um provedor nos botões (ex.: Google)
3. Seu agente recebe a solicitação e envia um link de autorização
4. Clique no link, faça login no provedor e conceda o acesso
5. O token é entregue ao seu agente e salvo em \`OAUTH.md\`

Seu agente pode então usar o token armazenado para acessar o serviço conectado.

---

## Provedores Disponíveis

Os seguintes provedores estão disponíveis por padrão (quando configurados pela plataforma):

| Provedor | O que seu agente pode fazer |
|---|---|
| **Google** | Acessar Google Drive, Gmail, Agenda e outras APIs do Google |
| **GitHub** | Ler/escrever repositórios, gerenciar issues e pull requests |
| **Microsoft** | Acessar OneDrive, Outlook e APIs do Microsoft 365 |

Se o botão de um provedor não aparecer, significa que ele ainda não foi configurado.

---

## Apps OAuth Personalizados

Seu agente também pode se conectar a **qualquer provedor OAuth** usando suas próprias credenciais de aplicativo. Isso é útil quando você:

- Quer usar seu próprio app OAuth em vez do compartilhado
- Precisa se conectar a um provedor não listado acima (ex.: Slack, GitLab, Bitbucket)
- Precisa de escopos OAuth específicos para o seu caso de uso

### Como configurar um app OAuth personalizado

1. **Registre um app OAuth** no seu provedor (ex.: Google Cloud Console, GitHub Developer Settings)

2. **Defina o URI de redirecionamento** como:
   \`\`\`
   https://router.xaiworkspace.com/oauth/callback
   \`\`\`

3. **Informe as credenciais ao seu agente**. Envie uma mensagem como:
   > Configure OAuth para GitHub com client ID \`seu-client-id\` e client secret \`seu-client-secret\`

4. Seu agente chamará o router para gerar um token de estado, construir a URL de autorização e enviar o link para você

5. Após você autorizar, o token é trocado e salvo em \`OAUTH.md\` na instância do seu agente

### Como funciona internamente

Quando seu agente inicia um fluxo OAuth personalizado, ele chama o endpoint \`/oauth/state\` do router com seu \`clientId\`, \`clientSecret\` e \`tokenUrl\` personalizados. O router armazena esses dados por cliente e os utiliza quando o provedor OAuth redireciona de volta para a URL de callback.

---

## Segurança

- **Os segredos do app OAuth nunca saem do router** -- para provedores globais, o client secret é armazenado no AWS Secrets Manager e nunca é enviado à instância do seu agente
- **Credenciais personalizadas são armazenadas por cliente** no banco de dados e usadas apenas para a troca do seu token
- **Tokens de estado expiram após 10 minutos** para prevenir ataques de replay
- **Os tokens são salvos localmente** na instância do seu agente em \`OAUTH.md\` -- não são compartilhados com outros usuários

---

## Solução de Problemas

| Problema | Solução |
|---|---|
| Nenhum botão de provedor aparece | A plataforma ainda não configurou nenhum provedor OAuth |
| "Seu agente deve estar em execução" | Envie \`/start\` para ativar sua instância primeiro |
| O link de autorização não chega | Seu agente pode estar ocupado — aguarde um momento e tente novamente |
| "Estado expirado" ao clicar no link | O link expirou (10 min). Execute \`/authorize\` novamente |
| Falha na troca de token | Verifique se o URI de redirecionamento corresponde exatamente a: \`https://router.xaiworkspace.com/oauth/callback\` |
`;
