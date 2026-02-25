export const AUTHORIZE_ES = `
## ¿Qué es /authorize?

El comando \`/authorize\` conecta servicios de terceros (como Google, GitHub o Microsoft) a tu agente de OpenClaw AI. Una vez conectado, tu agente puede interactuar con estos servicios en tu nombre.

---

## Cómo funciona

1. Envía \`/authorize\` en tu chat de Telegram
2. Elige un proveedor entre los botones disponibles (p. ej., Google)
3. Tu agente recibe la solicitud y te envía un enlace de autorización
4. Haz clic en el enlace, inicia sesión en el proveedor y concede el acceso
5. El token se entrega a tu agente y se guarda en \`OAUTH.md\`

Tu agente podrá entonces usar el token almacenado para acceder al servicio conectado.

---

## Proveedores disponibles

Los siguientes proveedores están disponibles de serie (cuando la plataforma los ha configurado):

| Proveedor | Lo que tu agente puede hacer |
|---|---|
| **Google** | Acceder a Google Drive, Gmail, Calendar y otras APIs de Google |
| **GitHub** | Leer/escribir repositorios, gestionar issues y pull requests |
| **Microsoft** | Acceder a OneDrive, Outlook y las APIs de Microsoft 365 |

Si el botón de un proveedor no aparece, significa que aún no ha sido configurado.

---

## Apps OAuth personalizadas

Tu agente también puede conectarse a **cualquier proveedor OAuth** usando tus propias credenciales de aplicación. Esto es útil cuando:

- Quieres usar tu propia app OAuth en lugar de la compartida
- Necesitas conectarte a un proveedor que no está en la lista anterior (p. ej., Slack, GitLab, Bitbucket)
- Necesitas ámbitos OAuth específicos para tu caso de uso

### Cómo configurar una app OAuth personalizada

1. **Registra una app OAuth** con tu proveedor (p. ej., Google Cloud Console, GitHub Developer Settings)

2. **Establece la URI de redirección** como:
   \`\`\`
   https://router.xaiworkspace.com/oauth/callback
   \`\`\`

3. **Indica las credenciales a tu agente**. Envía un mensaje como:
   > Configura OAuth para GitHub con el client ID \`your-client-id\` y el client secret \`your-client-secret\`

4. Tu agente llamará al router para generar un token de estado, construir la URL de autorización y enviarte el enlace

5. Tras autorizar, el token se intercambia y se guarda en \`OAUTH.md\` en la instancia de tu agente

### Cómo funciona internamente

Cuando tu agente inicia un flujo OAuth personalizado, llama al endpoint \`/oauth/state\` del router con tu \`clientId\`, \`clientSecret\` y \`tokenUrl\` personalizados. El router los almacena por cliente y los usa cuando el proveedor OAuth redirige de vuelta a la URL de callback.

---

## Seguridad

- **Los secretos de la app OAuth nunca salen del router** -- para los proveedores globales, el client secret se almacena en AWS Secrets Manager y nunca se envía a la instancia de tu agente
- **Las credenciales personalizadas se almacenan por cliente** en la base de datos y solo se usan para tu intercambio de tokens
- **Los tokens de estado caducan a los 10 minutos** para prevenir ataques de repetición
- **Los tokens se guardan localmente** en la instancia de tu agente en \`OAUTH.md\` -- no se comparten con otros usuarios

---

## Resolución de problemas

| Problema | Solución |
|---|---|
| No aparecen botones de proveedor | La plataforma aún no ha configurado ningún proveedor OAuth |
| "Tu agente debe estar en ejecución" | Envía \`/start\` para despertar tu instancia primero |
| El enlace de autorización no llega | Tu agente puede estar ocupado — espera un momento e inténtalo de nuevo |
| "Estado expirado" al hacer clic en el enlace | El enlace caducó (10 min). Ejecuta \`/authorize\` de nuevo |
| El intercambio de tokens falla | Comprueba que la URI de redirección coincida exactamente: \`https://router.xaiworkspace.com/oauth/callback\` |
`;
