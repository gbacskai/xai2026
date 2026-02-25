import { LocalizedArticle } from '../../i18n.types';

export const ARTICLES_PT_BR: Record<string, LocalizedArticle> = {
  welcome: {
    title: 'Bem-vindo ao xAI Workspace',
    subtitle: 'Seu agente de IA pessoal',
    content: `
**xAI Workspace** coloca um agente de IA dedicado direto no seu Telegram — sem aplicativos para instalar, sem contas para criar.

## Como funciona

1. **Inicie o bot** — Envie \`/start\` para começar. Você recebe um período de avaliação gratuito na hora.
2. **Só conversar** — Mande qualquer mensagem e seu agente de IA responde. Ele entende contexto e pode ajudar com pesquisa, redação, programação e muito mais.
3. **Sua instância própria** — Ao contrário de chatbots compartilhados, você tem um agente dedicado que roda no seu próprio servidor com memória persistente.

## O que diferencia o xAI Workspace

- **Privado** — Suas conversas ficam na sua instância dedicada
- **Persistente** — Seu agente lembra o contexto entre sessões
- **Poderoso** — Baseado no Claude, um dos modelos de IA mais capazes do mercado
- **Simples** — É só o Telegram. Sem novos aplicativos, sem curva de aprendizado
    `,
  },
  'first-steps': {
    title: 'Primeiros Passos',
    subtitle: 'Configure seu agente em 60 segundos',
    content: `
## 1. Inicie o bot

Abra o Telegram e envie \`/start\` para **@xAIWorkspaceBot**. Seu período gratuito começa imediatamente — sem necessidade de cartão de crédito.

## 2. Aguarde o provisionamento

Sua instância de IA dedicada leva cerca de 2 minutos para ser configurada. Você receberá uma notificação quando estiver pronta.

## 3. Envie sua primeira mensagem

Digite qualquer coisa! Experimente:
- "Com o que você pode me ajudar?"
- "Resuma as últimas notícias sobre IA"
- "Escreva um script Python que ordena uma lista"

## 4. Explore os comandos

- \`/authorize\` — Conecte Google, Microsoft, GitHub e mais
- \`/usage\` — Verifique seu saldo de tokens
- \`/billing\` — Gerencie sua assinatura
- \`/language\` — Altere o idioma preferido
- \`/ssh\` — Conecte-se ao seu workspace para acessar arquivos
- \`/help\` — Veja todos os comandos disponíveis
- \`/models\` — Alterne entre modelos de IA
    `,
  },
  models: {
    title: 'Modelos de IA',
    subtitle: 'Escolha o modelo certo para cada tarefa',
    content: `
xAI Workspace suporta múltiplos modelos de IA de diferentes provedores. Alterne entre eles com \`/models\`.

## Modelos disponíveis

| Modelo | Ideal para |
|-------|----------|
| **Claude Sonnet** | Tarefas do dia a dia — rápido, capaz e equilibrado |
| **Claude Opus** | Raciocínio complexo, pesquisa, documentos longos |
| **Claude Haiku** | Respostas rápidas, tarefas simples, menor custo |
| **GPT-4o** | Uso geral, ótimo para saídas estruturadas |
| **DeepSeek** | Raciocínio e programação com boa relação custo-benefício |
| **Gemini** | Tarefas multimodais, janelas de contexto grandes |

## Trocando de modelo

1. Envie \`/models\` no chat
2. Toque no modelo que deseja usar
3. Um ✓ aparece ao lado do modelo ativo

Sua escolha persiste entre sessões. Você pode trocar a qualquer momento.

## Consumo de tokens

Modelos diferentes consomem tokens em ritmos diferentes. O Opus usa mais tokens por resposta do que o Haiku. Verifique seu saldo com \`/usage\`.
    `,
  },
  'remote-access': {
    title: 'Acesso Remoto',
    subtitle: 'Acesso SSH e SFTP ao seu workspace',
    content: `
Cada instância do xAI Workspace é uma máquina dedicada exclusivamente sua. Você pode se conectar via SSH ou SFTP para gerenciar arquivos, executar ferramentas e personalizar seu ambiente.

## Obtendo sua chave

1. Envie \`/ssh\` no chat do Telegram
2. O bot envia um arquivo de chave \`.pem\` com os detalhes de conexão
3. Salve o arquivo e configure as permissões antes de conectar

## SSH — Acesso ao terminal

\`\`\`bash
# Configure as permissões do arquivo de chave (obrigatório, apenas uma vez)
chmod 600 <chatId>-xaiworkspace.pem

# Conecte via o host bastion
ssh -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

Substitua \`<chatId>\` pelo seu ID de chat do Telegram (exibido no nome do arquivo de chave).

> Se você receber um erro de "permissão negada", verifique se executou \`chmod 600\` no arquivo de chave.

## SFTP — Transferência de arquivos

Você pode usar qualquer cliente SFTP para enviar e baixar arquivos:

\`\`\`bash
# SFTP via linha de comando
sftp -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

Ou use um cliente gráfico como **FileZilla**, **Cyberduck** ou **WinSCP**:

| Configuração | Valor |
|---|---|
| **Protocolo** | SFTP |
| **Host** | ssh.xaiworkspace.com |
| **Porta** | 22 |
| **Usuário** | xai\`<chatId>\` |
| **Autenticação** | Arquivo de chave (.pem obtido com \`/ssh\`) |

## O que você pode fazer

Uma vez conectado, seu workspace é totalmente seu:

- **Gerenciar arquivos** — navegar, editar, enviar e baixar documentos
- **Monitorar atividade** — visualizar os logs do seu agente em tempo real
- **Instalar ferramentas** — adicionar qualquer software ou runtime que precisar
- **Executar automações** — configurar tarefas agendadas ou serviços em segundo plano
- **Transferir arquivos** — usar \`scp\`, \`rsync\` ou SFTP para mover arquivos

## Se o seu workspace ainda está sendo configurado

Se o provisionamento ainda estiver em andamento, o bot avisará você. Aguarde alguns minutos e tente \`/ssh\` novamente.

## Segurança

- Todas as conexões passam por um **host bastion** — sua instância nunca fica exposta diretamente à internet
- Uma chave de criptografia ed25519 exclusiva é gerada para cada workspace durante a configuração
- Login por senha está desativado — apenas seu arquivo de chave pessoal funciona
- Acesso root é restrito por segurança
- Sua chave é armazenada criptografada no S3 e entregue somente no seu chat do Telegram
    `,
  },
  billing: {
    title: 'Planos e Cobrança',
    subtitle: 'Assinaturas, tokens e pagamentos',
    content: `
## Planos

| Plano | Preço | Tokens |
|------|-------|--------|
| **Trial** | Gratuito | 50K |
| **Essential** | $100/mês | 750K |
| **Professional** | $300/mês | 3M |
| **Enterprise** | $600/mês | 8M |

## Gerenciando sua assinatura

Envie \`/billing\` para abrir o painel de cobrança, onde você pode:
- Ver seu plano atual e a data de renovação
- Fazer upgrade ou downgrade
- Ativar recarga automática para pacotes extras de tokens
- Atualizar seu método de pagamento

## Pacotes de tokens

Ficou com poucos tokens? Ative a **recarga automática** em \`/billing\` para comprar tokens extras automaticamente ao atingir seu limite.

## Histórico de pagamentos

Envie \`/invoices\` para ver todos os pagamentos e recibos anteriores.
    `,
  },
  productivity: {
    title: 'Dicas de Produtividade',
    subtitle: 'Aproveite ao máximo seu agente de IA',
    content: `
## Seja específico

Em vez de "me ajuda a escrever um e-mail", tente:
> "Escreva um e-mail profissional para meu cliente João recusando a reunião de sexta-feira. Sugira terça ou quarta como alternativa. Seja breve e cordial."

## Use o contexto

Seu agente lembra da conversa. Construa em cima das mensagens anteriores:
1. "Analise estes dados CSV: ..."
2. "Agora crie um gráfico mostrando a tendência mensal"
3. "Adicione um parágrafo de resumo para a diretoria"

## Escolha o modelo certo

- **Pergunta rápida?** → Haiku (mais rápido e barato)
- **Trabalho do dia a dia?** → Sonnet (padrão, equilibrado)
- **Análise complexa?** → Opus (mais capaz)

Troque com \`/models\`.

## Monitore o uso

Verifique \`/usage\` regularmente para acompanhar seu consumo de tokens. A barra de progresso mostra sua cota mensal.
    `,
  },
  'language-region': {
    title: 'Idioma e Região',
    subtitle: 'Altere o idioma e a localização do servidor',
    content: `
## Alterar idioma

Envie \`/language\` para escolher entre 10 idiomas suportados:

| | |
|---|---|
| 🇬🇧 English | 🇨🇳 中文 |
| 🇪🇸 Español | 🇸🇦 العربية |
| 🇧🇷 Português | 🇩🇪 Deutsch |
| 🇫🇷 Français | 🇯🇵 日本語 |
| 🇷🇺 Русский | 🇮🇳 हिन्दी |

Seu idioma é detectado automaticamente pelas configurações do Telegram no primeiro uso, mas você pode alterá-lo a qualquer momento. Todas as mensagens do bot aparecerão no idioma selecionado.

## Alterar região

Envie \`/region\` para mover sua instância de IA para uma região de servidor diferente. Isso pode reduzir a latência se você estiver mais próximo de outro data center.

As regiões disponíveis são exibidas com a sua seleção atual em destaque.
    `,
  },
  'privacy-data': {
    title: 'Seus Dados e Privacidade',
    subtitle: 'Acesse, exporte ou exclua seus dados',
    content: `
## Controles de privacidade

xAI Workspace oferece controle total sobre seus dados pessoais, diretamente no Telegram:

- \`/privacy\` — Veja a Política de Privacidade e os Termos de Serviço
- \`/my_data\` — Exporte todos os seus dados pessoais em formato JSON
- \`/delete_my_data\` — Exclua permanentemente todos os seus dados pessoais

## O que é exportado

O comando \`/my_data\` exporta:

- Detalhes da sua conta (plano, e-mail, região)
- Histórico de pagamentos
- Estatísticas de uso
- Informações da instância do servidor

## O que é excluído

O comando \`/delete_my_data\` remove:

- Seu cadastro e todos os dados da conta
- Histórico de pagamentos
- Logs de uso e rastreamento de gastos
- Sua instância de IA e todos os arquivos nela
- Chaves de acesso e registros de conexão

Esta ação é **permanente e não pode ser desfeita**. Você será solicitado a confirmar antes que a exclusão seja realizada.

## Contato

Para dúvidas sobre privacidade: privacy@xshopper.com
    `,
  },
  referrals: {
    title: 'Convide Amigos',
    subtitle: 'Ganhe tokens bônus com indicações',
    content: `
## Como funciona

1. Envie \`/invite email@example.com\` para convidar um amigo
2. Você recebe **200K tokens bônus** imediatamente por cada convite enviado
3. Quando seu amigo assinar, você ganha um bônus de indicação adicional

## Regras

- Até **5 convites por mês**
- Máximo de **10 convites pendentes** (não utilizados) ao mesmo tempo
- O mesmo e-mail não pode ser convidado novamente em **4 semanas**
- O convidado não pode ter uma conta xAI Workspace existente

## Acompanhando seus convites

Envie \`/invites\` para ver todos os convites enviados com seus respectivos status:
- **aguardando** — convite enviado, ainda não se cadastrou
- **cadastrado** — o convidado criou uma conta
- **assinante** — o convidado fez o primeiro pagamento (bônus de indicação recebido)
    `,
  },
};
