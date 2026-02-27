export const PRIVACY_ES = `
## Quiénes somos

xShopper Pty Ltd ("xShopper", "nosotros", "nos") opera el servicio xAI Workspace, accesible a través de xAI Workspace.
Responsable del tratamiento: xShopper Pty Ltd, Australia.
Contacto: privacy@xshopper.com

---

## Qué datos personales recopilamos

Cuando usas xAI Workspace, recopilamos:

- **Identificador de usuario de xAI Workspace** (chat_id) — tu ID único de xAI Workspace, utilizado para identificar tu cuenta en todo el servicio
- **Dirección de correo electrónico** — si te registras o eres invitado, almacenamos tu correo para gestionar tu cuenta y enviarte comunicaciones del servicio
- **Direcciones IP** — las direcciones IP de tu instancia de servidor dedicada, utilizadas para enrutar tus mensajes
- **Datos de pago** — importes de suscripción, fechas, ID de cliente de Stripe y los últimos 4 dígitos de la tarjeta de pago (los datos completos de la tarjeta son gestionados por Stripe, no por nosotros)
- **Datos de uso de tokens** — consumo diario y mensual de tokens de IA
- **Contenido de conversaciones con IA** — los mensajes que envías a tu agente de IA

---

## Por qué tratamos tus datos y la base legal

| Finalidad | Base legal |
|---|---|
| Prestación del servicio de agente de IA (configuración de cuenta, enrutamiento de mensajes, gestión de tu suscripción) | GDPR art. 6(1)(b) — ejecución de un contrato; APP 3 — razonablemente necesario para el servicio |
| Facturación y procesamiento de pagos | GDPR art. 6(1)(b) — ejecución de un contrato; APP 3 — razonablemente necesario |
| Supervisión del uso y control del presupuesto | GDPR art. 6(1)(b) — ejecución de un contrato; APP 3 — razonablemente necesario |
| Envío de notificaciones del servicio (alertas de uso, recordatorios de renovación) | GDPR art. 6(1)(b) — ejecución de un contrato |
| Envío de correos de invitación en tu nombre | GDPR art. 6(1)(a) — consentimiento (tú inicias el comando /invite) |
| Supervisión de seguridad y prevención de abusos | GDPR art. 6(1)(f) — intereses legítimos |

---

## Con quién compartimos tus datos

Utilizamos los siguientes proveedores externos para prestar el servicio:

- **Telegram** (Países Bajos / EAU) — entrega los mensajes entre tú y tu agente de IA
- **Anthropic** (Estados Unidos) — proveedor principal de modelo de IA; procesa el contenido de tus conversaciones para generar respuestas de IA
- **OpenAI** (Estados Unidos) — proveedor opcional de modelo de IA; procesa el contenido de las conversaciones si seleccionas un modelo de OpenAI
- **Google / Gemini** (Estados Unidos) — proveedor opcional de modelo de IA; procesa el contenido de las conversaciones si seleccionas un modelo Gemini
- **Groq** (Estados Unidos) — proveedor opcional de modelo de IA; procesa el contenido de las conversaciones si seleccionas un modelo Groq
- **DeepSeek** (China / Singapur) — proveedor opcional de modelo de IA; procesa el contenido de las conversaciones si seleccionas un modelo DeepSeek
- **Mistral AI** (Francia) — proveedor opcional de modelo de IA; procesa el contenido de las conversaciones si seleccionas un modelo Mistral
- **Alibaba Cloud / Qwen** (China / Singapur) — proveedor opcional de modelo de IA; procesa el contenido de las conversaciones si seleccionas un modelo Qwen
- **Stripe** (Estados Unidos) — gestiona todo el procesamiento de pagos
- **Neon** (Estados Unidos) — aloja nuestra base de datos
- **Amazon Web Services** (Australia y Estados Unidos) — aloja infraestructura en Sídney (ap-southeast-2) y Norte de Virginia (us-east-1)

No vendemos tus datos personales.

---

## Transferencias internacionales y divulgación en el extranjero

xShopper Pty Ltd es una empresa australiana. Tus datos personales se transfieren y procesan en los siguientes países:

| País | Destinatarios | Datos transferidos |
|---|---|---|
| **Australia** | AWS (Sídney, ap-southeast-2) | Todos los datos — región de alojamiento principal |
| **Estados Unidos** | Anthropic, OpenAI, Groq, Google, AWS (us-east-1), Neon, Stripe | Conversaciones de IA, datos de cuenta, datos de pago |
| **Francia** | Mistral AI | Conversaciones de IA (si se selecciona el modelo Mistral) |
| **China / Singapur** | DeepSeek, Alibaba Cloud (Qwen) | Conversaciones de IA (si se selecciona el modelo DeepSeek o Qwen) |
| **Países Bajos / EAU** | Telegram | Mensajes, identificadores de usuario |

**Para usuarios australianos (Privacy Act 1988):** Conforme al Australian Privacy Principle 8, xShopper toma medidas razonables para garantizar que los destinatarios en el extranjero traten tu información personal de acuerdo con los APPs. Al usar este servicio y dar tu consentimiento al registrarte, reconoces que tus datos serán transferidos a los países indicados y que los principios de privacidad australianos pueden no aplicarse a los datos en poder de destinatarios en el extranjero. Puedes presentar una reclamación ante la Oficina del Comisionado Australiano de Información (OAIC) si crees que tu información ha sido manejada de forma indebida.

**Para usuarios de la UE/EEE (GDPR):** Las transferencias a los Estados Unidos están amparadas por Cláusulas Contractuales Estándar y, cuando esté disponible, el Marco de Privacidad de Datos UE-EE. UU. Las transferencias a Francia (Mistral AI) no requieren garantías adicionales (Estado miembro de la UE).

---

## Cuánto tiempo conservamos tus datos

- Datos de cuenta: conservados mientras tu cuenta esté activa y durante 30 días tras la cancelación
- Registros de pagos: conservados durante 7 años según lo exige la legislación fiscal australiana
- Contenido de conversaciones con IA: almacenado en tu instancia de servidor dedicada; eliminado cuando se termina tu instancia
- Registros de uso: conservados durante 90 días
- Registros de uso de API: conservados durante 90 días

---

## Tus derechos

### Usuarios australianos (Privacy Act 1988)

En virtud de los Australian Privacy Principles, tienes derecho a:

- **Acceder** a tu información personal (APP 12)
- **Corregir** información inexacta o desactualizada (APP 13)
- **Solicitar la eliminación** de tu información personal
- **Reclamar** ante la Oficina del Comisionado Australiano de Información (OAIC) — [oaic.gov.au](https://www.oaic.gov.au)

### Usuarios de la UE/EEE y el Reino Unido (GDPR)

Tienes los siguientes derechos en virtud del GDPR:

- **Derecho de acceso** — solicitar una copia de tus datos personales
- **Derecho de rectificación** — solicitar la corrección de datos inexactos
- **Derecho de supresión** — solicitar la eliminación de tus datos personales
- **Derecho de limitación** — solicitar que limitemos el tratamiento de tus datos
- **Derecho a la portabilidad de los datos** — recibir tus datos en un formato estructurado y legible por máquina
- **Derecho de oposición** — oponerse al tratamiento basado en intereses legítimos

También tienes derecho a presentar una reclamación ante tu autoridad de control local.

### Cómo ejercer tus derechos

Puedes ejercer varios de estos derechos directamente desde xAI Workspace:

- Envía \`/my_data\` para exportar tus datos personales
- Envía \`/delete_my_data\` para solicitar la eliminación de todos tus datos
- Envía \`/email\` para actualizar tu dirección de correo electrónico

Para otras solicitudes, contacta con nosotros en privacy@xshopper.com. Responderemos en un plazo de 30 días.

---

## Reclamaciones

- **Australia:** Oficina del Comisionado Australiano de Información (OAIC), [oaic.gov.au](https://www.oaic.gov.au), Teléfono: 1300 363 992
- **UE/EEE:** Tu autoridad de control local

---

## Contacto

Consultas sobre privacidad: privacy@xshopper.com
xShopper Pty Ltd, Australia
Marca registrada australiana n.º 1749660 (Clase 35)

*Versión de la política de privacidad: 2026-02-27*
`;
