# ⚔️ Elige tu campeón

Página web para que el azar elija por ti entre campeones de **League of Legends**.
Marca los campeones que quieras (con su ícono), elige un juego y deja que decida.

Es una página estática: HTML, CSS y JavaScript puro, sin dependencias ni proceso de compilación.

> ¿Vas a trabajar en el proyecto con una IA? Pásale [`CONTEXT.md`](CONTEXT.md): resume qué es, cómo está hecho y qué falta.

## Cómo se usa

1. **Elige campeones** en la cuadrícula: un clic los marca o desmarca. Puedes buscar por
   nombre, filtrar por rol y usar *Marcar visibles* / *Limpiar*.
2. **Elige un juego** en las pestañas y pulsa el botón principal.
3. El resultado muestra el ícono, el nombre y los roles del campeón elegido.

Tu selección se guarda automáticamente en el navegador (`localStorage`), así que sigue ahí
al cerrar y volver a abrir la página. Es por navegador y por dispositivo.

### Juegos

| Juego | Máximo de campeones |
|---|---|
| 🎰 Carrete | sin límite |
| 🎡 Ruleta | sin límite (con más de 36 no se muestran los nombres en los sectores) |
| ✨ Gachapón | sin límite |
| 🍒 Tragaperras | sin límite |
| 🔴 Plinko | 20 |
| 🏁 Carrera | 16 |
| 🎴 Cartas | 16 |

Si hay más campeones marcados que el máximo de un juego, su botón se desactiva y aparece
un aviso. Los topes se cambian en `games.js` (`MAX`, `RMAX` y `CMAX`).

## Estructura

```
index.html          página única
styles.css          estilos (tema claro/oscuro automático)
core.js             datos, selección, guardado, utilidades y pestañas
games.js            los juegos
data/champions.json lista de campeones (id, nombre, roles, ícono) — solo lectura
data/champions.csv  fuente original de los datos
img/champions/      íconos .webp de 128×128
```

Para añadir o corregir un campeón hay que editar `data/champions.json` y poner su ícono en
`img/champions/` con el mismo nombre que indica el campo `icon` (se distinguen mayúsculas
y minúsculas).

## Probar en local

Los campeones se cargan con `fetch`, así que **no funciona abriendo `index.html` con doble
clic**; hay que servir la carpeta:

```bash
python -m http.server 8000
```

y abrir <http://localhost:8000>. (También sirve la extensión *Live Server* de VS Code.)

## Publicar en GitHub Pages

1. Sube el repositorio a GitHub.
2. En **Settings → Pages**, elige *Deploy from a branch*, rama `main` y carpeta `/ (root)`.
3. Tras un minuto, la página estará en `https://<usuario>.github.io/<repositorio>/`.

Todas las rutas son relativas, por lo que funciona tanto en la raíz como en un subdirectorio.

## Datos e imágenes

La lista de campeones y sus roles proceden de la
[League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/List_of_champions) y los íconos de
[Data Dragon](https://ddragon.leagueoflegends.com/) (parche 16.19.1). Más detalles en
[`data/README-fuente.md`](data/README-fuente.md).

## Aviso legal

Proyecto de fans, no afiliado ni respaldado por Riot Games. *League of Legends* y los
nombres e imágenes de sus campeones son propiedad de Riot Games, Inc.
