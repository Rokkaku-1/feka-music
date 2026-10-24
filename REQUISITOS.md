# Nuevo proyecto musical inspirado en Soundbliz

Decisiones del usuario registradas el 23 de octubre de 2026. Este documento corresponde al nuevo proyecto musical; no modifica el alcance de BetLog.

## Formato y despliegue

- Crear una plantilla reutilizable y portable para poder subirla posteriormente a otra web, siguiendo la intención del trabajo realizado con Fekamovies.
- Los detalles técnicos de la plantilla de Fekamovies están pendientes de consultar; no se presupone su estructura ni su implementación.
- Usar Netlify para el despliegue inicial y su dirección provisional.
- Por ahora no se cuenta con dominio ni hosting propio. No son requisitos para empezar.
- Mantener la configuración de despliegue y las integraciones separadas para facilitar una migración posterior.

## Alcance funcional

- Inicio con tendencias, novedades, artistas, géneros y playlists.
- Catálogo con páginas de canciones, artistas, álbumes y playlists.
- Buscador musical.
- Buscador centrado en la cabecera, con adaptación móvil; retirado del menú lateral. Permitir reproducir directamente las canciones encontradas.
- Reproductor persistente al navegar entre páginas.
- Cuenta, inicio de sesión y biblioteca personal.
- Escuchar música sin registrarse: el registro es opcional y no debe bloquear el acceso a la reproducción.
- La cuenta podrá utilizarse para guardar la biblioteca personal y sincronizarla.

## Exclusiones solicitadas

- Sin publicidad propia: no incorporar banners ni anuncios intersticiales del sitio.
- Sin módulo de comunidad: excluir contadores públicos de reproducciones, likes sociales, comentarios y respuestas.
- La exclusión de comunidad no elimina la biblioteca personal ni las playlists.

## Integración musical prevista

- Se prevé utilizar una API de YouTube e integrar su reproductor para la reproducción musical.
- Antes de implementar, concretar las APIs necesarias para búsqueda, metadatos y reproducción, así como sus cuotas y configuración de claves.
- La ausencia de publicidad propia no garantiza la ausencia de anuncios servidos por YouTube dentro de su reproductor.
- La prueba realizada en Soundbliz no detectó anuncios de YouTube en los arranques de diez canciones; no demuestra que nunca aparezcan.

## Estado

Nombre definitivo: Feka Music. Plantilla independiente en design/sonora-prototype (ruta conservada por compatibilidad con Live Server). Supabase conectado al proyecto xxhuqdspehyxobajoleh de la organización fekamusic; estructura privada verificada. Registro por correo integrado, pendiente de prueba real del usuario. Catálogo remoto de YouTube y despliegue Netlify pendientes. Estado detallado en design/FEKA-MUSIC-ESTADO.md.

## Prototipo de diseño solicitado

- Inspiración en Apple Music: carátulas cuadradas, tipografía limpia y composición editorial; tema claro con acento coral y alternativa oscura.
- Reproductor con diseño liquid glass en escritorio y móvil, adaptado a claro y oscuro: superficies translúcidas, reflejos, tintes de la portada y controles flotantes accesibles.
- Considerar Fekamovies como referencia cuando se disponga de su versión exacta; no se localizó en las fuentes consultadas durante este prototipo.
- El usuario prefiere el video en escritorio y evitar que domine el diseño móvil. Solución provisional: panel lateral en escritorio y tarjeta compacta durante la reproducción en móvil. No ocultar un video que siga sonando; revisar esta propuesta con el usuario.
- YouTube entrega miniaturas de video, no garantiza carátulas oficiales de álbum. El prototipo muestra carátulas remotas de ejemplo; la fuente autorizada para producción está pendiente.
- Se verificaron búsqueda de muestra, favoritos persistentes, biblioteca, playlist local, tema y diálogo de cuenta opcional. El error 150 inicial se resolvió en Live Server usando localhost en lugar de 127.0.0.1. Se confirmó reproducción de las seis canciones de muestra. Se incluyó la configuración del host y redirección local para conservar esta corrección.

## Continuidad del análisis inicial

El usuario solicita tener en cuenta todo el análisis y las propuestas anteriores, aplicando las modificaciones registradas arriba. Las propuestas técnicas siguen siendo una base de planificación y deben validarse al implementar; no son afirmaciones sobre la tecnología interna de Soundbliz.

### Interfaz y experiencia

- Diseño adaptable a móvil y escritorio, con fondo oscuro, texto claro, portadas grandes y secciones horizontales como referencia inicial.
- Navegación accesible entre inicio, búsqueda, catálogo, biblioteca y cuenta.
- Reproductor con play/pausa, anterior/siguiente, progreso, cola, aleatorio y repetición, sujeto a las capacidades y condiciones del proveedor.
- Mantener la reproducción al navegar dentro de la aplicación.
- Gestionar estados de carga, errores y canciones o videos no disponibles.
- Usar identidad y recursos propios o autorizados.
- El enlace denominado chat en la referencia llevaba a contacto; no se ha confirmado mensajería en tiempo real ni se incluye como requisito.

