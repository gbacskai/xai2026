export const PRIVACY_FR = `
## Qui sommes-nous

xShopper Pty Ltd ("xShopper", "nous") exploite le service xAI Workspace, accessible via xAI Workspace.
Responsable du traitement : xShopper Pty Ltd, Australie.
Contact : privacy@xshopper.com

---

## Données personnelles collectées

Lorsque vous utilisez xAI Workspace, nous collectons :

- **Identifiant xAI Workspace** (chat_id) — votre identifiant xAI Workspace unique, utilisé pour vous reconnaître dans l'ensemble du service
- **Adresse e-mail** — si vous vous inscrivez ou êtes invité, nous conservons votre e-mail pour gérer votre compte et vous envoyer des communications liées au service
- **Adresses IP** — les adresses IP de votre instance de serveur dédiée, utilisées pour acheminer vos messages
- **Données de paiement** — montants des abonnements, dates, identifiant client Stripe et quatre derniers chiffres de la carte de paiement (les coordonnées complètes de la carte sont conservées par Stripe, pas par nous)
- **Données de consommation de tokens** — consommation quotidienne et mensuelle de tokens IA
- **Contenu des conversations IA** — les messages que vous envoyez à votre agent IA

---

## Pourquoi nous traitons vos données et sur quelle base légale

| Finalité | Base légale |
|---|---|
| Fourniture du service d'agent IA (création du compte, acheminement des messages, gestion de l'abonnement) | RGPD art. 6(1)(b) — exécution d'un contrat ; APP 3 — raisonnablement nécessaire pour le service |
| Facturation et traitement des paiements | RGPD art. 6(1)(b) — exécution d'un contrat ; APP 3 — raisonnablement nécessaire |
| Suivi de l'utilisation et application des limites budgétaires | RGPD art. 6(1)(b) — exécution d'un contrat ; APP 3 — raisonnablement nécessaire |
| Envoi de notifications de service (alertes d'utilisation, rappels de renouvellement) | RGPD art. 6(1)(b) — exécution d'un contrat |
| Envoi d'e-mails d'invitation en votre nom | RGPD art. 6(1)(a) — consentement (vous déclenchez la commande /invite) |
| Surveillance de la sécurité et prévention des abus | RGPD art. 6(1)(f) — intérêts légitimes |

---

## Avec qui nous partageons vos données

Nous faisons appel aux sous-traitants tiers suivants pour fournir le service :

- **Telegram** (Pays-Bas / EAU) — achemine les messages entre vous et votre agent IA
- **Anthropic** (États-Unis) — fournisseur principal de modèle IA ; traite le contenu de vos conversations pour générer les réponses IA
- **OpenAI** (États-Unis) — fournisseur optionnel de modèle IA ; traite le contenu des conversations si vous sélectionnez un modèle OpenAI
- **Google / Gemini** (États-Unis) — fournisseur optionnel de modèle IA ; traite le contenu des conversations si vous sélectionnez un modèle Gemini
- **Groq** (États-Unis) — fournisseur optionnel de modèle IA ; traite le contenu des conversations si vous sélectionnez un modèle Groq
- **DeepSeek** (Chine / Singapour) — fournisseur optionnel de modèle IA ; traite le contenu des conversations si vous sélectionnez un modèle DeepSeek
- **Mistral AI** (France) — fournisseur optionnel de modèle IA ; traite le contenu des conversations si vous sélectionnez un modèle Mistral
- **Alibaba Cloud / Qwen** (Chine / Singapour) — fournisseur optionnel de modèle IA ; traite le contenu des conversations si vous sélectionnez un modèle Qwen
- **Stripe** (États-Unis) — gère l'ensemble du traitement des paiements
- **Neon** (États-Unis) — héberge notre base de données
- **Amazon Web Services** (Australie et États-Unis) — héberge l'infrastructure à Sydney (ap-southeast-2) et en Virginie du Nord (us-east-1)

Nous ne vendons pas vos données personnelles.

---

## Transferts internationaux et divulgation à l'étranger

xShopper Pty Ltd est une société australienne. Vos données personnelles sont transférées vers les pays suivants et y sont traitées :

| Pays | Destinataires | Données transférées |
|---|---|---|
| **Australie** | AWS (Sydney, ap-southeast-2) | Toutes les données — région d'hébergement principale |
| **États-Unis** | Anthropic, OpenAI, Groq, Google, AWS (us-east-1), Neon, Stripe | Conversations IA, données de compte, données de paiement |
| **France** | Mistral AI | Conversations IA (si modèle Mistral sélectionné) |
| **Chine / Singapour** | DeepSeek, Alibaba Cloud (Qwen) | Conversations IA (si modèle DeepSeek ou Qwen sélectionné) |
| **Pays-Bas / EAU** | Telegram | Messages, identifiants utilisateur |

**Pour les utilisateurs australiens (Privacy Act 1988) :** En vertu de l'Australian Privacy Principle 8, xShopper prend des mesures raisonnables pour s'assurer que les destinataires à l'étranger traitent vos informations personnelles conformément aux APP. En utilisant ce service et en donnant votre consentement lors de l'inscription, vous reconnaissez que vos données seront transférées dans les pays listés ci-dessus et que les principes australiens de protection de la vie privée peuvent ne pas s'appliquer aux données détenues par des destinataires à l'étranger. Vous pouvez déposer une plainte auprès du Bureau du commissaire australien à l'information (OAIC) si vous estimez que vos informations ont été mal gérées.

**Pour les utilisateurs UE/EEE (RGPD) :** Les transferts vers les États-Unis sont couverts par des clauses contractuelles types et, lorsqu'il est disponible, le cadre UE-États-Unis de protection des données à caractère personnel. Les transferts vers la France (Mistral AI) ne nécessitent pas de garanties supplémentaires (État membre de l'UE).

---

## Durée de conservation de vos données

- Données de compte : conservées pendant la durée d'activité de votre compte et pendant 30 jours après la résiliation
- Données de paiement : conservées pendant 7 ans, conformément aux obligations fiscales australiennes
- Contenu des conversations IA : stocké sur votre instance de serveur dédiée ; supprimé lorsque votre instance est résiliée
- Journaux d'utilisation : conservés pendant 90 jours
- Enregistrements d'utilisation des API : conservés pendant 90 jours

---

## Vos droits

### Utilisateurs australiens (Privacy Act 1988)

En vertu des Australian Privacy Principles, vous avez le droit :

- D'**accéder** à vos informations personnelles (APP 12)
- De **corriger** les informations inexactes ou périmées (APP 13)
- De **demander la suppression** de vos informations personnelles
- De **déposer une plainte** auprès du Bureau du commissaire australien à l'information (OAIC) — [oaic.gov.au](https://www.oaic.gov.au)

### Utilisateurs UE/EEE et Royaume-Uni (RGPD)

Vous disposez des droits suivants au titre du RGPD :

- **Droit d'accès** — demander une copie de vos données personnelles
- **Droit de rectification** — demander la correction de données inexactes
- **Droit à l'effacement** — demander la suppression de vos données personnelles
- **Droit à la limitation** — demander que nous limitions le traitement de vos données
- **Droit à la portabilité** — recevoir vos données dans un format structuré et lisible par machine
- **Droit d'opposition** — vous opposer au traitement fondé sur nos intérêts légitimes

Vous avez également le droit d'introduire une réclamation auprès de votre autorité de contrôle locale.

### Comment exercer vos droits

Vous pouvez exercer plusieurs de ces droits directement dans xAI Workspace :

- Envoyez \`/my_data\` pour exporter vos données personnelles
- Envoyez \`/delete_my_data\` pour demander la suppression de toutes vos données
- Envoyez \`/email\` pour mettre à jour votre adresse e-mail

Pour toute autre demande, contactez-nous à privacy@xshopper.com. Nous répondrons dans un délai de 30 jours.

---

## Réclamations

- **Australie :** Bureau du commissaire australien à l'information (OAIC), [oaic.gov.au](https://www.oaic.gov.au), Téléphone : 1300 363 992
- **UE/EEE :** Votre autorité de contrôle locale

---

## Contact

Demandes relatives à la confidentialité : privacy@xshopper.com
xShopper Pty Ltd, Australie
Marque australienne n° 1749660 (classe 35)

*Version de la politique de confidentialité : 2026-02-27*
`;
