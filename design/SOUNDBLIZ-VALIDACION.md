# Validación pública de Soundbliz

Fecha: 23 de octubre de 2026. Sitio: https://soundbliz.com/

## Evidencia observada

Se revisaron el DOM y el inventario de recursos cargados por el navegador.

| Componente | Evidencia | Alcance de la conclusión |
| --- | --- | --- |
| Reproducción de video | Iframe `https://www.youtube-nocookie.com/embed/sOnqjkJTMaA` con `enablejsapi=1`, título Michael Jackson - Thriller | Usa un reproductor incrustado de YouTube. Esto no demuestra el uso de YouTube Data API v3. |
| API del sitio | Recurso observado `https://soundbliz.com/api/v1/search/audio/998733/Michael%2520Jackson/Thriller` | El navegador consulta un endpoint propio relacionado con la resolución de audio. No se inspeccionó su respuesta ni su implementación interna. |
| Contenido del sitio | Recurso observado `https://soundbliz.com/api/v1/posts` con parámetros de paginación y homepage | El sitio dispone de una API propia para contenido. |
| Imágenes de Spotify | Imágenes desde `i.scdn.co`, `image-cdn-ak.spotifycdn.com`, `charts-images.scdn.co`, `pickasso.spotifycdn.com` | Usa imágenes alojadas en infraestructura de Spotify; no prueba acceso a Spotify Web API. |
| Imágenes de Deezer | Imágenes desde `cdn-images.dzcdn.net` y endpoints como `https://api.deezer.com/genre/132/image` | Usa recursos gráficos de Deezer, incluido su endpoint de imágenes de géneros. No demuestra consultas a su catálogo o reproducción. |
| Miniaturas de YouTube | Imágenes desde `i.ytimg.com` | Usa miniaturas de YouTube. |

## Límites

No se observó una llamada directa del navegador a YouTube Data API v3. El servidor podría consultarla u obtener metadatos de otras fuentes; no se puede determinar sin acceso al backend o evidencia pública adicional.

La búsqueda de Los Toribianitos abrió `/search/Los%20Toribianitos`, pero mostró “There was an issue loading this page / Por favor, inténtelo de nuevo más tarde”. Un reintento mantuvo el error. Esta prueba no permite determinar el proveedor de la búsqueda general ni concluir que el artista no esté en su catálogo.

La lectura independiente del JavaScript público fue bloqueada por una comprobación de Cloudflare. No se obtuvo ni analizó su código mediante esa descarga.

## Conclusión

Actualización aportada por el usuario: su captura de la búsqueda «los toribianitos» muestra resultados en Soundbliz, incluidos «Ronda de Navidad», «PoutPourri de Navidad», «Alegria, Alegria» y «Cholito Jesús», con artista, álbum, portada y duración. Queda confirmado que esa búsqueda devuelve resultados en su sesión. El error observado durante la prueba del agente no demuestra ausencia del artista ni un fallo general del buscador. La captura no permite identificar el proveedor de los metadatos ni comprobar la reproducción.

La implementación visible combina reproducción incrustada de YouTube, endpoints propios y recursos gráficos de Spotify y Deezer. No hay evidencia suficiente para afirmar que todo el catálogo y el buscador dependan únicamente de YouTube Data API, ni para afirmar que integra las APIs de catálogo de Spotify o Deezer.