### Arquitectura propuesta

- Next.js, React y TypeScript para la aplicación, validando su encaje con una plantilla portable y el despliegue en Netlify.
- Tailwind CSS e iconos Lucide como base visual propuesta.
- Componente compartido y estado global para el reproductor persistente.
- Supabase como propuesta para PostgreSQL, autenticación y permisos por usuario; usar un proyecto de datos independiente de BetLog.
- Búsqueda inicial en PostgreSQL para el catálogo propio y conexión al proveedor cuando proceda; evaluar un motor especializado solo si el volumen lo justifica.
- Integraciones y operaciones privadas en servidor o funciones compatibles con Netlify. Proteger las claves que deban ser privadas y restringir las claves públicas según su uso.
- No alojar audio en la primera versión si toda la reproducción procede del reproductor integrado de YouTube.
- Evaluar almacenamiento de objetos y CDN únicamente para archivos propios autorizados que lo necesiten.
- No usar IA como dependencia necesaria de la primera versión; comenzar con selección editorial, tendencias e historial.

### Datos y administración

- Modelar usuarios, artistas, álbumes, canciones, identificadores del proveedor, fuentes de reproducción, playlists, elementos de playlists, favoritos privados e historial.
- Los favoritos privados de la biblioteca son distintos de los likes sociales excluidos del alcance.
- Panel de administración para gestionar secciones del inicio, contenido destacado, enlaces rotos y reportes de contenido no disponible.
- Actualización programada del catálogo cuando el proveedor y el despliegue lo permitan, con control de duplicados y disponibilidad.
- Gestionar permisos de biblioteca y playlists por propietario.

### Seguridad, operación y verificación

- Límites de solicitudes, control de cuotas de APIs y protección de cuentas.
- Copias de seguridad, seguimiento de errores y control del consumo de servicios.
- SEO de páginas públicas y métricas de uso apropiadas al proyecto.
- Verificar móvil y escritorio, búsqueda, reproducción real, navegación persistente, biblioteca y manejo de fallos del proveedor.
- Respetar las condiciones de YouTube, incluidos visibilidad del reproductor y tratamiento de anuncios. No prometer reproducción en segundo plano, descargas o ausencia de anuncios de YouTube sin soporte permitido y verificado.
- Antes de escribir código de Next.js, leer la documentación local correspondiente en node_modules/next/dist/docs/, conforme a AGENTS.md.

### Fases previstas

1. Consultar la referencia de Fekamovies cuando esté disponible y definir el formato portable de la plantilla.
2. Validar la integración con YouTube usando un catálogo pequeño: búsqueda, selección y reproducción real.
3. Construir inicio, buscador, fichas de catálogo y reproductor persistente.
4. Incorporar cuenta opcional, biblioteca, favoritos privados, playlists e historial.
5. Completar administración, SEO, métricas, verificaciones y despliegue inicial en Netlify.
6. Incorporar las recomendaciones personalizadas descritas abajo; su fase concreta queda por definir. Evaluar posteriormente PWA. Descargas, letras sincronizadas y chat quedan fuera de la primera versión; comunidad y publicidad propia permanecen excluidas por decisión del usuario.

### Información por concretar durante la preparación

- Nombre confirmado: Feka Music. Público y países objetivo pendientes.
- Presupuesto de servicios y tráfico esperado; distinguir desarrollo, infraestructura y contenido.
- Supabase confirmado y conectado para Feka Music. Pendientes Netlify y la clave de búsqueda de YouTube.
- El dominio propio se decidirá posteriormente y no bloquea el inicio.
- No presupuestar como disponible el catálogo completo de Spotify o Deezer por el hecho de que la referencia utilice sus portadas.
- La elección actual es YouTube; las alternativas de Spotify o catálogo propio/licenciado quedan como contexto del análisis, no como integraciones adicionales obligatorias.

## Lógica acordada para ahorrar consultas de YouTube

Guardada por petición del usuario el 23 de octubre de 2026 para implementación posterior. Esta sección registra decisiones; no implica que estén implementadas en el prototipo.

