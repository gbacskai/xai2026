export const PRIVACY_IT = `
## Chi siamo

xShopper Pty Ltd ("xShopper", "noi", "ci") gestisce il servizio xAI Workspace, accessibile tramite xAI Workspace.
Titolare del trattamento: xShopper Pty Ltd, Australia.
Contatto: privacy@xshopper.com

---

## Quali dati personali raccogliamo

Quando utilizzi xAI Workspace, raccogliamo:

- **Identificativo utente xAI Workspace** (chat_id) — il tuo ID xAI Workspace univoco, utilizzato per identificare il tuo account in tutto il servizio
- **Indirizzo email** — se ti registri o vieni invitato, conserviamo la tua email per gestire il tuo account e inviarti comunicazioni di servizio
- **Indirizzi IP** — gli indirizzi IP della tua istanza server dedicata, utilizzati per instradare i tuoi messaggi
- **Dati di pagamento** — importi degli abbonamenti, date, ID cliente Stripe e ultime 4 cifre della carta di pagamento (i dati della carta di pagamento sono conservati da Stripe, non da noi)
- **Dati di utilizzo** — consumo giornaliero e mensile di token AI
- **Contenuto delle conversazioni AI** — i messaggi che invii al tuo agente AI

---

## Perché trattiamo i tuoi dati e base giuridica

| Finalità | Base giuridica |
|---|---|
| Fornitura del servizio di agente AI (configurazione account, instradamento messaggi, gestione abbonamento) | GDPR Art. 6(1)(b) — esecuzione di un contratto; APP 3 — ragionevolmente necessario per il servizio |
| Fatturazione ed elaborazione dei pagamenti | GDPR Art. 6(1)(b) — esecuzione di un contratto; APP 3 — ragionevolmente necessario |
| Monitoraggio dell'utilizzo e applicazione dei limiti di budget | GDPR Art. 6(1)(b) — esecuzione di un contratto; APP 3 — ragionevolmente necessario |
| Invio di notifiche di servizio (avvisi di utilizzo, promemoria di rinnovo) | GDPR Art. 6(1)(b) — esecuzione di un contratto |
| Invio di email di invito per tuo conto | GDPR Art. 6(1)(a) — consenso (sei tu ad avviare il comando /invite) |
| Monitoraggio della sicurezza e prevenzione degli abusi | GDPR Art. 6(1)(f) — interessi legittimi |

---

## Con chi condividiamo i tuoi dati

Utilizziamo i seguenti responsabili del trattamento terzi per erogare il servizio:

- **Telegram** (Paesi Bassi / EAU) — consegna i messaggi tra te e il tuo agente AI
- **Anthropic** (Stati Uniti) — fornitore principale del modello AI; elabora il contenuto delle tue conversazioni per generare le risposte AI
- **OpenAI** (Stati Uniti) — fornitore opzionale del modello AI; elabora il contenuto delle conversazioni se selezioni un modello OpenAI
- **Google / Gemini** (Stati Uniti) — fornitore opzionale del modello AI; elabora il contenuto delle conversazioni se selezioni un modello Gemini
- **Groq** (Stati Uniti) — fornitore opzionale del modello AI; elabora il contenuto delle conversazioni se selezioni un modello Groq
- **DeepSeek** (Cina / Singapore) — fornitore opzionale del modello AI; elabora il contenuto delle conversazioni se selezioni un modello DeepSeek
- **Mistral AI** (Francia) — fornitore opzionale del modello AI; elabora il contenuto delle conversazioni se selezioni un modello Mistral
- **Alibaba Cloud / Qwen** (Cina / Singapore) — fornitore opzionale del modello AI; elabora il contenuto delle conversazioni se selezioni un modello Qwen
- **Stripe** (Stati Uniti) — gestisce l'elaborazione di tutti i pagamenti
- **Neon** (Stati Uniti) — ospita il nostro database
- **Amazon Web Services** (Australia e Stati Uniti) — ospita l'infrastruttura a Sydney (ap-southeast-2) e in Virginia del Nord (us-east-1)

Non vendiamo i tuoi dati personali.

---

## Trasferimenti internazionali e divulgazione all'estero

xShopper Pty Ltd è una società australiana. I tuoi dati personali vengono trasferiti e trattati nei seguenti paesi:

| Paese | Destinatari | Dati trasferiti |
|---|---|---|
| **Australia** | AWS (Sydney, ap-southeast-2) | Tutti i dati — regione di hosting principale |
| **Stati Uniti** | Anthropic, OpenAI, Groq, Google, AWS (us-east-1), Neon, Stripe | Conversazioni AI, dati account, dati di pagamento |
| **Francia** | Mistral AI | Conversazioni AI (se viene selezionato il modello Mistral) |
| **Cina / Singapore** | DeepSeek, Alibaba Cloud (Qwen) | Conversazioni AI (se viene selezionato il modello DeepSeek o Qwen) |
| **Paesi Bassi / EAU** | Telegram | Messaggi, identificativi utente |

**Per gli utenti australiani (Privacy Act 1988):** Ai sensi dell'Australian Privacy Principle 8, xShopper adotta misure ragionevoli per garantire che i destinatari stranieri trattino le tue informazioni personali in conformità con gli APP. Utilizzando questo servizio e prestando il consenso alla registrazione, riconosci che i tuoi dati verranno trasferiti nei paesi sopra elencati e che i Principi australiani sulla privacy potrebbero non applicarsi ai dati detenuti da destinatari stranieri. Puoi presentare un reclamo all'Ufficio del Commissario australiano per le informazioni (OAIC) se ritieni che le tue informazioni siano state gestite in modo improprio.

**Per gli utenti UE/SEE (GDPR):** I trasferimenti verso gli Stati Uniti sono coperti da Clausole Contrattuali Standard e, ove disponibile, dall'EU-US Data Privacy Framework. I trasferimenti verso la Francia (Mistral AI) non richiedono garanzie aggiuntive (Stato membro UE).

---

## Per quanto tempo conserviamo i tuoi dati

- Dati dell'account: conservati finché il tuo account è attivo e per 30 giorni dopo la cancellazione
- Registrazioni dei pagamenti: conservate per 7 anni come richiesto dalla normativa fiscale australiana
- Contenuto delle conversazioni AI: conservato sulla tua istanza server dedicata; eliminato quando la tua istanza viene terminata
- Log di utilizzo: conservati per 90 giorni
- Registrazioni di utilizzo API: conservate per 90 giorni

---

## I tuoi diritti

### Utenti australiani (Privacy Act 1988)

Ai sensi degli Australian Privacy Principles, hai il diritto di:

- **Accedere** alle tue informazioni personali (APP 12)
- **Correggere** informazioni inesatte o non aggiornate (APP 13)
- **Richiedere la cancellazione** delle tue informazioni personali
- **Presentare un reclamo** all'Ufficio del Commissario australiano per le informazioni (OAIC) — [oaic.gov.au](https://www.oaic.gov.au)

### Utenti UE/SEE e Regno Unito (GDPR)

Hai i seguenti diritti ai sensi del GDPR:

- **Diritto di accesso** — richiedere una copia dei tuoi dati personali
- **Diritto di rettifica** — richiedere la correzione di dati inesatti
- **Diritto alla cancellazione** — richiedere l'eliminazione dei tuoi dati personali
- **Diritto di limitazione** — richiedere che limitiamo il modo in cui trattiamo i tuoi dati
- **Diritto alla portabilità dei dati** — ricevere i tuoi dati in un formato strutturato e leggibile da dispositivo automatico
- **Diritto di opposizione** — opporsi al trattamento basato su interessi legittimi

Hai inoltre il diritto di presentare un reclamo presso la tua autorità di controllo locale.

### Come esercitare i tuoi diritti

Puoi esercitare diversi di questi diritti direttamente da xAI Workspace:

- Invia \`/my_data\` per esportare i tuoi dati personali
- Invia \`/delete_my_data\` per richiedere l'eliminazione di tutti i tuoi dati
- Invia \`/email\` per aggiornare il tuo indirizzo email

Per altre richieste, contattaci a privacy@xshopper.com. Risponderemo entro 30 giorni.

---

## Reclami

- **Australia:** Ufficio del Commissario australiano per le informazioni (OAIC), [oaic.gov.au](https://www.oaic.gov.au), Telefono: 1300 363 992
- **UE/SEE:** La tua autorità di controllo locale

---

## Contatto

Richieste sulla privacy: privacy@xshopper.com
xShopper Pty Ltd, Australia
Australian Trademark No. 1749660 (Class 35)

*Versione della politica sulla privacy: 2026-02-27*
`;
