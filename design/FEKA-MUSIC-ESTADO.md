# Feka Music — estado y continuidad

Actualizado: 23 de octubre de 2026.

## Identidad verificada en Supabase

- Organización: `fekamusic`, identificador `vnheijkrmuvdvnathvvt`.
- Proyecto de música: `xxhuqdspehyxobajoleh`, región `us-west-2`.
- El panel muestra creación el 23 de octubre de 2026, 10:46:36, sin zona horaria indicada en el listado. No se pudo atribuir quién lo creó ni por qué recibió su nombre inicial.
- Nombre inicial: `Rokkaku-1's Project`. Renombrado a **Feka Music** después de verificar la organización y ausencia de tablas de aplicación.
- FekaMovies es un proyecto distinto: `hreclyrdptiyompfencb`, organización `fekamovies`, región `us-east-1`, creado según el listado el 22 de octubre de 2026. No se modificó su base ni configuración.

## Implementado

- Marca Feka Music en la web y diálogos. La carpeta `design/sonora-prototype` se conserva para no romper VS Code/Live Server y el servidor local existente.
- Cuenta opcional, entrada y registro por correo mediante Supabase. Configuración pública en `config.js`; solo clave publicable, sin claves privadas.
- Biblioteca privada: favoritos, playlists, historial y géneros. Guardar/cargar desde el diálogo de cuenta, con comprobación de revisión para evitar sobrescrituras simultáneas. No se sincroniza automáticamente ni se reemplaza una biblioteca existente sin cargarla antes.
- Supabase Site URL configurada para `http://localhost:5500/index.html`. Adaptarla al desplegar en Netlify.
- Preferencias de géneros y recomendaciones locales dentro de seis canciones de muestra. Se tienen en cuenta favoritos y escuchas de 30 segundos efectivos. No hay catálogo remoto de artistas poco conocidos todavía.
- Historial local de hasta 100 escuchas, con opción de reiniciar historial y géneros.
- Tablas remotas creadas: `music_libraries`, `music_search_cache`, `music_api_daily_usage`. RLS en todas; biblioteca limitada al propietario y caché/consumo inaccesibles para `anon` y `authenticated`.
- RPC `claim_music_search`: reserva atómica, reutilización de resultados y presupuesto diario compartido. Acceso solo de servidor.
- Función Netlify `youtube-search.mjs` preparada. Sin clave devuelve un estado de configuración pendiente. Buscador conectado con resultados reales mediante servidor privado local; pendiente despliegue y variables privadas en Netlify.

## Verificaciones realizadas

- Consulta SQL inicial: ningún esquema de aplicación contenía tablas.
- Verificación SQL posterior: RLS activa, cuatro políticas de propietario en la biblioteca, sin SELECT de invitado; caché y consumo sin acceso de clientes.
- `supabase/verify.sql` ejecutado en transacción con ROLLBACK: aislamiento entre dos usuarios, bloqueo de escritura ajena, acierto de caché, reserva duplicada y límite de cuota. Resultado PASS; no dejó usuarios ni consumo de prueba.
- Peticiones reales con la clave publicable: `/auth/v1/settings` devuelve 200, correo habilitado y confirmación requerida; lectura anónima de biblioteca/caché devuelve 401/42501.
- Interfaz de cuenta: SDK oficial inicializa y muestra entrada/registro. No se creó una cuenta real ni se probó el enlace de correo de un usuario; esa prueba requiere que el usuario introduzca y confirme sus propios datos.
- Recomendaciones: elegir Rock coloca Demons en primer lugar dentro de la muestra.
- Asesor de seguridad: inicialmente 0 errores y dos advertencias sobre la función interna `rls_auto_enable`. Se revocó su ejecución para PUBLIC/anon/authenticated y se comprobó que ambas autorizaciones quedan en false. Revisión final del asesor: 0 errores, 0 advertencias y 2 sugerencias informativas.

## Pendiente antes de habilitar búsqueda pública y publicar

