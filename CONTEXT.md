# Contexto del proyecto (para una IA)

> Pega este archivo al inicio de la conversación. Resume qué es la página, cómo está hecha y qué falta.

## Qué es
Página web estática, **"Elige tu campeón"**: el usuario marca campeones de *League of Legends*
(haciendo clic en sus íconos) y un juego de azar elige uno por él. Es una adaptación de una página
genérica de "elige por mí" (texto libre → 9 juegos), ahora **solo para campeones de LoL**.
Idioma de la interfaz y del código: **español**. Publicada con **GitHub Pages**.

## Stack y reglas
- HTML + CSS + **JavaScript puro ES5** (`var`, funciones, IIFE). **Sin frameworks, npm ni build.** Mantén ese estilo.
- Los datos se cargan con `fetch`, así que hay que servir la carpeta (`python -m http.server`); con doble clic no funciona.
- Rutas **relativas** siempre (Pages sirve en un subdirectorio). Los nombres de archivo distinguen mayúsculas.
- Los datos son **fijos y de solo lectura**: la app nunca los edita.

## Archivos
```
index.html            página única: selector arriba, pestañas de juegos y <section id="s-X"> abajo
styles.css            tokens CSS (--bg, --card, --text, --muted, --accent, --line), modo oscuro automático
core.js               objeto global `Core`: estado, datos, selección, localStorage, utilidades, pestañas
games.js              un IIFE por juego; registra cada uno con Core.registerGame
data/champions.json   173 campeones: { id, name, roles[], icon }   (id = slug "kaisa"; icon = nombre de archivo)
img/champions/        173 íconos .webp 128×128, nombre = campo `icon` (p. ej. "Kai'Sa.webp")
champions.csv        dataset original (raíz): Champion, Region, Role(s), Icon, IconFile. NO se usa en ejecución;
                      tiene `Region`, que champions.json aún no incluye. También darkins.csv y yordles.csv (listas por especie)
icons/                íconos originales del dataset (idénticos a img/champions/; duplicado)
```
Rutas de imagen: `Core.iconSrc(champ)` aplica `encodeURIComponent` (hay nombres con `'`, `&`, espacios y `.`).

## Cómo funciona
1. `core.js` carga `champions.json`, construye la cuadrícula (íconos + nombre), el buscador y los filtros por rol.
2. La selección es `Core.state.sel` (mapa id→true) y se guarda sola en `localStorage` (`lol-picker:selection`).
3. Derivados que **leen los juegos**: `Core.state.opts` (nombres) y `Core.state.champs` (objetos), mismo orden, orden alfabético.
4. Flujo de cada jugada: `Core.ok()` → `Core.setBusy(true)` → animación → `Core.confetti()` + `Core.showRes(nombre, champ)` → `Core.setBusy(false)`.
   El ganador se sortea con `Core.randInt` (crypto, sin sesgo); `showRes` muestra ícono, nombre y roles.
5. Un juego se registra con `Core.registerGame(id, { preview, onShow?, name?, max? })`.
   Si hay más de `max` campeones marcados, `Core` desactiva su botón y muestra un aviso con `name` (no se sortean "finalistas": se bloquea).
6. Añadir un juego = pestaña `.tab[data-v]` + `<section id="s-<id>">` en `index.html` + IIFE en `games.js`. Las pestañas se leen del DOM.

## Juegos (id → estado)
| id | Juego | Máximo de campeones |
|---|---|---|
| c | Carrete | sin límite (con n>12 gira un tiempo fijo) |
| w | Ruleta | sin límite (con n>36 no dibuja nombres en los sectores) |
| p | Plinko | 20 |
| g | Gachapón | sin límite (el panel final muestra el retrato) |
| s | Tragaperras | sin límite (con n>20 giros de duración fija) |
| r | Carrera | 16 |
| k | Cartas | 16 |

## Pendiente / ideas
- **Batalla** (esferas que pelean; idea: usar los roles de LoL como clases) y **Blackjack**: no están en esta versión; su código original está en la carpeta local `paginaDesicionesOG` (fuera del repo). Usarían `max` + `name` como los demás.
- Íconos dentro de Carrete, Ruleta y Tragaperras (hoy solo texto).
- Roles en español (el CSV los trae en inglés).
- Filtros por **región** y por especie (darkin, yordle): los datos ya existen en `champions.csv`, `darkins.csv` y `yordles.csv`; habría que añadir `region` a `champions.json`.
- Listas con nombre guardadas en `localStorage`, y selección compartible por enlace (`#jinx,teemo`): propuestas, no implementadas.

## Decisiones ya tomadas (no reabrir sin motivo)
- JSON como única fuente de datos en ejecución (no CSV).
- Dos proyectos separados: el original de texto libre y este de LoL; no comparten código.
- Topes con bloqueo y aviso, no con sorteo de finalistas.
- Sin cookies ni backend; solo `localStorage`.

## Bugs/deuda conocidos
- Nombres de IDs cortos y crípticos heredados (`s-x`, `kc`, `kst`).
- Si cambian los datos, los ids guardados que ya no existan se ignoran (comportamiento deseado).

## Aviso
Proyecto de fans, no afiliado a Riot Games. Nombres e imágenes son de Riot Games, Inc.
