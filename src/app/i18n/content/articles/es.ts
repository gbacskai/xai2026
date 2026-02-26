import { LocalizedArticle } from '../../i18n.types';

export const ARTICLES_ES: Record<string, LocalizedArticle> = {
  welcome: {
    title: 'Bienvenido a xAI Workspace',
    subtitle: 'Tu agente de IA personal',
    content: `
**xAI Workspace** te proporciona un agente de IA dedicado, accesible directamente desde Telegram — sin aplicaciones que instalar ni cuentas que crear.

## Cómo funciona

1. **Inicia el bot** — Envía \`/start\` para comenzar. Obtienes una prueba gratuita de inmediato.
2. **Simplemente escribe** — Envía cualquier mensaje y tu agente de IA responderá. Entiende el contexto y puede ayudarte con investigación, redacción, programación y mucho más.
3. **Tu propia instancia** — A diferencia de los chatbots de IA compartidos, obtienes un agente dedicado que funciona en su propio servidor con memoria persistente.

## Qué hace diferente a xAI Workspace

- **Privado** — Tus conversaciones permanecen en tu instancia dedicada
- **Persistente** — Tu agente recuerda el contexto entre sesiones
- **Potente** — Impulsado por Claude, uno de los modelos de IA más avanzados
- **Sencillo** — Es solo Telegram. Sin nuevas aplicaciones, sin curva de aprendizaje
    `,
  },
  'first-steps': {
    title: 'Primeros pasos',
    subtitle: 'Configura tu agente en 60 segundos',
    content: `
## 1. Inicia el bot

Abre Telegram y envía \`/start\` a **@xAIWorkspaceBot**. Tu periodo de prueba gratuito comienza de inmediato — sin necesidad de tarjeta de crédito.

## 2. Espera el aprovisionamiento

Tu instancia de IA dedicada tarda unos 2 minutos en configurarse. Recibirás una notificación cuando esté lista.

## 3. Envía tu primer mensaje

¡Escribe cualquier cosa! Por ejemplo:
- "¿Con qué me puedes ayudar?"
- "Resume las últimas noticias sobre IA"
- "Escribe un script de Python que ordene una lista"

## 4. Explora los comandos

- \`/authorize\` — Conecta Google, Microsoft, GitHub y más
- \`/usage\` — Consulta tu saldo de tokens
- \`/billing\` — Gestiona tu suscripción
- \`/language\` — Cambia tu idioma preferido
- \`/ssh\` — Conéctate a tu espacio de trabajo para acceder a archivos
- \`/help\` — Ver todos los comandos disponibles
- \`/models\` — Cambia entre modelos de IA
    `,
  },
  models: {
    title: 'Modelos de IA',
    subtitle: 'Elige el modelo adecuado para tu tarea',
    content: `
xAI Workspace admite múltiples modelos de IA de varios proveedores. Cambia entre ellos con \`/models\`.

## Modelos disponibles

| Modelo | Ideal para |
|-------|----------|
| **Claude Sonnet** | Tareas cotidianas — rápido, capaz y equilibrado |
| **Claude Opus** | Razonamiento complejo, investigación, documentos largos |
| **Claude Haiku** | Respuestas rápidas, tareas simples, menor coste |
| **GPT-4o** | Uso general, excelente para resultados estructurados |
| **DeepSeek** | Razonamiento y programación rentables |
| **Gemini** | Tareas multimodales, ventanas de contexto amplias |

## Cambiar de modelo

1. Envía \`/models\` en el chat
2. Pulsa el modelo que deseas usar
3. Aparece un ✓ junto a tu modelo activo

Tu selección se mantiene entre sesiones. Puedes cambiar en cualquier momento.

## Uso de tokens

Los distintos modelos consumen tokens a ritmos diferentes. Opus consume más tokens por respuesta que Haiku. Consulta tu saldo con \`/usage\`.
    `,
  },
  'remote-access': {
    title: 'Acceso remoto',
    subtitle: 'Acceso SSH y SFTP a tu espacio de trabajo',
    content: `
Cada instancia de xAI Workspace es tu propia máquina dedicada. Puedes conectarte por SSH o SFTP para gestionar archivos, ejecutar herramientas y personalizar tu entorno.

## Obtener tu clave

1. Envía \`/ssh\` en el chat de Telegram
2. El bot te envía un archivo de clave \`.pem\` con los datos de conexión
3. Guarda el archivo y establece los permisos antes de conectarte

## SSH — Acceso por terminal

\`\`\`bash
# Establecer permisos en el archivo de clave (obligatorio, una sola vez)
chmod 600 <chatId>-xaiworkspace.pem

# Conectar a través del bastion host
ssh -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

Reemplaza \`<chatId>\` con tu ID de chat de Telegram (que aparece en el nombre del archivo de clave).

> Si obtienes un error de "permiso denegado", verifica que hayas ejecutado \`chmod 600\` sobre el archivo de clave.

## SFTP — Transferencia de archivos

Puedes usar cualquier cliente SFTP para subir y descargar archivos:

\`\`\`bash
# SFTP por línea de comandos
sftp -i <chatId>-xaiworkspace.pem xai<chatId>@ssh.xaiworkspace.com
\`\`\`

### FileZilla — Configuración paso a paso

FileZilla es un cliente SFTP gratuito y multiplataforma. Sigue estos pasos para conectarte a tu espacio de trabajo:

#### 1. Descargar e instalar FileZilla

Descarga FileZilla Client (no Server) desde [filezilla-project.org](https://filezilla-project.org). Disponible para Windows, macOS y Linux.

#### 2. Abrir el Gestor de sitios

Abre FileZilla y ve a **Archivo → Gestor de sitios** (o pulsa **Ctrl+S** en Windows/Linux, **Cmd+S** en macOS).

#### 3. Crear un nuevo sitio

1. Haz clic en **Nuevo sitio**
2. Nómbralo **xAI Workspace**

#### 4. Introducir la configuración de conexión

Completa el panel de la derecha:

| Ajuste | Valor |
|---|---|
| **Protocolo** | SFTP - Protocolo de transferencia de archivos SSH |
| **Host** | ssh.xaiworkspace.com |
| **Puerto** | 22 |
| **Tipo de inicio de sesión** | Archivo de clave |
| **Usuario** | xai\`<chatId>\` |

#### 5. Añadir tu archivo de clave

1. En el campo **Archivo de clave**, haz clic en **Examinar...**
2. Selecciona el archivo \`.pem\` que descargaste desde \`/ssh\`
3. Si FileZilla pide convertir la clave a formato PPK, haz clic en **Sí** — guardará una copia convertida automáticamente

> En macOS o Linux, asegúrate de haber ejecutado \`chmod 600\` sobre el archivo .pem primero.

#### 6. Conectar

1. Haz clic en **Conectar**
2. En la primera conexión, FileZilla muestra un diálogo de "Clave de servidor desconocida" — verifica los datos y haz clic en **Aceptar** para confiar en el servidor

#### 7. Transferir archivos

- El **panel izquierdo** muestra tus archivos locales
- El **panel derecho** muestra los archivos de tu espacio de trabajo
- **Arrastra y suelta** archivos entre paneles para subir o descargar
- **Haz clic derecho** para renombrar, eliminar y opciones de permisos

> **Consejo:** Tu sitio queda guardado en el Gestor de sitios. La próxima vez, abre el Gestor de sitios y haz doble clic en **xAI Workspace** para reconectarte al instante.

Otros clientes SFTP gráficos como **Cyberduck** y **WinSCP** también funcionan — usa la misma configuración de host, puerto, usuario y archivo de clave de arriba.

## Qué puedes hacer

Una vez conectado, tu espacio de trabajo es completamente tuyo:

- **Gestionar archivos** — navegar, editar, subir y descargar documentos
- **Supervisar la actividad** — ver los registros de tu agente en tiempo real
- **Instalar herramientas** — añadir cualquier software o entorno de ejecución que necesites
- **Ejecutar automatizaciones** — configurar tareas programadas o servicios en segundo plano
- **Transferir archivos** — usa \`scp\`, \`rsync\` o SFTP para mover archivos

## Si tu espacio de trabajo aún se está configurando

Si tu espacio de trabajo todavía está siendo aprovisionado, el bot te lo hará saber. Espera un par de minutos y vuelve a intentarlo con \`/ssh\`.

## Seguridad

- Todas las conexiones pasan por un **bastion host** — tu instancia nunca queda expuesta directamente a internet
- Se genera una clave de cifrado ed25519 única para cada espacio de trabajo durante la configuración
- El acceso por contraseña está desactivado — solo funciona tu archivo de clave personal
- El acceso root está restringido por seguridad
- Tu clave se almacena cifrada en S3 y solo se entrega a tu chat de Telegram
    `,
  },
  billing: {
    title: 'Planes y facturación',
    subtitle: 'Suscripciones, tokens y pagos',
    content: `
## Planes

| Plan | Precio | Tokens |
|------|-------|--------|
| **Trial** | Gratis | 50K |
| **Essential** | $100/mes | 750K |
| **Professional** | $300/mes | 3M |
| **Enterprise** | $600/mes | 8M |

## Gestionar tu suscripción

Envía \`/billing\` para abrir el panel de facturación, donde puedes:
- Ver tu plan actual y la fecha de renovación
- Subir o bajar de plan
- Activar la recarga automática para paquetes de tokens adicionales
- Actualizar tu método de pago

## Paquetes de tokens

¿Te estás quedando sin tokens? Activa la **recarga automática** en \`/billing\` para comprar tokens adicionales automáticamente cuando alcances tu límite.

## Historial de pagos

Envía \`/invoices\` para ver todos tus pagos anteriores y recibos.
    `,
  },
  productivity: {
    title: 'Consejos de productividad',
    subtitle: 'Aprovecha al máximo tu agente de IA',
    content: `
## Sé específico

En lugar de "ayúdame a escribir un correo", intenta:
> "Escribe un correo profesional a mi cliente Juan rechazando la reunión del viernes. Sugiere el martes o el miércoles como alternativa. Que sea breve y amable."

## Usa el contexto

Tu agente recuerda la conversación. Construye sobre los mensajes anteriores:
1. "Analiza estos datos CSV: ..."
2. "Ahora crea un gráfico que muestre la tendencia mensual"
3. "Añade un párrafo de resumen para el equipo directivo"

## Elige el modelo adecuado

- **¿Pregunta rápida?** → Haiku (el más rápido y económico)
- **¿Trabajo cotidiano?** → Sonnet (predeterminado, equilibrado)
- **¿Análisis complejo?** → Opus (el más capaz)

Cambia con \`/models\`.

## Controla el uso

Revisa \`/usage\` regularmente para seguir tu consumo de tokens. La barra de progreso muestra tu asignación mensual.
    `,
  },
  'language-region': {
    title: 'Idioma y región',
    subtitle: 'Cambia el idioma y la ubicación del servidor',
    content: `
## Cambiar idioma

Envía \`/language\` para elegir entre 10 idiomas disponibles:

| | |
|---|---|
| 🇬🇧 English | 🇨🇳 中文 |
| 🇪🇸 Español | 🇸🇦 العربية |
| 🇧🇷 Português | 🇩🇪 Deutsch |
| 🇫🇷 Français | 🇯🇵 日本語 |
| 🇷🇺 Русский | 🇮🇳 हिन्दी |

Tu preferencia de idioma se detecta automáticamente desde la configuración de Telegram en el primer uso, pero puedes cambiarla en cualquier momento. Todos los mensajes del bot aparecerán en el idioma seleccionado.

## Cambiar región

Envía \`/region\` para mover tu instancia de IA a una región de servidor diferente. Esto puede reducir la latencia si estás más cerca de otro centro de datos.

Las regiones disponibles se muestran con tu selección actual resaltada.
    `,
  },
  'privacy-data': {
    title: 'Tus datos y privacidad',
    subtitle: 'Accede, exporta o elimina tus datos',
    content: `
## Controles de privacidad

xAI Workspace te da control total sobre tus datos personales, directamente desde Telegram:

- \`/privacy\` — Ver la Política de privacidad y los Términos de servicio
- \`/my_data\` — Exportar todos tus datos personales como archivo JSON
- \`/delete_my_data\` — Eliminar permanentemente todos tus datos personales

## Qué se exporta

El comando \`/my_data\` exporta:

- Los detalles de tu cuenta (plan, correo electrónico, región)
- Historial de pagos
- Estadísticas de uso
- Información de la instancia del servidor

## Qué se elimina

El comando \`/delete_my_data\` elimina:

- Tu registro de cliente y todos los datos de la cuenta
- Historial de pagos
- Registros de uso y seguimiento del gasto
- Tu instancia de IA y todos los archivos en ella
- Claves de acceso y registros de conexión

Esta acción es **permanente e irreversible**. Se te pedirá confirmación antes de proceder con la eliminación.

## Contacto

Para cualquier consulta sobre privacidad: privacy@xshopper.com
    `,
  },
  referrals: {
    title: 'Invita a amigos',
    subtitle: 'Gana tokens adicionales con referidos',
    content: `
## Cómo funciona

1. Envía \`/invite email@example.com\` para invitar a un amigo
2. Obtienes **200K tokens de bonificación** de inmediato por cada invitación enviada
3. Cuando tu amigo se suscriba, ganas una bonificación adicional por referido

## Normas

- Hasta **5 créditos de invitación por mes**
- Máximo **10 invitaciones pendientes** (sin usar) al mismo tiempo
- El mismo correo electrónico no puede ser re-invitado en **4 semanas**
- El invitado no debe tener ya una cuenta de xAI Workspace

## Seguimiento de tus invitaciones

Envía \`/invites\` para ver todas las invitaciones enviadas con su estado:
- **waiting** — invitación enviada, aún no registrado
- **signed up** — el invitado creó una cuenta
- **subscribed** — el invitado realizó su primer pago (bonificación por referido obtenida)
    `,
  },
};
