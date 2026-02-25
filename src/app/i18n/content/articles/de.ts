import { LocalizedArticle } from '../../i18n.types';

export const ARTICLES_DE: Record<string, LocalizedArticle> = {
  welcome: {
    title: 'Willkommen bei xAI Workspace',
    subtitle: 'Dein persönlicher KI-Agent',
    content: `
**xAI Workspace** stellt dir einen dedizierten KI-Agenten direkt in Telegram zur Verfügung — keine Apps installieren, keine Konten erstellen.

## So funktioniert es

1. **Bot starten** — Sende \`/start\`, um zu beginnen. Du erhältst sofort eine kostenlose Testphase.
2. **Einfach chatten** — Schreibe eine Nachricht, und dein KI-Agent antwortet. Er versteht Kontext und hilft bei Recherche, Texten, Programmierung und mehr.
3. **Deine eigene Instanz** — Im Gegensatz zu geteilten KI-Chatbots bekommst du einen dedizierten Agenten, der auf einem eigenen Server mit dauerhaftem Gedächtnis läuft.

## Was xAI Workspace besonders macht

- **Privat** — Deine Gespräche bleiben auf deiner dedizierten Instanz
- **Dauerhaft** — Dein Agent erinnert sich über Sitzungen hinweg an den Kontext
- **Leistungsstark** — Angetrieben von Claude, einem der leistungsfähigsten KI-Modelle
- **Einfach** — Es ist einfach Telegram. Keine neuen Apps, keine Einarbeitungszeit
    `,
  },
  'first-steps': {
    title: 'Erste Schritte',
    subtitle: 'Richte deinen Agenten in 60 Sekunden ein',
    content: `
## 1. Bot starten

Öffne Telegram und sende \`/start\` an **@xAIWorkspaceBot**. Deine kostenlose Testphase beginnt sofort — keine Kreditkarte erforderlich.

## 2. Bereitstellung abwarten

Die Einrichtung deiner dedizierten KI-Instanz dauert etwa 2 Minuten. Du erhältst eine Benachrichtigung, wenn sie bereit ist.

## 3. Erste Nachricht senden

Schreib einfach irgendetwas! Zum Beispiel:
- "Womit kannst du mir helfen?"
- "Fasse die neuesten Nachrichten über KI zusammen"
- "Schreib ein Python-Skript, das eine Liste sortiert"

## 4. Befehle erkunden

- \`/authorize\` — Google, Microsoft, GitHub und weitere Dienste verbinden
- \`/usage\` — Token-Guthaben prüfen
- \`/billing\` — Abonnement verwalten
- \`/language\` — Bevorzugte Sprache ändern
- \`/ssh\` — Mit deinem Workspace für Dateizugriff verbinden
- \`/help\` — Alle verfügbaren Befehle anzeigen
- \`/models\` — Zwischen KI-Modellen wechseln
    `,
  },
  models: {
    title: 'KI-Modelle',
    subtitle: 'Das richtige Modell für deine Aufgabe wählen',
    content: `
xAI Workspace unterstützt mehrere KI-Modelle von verschiedenen Anbietern. Wechsle zwischen ihnen mit \`/models\`.

## Verfügbare Modelle

| Modell | Am besten geeignet für |
|-------|----------|
| **Claude Sonnet** | Alltagsaufgaben — schnell, leistungsfähig, ausgewogen |
| **Claude Opus** | Komplexes Denken, Recherche, lange Dokumente |
| **Claude Haiku** | Schnelle Antworten, einfache Aufgaben, niedrigste Kosten |
| **GPT-4o** | Allzweck, gut bei strukturierter Ausgabe |
| **DeepSeek** | Kostengünstiges Denken und Programmieren |
| **Gemini** | Multimodale Aufgaben, große Kontextfenster |

## Modell wechseln

1. Sende \`/models\` im Chat
2. Tippe auf das gewünschte Modell
3. Ein ✓ erscheint neben deinem aktiven Modell

Deine Auswahl bleibt über Sitzungen hinweg erhalten. Du kannst jederzeit wechseln.

## Token-Verbrauch

Verschiedene Modelle verbrauchen Token mit unterschiedlichen Raten. Opus verbraucht mehr Token pro Antwort als Haiku. Prüfe dein Guthaben mit \`/usage\`.
    `,
  },
  'remote-access': {
    title: 'Fernzugriff',
    subtitle: 'SSH- und SFTP-Zugriff auf deinen Workspace',
    content: `
Jede xAI Workspace-Instanz ist dein eigener dedizierter Rechner. Du kannst dich per SSH oder SFTP verbinden, um Dateien zu verwalten, Tools auszuführen und deine Umgebung anzupassen.

## Deinen Schlüssel abrufen

1. Sende \`/ssh\` im Telegram-Chat
2. Der Bot schickt dir eine \`.pem\`-Schlüsseldatei mit Verbindungsdaten
3. Speichere die Datei und setze die Berechtigungen, bevor du dich verbindest

## SSH — Terminal-Zugriff

\`\`\`bash
# Berechtigungen für die Schlüsseldatei setzen (einmalig erforderlich)
chmod 600 <chatId>-xaiworkspace.pem

# Über den Bastion-Host verbinden
ssh -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

Ersetze \`<chatId>\` mit deiner Telegram-Chat-ID (im Dateinamen des Schlüssels angegeben).

> Falls du eine "permission denied"-Fehlermeldung erhältst, prüfe, ob du \`chmod 600\` auf die Schlüsseldatei angewendet hast.

## SFTP — Dateiübertragung

Du kannst jeden SFTP-Client zum Hoch- und Herunterladen von Dateien verwenden:

\`\`\`bash
# SFTP über die Befehlszeile
sftp -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

Oder verwende einen grafischen Client wie **FileZilla**, **Cyberduck** oder **WinSCP**:

| Einstellung | Wert |
|---|---|
| **Protokoll** | SFTP |
| **Host** | ssh.xaiworkspace.com |
| **Port** | 22 |
| **Benutzername** | xai\`<chatId>\` |
| **Authentifizierung** | Schlüsseldatei (.pem aus \`/ssh\`) |

## Was du tun kannst

Nach der Verbindung gehört dein Workspace ganz dir:

- **Dateien verwalten** — Dokumente durchsuchen, bearbeiten, hoch- und herunterladen
- **Aktivität überwachen** — Protokolle deines Agenten in Echtzeit einsehen
- **Tools installieren** — beliebige Software oder Laufzeitumgebungen hinzufügen
- **Automatisierungen einrichten** — geplante Aufgaben oder Hintergrunddienste konfigurieren
- **Dateien übertragen** — \`scp\`, \`rsync\` oder SFTP zum Verschieben von Dateien nutzen

## Falls dein Workspace noch eingerichtet wird

Wenn dein Workspace noch bereitgestellt wird, informiert dich der Bot darüber. Warte ein paar Minuten und versuche es erneut mit \`/ssh\`.

## Sicherheit

- Alle Verbindungen laufen über einen **Bastion-Host** — deine Instanz ist niemals direkt dem Internet ausgesetzt
- Ein einzigartiger ed25519-Verschlüsselungsschlüssel wird für jeden Workspace bei der Einrichtung generiert
- Passwort-Login ist deaktiviert — nur deine persönliche Schlüsseldatei funktioniert
- Root-Zugriff ist aus Sicherheitsgründen eingeschränkt
- Dein Schlüssel wird verschlüsselt in S3 gespeichert und nur an deinen Telegram-Chat übermittelt
    `,
  },
  billing: {
    title: 'Tarife & Abrechnung',
    subtitle: 'Abonnements, Token und Zahlungen',
    content: `
## Tarife

| Tarif | Preis | Token |
|------|-------|--------|
| **Trial** | Kostenlos | 50K |
| **Essential** | 100 $/Monat | 750K |
| **Professional** | 300 $/Monat | 3M |
| **Enterprise** | 600 $/Monat | 8M |

## Abonnement verwalten

Sende \`/billing\`, um das Abrechnungs-Dashboard zu öffnen. Dort kannst du:
- Deinen aktuellen Tarif und das Verlängerungsdatum einsehen
- Up- oder Downgrade durchführen
- Automatisches Aufladen für zusätzliche Token-Pakete aktivieren
- Deine Zahlungsmethode aktualisieren

## Token-Pakete

Wird dein Guthaben knapp? Aktiviere **automatisches Aufladen** unter \`/billing\`, um automatisch zusätzliche Token zu kaufen, wenn du dein Limit erreichst.

## Zahlungshistorie

Sende \`/invoices\`, um alle bisherigen Zahlungen und Belege einzusehen.
    `,
  },
  productivity: {
    title: 'Produktivitätstipps',
    subtitle: 'Das Beste aus deinem KI-Agenten herausholen',
    content: `
## Konkret sein

Statt "hilf mir, eine E-Mail zu schreiben", versuche:
> "Schreib eine professionelle E-Mail an meinen Kunden John, in der ich das Freitagstreffen absage. Schlage stattdessen Dienstag oder Mittwoch vor. Kurz und freundlich."

## Kontext nutzen

Dein Agent erinnert sich an das Gespräch. Baue auf vorherigen Nachrichten auf:
1. "Analysiere diese CSV-Daten: ..."
2. "Erstelle jetzt ein Diagramm, das den monatlichen Trend zeigt"
3. "Füge einen Zusammenfassungsabsatz für das Führungsteam hinzu"

## Das richtige Modell wählen

- **Schnelle Frage?** → Haiku (schnellstes, günstigstes)
- **Alltagsarbeit?** → Sonnet (Standard, ausgewogen)
- **Komplexe Analyse?** → Opus (leistungsfähigstes)

Wechseln mit \`/models\`.

## Verbrauch überwachen

Prüfe regelmäßig \`/usage\`, um deinen Token-Verbrauch zu verfolgen. Der Fortschrittsbalken zeigt dein monatliches Kontingent.
    `,
  },
  'language-region': {
    title: 'Sprache & Region',
    subtitle: 'Sprache und Serverstandort ändern',
    content: `
## Sprache ändern

Sende \`/language\`, um aus 10 unterstützten Sprachen zu wählen:

| | |
|---|---|
| 🇬🇧 English | 🇨🇳 中文 |
| 🇪🇸 Español | 🇸🇦 العربية |
| 🇧🇷 Português | 🇩🇪 Deutsch |
| 🇫🇷 Français | 🇯🇵 日本語 |
| 🇷🇺 Русский | 🇮🇳 हिन्दी |

Deine Spracheinstellung wird bei der ersten Nutzung automatisch aus deinen Telegram-Einstellungen erkannt, kann aber jederzeit geändert werden. Alle Bot-Nachrichten erscheinen in deiner gewählten Sprache.

## Region ändern

Sende \`/region\`, um deine KI-Instanz in eine andere Serverregion zu verschieben. Dies kann die Latenz verringern, wenn du einem anderen Rechenzentrum näher bist.

Die verfügbaren Regionen werden mit deiner aktuellen Auswahl hervorgehoben angezeigt.
    `,
  },
  'privacy-data': {
    title: 'Deine Daten & Datenschutz',
    subtitle: 'Daten abrufen, exportieren oder löschen',
    content: `
## Datenschutzeinstellungen

xAI Workspace gibt dir die vollständige Kontrolle über deine persönlichen Daten, direkt in Telegram:

- \`/privacy\` — Datenschutzrichtlinie und Nutzungsbedingungen anzeigen
- \`/my_data\` — Alle deine persönlichen Daten als JSON-Datei exportieren
- \`/delete_my_data\` — Alle deine persönlichen Daten dauerhaft löschen

## Was exportiert wird

Der Befehl \`/my_data\` exportiert:

- Deine Kontodaten (Tarif, E-Mail, Region)
- Zahlungshistorie
- Nutzungsstatistiken
- Informationen zur Serverinstanz

## Was gelöscht wird

Der Befehl \`/delete_my_data\` entfernt:

- Deinen Kundendatensatz und alle Kontodaten
- Zahlungshistorie
- Nutzungsprotokolle und Ausgabenverfolgung
- Deine KI-Instanz und alle darauf befindlichen Dateien
- Zugriffsschlüssel und Verbindungsdatensätze

Diese Aktion ist **dauerhaft und kann nicht rückgängig gemacht werden**. Du wirst vor der Löschung zur Bestätigung aufgefordert.

## Kontakt

Bei Datenschutzfragen: privacy@xshopper.com
    `,
  },
  referrals: {
    title: 'Freunde einladen',
    subtitle: 'Bonus-Token durch Empfehlungen verdienen',
    content: `
## So funktioniert es

1. Sende \`/invite email@example.com\`, um einen Freund einzuladen
2. Du erhältst sofort **200K Bonus-Token** für jede gesendete Einladung
3. Wenn dein Freund ein Abonnement abschließt, erhältst du einen zusätzlichen Empfehlungsbonus

## Regeln

- Bis zu **5 Einladungsguthaben pro Monat**
- Maximal **10 ausstehende** (ungenutzte) Einladungen gleichzeitig
- Dieselbe E-Mail-Adresse kann nicht innerhalb von **4 Wochen** erneut eingeladen werden
- Die eingeladene Person darf noch kein xAI Workspace-Konto haben

## Einladungen verfolgen

Sende \`/invites\`, um alle gesendeten Einladungen mit ihrem Status zu sehen:
- **waiting** — Einladung gesendet, noch nicht registriert
- **signed up** — Eingeladene Person hat ein Konto erstellt
- **subscribed** — Eingeladene Person hat ihre erste Zahlung geleistet (Empfehlungsbonus gutgeschrieben)
    `,
  },
};
