# Verificación del prototipo

Fecha: 23 de octubre de 2026.

- `node --check app.js`: correcto.

## Buscador central

- Campo retirado del menú lateral y del bloque móvil duplicado. Un único input de búsqueda en la cabecera para todos los tamaños.
- Alineación central verificada en 1024 px (desplazamiento respecto al centro de la cabecera: 0 px) y revisión visual en 1440 px. En móvil se ubica debajo del logo con 44 px de alto; revisión en 390 y 360 px sin desbordamiento horizontal.
- Búsquedas y reproducciones verificadas desde el resultado: `vamp` → vampire (avance a 0:11), `RADIOHEAD` → Creep (0:10), `thriller` → Thriller (0:12), `billie eilish` → bury a friend (0:07), `Imagine` → Demons (0:04), `rihanna` → Disturbia (0:20). Título del video de YouTube y canción seleccionada comprobados.
- Primeras tres búsquedas en escritorio; últimas tres en móvil. Resultados móviles compactos para evitar que el panel flotante intercepte la selección.
- `zzzz-sin-coincidencias`: cero resultados y mensaje específico. Escape limpia el campo y restablece las seis canciones. La reproducción continúa al cambiar la consulta.
- Tema oscuro revisado. La búsqueda sigue limitada al catálogo de muestra, sin conexión a YouTube Data API.
- Navegador real: inspección visual en 360 × 800, 390 × 844, 768 × 1024 y 1440 × 900; sin desbordamiento horizontal del documento en los tamaños comprobados.
- Las carátulas visibles cargaron correctamente.
- Búsqueda móvil por Radiohead: devuelve Creep.
- Guardado de Creep sin registro: aparece en biblioteca y persiste tras recargar.
- Creación de playlist local Mis favoritas: contiene la selección guardada.
- Diálogo de cuenta: explica que la cuenta es opcional y no está conectada. Cierre mediante Escape correcto.
- Tema oscuro verificado visualmente y restaurado a claro.
- Video móvil: contenedor comprobado de 340 × 200 px en viewport de 390 px; cierre pausa y retira el panel.
- Reproducción: el error 150 se reprodujo con 127.0.0.1. Cambiando al mismo Live Server en localhost:5500/index.html se confirmó el estado real PLAYING del reproductor y el avance de la reproducción. Se mantuvo el dominio youtube-nocookie.com y el parámetro origin con la dirección real. No se usaron fuentes de audio alternativas ni referencias falsificadas.
- Canciones verificadas: vampire, Creep (avance a 0:07), Thriller (0:06), bury a friend (0:05), Demons (0:05) y Disturbia (0:13). vampire se confirmó en estado de reproducción con duración 4:04.
- Corrección: host localhost en .vscode/settings.json, redirección local de 127.0.0.1 a localhost conservando ruta y puerto, política de referencia explícita y mensajes de error diferenciados.
- No se verificaron catálogo remoto, autenticación, administración ni sincronización porque no forman parte de este prototipo visual.
- Sin publicación en Netlify. ZIP preparado con la plantilla estática; recursos visuales remotos de muestra pendientes de sustituir o autorizar para producción.

Capturas conservadas en la carpeta de visualizaciones del chat: sonora-desktop.png y sonora-mobile.png.

## Rediseño liquid glass

- Revisión visual del reproductor en escritorio 1440 × 900 y móvil 390 × 844, en claro y oscuro.
- Comprobación adicional de móvil 360 × 800: documento sin desbordamiento horizontal y video de 295 × 200 px.
- Barra de controles, video y navegación separados por 12 px en móvil; botones principales de 44 × 44 px.
- YouTube en Live Server: vampire se reprodujo y avanzó; cierre del panel móvil pausó el video. Cambio a Creep correcto y actualización del tinte de la portada comprobada.
- Texto y controles usan tokens específicos para cada tema. No se aplican filtros ni superposiciones sobre el iframe de YouTube.
- Fallback opaco para navegadores sin backdrop-filter y para prefers-reduced-transparency. Se mantiene la preferencia de movimiento reducido existente.
- `node --check app.js`: correcto.

## Controles de ventana del reproductor (23/10/2026)
- Añadidos − para minimizar y + para ampliar junto a la X, en escritorio y móvil.
- Quitada la etiqueta duplicada YouTube de la cabecera del prototipo; conservadas las marcas del iframe oficial.
- Vista compacta flotante: mantiene el mismo iframe visible (al menos 200 × 200 CSS px), sin recargarlo ni pausar la reproducción.
- X pausa y oculta el panel; la barra permite volver a abrir y reproducir. Se protege el cierre durante la carga inicial para no iniciar audio con el panel cerrado.
- Verificado en Live Server localhost:5500: reproducción real de Thriller, minimizar/ampliar, cerrar y reanudar; escritorio 1440 × 900 y móvil 390 × 844, temas claro y oscuro. Sintaxis de app.js comprobada con node --check.
- No se implementa audio con video oculto, conforme a las condiciones del reproductor de YouTube.


