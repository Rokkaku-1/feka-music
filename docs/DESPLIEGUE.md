# Despliegue en Netlify

## Desde GitHub

1. En Netlify, importar el repositorio privado Rokkaku-1/feka-music y seleccionar main. Para la web ya existente, vincular su proyecto Feka Music en lugar de crear un duplicado. No seleccionar FekaMovies.
2. Configurar **Base directory: design/sonora-prototype**. Netlify debe leer el netlify.toml de esa carpeta.
3. Confirmar comando de build `node build.mjs`, Publish directory `dist` y Functions directory `netlify/functions`, relativos a la base. Utilizar Node.js 22 o posterior.
4. Añadir YOUTUBE_API_KEY, SUPABASE_URL y SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY como variables privadas disponibles para Functions. Añadir YOUTUBE_DAILY_SEARCH_LIMIT=90 o el presupuesto aprobado para esa instalación.
5. Desplegar y comprobar /api/music, búsqueda, tendencias y reproducción por HTTPS. No publicar la raíz del repositorio ni toda la carpeta fuente.

El repositorio no vincula automáticamente Netlify con GitHub. Esa vinculación es una configuración separada; el despliegue existente continúa operativo aunque no esté activada.

## Desde CLI

Con Netlify CLI autenticada y autorizada para el equipo correcto:

```sh
cd design/sonora-prototype
npm ci
npx netlify-cli login
npx netlify-cli link
node build.mjs
npx netlify-cli deploy --dir dist --functions netlify/functions --no-build
```

La primera publicación es una vista previa. Una vez revisada:

```sh
npx netlify-cli deploy --prod --dir dist --functions netlify/functions --no-build
```

No se incluye .netlify/state.json: cada instalación debe vincular su sitio conscientemente. No poner claves en parámetros del comando ni en el historial del terminal; usar las variables privadas de Netlify.

## Comprobación posterior

- HTTPS y cabeceras CSP, HSTS, nosniff y X-Frame-Options.
- /server/, /supabase/, /.env, README.md y archivos de configuración no accesibles como contenido estático.
- /api/music rechaza métodos distintos de GET y llamadas sin X-Feka-Search: 1.
- Búsqueda real, reproducción y continuación automática; una búsqueda repetida usa la caché compartida.
- SDK Supabase local carga correctamente; diálogo de cuenta disponible.
- Manifest, service worker e iconos PWA accesibles. PWA requiere navegador compatible y HTTPS; audio sin conexión no implementado.
- Supabase usa la URL pública correcta y redirecciones exactas. Confirmación de correo probada con SMTP antes de abrir registros al público.

## Mover a otro dominio

Actualizar Site URL/redirecciones en Supabase, configuración de proveedores que dependan del dominio y la identidad PWA si procede. Mantener el backend en el mismo origen o implementar una política explícita de orígenes: la API de producción actual exige mismo origen. El almacenamiento del navegador está separado por origen; ofrecer una copia de biblioteca o cargarla desde la cuenta antes del cambio.
