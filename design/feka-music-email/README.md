# Correo de confirmación — Feka Music

Estado: diseño preparado, envío personalizado sin activar. El usuario confirmó el 23/10/2026 que todavía no dispone de dominio propio.

- Asunto: **Confirma tu correo en Feka Music**.
- Nombre del remitente previsto: **Feka Music**.
- Dirección del remitente: pendiente de dominio verificado; no se ha inventado una dirección real.
- Plantilla para Supabase: `confirmation.html`. Mantiene `{{ .ConfirmationURL }}` como enlace dinámico de confirmación, incluido el enlace de respaldo.
- `preview.html` es una vista de diseño con enlace ficticio e inerte. No sirve para enviar confirmaciones.
- `supabase-auth-email.json` contiene solo asunto y HTML para una futura actualización de configuración. No contiene claves ni activa envíos.

## Activación posterior

1. Elegir un dominio que el usuario controle, sin comprarlo ni contratar servicios automáticamente.
2. Configurar una cuenta del proveedor de envío (Resend es la propuesta), verificar el dominio mediante sus registros DNS y comprobar la verificación antes de usar el remitente.
3. En el proyecto **Feka Music**, referencia `xxhuqdspehyxobajoleh`, entrar en Authentication → Emails → SMTP Settings.
4. Configurar nombre Feka Music y dirección del dominio verificado. Para Resend, según su guía actual: host `smtp.resend.com`, puerto `465`, usuario `resend`; contraseña: clave API guardada solo en la configuración privada de Supabase.
5. Una vez habilitado SMTP, aplicar el asunto y el HTML a **Confirm sign up**. No actualizar otras plantillas con este contenido.
6. Configurar Site URL y redirecciones exactas de la web publicada. La web actual utiliza `https://feka-music.netlify.app` como Site URL. En una instalación nueva, usar su propia URL pública y registrar las redirecciones exactas; localhost solo sirve para desarrollo.
7. Desactivar el seguimiento de enlaces del proveedor si reescribe los enlaces de autenticación. Probar con una cuenta y un correo controlados por el usuario: recepción, remitente, enlace, sesión y comportamiento ante reutilización.

No se ha cambiado el remitente, conectado SMTP ni enviado correos de prueba. La plantilla no se ha aplicado al servicio predeterminado del proyecto Free: los proyectos nuevos requieren SMTP propio para personalizarla.

El contenido visible del correo, el dominio del remitente y el dominio del enlace son aspectos distintos. Esta plantilla no cambia automáticamente el dominio de verificación de Supabase ni contrata su complemento de dominio personalizado.

Se usan tablas de presentación, estilos en línea, fuentes del sistema, botón de texto y enlace alternativo. Sin imágenes remotas, píxeles de seguimiento ni scripts. La vista se comprueba en navegador; Outlook, Gmail y otros clientes necesitarán una prueba de recepción real al activar SMTP.

Fuentes verificadas:
- https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://resend.com/docs/send-with-supabase-smtp

Verificación: vista de navegador revisada en escritorio y a 390 × 844; sin desbordamiento horizontal visible. JSON validado y enlace dinámico conservado. No se ha probado entrega en clientes de correo reales.
