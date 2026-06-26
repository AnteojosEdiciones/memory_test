# Memory Educativo LSC

Juego de memoria en Lengua de Señas Colombiana (LSC) para niños de 4 a 6 años.
Hecho con HTML, CSS y JS, sin frameworks.

## Cómo se juega

12 cartas boca abajo (6 parejas). Tocás una, se da vuelta y suena la palabra.
Si las dos cartas son pareja aparece una frase y los botones para ver el video
en señas de cada palabra. Si no, se vuelven a tapar. Cuando juntás las
6 parejas sale la pantalla de felicitación.

### Parejas

- Casa + Familia → La familia está en casa.
- Biblioteca + Libro → El libro está en la biblioteca.
- Parque + Jugar → En el parque podemos jugar.
- Mercado + Fruta → En el mercado encontramos fruta.
- Colegio + Maleta → Llevo mi maleta al colegio.
- Río + Agua → El agua corre por el río.

## Estructura

```
index.html         estructura
css/estilos.css    estilos + animaciones
js/juego.js        logica
manifest.json      pwa
service-worker.js  cache offline
img/ audio/ lsc/   assets (faltan todavia)
```

## Correrlo

Lo más fácil es abrir el index.html en el navegador. Pero para que ande el
service worker (modo offline) hay que servirlo por http, ej:

```
python3 -m http.server 8000
```

y entrar a http://localhost:8000. Con file:// el SW no funciona.

## Notas

- Anda con teclado (Tab + Enter/Espacio).
- Tiene labels ARIA y región de anuncios para lectores de pantalla.
- Botones de mín 44px.
- Respeta "reducir movimiento" del sistema.
- Responsive: 2 columnas en mobile, 4 en tablet, 3 en desktop.

TODO: meter los svg, los mp3 y los videos en señas.
