# Instalación de la plantilla

## 1. Preparar el equipo

Instalar Node.js 22 o posterior y Git. Clonar el repositorio privado con una cuenta que tenga acceso y ejecutar `npm run setup` desde su raíz. El lockfile de la aplicación fija las dependencias; no contiene las claves privadas.

## 2. Elegir la instalación

- Para mantener Feka Music existente, conservar su configuración publicable y usar sus credenciales privadas autorizadas.
- Para otra marca o web, crear un proyecto Supabase dedicado y una clave propia de YouTube. No reutilizar la base de Feka Music ni FekaMovies para una instalación independiente.

Crear la configuración local:

```powershell
New-Item -ItemType Directory -Force design/.private
Copy-Item design/sonora-prototype/.env.example design/.private/feka-music.env
```

En macOS/Linux:

```sh
mkdir -p design/.private
cp design/sonora-prototype/.env.example design/.private/feka-music.env
```

Editar ese archivo privado:

```dotenv
YOUTUBE_API_KEY=CLAVE_PROPIA_DE_YOUTUBE
SUPABASE_URL=https://REFERENCIA.supabase.co
SUPABASE_SECRET_KEY=CLAVE_SECRETA_DE_SERVIDOR
SUPABASE_SERVICE_ROLE_KEY=
YOUTUBE_DAILY_SEARCH_LIMIT=90
```

Usar una credencial de servidor: `SUPABASE_SECRET_KEY` o, alternativamente, la clave legacy en `SUPABASE_SERVICE_ROLE_KEY`. No es necesario rellenar ambas. La clave publicable no sustituye a la de servidor. Nunca copiar estas claves a config.js, capturas, documentos o commits. El límite es un presupuesto interno de operaciones nuevas, no una ampliación de la cuota de Google; comprobar la asignación real del proyecto en Google Cloud.

Sin Supabase privado, el servidor local puede usar una caché de archivos en design/.private; esa alternativa local no sustituye a la caché compartida necesaria en producción.

## 3. Preparar Supabase nuevo

En un proyecto vacío y exclusivo para la instalación, ejecutar `design/sonora-prototype/supabase/schema.sql` en el editor SQL. Crea biblioteca por usuario, caché privada, uso diario y reserva atómica. No es una migración idempotente: no repetirlo sobre una base existente ni en otro producto.

Ejecutar después `supabase/verify.sql`: comprueba políticas y utiliza una transacción con rollback. Revisar el script antes de usarlo. No desactivar RLS ni la confirmación de correo.

Editar `design/sonora-prototype/config.js` con la URL y clave **publicable** de ese proyecto. En `netlify.toml`, sustituir únicamente el host Supabase de la directiva CSP connect-src por el del nuevo proyecto. Mantener las demás restricciones.

En Authentication → URL Configuration:

- Site URL: la URL pública de la nueva web; para el Feka Music actual, https://feka-music.netlify.app.
- Redirect URLs: raíz e index.html de la URL pública y las rutas locales que se utilicen, por ejemplo http://localhost:4186/ y http://localhost:5500/index.html.
- Registrar direcciones exactas; evitar comodines en producción.

Activar Email/Password según el proyecto. Para una apertura pública completar SMTP con dominio verificado y probar confirmación, recuperación y acceso entre dos cuentas. La plantilla por sí sola no configura un remitente.

## 4. Preparar YouTube

En Google Cloud habilitar YouTube Data API v3 y crear la clave para el backend. Restringirla a esa API y revisar cuotas/alertas. No configurar una restricción de referentes web como si la clave se usara en el navegador: las consultas salen del servidor. Una restricción de IP necesita una salida de red fija compatible con el alojamiento elegido.

El iframe reproduce sin exponer esa clave. Los metadatos, búsqueda, radio y tendencias utilizan el backend. La cuenta de Google Cloud y su facturación son independientes de esta plantilla.

## 5. Ejecutar y comprobar

```sh
npm start
```

Abrir http://localhost:4186/. Reiniciar el proceso tras cambiar variables privadas. No abrir index.html mediante file://. Como alternativa, Live Server debe usar localhost:5500 o 127.0.0.1:5500 y mantener abierto el backend en 4186. Otros puertos/orígenes requieren adaptar y revisar la configuración del servidor y frontend.

Comprobar búsqueda, reproducción, pausa, siguiente, favoritos y playlists. Sin cuenta se guardan en ese navegador; borrarlo o cambiar de dispositivo no conserva la biblioteca. La cuenta ofrece guardar/cargar manualmente; no hay sincronización automática.

Ejecutar `npm test` y `npm run audit`. Si el sandbox de Windows rechaza reemplazar la caché temporal con EPERM, ejecutar las pruebas en una carpeta temporal propia autorizada; no desactivar protecciones del sistema:

```powershell
New-Item -ItemType Directory -Force design/.private
$env:TEMP = Join-Path (Get-Location) 'design/.private'
$env:TMP = $env:TEMP
npm test
```

## 6. Cambiar la marca y reutilizar

Revisar index.html, 404.html, offline.html, app.js, cloud.js, manifest.webmanifest y los iconos. Actualizar nombre, colores, iconos PWA y referencias del correo. Para instalaciones con cuentas distintas, cambiar también las claves de almacenamiento local `fekamusic.*` si comparten origen. Actualizar el nombre de la caché en sw.js al publicar recursos modificados y comprobar que no queden recursos antiguos instalados.

El backend de Netlify no se traslada automáticamente al subir solo los HTML a otro hosting. Implementar el endpoint /api/music, variables privadas, caché/presupuesto, limitación de peticiones y limpieza programada en el nuevo proveedor. No resolverlo exponiendo la clave en el navegador.
