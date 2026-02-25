import { LocalizedArticle } from '../../i18n.types';

export const ARTICLES_FR: Record<string, LocalizedArticle> = {
  welcome: {
    title: 'Bienvenue sur xAI Workspace',
    subtitle: 'Votre agent IA personnel',
    content: `
**xAI Workspace** vous offre un agent IA dédié, accessible directement dans Telegram — sans application à installer ni compte à créer.

## Comment ça fonctionne

1. **Démarrer le bot** — Envoyez \`/start\` pour commencer. Votre essai gratuit est activé immédiatement.
2. **Discutez librement** — Envoyez n'importe quel message et votre agent IA vous répondra. Il comprend le contexte et peut vous aider pour la recherche, la rédaction, la programmation, et bien plus encore.
3. **Votre propre instance** — Contrairement aux chatbots IA partagés, vous disposez d'un agent dédié qui tourne sur son propre serveur avec une mémoire persistante.

## Ce qui distingue xAI Workspace

- **Privé** — Vos conversations restent sur votre instance dédiée
- **Persistant** — Votre agent se souvient du contexte d'une session à l'autre
- **Puissant** — Propulsé par Claude, l'un des modèles IA les plus performants
- **Simple** — C'est juste Telegram. Pas de nouvelle application, pas de courbe d'apprentissage
    `,
  },
  'first-steps': {
    title: 'Premiers pas',
    subtitle: 'Configurer votre agent en 60 secondes',
    content: `
## 1. Démarrer le bot

Ouvrez Telegram et envoyez \`/start\` à **@xAIWorkspaceBot**. Votre essai gratuit commence immédiatement — aucune carte bancaire requise.

## 2. Attendre le provisionnement

Votre instance IA dédiée prend environ 2 minutes à configurer. Vous recevrez une notification dès qu'elle sera prête.

## 3. Envoyer votre premier message

Tapez n'importe quoi ! Essayez :
- "Qu'est-ce que tu peux faire pour moi ?"
- "Résume les dernières actualités sur l'IA"
- "Écris un script Python qui trie une liste"

## 4. Explorer les commandes

- \`/authorize\` — Connecter Google, Microsoft, GitHub et d'autres services
- \`/usage\` — Vérifier votre solde de tokens
- \`/billing\` — Gérer votre abonnement
- \`/language\` — Changer votre langue préférée
- \`/ssh\` — Accéder à votre espace de travail pour gérer vos fichiers
- \`/help\` — Voir toutes les commandes disponibles
- \`/models\` — Changer de modèle IA
    `,
  },
  models: {
    title: 'Modèles IA',
    subtitle: 'Choisir le bon modèle pour chaque tâche',
    content: `
xAI Workspace prend en charge plusieurs modèles IA de différents fournisseurs. Passez de l'un à l'autre avec \`/models\`.

## Modèles disponibles

| Modèle | Idéal pour |
|-------|----------|
| **Claude Sonnet** | Tâches quotidiennes — rapide, efficace, équilibré |
| **Claude Opus** | Raisonnement complexe, recherche, longs documents |
| **Claude Haiku** | Réponses rapides, tâches simples, coût le plus bas |
| **GPT-4o** | Usage général, excellent pour les sorties structurées |
| **DeepSeek** | Raisonnement et programmation à moindre coût |
| **Gemini** | Tâches multimodales, grandes fenêtres de contexte |

## Changer de modèle

1. Envoyez \`/models\` dans le chat
2. Appuyez sur le modèle que vous souhaitez utiliser
3. Un ✓ apparaît à côté de votre modèle actif

Votre sélection est conservée d'une session à l'autre. Vous pouvez changer à tout moment.

## Consommation de tokens

Les différents modèles consomment des tokens à des rythmes différents. Opus utilise plus de tokens par réponse que Haiku. Vérifiez votre solde avec \`/usage\`.
    `,
  },
  'remote-access': {
    title: 'Accès à distance',
    subtitle: 'Accès SSH et SFTP à votre espace de travail',
    content: `
Chaque instance xAI Workspace est votre propre machine dédiée. Vous pouvez vous y connecter via SSH ou SFTP pour gérer vos fichiers, exécuter des outils et personnaliser votre environnement.

## Obtenir votre clé

1. Envoyez \`/ssh\` dans le chat Telegram
2. Le bot vous envoie un fichier de clé \`.pem\` avec les informations de connexion
3. Sauvegardez le fichier et définissez ses permissions avant de vous connecter

## SSH — Accès au terminal

\`\`\`bash
# Définir les permissions sur le fichier de clé (requis, une seule fois)
chmod 600 <chatId>-xaiworkspace.pem

# Se connecter via le bastion host
ssh -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

Remplacez \`<chatId>\` par votre identifiant de chat Telegram (visible dans le nom du fichier de clé).

> Si vous obtenez une erreur "permission denied", vérifiez bien que vous avez exécuté \`chmod 600\` sur le fichier de clé.

## SFTP — Transfert de fichiers

Vous pouvez utiliser n'importe quel client SFTP pour envoyer et télécharger des fichiers :

\`\`\`bash
# SFTP en ligne de commande
sftp -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

Ou utilisez un client graphique comme **FileZilla**, **Cyberduck** ou **WinSCP** :

| Paramètre | Valeur |
|---|---|
| **Protocole** | SFTP |
| **Hôte** | ssh.xaiworkspace.com |
| **Port** | 22 |
| **Nom d'utilisateur** | xai\`<chatId>\` |
| **Authentification** | Fichier de clé (.pem fourni par \`/ssh\`) |

## Ce que vous pouvez faire

Une fois connecté, votre espace de travail vous appartient entièrement :

- **Gérer les fichiers** — parcourir, modifier, envoyer et télécharger des documents
- **Surveiller l'activité** — consulter les journaux de votre agent en temps réel
- **Installer des outils** — ajouter les logiciels ou environnements d'exécution dont vous avez besoin
- **Automatiser** — configurer des tâches planifiées ou des services en arrière-plan
- **Transférer des fichiers** — utiliser \`scp\`, \`rsync\` ou SFTP pour déplacer des fichiers

## Si votre espace de travail est encore en cours de configuration

Si votre espace de travail est encore en cours de provisionnement, le bot vous en informera. Attendez quelques minutes et réessayez \`/ssh\`.

## Sécurité

- Toutes les connexions passent par un **bastion host** — votre instance n'est jamais directement exposée à Internet
- Une clé de chiffrement ed25519 unique est générée pour chaque espace de travail lors de la configuration
- La connexion par mot de passe est désactivée — seul votre fichier de clé personnel fonctionne
- L'accès root est restreint pour des raisons de sécurité
- Votre clé est stockée chiffrée dans S3 et transmise uniquement à votre chat Telegram
    `,
  },
  billing: {
    title: 'Forfaits et facturation',
    subtitle: 'Abonnements, tokens et paiements',
    content: `
## Forfaits

| Forfait | Prix | Tokens |
|------|-------|--------|
| **Trial** | Gratuit | 50K |
| **Essential** | 100 $/mois | 750K |
| **Professional** | 300 $/mois | 3M |
| **Enterprise** | 600 $/mois | 8M |

## Gérer votre abonnement

Envoyez \`/billing\` pour ouvrir le tableau de bord de facturation, où vous pouvez :
- Consulter votre forfait actuel et la date de renouvellement
- Passer à un forfait supérieur ou inférieur
- Activer le rechargement automatique pour des packs de tokens supplémentaires
- Mettre à jour votre mode de paiement

## Packs de tokens

Vous manquez de tokens ? Activez le **rechargement automatique** dans \`/billing\` pour acheter automatiquement des tokens supplémentaires lorsque vous atteignez votre limite.

## Historique des paiements

Envoyez \`/invoices\` pour consulter tous vos paiements passés et vos reçus.
    `,
  },
  productivity: {
    title: 'Conseils de productivité',
    subtitle: 'Tirer le meilleur de votre agent IA',
    content: `
## Soyez précis

Au lieu de "aide-moi à rédiger un e-mail", essayez :
> "Rédige un e-mail professionnel à mon client John pour décliner la réunion de vendredi. Propose le mardi ou le mercredi à la place. Reste bref et cordial."

## Exploitez le contexte

Votre agent se souvient de la conversation. Enchaînez les messages :
1. "Analyse ces données CSV : ..."
2. "Maintenant crée un graphique montrant la tendance mensuelle"
3. "Ajoute un paragraphe de synthèse pour l'équipe de direction"

## Choisir le bon modèle

- **Question rapide ?** → Haiku (le plus rapide, le moins cher)
- **Travail quotidien ?** → Sonnet (par défaut, équilibré)
- **Analyse complexe ?** → Opus (le plus performant)

Changez avec \`/models\`.

## Surveiller votre consommation

Consultez régulièrement \`/usage\` pour suivre votre consommation de tokens. La barre de progression indique votre allocation mensuelle.
    `,
  },
  'language-region': {
    title: 'Langue et région',
    subtitle: 'Changer la langue et la localisation du serveur',
    content: `
## Changer de langue

Envoyez \`/language\` pour choisir parmi 10 langues prises en charge :

| | |
|---|---|
| 🇬🇧 English | 🇨🇳 中文 |
| 🇪🇸 Español | 🇸🇦 العربية |
| 🇧🇷 Português | 🇩🇪 Deutsch |
| 🇫🇷 Français | 🇯🇵 日本語 |
| 🇷🇺 Русский | 🇮🇳 हिन्दी |

Votre préférence de langue est détectée automatiquement depuis vos paramètres Telegram lors de la première utilisation, mais vous pouvez la modifier à tout moment. Tous les messages du bot s'afficheront dans la langue choisie.

## Changer de région

Envoyez \`/region\` pour déplacer votre instance IA vers une autre région de serveur. Cela peut réduire la latence si vous êtes plus proche d'un autre centre de données.

Les régions disponibles sont affichées avec votre sélection actuelle mise en évidence.
    `,
  },
  'privacy-data': {
    title: 'Vos données et votre vie privée',
    subtitle: 'Accéder, exporter ou supprimer vos données',
    content: `
## Contrôle de la confidentialité

xAI Workspace vous donne un contrôle total sur vos données personnelles, directement dans Telegram :

- \`/privacy\` — Consulter la politique de confidentialité et les conditions d'utilisation
- \`/my_data\` — Exporter toutes vos données personnelles sous forme de fichier JSON
- \`/delete_my_data\` — Supprimer définitivement toutes vos données personnelles

## Ce qui est exporté

La commande \`/my_data\` exporte :

- Vos informations de compte (forfait, e-mail, région)
- L'historique des paiements
- Les statistiques d'utilisation
- Les informations sur votre instance serveur

## Ce qui est supprimé

La commande \`/delete_my_data\` supprime :

- Votre fiche client et toutes les données de votre compte
- L'historique des paiements
- Les journaux d'utilisation et le suivi des dépenses
- Votre instance IA et tous les fichiers qu'elle contient
- Les clés d'accès et les enregistrements de connexion

Cette action est **définitive et irréversible**. Une confirmation vous sera demandée avant que la suppression ne soit effectuée.

## Contact

Pour toute question relative à la confidentialité : privacy@xshopper.com
    `,
  },
  referrals: {
    title: 'Inviter des amis',
    subtitle: 'Gagnez des tokens en parrainant',
    content: `
## Comment ça fonctionne

1. Envoyez \`/invite email@example.com\` pour inviter un ami
2. Vous recevez immédiatement **200K tokens bonus** pour chaque invitation envoyée
3. Lorsque votre ami s'abonne, vous gagnez un bonus de parrainage supplémentaire

## Règles

- Jusqu'à **5 crédits d'invitation par mois**
- Maximum **10 invitations en attente** (non utilisées) à la fois
- Le même e-mail ne peut pas être ré-invité avant **4 semaines**
- L'invité ne doit pas déjà posséder un compte xAI Workspace

## Suivre vos invitations

Envoyez \`/invites\` pour voir toutes vos invitations envoyées avec leur statut :
- **en attente** — invitation envoyée, compte non encore créé
- **inscrit** — l'invité a créé un compte
- **abonné** — l'invité a effectué son premier paiement (bonus de parrainage obtenu)
    `,
  },
};
