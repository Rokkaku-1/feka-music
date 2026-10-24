# Estado y operación

## Instalación actual

- Sitio: https://feka-music.netlify.app
- Proyecto Supabase dedicado: xxhuqdspehyxobajoleh, organización fekamusic.
- Los identificadores públicos no son credenciales. Las claves privadas no forman parte del repositorio.
- Código y documentación conservan nombres históricos de carpetas para mantener rutas.

## Búsqueda y cuotas

La API /api/music admite búsqueda, tendencias y radio. La caché dura 24 horas; una reserva atómica en Supabase deduplica llamadas concurrentes y aplica presupuesto compartido. El límite de 90 operaciones nuevas al día es una decisión interna conservadora: los distintos modos no equivalen a una única llamada ni a una unidad uniforme de la cuota de YouTube. Comprobar siempre consumo y asignación en Google Cloud.

Netlify aplica 20 peticiones por 60 segundos agrupadas por IP y dominio. Puede devolver 429; no cambiar claves/proyectos para esquivar límites. La función cache-cleanup limpia la caché vencida a las 06:00 UTC. Los controles no garantizan bloquear bots distribuidos.

## Biblioteca y cuentas

Favoritos/playlists se guardan localmente sin cuenta. Con cuenta hay acciones explícitas Guardar biblioteca y Cargar biblioteca; cargar sustituye la biblioteca local y se ofrece copia previa. Cerrar sesión conserva los datos del navegador. Evitar equipos compartidos para información personal que se quiera mantener privada.

Las políticas RLS limitan cada biblioteca al usuario autenticado propietario. Caché, presupuesto y RPC están reservados al servidor. No colocar credenciales secretas en config.js ni desactivar RLS para resolver errores.

## Pendientes conocidos

- SMTP personalizado, dominio de correo y prueba real de registro, confirmación, recuperación y aislamiento entre dos cuentas autenticadas.
- Letras/karaoke, importación de playlists y administración.
- APK Android: no implementada. Convertir a APK o PWA no elimina las restricciones de YouTube sobre reproducción oculta o en segundo plano.
- Ecualizador de bandas para audio YouTube: no implementado ni simulado; solo volumen.
- El canal o la temática de YouTube no garantizan identidad del artista, género exacto ni disponibilidad regional.
- Sustituir o verificar derechos de las canciones y portadas de muestra antes del uso comercial.

## Diagnóstico

| Problema | Revisar |
| --- | --- |
| Búsqueda no disponible | Backend activo, clave privada, variables y respuesta del proveedor. |
| 403 en /api/music | Cabecera X-Feka-Search y origen autorizado; no abrir el HTML como archivo. |
| 429 | Límite por IP, presupuesto interno o cuota del proveedor; esperar y revisar métricas. |
| Cuenta no inicializa | config.js, host Supabase de CSP e integridad del SDK local. |
| Correo no llega | SMTP, remitente/dominio, políticas de entrega y redirecciones de Supabase. |
| Video no reproduce | Restricción del propietario/región, conexión, origen/referrer y gesto del usuario. |
| PWA muestra versión vieja | Nombre de caché en sw.js, despliegue y actualización del service worker. |

## Documentos relacionados

- [Informe de seguridad y comprobaciones](../design/FEKA-MUSIC-SEGURIDAD.md)
- [QA del prototipo](../design/sonora-prototype/QA.md)
- [Historial de decisiones](../design/FEKA-MUSIC-ESTADO.md)
- [Requisitos originales](../REQUISITOS.md)
- [Validación de la referencia](../design/SOUNDBLIZ-VALIDACION.md)
- [Plantilla de confirmación de correo](../design/feka-music-email/README.md)

Los documentos históricos conservan decisiones y resultados anteriores; no convierten funciones pendientes en funciones implementadas.