- Mantener YouTube como proveedor de búsqueda y reproducción.
- Ejecutar las búsquedas a través de una función de Netlify, con almacenamiento compartido de resultados en servidor. Elegir el servicio de almacenamiento al implementar; no depender únicamente de localStorage ni de la memoria temporal de una función.
- Consultar primero los resultados compartidos vigentes y llamar a YouTube solo cuando no exista una respuesta reutilizable.
- Normalizar mayúsculas y espacios para reutilizar consultas equivalentes. La clave de caché debe incluir también filtros, idioma/región cuando afecten la consulta, orden y página, para no mezclar resultados distintos.
- Agrupar solicitudes simultáneas idénticas en una única consulta al proveedor.
- Consultar al pulsar Enter o el botón Buscar; no enviar solicitudes por cada letra. Las sugerencias durante la escritura usarán datos ya disponibles.
- Cargar páginas adicionales solo cuando el usuario lo solicite.
- Reproducir videos ya identificados sin volver a buscarlos. Priorizar después la importación de playlists y enlaces de YouTube para obtener identificadores sin búsquedas individuales; no se acuerda soporte universal para otras plataformas.
- Establecer caducidad para los resultados y actualizar o eliminar los datos de API correspondientes dentro del plazo permitido por YouTube (actualmente, como máximo 30 días para estos datos), pudiendo usar un plazo menor. Verificar las políticas vigentes al implementar y mantener los datos y la disponibilidad actualizados.
- Proteger y restringir las credenciales; aplicar límites de solicitudes y evitar reintentos repetidos cuando la cuota esté agotada.
- Registrar solicitudes reales al proveedor, aciertos de caché y errores. El contador interno será orientativo; comprobar cuota y consumo efectivos en Google Cloud. Prever aviso al 80 % y un estado claro cuando se agote la cuota.
- Los límites se comparten entre todos los usuarios del proyecto; importar playlists o iniciar sesión no crea una cuota independiente para cada persona.
- El ahorro depende de la repetición: 50 búsquedas idénticas con la misma configuración y una respuesta vigente pueden requerir una sola consulta; 50 búsquedas distintas sin resultados guardados pueden requerir 50.
- No fijar cuotas en el código a partir de esta conversación: verificar la asignación real del proyecto al integrar y permitir configurar los umbrales.

Referencia de almacenamiento: https://developers.google.com/youtube/terms/developer-policies

## Recomendaciones por gustos y descubrimiento de artistas

Requisito añadido por el usuario el 23 de octubre de 2026 para desarrollo posterior; todavía no implementado.

- Recomendar canciones similares a los géneros que escucha cada usuario, de distintos artistas, tanto conocidos como poco conocidos. La popularidad no debe ser un requisito para aparecer.
- Adaptar las recomendaciones conforme cambien sus gustos y admitir varios géneros por persona, sin encasillarla en uno solo.
- Propuesta inicial de señales: canciones escuchadas durante un tiempo significativo o completadas, repeticiones, favoritos privados y saltos frecuentes. Un clic aislado no bastará para asumir una preferencia; ajustar y validar estas señales al implementar.
- Combinar afinidad de género y estilo con variedad de artistas y descubrimiento. Evitar que los más populares monopolicen las recomendaciones, así como repeticiones constantes del mismo artista o canción.
- Mostrar una sección de descubrimiento, por ejemplo «Porque escuchas…» y «Descubre nuevos artistas», con explicaciones basadas en señales reales disponibles.
- Mantener opcional el registro: para visitantes, ofrecer personalización local en el dispositivo, con opción de borrar o reiniciar sus gustos; con cuenta, prever sincronización del historial y preferencias respetando sus permisos.
- Para usuarios sin historial, permitir elegir géneros opcionalmente y ofrecer una selección variada de inicio.
- Reutilizar datos y candidatos vigentes para no disparar búsquedas de YouTube por cada recomendación mostrada. Verificar disponibilidad y evitar recomendar elementos que no puedan reproducirse.
- Pendiente técnico: elegir y validar una fuente permitida de géneros y similitud. No asumir que la API de YouTube entrega géneros musicales precisos ni recomendaciones personalizadas listas para usar. No prometer cobertura de todos los artistas; dependerá de los datos y videos disponibles.
- Empezar con reglas de afinidad y diversidad; no se requiere IA como dependencia de esta función.

## Panel de video: minimizar y cerrar
- Implementado en el prototipo: botones −/+ junto a la X y eliminación de la etiqueta YouTube duplicada de la cabecera.
- Minimizar mantiene una tarjeta flotante con el video visible y la reproducción continua, tanto en escritorio como en móvil, en claro y oscuro. X pausa y cierra; se puede reabrir desde la barra.
- La petición de escuchar con video totalmente oculto en móvil queda limitada por las condiciones de YouTube: no se implementa ese modo. Se conserva el reproductor oficial y sus marcas.


## Avance confirmado: Feka Music y Supabase

Organización fekamusic y proyecto xxhuqdspehyxobajoleh verificados. Proyecto renombrado a Feka Music; no corresponde a la base de FekaMovies. Se implementó la base local de recomendaciones por géneros y escuchas, manteniendo el catálogo de muestra. Supabase conectado para acceso opcional por correo y biblioteca privada con guardar/cargar explícitos. Caché y contador de búsquedas creados; búsqueda remota aún pendiente de clave y activación. Estado, verificaciones y pendientes en design/FEKA-MUSIC-ESTADO.md. Letras y karaoke permanecen pospuestos.


Correo de confirmación: usar marca Feka Music, asunto y diseño propios. Plantilla preparada en design/feka-music-email. El usuario aún no tiene dominio; queda pendiente conectar SMTP de dominio verificado. No contratar dominio ni servicios de pago sin autorización.
