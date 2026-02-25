export const AUTHORIZE_DE = `
## Was ist /authorize?

Der Befehl \`/authorize\` verbindet Drittanbieterdienste (wie Google, GitHub oder Microsoft) mit deinem OpenClaw AI-Agenten. Einmal verbunden, kann dein Agent in deinem Namen mit diesen Diensten interagieren.

---

## So funktioniert es

1. Sende \`/authorize\` in deinem Telegram-Chat
2. Wähle einen Anbieter aus den Schaltflächen (z. B. Google)
3. Dein Agent empfängt die Anfrage und sendet dir einen Autorisierungslink
4. Klicke auf den Link, melde dich beim Anbieter an und erteile den Zugriff
5. Das Token wird an deinen Agenten übermittelt und in \`OAUTH.md\` gespeichert

Dein Agent kann dann das gespeicherte Token verwenden, um auf den verbundenen Dienst zuzugreifen.

---

## Verfügbare Anbieter

Folgende Anbieter sind standardmäßig verfügbar (sofern von der Plattform konfiguriert):

| Anbieter | Was dein Agent tun kann |
|---|---|
| **Google** | Zugriff auf Google Drive, Gmail, Kalender und andere Google-APIs |
| **GitHub** | Repositories lesen/schreiben, Issues und Pull Requests verwalten |
| **Microsoft** | Zugriff auf OneDrive, Outlook, Microsoft 365-APIs |

Wenn eine Anbieter-Schaltfläche nicht erscheint, wurde sie noch nicht konfiguriert.

---

## Eigene OAuth-Apps

Dein Agent kann sich auch mit **jedem beliebigen OAuth-Anbieter** über deine eigenen App-Zugangsdaten verbinden. Dies ist nützlich, wenn du:

- Deine eigene OAuth-App statt der gemeinsam genutzten verwenden möchtest
- Dich mit einem oben nicht aufgeführten Anbieter verbinden musst (z. B. Slack, GitLab, Bitbucket)
- Spezifische OAuth-Berechtigungen für deinen Anwendungsfall benötigst

### Eigene OAuth-App einrichten

1. **Registriere eine OAuth-App** bei deinem Anbieter (z. B. Google Cloud Console, GitHub Developer Settings)

2. **Setze die Weiterleitungs-URI** auf:
   \`\`\`
   https://router.xaiworkspace.com/oauth/callback
   \`\`\`

3. **Teile deinem Agenten die Zugangsdaten mit.** Sende eine Nachricht wie:
   > Richte OAuth für GitHub ein mit Client-ID \`your-client-id\` und Client-Secret \`your-client-secret\`

4. Dein Agent ruft den Router auf, um ein State-Token zu generieren, die Autorisierungs-URL aufzubauen und dir den Link zu senden

5. Nachdem du autorisiert hast, wird das Token ausgetauscht und in \`OAUTH.md\` auf der Instanz deines Agenten gespeichert

### Funktionsweise im Hintergrund

Wenn dein Agent einen benutzerdefinierten OAuth-Ablauf initiiert, ruft er den \`/oauth/state\`-Endpunkt des Routers mit deiner benutzerdefinierten \`clientId\`, \`clientSecret\` und \`tokenUrl\` auf. Der Router speichert diese pro Client und verwendet sie, wenn der OAuth-Anbieter zurück zur Callback-URL weiterleitet.

---

## Sicherheit

- **OAuth-App-Secrets verlassen den Router niemals** -- bei globalen Anbietern wird das Client-Secret in AWS Secrets Manager gespeichert und niemals an die Instanz deines Agenten gesendet
- **Benutzerdefinierte Zugangsdaten werden pro Client** in der Datenbank gespeichert und nur für deinen Token-Austausch verwendet
- **State-Token laufen nach 10 Minuten ab**, um Replay-Angriffe zu verhindern
- **Token werden lokal** auf der Instanz deines Agenten in \`OAUTH.md\` gespeichert -- sie werden nicht mit anderen Nutzern geteilt

---

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| Keine Anbieter-Schaltflächen erscheinen | Die Plattform hat noch keine OAuth-Anbieter konfiguriert |
| "Your agent must be running" | Sende \`/start\`, um deine Instanz zuerst aufzuwecken |
| Autorisierungslink kommt nicht an | Dein Agent ist möglicherweise beschäftigt -- warte einen Moment und versuche es erneut |
| "State expired" nach dem Klicken auf den Link | Der Link ist abgelaufen (10 Min.). Führe \`/authorize\` erneut aus |
| Token-Austausch schlägt fehl | Prüfe, ob die Weiterleitungs-URI exakt übereinstimmt: \`https://router.xaiworkspace.com/oauth/callback\` |
`;