## Feka Music y Supabase (23/10/2026)
- Renombrado visual, migración de claves locales con lectura compatible de sonora.*, sin cambiar la ruta de Live Server.
- Cliente Supabase inicializado con clave publicable del proyecto de música verificado. Auth settings: 200, email habilitado y confirmación requerida.
- Lectura de biblioteca/caché sin sesión: 401/42501.
- verify.sql pasó en base real con ROLLBACK: privacidad entre usuarios, escritura ajena bloqueada, caché, reservas duplicadas y cuota.
- Asesor de seguridad final: 0 errores, 0 advertencias, 2 sugerencias informativas.
- node --check para app.js y cloud.js; node --test design/feka-music-api.test.mjs para validación, configuración ausente, caché, cuota y fallo de proveedor sin reintentos.
- Preferencia Rock prioriza Demons; preferencias persistentes tras recarga. Vista móvil revisada a 390 × 844, sin desbordamiento horizontal.
- Registro real, confirmación de correo, login y guardar/cargar entre dispositivos requieren prueba posterior con una cuenta del usuario. No se han creado contraseñas ni usuarios persistentes de prueba.
- Historial verificado con reproducción real de Thriller: apareció tras 30 segundos y se abrió correctamente el diálogo en móvil.

## YouTube real — 23 octubre 2026

- Los Toribianitos: 20 resultados reales. Repeticiones HTTP 200 con cached=true; solo una búsqueda al proveedor durante esta prueba.
- Ronda de Navidad: estado Reproduciendo desde YouTube, avance 1:51 / 3:34. Favorito conservado después de recargar en Mi biblioteca.
- Búsqueda móvil 390x844 con Enter: 20 resultados y selección de Ven a Cantar.
- node --test design/feka-music-api.test.mjs design/feka-music-local-store.test.mjs: 2 pruebas aprobadas.
- Sin clave privada en la carpeta pública. Rutas privadas y de fuente de función: 404. Llamadas sin cabecera o con origen ajeno: 403.
- Pendiente producción: variables privadas de Netlify, caché compartida Supabase, límites públicos por cliente y retención/renovación de metadatos.

## Instalación PWA — 23 octubre 2026

Apartado Instalar Feka Music al final del contenido y acceso Instalar app en la barra lateral. Manifiesto relativo, iconos PNG 192/512 y maskable, modo standalone, metadatos iOS y service worker con aviso sin conexión. Botón nativo condicionado a beforeinstallprompt; estado instalado mediante appinstalled/display-mode. Instrucciones manuales para Safari/iPhone y navegadores sin evento. No se instaló en el dispositivo del usuario ni se verificó una instalación nativa en iOS/Android. El navegador integrado muestra correctamente la alternativa manual.

El service worker solo guarda offline.html: nunca guarda búsquedas, cuentas, claves ni contenido de YouTube. No se fuerza recarga ni activación de actualizaciones durante la reproducción. Probar desde localhost o HTTPS; para instalar en un teléfono usar el futuro despliegue HTTPS de Netlify, no localhost del computador. La música requiere internet. Referencia: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

Comprobación PWA: recursos HTTP 200 en Live Server 5500 y servidor 4186; dimensiones PNG verificadas con cabecera real. Ventana revisada en escritorio y móvil 390x844, claro y oscuro; cierre con Escape probado. La instalación nativa no se ejecutó desde el navegador integrado.

Géneros: 31 opciones compartidas por filtros, preferencias y validación de biblioteca; filtro Salsa muestra estado vacío explicativo y búsqueda voluntaria. Layout con filas adaptables y diálogo de preferencias con scroll en pantallas pequeñas.

## Inicio dinámico de tendencias — 23 octubre 2026

Inicio conectado a videos.list mostPopular, categoría Música, regiones PE/US/KR. Se deduplican IDs y se excluyen videos sin permiso de incrustación. Temáticas musicales de YouTube mapeadas a géneros conocidos; sin dato no se inventa género. No representa un ranking oficial de los 31 géneros. Prueba real: 81 videos, cinco géneros identificados y grupo sin clasificar. Caché de 24 horas compartida, reutilizada al recargar; tres peticiones videos.list al renovar el lote, una reserva conservadora del presupuesto interno. No se usa search.list para cargar este inicio.

