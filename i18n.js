/* ============================================================
   i18n.js — Textos en español e inglés
   - Texto estático: atributos data-i18n (contenido) y data-i18n-ph (placeholder) en index.html
   - Texto dinámico: I18N.t('clave', { var: valor })
   Debe cargarse antes que core.js
   ============================================================ */

var I18N = (function () {
  'use strict';

  var LANG_KEY = 'lol-picker:lang';

  var dict = {
    es: {
      'title': '⚔️ Elige tu campeón',
      'sub': 'Marca los campeones de League of Legends que quieras y deja que el azar decida.',
      'search': 'Buscar campeón…',
      'selVisible': 'Marcar visibles',
      'clear': 'Limpiar',
      'noMatch': 'Ningún campeón coincide con la búsqueda.',
      'all': 'Todos',
      'grp.role': 'Rol',
      'grp.lane': 'Línea',
      'grp.region': 'Región',
      'grp.species': 'Especie',

      'cnt.load': 'Cargando campeones…',
      'cnt.err': 'No se pudieron cargar los campeones ({msg}). Abre la página desde un servidor (GitHub Pages o Live Server), no con doble clic.',
      'cnt.0': 'Marca al menos 2 campeones.',
      'cnt.1': '1 campeón seleccionado · marca al menos 2.',
      'cnt.n': '{n} campeones seleccionados.',
      'limit': '⚠️ {name} solo está disponible con {max} campeones o menos. Tienes {n} seleccionados: quita {d} para usarlo.',
      'result': 'Resultado: ',

      'tab.c': '🎰 Carrete',
      'tab.w': '🎡 Ruleta',
      'tab.p': '🔴 Plinko',
      'tab.g': '✨ Gachapón',
      'tab.s': '🍒 Tragaperras',
      'tab.r': '🏁 Carrera',
      'tab.k': '🎴 Cartas',
      'tab.b': '⚔️ Batalla',
      'tab.j': '🃏 Blackjack',

      'name.p': 'El Plinko',
      'name.r': 'La Carrera',
      'name.k': 'El juego de Cartas',
      'name.b': 'La Batalla',
      'name.j': 'El Blackjack',

      'go.c': 'Elegir',
      'go.w': 'Girar ruleta',
      'go.p': 'Soltar bola',
      'go.g': '✨ Hacer un deseo',
      'go.s': 'Jalar palanca',
      'go.r': '¡Largada!',
      'go.k': 'Barajar',
      'go.b': '¡A pelear!',
      'go.j': 'Repartir',

      'reelIdle': '¿QUIÉN SERÁ?',
      'wNote': 'Con tantos campeones los nombres no caben en la ruleta; el resultado se muestra al final.',
      'plinkoMax': 'Disponible con {max} campeones o menos',
      'wish': 'Haz un deseo',
      'champion': '★ ¡CAMPEÓN! ★',
      'sHint': 'Cada carrete sale al azar por separado. Gana el campeón que aparezca en 2 o más carretes; si no hay aciertos, se vuelve a tirar.',
      'slotFail': 'Intento {k}: sin aciertos, giro extra…',
      'hits': '{m} aciertos',
      'attempt': 'intento {n}',
      'rHint': 'Todos corren a la vez con saltos al azar. El primero en cruzar la meta gana.',
      'kHint': 'Las cartas se muestran, se barajan boca abajo y tú eliges una. Lo que hay detrás lo decide el azar.',
      'pickCard': 'Elige una carta 👆',
      'bHint': 'Los campeones chocan entre sí y se hacen daño según su rol (los Vanguard aguantan, los Assassin pegan fuerte). El último en pie gana.',
      'jHint': 'Cada campeón juega su mano y pide carta hasta llegar a 17. Gana quien más se acerque a 21 sin pasarse; si todos se pasan, el que menos se pasó.',
      'legal': 'Proyecto de fans, no afiliado a Riot Games. League of Legends y sus campeones son marcas de Riot Games, Inc.',

      'tag.Juggernaut': 'Juggernaut', 'tag.Burst': 'Ráfaga', 'tag.Assassin': 'Asesino',
      'tag.Marksman': 'Tirador', 'tag.Vanguard': 'Vanguardia', 'tag.Diver': 'Asaltante',
      'tag.Skirmisher': 'Hostigador', 'tag.Battlemage': 'Mago de batalla',
      'tag.Specialist': 'Especialista', 'tag.Catcher': 'Capturador', 'tag.Warden': 'Guardián',
      'tag.Artillery': 'Artillero', 'tag.Enchanter': 'Encantador',
      'tag.Top': 'Superior', 'tag.Mid': 'Central', 'tag.Jungle': 'Jungla',
      'tag.Support': 'Soporte', 'tag.Bottom': 'Inferior'
    },

    en: {
      'title': '⚔️ Choose your champion',
      'sub': 'Mark the League of Legends champions you want and let chance decide.',
      'search': 'Search champion…',
      'selVisible': 'Mark visible',
      'clear': 'Clear',
      'noMatch': 'No champion matches your search.',
      'all': 'All',
      'grp.role': 'Role',
      'grp.lane': 'Lane',
      'grp.region': 'Region',
      'grp.species': 'Species',

      'cnt.load': 'Loading champions…',
      'cnt.err': 'Could not load the champions ({msg}). Open the page from a server (GitHub Pages or Live Server), not by double-clicking.',
      'cnt.0': 'Mark at least 2 champions.',
      'cnt.1': '1 champion selected · mark at least 2.',
      'cnt.n': '{n} champions selected.',
      'limit': '⚠️ {name} is only available with {max} champions or fewer. You have {n} selected: remove {d} to use it.',
      'result': 'Result: ',

      'tab.c': '🎰 Reel',
      'tab.w': '🎡 Wheel',
      'tab.p': '🔴 Plinko',
      'tab.g': '✨ Gacha',
      'tab.s': '🍒 Slots',
      'tab.r': '🏁 Race',
      'tab.k': '🎴 Cards',
      'tab.b': '⚔️ Battle',
      'tab.j': '🃏 Blackjack',

      'name.p': 'Plinko',
      'name.r': 'The Race',
      'name.k': 'The Cards game',
      'name.b': 'The Battle',
      'name.j': 'Blackjack',

      'go.c': 'Pick',
      'go.w': 'Spin the wheel',
      'go.p': 'Drop the ball',
      'go.g': '✨ Make a wish',
      'go.s': 'Pull the lever',
      'go.r': 'Go!',
      'go.k': 'Shuffle',
      'go.b': 'Fight!',
      'go.j': 'Deal',

      'reelIdle': 'WHO WILL IT BE?',
      'wNote': "With this many champions the names don't fit on the wheel; the result is shown at the end.",
      'plinkoMax': 'Available with {max} champions or fewer',
      'wish': 'Make a wish',
      'champion': '★ CHAMPION! ★',
      'sHint': 'Each reel spins randomly on its own. The champion that shows up on 2 or more reels wins; with no match, it spins again.',
      'slotFail': 'Attempt {k}: no match, extra spin…',
      'hits': '{m} matches',
      'attempt': 'attempt {n}',
      'rHint': 'Everyone runs at once with random jumps. The first to cross the finish line wins.',
      'kHint': 'The cards are shown, shuffled face down, and you pick one. What is behind it is decided by chance.',
      'pickCard': 'Pick a card 👆',
      'bHint': 'Champions crash into each other and deal damage based on their role (Vanguards tank, Assassins hit hard). Last one standing wins.',
      'jHint': 'Each champion plays their own hand and draws until reaching 17. Whoever gets closest to 21 without going over wins; if everyone busts, the one who went over the least.',
      'legal': 'Fan project, not affiliated with Riot Games. League of Legends and its champions are trademarks of Riot Games, Inc.',

      'tag.Juggernaut': 'Juggernaut', 'tag.Burst': 'Burst', 'tag.Assassin': 'Assassin',
      'tag.Marksman': 'Marksman', 'tag.Vanguard': 'Vanguard', 'tag.Diver': 'Diver',
      'tag.Skirmisher': 'Skirmisher', 'tag.Battlemage': 'Battlemage',
      'tag.Specialist': 'Specialist', 'tag.Catcher': 'Catcher', 'tag.Warden': 'Warden',
      'tag.Artillery': 'Artillery', 'tag.Enchanter': 'Enchanter',
      'tag.Top': 'Top', 'tag.Mid': 'Mid', 'tag.Jungle': 'Jungle',
      'tag.Support': 'Support', 'tag.Bottom': 'Bottom'
    }
  };

  function detect() {
    try {
      var v = localStorage.getItem(LANG_KEY);
      if (v && dict[v]) return v;
    } catch (e) { /* sin almacenamiento: se ignora */ }
    return /^en/i.test(navigator.language || '') ? 'en' : 'es';
  }

  var lang = detect();

  // Texto de la clave en el idioma activo ({var} se sustituye); cae al español y luego a la clave
  function t(key, vars) {
    var s = dict[lang][key];
    if (s == null) s = dict.es[key];
    if (s == null) return key;
    return vars ? s.replace(/\{(\w+)\}/g, function (m, x) {
      return vars[x] !== undefined ? vars[x] : m;
    }) : s;
  }

  // Etiqueta traducida de un rol o línea (si no hay traducción, el mismo texto: regiones, especies)
  function tag(x) {
    var s = dict[lang]['tag.' + x];
    return s == null ? x : s;
  }

  // Aplica el idioma activo al texto estático del HTML
  function apply() {
    document.documentElement.lang = lang;
    document.title = t('title').replace(/^\S+\s/, '');

    [].forEach.call(document.querySelectorAll('[data-i18n]'), function (e) {
      e.textContent = t(e.getAttribute('data-i18n'));
    });
    [].forEach.call(document.querySelectorAll('[data-i18n-ph]'), function (e) {
      e.placeholder = t(e.getAttribute('data-i18n-ph'));
    });
    [].forEach.call(document.querySelectorAll('#lang button'), function (b) {
      b.classList.toggle('on', b.dataset.l === lang);
    });
  }

  function set(l) {
    if (!dict[l] || l === lang) return false;
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* se ignora */ }
    apply();
    return true;
  }

  return { t: t, tag: tag, apply: apply, set: set };
})();
