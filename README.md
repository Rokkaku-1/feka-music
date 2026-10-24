# Feka Music

Plantilla web musical independiente en HTML, CSS y JavaScript, con búsqueda y reproducción de YouTube, cuenta opcional de Supabase, instalación PWA y backend privado en Netlify.

Web publicada: https://feka-music.netlify.app

## Instalar y ejecutar

Requisitos: Git, Node.js 22 o posterior y npm. No es necesario instalar Next.js, React ni un servidor de base de datos local.

```sh
git clone https://github.com/Rokkaku-1/feka-music.git
cd feka-music
npm run setup
npm start
```

Abrir http://localhost:4186/. Sin credenciales se puede explorar el diseño y el catálogo de muestra; la búsqueda real, tendencias y radio necesitan la clave privada de YouTube. La cuenta necesita Supabase configurado.

Para habilitar las integraciones y reutilizar la plantilla, seguir [Instalación completa](docs/INSTALACION.md). Para publicarla, seguir [Despliegue en Netlify](docs/DESPLIEGUE.md).

## Funciones disponibles

- Escucha sin registro; favoritos y playlists en el navegador.
- Inicio de sesión y guardado/carga manual de la biblioteca en Supabase.
- Búsqueda explícita, caché compartida de 24 horas y presupuesto diario.
- Tendencias musicales de Perú, Estados Unidos y Corea del Sur.
- Radio que conserva la canción inicial como referencia y prioriza otros canales.
- Reproductor con video de YouTube, cola, volumen y continuación automática.
- Diseño adaptable con modo claro/oscuro, Halloween en octubre y Navidad en diciembre.
- PWA con iconos, instalación y pantalla sin conexión; la música requiere internet.

## Comandos

| Comando | Resultado |
| --- | --- |
| `npm run setup` | Instala las dependencias fijadas de la aplicación. |
| `npm start` | Sirve la web y la API de desarrollo en localhost:4186. |
| `npm run build` | Genera únicamente los archivos públicos en design/sonora-prototype/dist. |
| `npm test` | Compila y ejecuta las diez pruebas automatizadas. |
| `npm run audit` | Revisa las dependencias de producción. |

## Estructura

```text
docs/                           Instalación, despliegue y operación
design/sonora-prototype/         Plantilla y dependencias fijadas
  server/                       Lógica privada del proveedor
  netlify/functions/            API y limpieza programada
  supabase/                     Esquema SQL y verificación con rollback
  vendor/                       SDK oficial Supabase y licencia
design/sonora-preview-server.mjs Servidor de desarrollo
design/feka-music-*.test.mjs     Pruebas automatizadas
design/feka-music-email/         Plantilla de confirmación y vista previa
design/FEKA-MUSIC-SEGURIDAD.md   Revisión de seguridad y evidencia
design/FEKA-MUSIC-ESTADO.md      Historial de decisiones y estado
REQUISITOS.md                   Requisitos registrados del producto
```

El nombre histórico `sonora-prototype` se conserva para no romper rutas. La aplicación y su marca son Feka Music. Los documentos de estado contienen antecedentes; el estado vigente y los pendientes se detallan en [Operación](docs/OPERACION.md).

## Seguridad y límites

Las claves privadas no están en este repositorio. El frontend solo contiene configuración publicable de Supabase; las credenciales de YouTube y de servidor Supabase se guardan localmente en `design/.private/` o en las variables privadas de Netlify. Solo `dist/` se sirve como contenido estático.

La revisión incluyó diez pruebas aprobadas, auditoría de dependencias, validación de entradas, comprobación de acceso anónimo a Supabase, cabeceras de seguridad y límite por IP. Esto no constituye una garantía de ausencia de vulnerabilidades. Ver [informe](design/FEKA-MUSIC-SEGURIDAD.md).

YouTube puede mostrar anuncios y restringir videos. No se extrae audio ni se ofrece reproducción oculta, en segundo plano o sin conexión. No hay ecualizador de bandas real para el iframe. Letras, importación de playlists, SMTP personalizado y la prueba completa de registro/correo entre cuentas reales están pendientes.

Las portadas y canciones de muestra no tienen autorización comercial verificada; deben revisarse o sustituirse antes de una explotación comercial. La licencia del SDK de terceros se conserva en vendor/SUPABASE-LICENSE. No se otorga una licencia de redistribución del código propio por incluirlo en este repositorio privado.