1. Clave de YouTube recibida y guardada en configuración privada local; configurar su variable privada en Netlify al publicar.
2. Configurar la clave privada de Supabase en Netlify Functions; la web ya usa su clave publicable. No se ha extraído ninguna clave privada del panel.
3. Resultados remotos e IDs estables implementados. Completar renovación y retención de metadatos antes de producción.
4. Activar limpieza programada de caché vencida y comprobar retención conforme a políticas de YouTube; caché propuesta de 24 horas. Añadir límites por cliente antes de abrir la búsqueda al público.
5. Configurar avisos de consumo al 80 %, paginación a demanda, importación de playlists de YouTube y comprobar cuotas reales. El endpoint inicial no pagina.
6. Completar recuperación de contraseña, probar registro/correo/login/sincronización entre dispositivos y configurar SMTP/URLs de producción según necesidad.
7. Ampliar catálogo autorizado, diversidad de recomendaciones y administración. Sustituir portadas de muestra por recursos autorizados para producción.
8. Desplegar vía Git o Netlify CLI para incluir funciones. Netlify Drop sirve la parte estática; no activa por sí solo el backend preparado.

Letras y karaoke siguen pospuestos. Registro opcional, sin comunidad ni publicidad propia. Conservar marcas y visibilidad del reproductor oficial.

Prueba adicional confirmada: historial local registra Thriller tras 30 segundos de reproducción real; cierre del video pausa y conserva la biblioteca.


## Correo con marca Feka Music

Plantilla de confirmación preparada en design/feka-music-email/confirmation.html, con vista previa y configuración JSON sin credenciales. El usuario confirmó que aún no tiene dominio propio. Activación SMTP y aplicación de la plantilla pendientes de dominio verificado y cuenta de envío. No se modificó el correo activo ni se enviaron mensajes. Ver instrucciones en design/feka-music-email/README.md.

## Integración real de YouTube — 23 octubre 2026

Clave privada configurada sin incorporarla a HTML/JS público ni al ZIP. Búsqueda real: Los Toribianitos devuelve 20 resultados; Ronda de Navidad reproduce y avanza en el reproductor. Favorito conservado tras recargar. Consultas repetidas servidas desde caché de disco (24 h), una sola búsqueda real al proveedor durante la prueba inicial. Backend local con CORS restringido, cabecera requerida y límite de solicitudes; mantiene presupuesto diario y reservas concurrentes. La caché compartida de Supabase en producción requiere todavía su credencial privada en Netlify.

Pruebas automatizadas: validación, configuración ausente, caché, reserva pendiente, límite diario, error de cuota, normalización de consulta; caché persistente, concurrencia y presupuesto sin reinicio al recargar el almacén.

## PWA

Implementado apartado de instalación, diálogo adaptado a móvil y temas, manifiesto, iconos propios e instrucciones por navegador. Aviso offline sin guardar música ni respuestas privadas. Pendiente comprobar instalación nativa desde el despliegue HTTPS en dispositivos reales.

Inicio actualizado: tendencias reales de música YouTube en PE/US/KR, bloques por temática disponible, destacada y selección aleatorias al recargar. Caché 24 horas; no se promete ranking individual para los 31 géneros. Producción requiere las mismas variables privadas de Netlify ya pendientes.

Temas de calendario implementados: Halloween naranja en octubre y Navidad verde/rojo/dorado en diciembre; regreso a identidad normal en otros meses. Se adapta al tema claro/oscuro y se actualiza sin recargar.

Radio automática por canción implementada y comprobada: mantiene referencia hasta elección manual, prioriza otros canales con temática musical compartida y reutiliza caché. Ajustes de sonido con volumen; ecualizador real no disponible para el audio incrustado de YouTube.

## Estado vigente tras revisión de seguridad

Proyecto Netlify independiente feka-music, ID 648cb05b-473a-4821-9129-76f403cebc3a. Fuentes privadas separadas de dist; API moderna /api/music con límite por IP/dominio y validación de peticiones. SDK Supabase 2.117.2 local y fijado; claves privadas disponibles solo en configuración privada/variables Netlify. Caché remota Supabase conectada y verificada. Auth Site URL https://feka-music.netlify.app, redirecciones exactas de raíz/index.html y localhost:5500/index.html. Previsualización de seguridad superada. Estado del despliegue definitivo se documenta en FEKA-MUSIC-SEGURIDAD.md. Los puntos antiguos sobre clave faltante/búsqueda solo local ya quedaron resueltos.
