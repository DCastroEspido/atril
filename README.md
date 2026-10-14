# Atril

Tablaturas para practicar con banda. Atril dibuja la partitura y la tablatura, toca todas las
pistas a la vez (guitarra, bajo, batería, teclados, cuerdas) y deja practicar a otra velocidad
o repitiendo una sección en bucle. Es una PWA: se instala en el móvil o el ordenador y funciona
sin conexión.

## Qué hace

- **Biblioteca con buscador**: busca por título, autor, estilo o técnica (`palm mute`,
  `arpegio`…) y filtra por estilo y nivel.
- **Favoritas**: la ★ añade una canción al selector de la barra superior.
- **Reproductor**: mezclador por pista (ver en la partitura, silenciar, solo, volumen),
  velocidad del 25 % al 150 %, metrónomo y cuenta atrás.
- **Bucles**: por sección, por rango de compases o arrastrando sobre la partitura.
- **Importar**: abre archivos Guitar Pro (`.gp`, `.gpx`, `.gp5`, `.gp4`, `.gp3`) y MusicXML.
  Se guardan en el navegador, en «Mis archivos». Instalada en Chrome o Edge, Atril también
  abre esos archivos desde el sistema operativo.

El buscador busca primero en la biblioteca local: el catálogo incluido (piezas tradicionales y
ejercicios propios) y los archivos importados. Debajo ofrece la misma búsqueda en Songsterr,
Ultimate Guitar y 911Tabs, que se abre en su web. Atril no lee sus resultados ni carga sus
tablaturas: Songsterr no ofrece una API pública (la de su web no admite llamadas desde otras
páginas) y su política reserva la velocidad, los bucles y el solo de pistas a su suscripción.
Para practicar una de esas canciones aquí, descarga su archivo Guitar Pro e impórtalo.

## Desarrollo

Requiere Node 24.

```sh
npm install
npm run dev        # servidor de desarrollo
npm run check      # tipos, lint, formato y tests
npm run build      # build de producción en dist/, con service worker
npm run preview    # sirve dist/ para probar la PWA (instalación, modo sin conexión)
```

El service worker solo existe en el build de producción: para probar la instalación o el modo
sin conexión usa `npm run build && npm run preview`.

## Estructura

```
src/
  catalog/            canciones incluidas, escritas en alphaTex
    songs/            una canción por archivo
    theory.ts         notas, afinaciones y formas de acordes para escribirlas
    tex.ts            defineSong(): monta el alphaTex (compás, secciones, pistas)
    catalog.test.ts   valida cada canción con el parser de alphaTab
  features/
    library/          buscador, lista y tipos de la biblioteca
    favorites/        favoritas y su selector
    player/           controlador de alphaTab y la interfaz del reproductor
    import/           lectura de archivos Guitar Pro / MusicXML, arrastrar y soltar
  storage/            preferencias (localStorage) y archivos importados (IndexedDB)
  pwa/                aviso de versión nueva e instalación
  ui/                 iconos y avisos
  styles/             tokens de diseño (tema claro y oscuro) y estilos
```

`features/player/controller.ts` es la única pieza que habla con alphaTab. Expone el estado
como instantáneas a las que React se suscribe con `useSyncExternalStore`; la posición de
reproducción va aparte porque cambia muchas veces por segundo.

## Añadir una canción al catálogo

1. Crea `src/catalog/songs/<id>.ts` con `defineSong({...})`. Copia una existente como base: los
   compases se escriben en [alphaTex](https://alphatab.net/docs/alphatex/introduction) y las
   utilidades de `theory.ts` colocan notas y acordes en el mástil.
2. Añádela a `CATALOG` en `src/catalog/index.ts`.
3. `npm test` comprueba que todos los compases suman lo que marca el compás, que ninguna
   pista pide dos notas en la misma cuerda y que las secciones están marcadas.

Incluye solo música de dominio público o propia.

## Despliegue

`.github/workflows/deploy.yml` publica en GitHub Pages en cada push a `main`. La variable
`BASE` ajusta las rutas al subdirectorio del repositorio (`/atril/`). En otro hosting
estático, `npm run build` sin `BASE` sirve la app desde la raíz.

## Iconos

Se generan a partir de `public/favicon.svg` con `npm run icons`; los PNG resultantes están en
el repositorio.

## Créditos

- [alphaTab](https://alphatab.net) (MPL-2.0) dibuja y reproduce las partituras.
- Fuente musical Bravura (SIL OFL) y banco de sonidos SONiVOX, incluidos en alphaTab.