Destacada, orden de bloques y canciones aleatorios en cada carga; la primera canción se compara con la visita anterior para evitar repetición consecutiva. Hasta cinco géneros disponibles y sección Más sonidos; cola sigue el mix cargado. Búsqueda y biblioteca siguen independientes. Pruebas Node: 3/3 aprobadas, incluyendo deduplicación, embeddable, temática, caché y parámetros de popularidad.

Verificación visual final de tendencias: escritorio y móvil 390x844; destacada cambió de Cristian Castro a Kerosene tras recargar; reproducción real y cola del mix verificadas. La barra inactiva se prepara con la nueva destacada sin reproducir automáticamente.

## Temas estacionales automáticos

Octubre completo: Halloween, naranja, calabaza y telaraña decorativa. Diciembre completo: Navidad, verde, rojo y detalles dorados. Los demás meses vuelven a la identidad normal. Calendario local del dispositivo, revisión cada minuto y al volver a una pestaña suspendida; respeta el modo claro/oscuro elegido. No agrega peticiones a YouTube ni cambia la música o controles del video. Paletas aplicadas a acentos, botones, portada, navegación y reflejos del reproductor. El manifiesto/icono instalado mantienen la marca permanente; meta theme-color de la página sigue la temporada.

Pruebas de fechas: límites septiembre/octubre/noviembre/diciembre/enero y fecha inválida aprobados con node --test design/feka-music-seasonal.test.mjs. Revisión visual Halloween oscuro en escritorio y Navidad oscuro en escritorio/claro en móvil. Vista previa exclusiva de localhost: ?season-preview=christmas, ?season-preview=halloween o ?season-preview=default; eliminar el parámetro vuelve al calendario real. No hay selector artificial de temporada en producción.

## Radio por canción y sonido

Elección manual: nueva referencia de artista/canción. Fin de video y Siguiente: conservan la referencia; no se solicitan recomendaciones en cada salto. Cola sin repetir IDs ya escuchados y priorizando otros canales/artistas. API verifica temática musical compartida (Rock, Pop, etc.), permiso de incrustación y otro canal; YouTube devuelve canales, no una identidad de artista certificada. No reproduce el algoritmo personalizado de YouTube ni garantiza un subgénero exacto. Respuestas de radios anteriores descartadas con revisión/AbortController. Caché compartida 24 horas por ID inicial. Una búsqueda y hasta dos consultas de metadatos por radio nueva; usa el presupuesto interno existente. Si falla, solo usa canciones guardadas del mismo género conocido; si se agotan, se detiene.

Continuación automática activable en panel y ajustes de sonido. Siguiente manual funciona con continuación desactivada. Volumen real conectado a setVolume; ajustes accesibles también en móvil. Ecualizador de bandas no implementado: IFrame API no lo ofrece y las políticas del proveedor no permiten modificar el audio. No se muestran bandas simuladas. Referencias: https://developers.google.com/youtube/iframe_api_reference y https://developers.google.com/youtube/terms/developer-policies-guide

Pruebas: conservación de referencia tras salto, exclusión de duplicados y variantes VEVO, respuesta anterior descartada, nueva referencia manual, filtrado por canal/temática/embeddable y caché. Prueba real de final adelantado: Creep → Charli xcx, conservando Radio de Radiohead. Selección manual de Billie Eilish cambia la referencia.

Validación adicional real: desactivar continuación y adelantar bury a friend hasta el final conserva la canción y muestra Continuación automática desactivada. Siguiente manual conserva la radio aunque la continuación esté desactivada. Se detectó un video bloqueado regionalmente pese a embeddable=true; con continuación activa ahora se salta hasta tres errores consecutivos 100/101/150. Volumen del diálogo y barra comprobados a 100 % en DOM; selector móvil abre correctamente en 390x844. Corregido solapamiento del botón Sonido con el buscador en anchos intermedios. Suite final 6/6 aprobada.

## Revisión final de seguridad y publicación

Suite de 10 pruebas aprobada; npm audit de producción: 0 vulnerabilidades conocidas. HTTPS de Netlify: búsqueda real 20 resultados, Ronda de Navidad reproduce, radio prepara candidatos y cuenta inicializa con SDK local; registro/correo real sin probar por SMTP pendiente. CSP activa sin errores/advertencias capturados en esta comprobación. Rate limit real 429, rutas privadas 404, invocación pública de tarea programada 403 y Supabase anónimo 401. Informe completo en ../FEKA-MUSIC-SEGURIDAD.md.
