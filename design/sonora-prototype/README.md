# Feka Music

Plantilla independiente en HTML, CSS y JavaScript. Web: https://feka-music.netlify.app

## Desarrollo

Desde la raíz del repositorio: node design/sonora-preview-server.mjs. Abrir http://localhost:4186/ o Live Server en http://localhost:5500/index.html. El servidor privado debe permanecer abierto para búsqueda, tendencias y radio. No abrir como file://.

La configuración privada local está fuera de esta carpeta, en design/.private/feka-music.env, excluida de Git y archivos de entrega. config.js contiene únicamente la configuración publicable de Supabase.

## Código y despliegue

- app.js y client-data.js: catálogo, biblioteca y validación de datos.
- cloud.js y vendor/: cuenta opcional con SDK oficial Supabase 2.117.2 fijado, alojado localmente y verificado por integridad.
- search-remote.js, home-trending.js y radio.js: búsquedas explícitas, tendencias y continuación basada en la canción inicial.
- server/: lógica privada del proveedor y validación de peticiones.
- netlify/functions/: API en /api/music y limpieza programada de caché.
- seasonal.js/css: Halloween en octubre, Navidad en diciembre, claro y oscuro.
- pwa.js, manifest.webmanifest y sw.js: instalación y aviso sin conexión. La música necesita internet.

Ejecutar node build.mjs desde esta carpeta prepara dist mediante una lista explícita de archivos públicos. Solo dist se publica. netlify.toml configura las funciones, cabeceras CSP/HSTS y los límites por IP. El backend y la documentación no se sirven como archivos estáticos.

Configurar en Netlify YOUTUBE_API_KEY, SUPABASE_URL y una credencial de servidor Supabase; nunca añadir sus valores al código público. Presupuesto de producción: 90 operaciones nuevas al día, compartido por Supabase. Caché: 24 horas; los resultados repetidos no consultan YouTube. Un lote de tendencias usa tres consultas de metadatos; una radio puede usar una búsqueda y dos lotes de metadatos.

## Producto

Escucha sin cuenta; favoritos y playlists locales, guardado/carga explícitos en Supabase, 31 géneros, tendencias de PE/US/KR y radio por temática musical. Los canales de YouTube no certifican la identidad del artista ni un subgénero exacto. No se extrae audio ni se oculta el video en reproducción. YouTube puede servir anuncios y restringir videos por región.

El volumen funciona. Un ecualizador de bandas no está disponible con el reproductor de YouTube. Letras/karaoke, administración, importación de playlists y SMTP personalizado siguen pendientes. La entrega de correos y sincronización entre dos cuentas reales requieren una prueba aparte; no se crearon cuentas ni enviaron correos durante la revisión.

## Seguridad y comprobaciones

Ver ../FEKA-MUSIC-SEGURIDAD.md y QA.md. Las pruebas están en ../feka-music-*.test.mjs. Supabase usa el proyecto xxhuqdspehyxobajoleh de fekamusic; no modificar FekaMovies. schema.sql documenta una estructura ya aplicada: no volver a ejecutarlo sobre la misma base.

Las seis canciones originales y sus portadas de Spotify CDN son contenido de muestra cuya autorización comercial no se ha verificado. Las búsquedas nuevas usan miniaturas de YouTube. Sustituir recursos de muestra antes de explotación comercial.
