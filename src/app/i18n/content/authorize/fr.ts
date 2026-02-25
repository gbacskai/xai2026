export const AUTHORIZE_FR = `
## À quoi sert /authorize ?

La commande \`/authorize\` connecte des services tiers (comme Google, GitHub ou Microsoft) à votre agent OpenClaw AI. Une fois la connexion établie, votre agent peut interagir avec ces services en votre nom.

---

## Comment ça fonctionne

1. Envoyez \`/authorize\` dans votre chat Telegram
2. Choisissez un fournisseur parmi les boutons proposés (ex. Google)
3. Votre agent reçoit la demande et vous envoie un lien d'autorisation
4. Cliquez sur le lien, connectez-vous au fournisseur et accordez l'accès
5. Le token est transmis à votre agent et enregistré dans \`OAUTH.md\`

Votre agent peut ensuite utiliser le token stocké pour accéder au service connecté.

---

## Fournisseurs disponibles

Les fournisseurs suivants sont disponibles par défaut (s'ils ont été configurés sur la plateforme) :

| Fournisseur | Ce que votre agent peut faire |
|---|---|
| **Google** | Accéder à Google Drive, Gmail, Calendar et d'autres API Google |
| **GitHub** | Lire/écrire des dépôts, gérer les issues et les pull requests |
| **Microsoft** | Accéder à OneDrive, Outlook et aux API Microsoft 365 |

Si un bouton de fournisseur n'apparaît pas, c'est qu'il n'a pas encore été configuré.

---

## Applications OAuth personnalisées

Votre agent peut également se connecter à **n'importe quel fournisseur OAuth** en utilisant vos propres identifiants d'application. Cela est utile si vous souhaitez :

- Utiliser votre propre application OAuth plutôt que celle partagée
- Vous connecter à un fournisseur non répertorié ci-dessus (ex. Slack, GitLab, Bitbucket)
- Utiliser des scopes OAuth spécifiques à votre cas d'usage

### Configurer une application OAuth personnalisée

1. **Enregistrez une application OAuth** auprès de votre fournisseur (ex. Google Cloud Console, paramètres développeur GitHub)

2. **Définissez l'URI de redirection** comme suit :
   \`\`\`
   https://router.xaiworkspace.com/oauth/callback
   \`\`\`

3. **Communiquez les identifiants à votre agent** en lui envoyant un message du type :
   > Configure OAuth pour GitHub avec le client ID \`your-client-id\` et le client secret \`your-client-secret\`

4. Votre agent appellera le routeur pour générer un token d'état, construire l'URL d'autorisation et vous envoyer le lien

5. Après votre autorisation, le token est échangé et enregistré dans \`OAUTH.md\` sur l'instance de votre agent

### Fonctionnement interne

Lorsque votre agent initie un flux OAuth personnalisé, il appelle le point d'entrée \`/oauth/state\` du routeur avec votre \`clientId\`, \`clientSecret\` et \`tokenUrl\` personnalisés. Le routeur stocke ces informations par client et les utilise lorsque le fournisseur OAuth redirige vers l'URL de callback.

---

## Sécurité

- **Les secrets d'application OAuth ne quittent jamais le routeur** — pour les fournisseurs globaux, le client secret est stocké dans AWS Secrets Manager et n'est jamais transmis à l'instance de votre agent
- **Les identifiants personnalisés sont stockés par client** dans la base de données et utilisés uniquement pour votre échange de tokens
- **Les tokens d'état expirent après 10 minutes** pour prévenir les attaques par rejeu
- **Les tokens sont enregistrés localement** sur l'instance de votre agent dans \`OAUTH.md\` — ils ne sont pas partagés avec d'autres utilisateurs

---

## Résolution des problèmes

| Problème | Solution |
|---|---|
| Aucun bouton de fournisseur n'apparaît | La plateforme n'a pas encore configuré de fournisseurs OAuth |
| "Votre agent doit être en cours d'exécution" | Envoyez \`/start\` pour réveiller votre instance d'abord |
| Le lien d'autorisation n'arrive pas | Votre agent est peut-être occupé — patientez un instant et réessayez |
| "State expired" après avoir cliqué sur le lien | Le lien a expiré (10 min). Exécutez à nouveau \`/authorize\` |
| L'échange de token échoue | Vérifiez que l'URI de redirection correspond exactement à : \`https://router.xaiworkspace.com/oauth/callback\` |
`;
