# Feka Music — revisión de seguridad, 23 de octubre de 2026

## Alcance

Revisión del código HTML/CSS/JavaScript y funciones de Feka Music, pruebas automatizadas, peticiones controladas contra su proyecto Supabase y el despliegue de prueba en Netlify. No se probó ni modificó FekaMovies, BetLog u otros proyectos. No es una certificación de seguridad ni una prueba exhaustiva de infraestructura del proveedor.

## Problemas corregidos

| Hallazgo | Corrección |
| --- | --- |
| Límite por visitante presente solo en el servidor local | Netlify Function con regla por IP y dominio: 20 peticiones por 60 segundos. Prueba real devolvió 429. |
| Función pública sin filtro de origen y parámetros duplicados | Validación de método, origen, Sec-Fetch-Site, cabecera requerida, tamaño de URL y lista de parámetros; 400/403/405/414 antes de invocar proveedores. La cabecera no se presenta como autenticación. |
| Paquete estático contenía documentación, SQL y fuentes del servidor | Publicación desde dist mediante lista explícita de 28 archivos. Rutas privadas comprobadas: 404. |
| Bibliotecas y almacenamiento local con validación insuficiente | Límites de tamaño y cantidad, IDs de video estrictos, selección de campos permitidos, escape HTML y URLs de imágenes construidas por la app. Pruebas con etiquetas maliciosas, URLs javascript y __proto__. |
| Falta de CSP, protección frente a enmarcado y políticas del navegador | CSP sin JavaScript inline/eval, frame-ancestors none, object-src none, base-uri none, HSTS, X-Frame-Options DENY, nosniff y permisos restringidos. YouTube conserva su iframe visible y su referencia de origen. |
| SDK de cuenta antiguo cargado desde un CDN de JavaScript | SDK oficial Supabase 2.117.2 alojado con la web, licencia incluida, integridad SHA-384 en el script y versión fijada en package-lock.json. Eliminado el permiso de CDN externo en CSP. |
| Metadatos guardados sin caducidad | Expiración de metadatos a 30 días y caché de búsquedas/tendencias/radios a 24 horas; limpieza diaria programada de la caché remota. |
| Colisiones entre consultas de búsqueda y claves internas de radio/tendencias | El modo forma parte del hash de caché. |
| Retención de contraseña en el diálogo de cuenta | Se limpia al cerrar el diálogo. |

## Evidencia

- Diez pruebas Node aprobadas: validación de peticiones, XSS/entrada de biblioteca, aislamiento de archivos publicados, concurrencia y presupuesto, radio, tendencias y calendario.
- npm audit --omit=dev: 0 vulnerabilidades conocidas en las dependencias de producción de este proyecto.
- Supabase real: lectura anónima de music_libraries, music_search_cache y music_api_daily_usage: 401. Ejecución anónima de claim_music_search: 401.
- Netlify HTTPS de prueba: CSP/HSTS presentes, X-Frame-Options DENY; siete rutas de configuración/SQL/servidor/documentación: 404.
- API: petición sin cabecera y origen ajeno: 403; parámetros duplicados: 400; POST: 405.
- Prueba acotada por IP: 26 peticiones inválidas, sin consumir YouTube; 24 devolvieron 400 y 2 devolvieron 429. Una petición posterior también recibió 429.
- La ruta alternativa /.netlify/functions/youtube-search devolvió 404. La función programada cache-cleanup rechazó invocación pública con 403.
- Búsqueda real de Los Toribianitos: 20 resultados; reproducción de Ronda de Navidad y carga de radio verificadas en HTTPS con CSP activa.
- Diálogo de cuenta inicializado con el SDK local. Sin errores/advertencias capturados en esa comprobación del navegador.
- URLs de Supabase ajustadas a https://feka-music.netlify.app y redirecciones exactas de raíz, index.html y localhost:5500/index.html, sin comodines.

## Secretos y límites operativos

YouTube y la credencial de servidor Supabase se guardan en configuración privada, excluida de Git y dist, y en variables del proyecto Netlify. La clave publicable de Supabase permanece pública por diseño y depende de las políticas RLS. Nunca añadir la credencial de servidor a config.js, documentación, ZIP público o registros.

Se configura un presupuesto conservador de 90 operaciones nuevas al día en producción, compartido mediante Supabase. Una radio nueva puede consultar hasta dos lotes de metadatos además de una búsqueda. La limitación por IP de Netlify puede tardar unos segundos en aplicarse; la reserva atómica compartida limita el gasto global. Estos controles no equivalen a una garantía contra bots distribuidos.

No se creó una cuenta real, no se enviaron correos ni se repitió en esta revisión la prueba de dos usuarios autenticados. El script SQL verify.sql y sus resultados previos siguen documentados. El registro público y la entrega de confirmaciones siguen requiriendo completar el SMTP previsto; no se desactivó la confirmación de correo.

Antes de una apertura a gran escala: completar registro/correo/recuperación y prueba entre dos cuentas reales, supervisar consumo y revisar restricciones de la clave en Google Cloud. No se afirma que todos los videos marcados como embeddable estén disponibles en todas las regiones.

## Despliegue definitivo

Publicado en https://feka-music.netlify.app con el deploy 6adbf35131fe9ac8dcfb3e8f. Comprobación final: HTTP 200, búsqueda real con 20 resultados y cached=true, cabeceras de seguridad presentes, rutas privadas 404, integridad SHA-384 del SDK correcta y manifiesto/service worker/iconos PWA disponibles. Barrido del contenido publicado contra los valores reales de las claves privadas: 0 coincidencias.

En producción se verificó también Creep y su avance automático a otro canal, manteniendo Radiohead como referencia de la radio; reproducción confirmada y sin errores/advertencias capturados. Se dejó en pausa al terminar. La última ejecución de las diez pruebas pasó usando TEMP/TMP dentro de design/.private: la carpeta temporal del sandbox de Windows rechazaba la sustitución del archivo de caché con EPERM.
