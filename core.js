/* ============================================================
   core.js — Utilidades, datos de campeones, selección y orquestación
   ============================================================ */

var Core = (function () {
  'use strict';

  var DATA_URL = 'data/champions.json';
  var IMG_DIR = 'img/champions/';
  var STORE_KEY = 'lol-picker:selection';   // localStorage: ids de los campeones marcados

  // ---------- Helpers DOM ----------
  var $ = function (i) { return document.getElementById(i); };

  // ---------- Estado global compartido ----------
  // opts  : nombres de los campeones seleccionados (los juegos solo leen esto)
  // champs: objetos de campeón en el mismo orden que opts
  var state = {
    opts: [],
    champs: [],
    busy: false,
    tab: 'c',
    res: null,
    all: [],          // los 173 campeones (solo lectura)
    sel: {},          // id -> true
    role: '',         // filtro de rol activo ('' = todos)
    query: ''         // texto del buscador
  };

  var tiles = {};     // id -> elemento del grid

  // ---------- Registro de juegos ----------
  // Cada juego se registra con: { preview, onShow, max, name }
  //   - preview(): dibuja el estado "en reposo" al cambiar de pestaña o de selección
  //   - onShow():  opcional, se ejecuta al abrir la pestaña
  //   - max/name:  opcional; si hay más de `max` campeones seleccionados el juego
  //                se bloquea y se muestra un aviso con `name`
  var games = {};

  function registerGame(id, def) {
    games[id] = def || {};
  }

  // ---------- Utilidades numéricas / aleatorias ----------
  function randInt(n) {
    var c = window.crypto;
    if (!c || !c.getRandomValues) return Math.floor(Math.random() * n);
    var m = Math.floor(4294967296 / n) * n;
    var a = new Uint32Array(1);
    do { c.getRandomValues(a); } while (a[0] >= m);
    return a[0] % n;
  }

  function rnd() {
    return randInt(1000000) / 1000000;
  }

  function perm(n) {
    var a = [], i, j, x;
    for (i = 0; i < n; i++) a.push(i);
    for (i = n - 1; i > 0; i--) {
      j = randInt(i + 1);
      x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }

  // ---------- Utilidades de presentación ----------
  function col(i) {
    return 'hsl(' + ((i * 47) % 360) + ',65%,50%)';
  }

  function cv(v) {
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  }

  function trunc(s, n) {
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  // Ruta del icono (los nombres llevan espacios, apóstrofos, "&", ".")
  function iconSrc(c) {
    return IMG_DIR + encodeURIComponent(c.icon);
  }

  // Muestra el resultado. Si se pasa el campeón, añade su icono y roles.
  function showRes(t, champ) {
    var res = state.res;
    res.textContent = '';

    if (champ) {
      var img = document.createElement('img');
      img.className = 'rimg';
      img.src = iconSrc(champ);
      img.alt = '';
      res.appendChild(img);
    }

    res.appendChild(document.createTextNode('Resultado: '));
    var b = document.createElement('b');
    b.textContent = t;
    res.appendChild(b);

    if (champ) {
      var r = document.createElement('small');
      r.className = 'rroles';
      r.textContent = champ.roles.join(' · ');
      res.appendChild(r);
    }
  }

  // ---------- Estado busy / habilitación de botones ----------
  // Juego activo que no admite tantos campeones (o null)
  function overLimit() {
    var g = games[state.tab];
    return g && g.max && state.opts.length > g.max ? g : null;
  }

  function refresh() {
    var over = overLimit();
    var n = state.opts.length;

    document.querySelectorAll('.go').forEach(function (b) {
      b.disabled = state.busy || n < 2 || !!over;
    });

    var w = $('limit');
    w.hidden = !over;
    if (over) {
      w.textContent = '⚠️ ' + over.name + ' solo está disponible con ' + over.max +
        ' campeones o menos. Tienes ' + n + ' seleccionados: quita ' + (n - over.max) +
        ' para usarlo.';
    }
  }

  function setBusy(b) {
    state.busy = b;
    $('picker').classList.toggle('locked', b);
    $('q').disabled = b;
    refresh();
  }

  function ok() {
    return !state.busy && state.opts.length >= 2 && !overLimit();
  }

  // ---------- Persistencia (localStorage) ----------
  // Puede fallar (modo incógnito, almacenamiento bloqueado): la app sigue sin guardar.
  function saveSelection() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(Object.keys(state.sel)));
    } catch (e) { /* sin almacenamiento: se ignora */ }
  }

  function loadSelection() {
    try {
      var v = JSON.parse(localStorage.getItem(STORE_KEY));
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  // Marca los campeones guardados; ignora ids que ya no existan en el JSON
  function restoreSelection() {
    loadSelection().forEach(function (id) {
      var el = tiles[id];
      if (typeof id !== 'string' || !el) return;
      state.sel[id] = true;
      el.classList.add('on');
      el.setAttribute('aria-pressed', 'true');
    });
  }

  // ---------- Selección de campeones ----------
  function updateSelection() {
    state.champs = state.all.filter(function (c) { return state.sel[c.id]; });
    state.opts = state.champs.map(function (c) { return c.name; });

    var n = state.opts.length;
    $('cnt').textContent = n === 0
      ? 'Marca al menos 2 campeones.'
      : n === 1
        ? '1 campeón seleccionado · marca al menos 2.'
        : n + ' campeones seleccionados.';

    state.res.textContent = '';
    saveSelection();
    refresh();
    preview();
  }

  function toggle(id) {
    if (state.sel[id]) delete state.sel[id];
    else state.sel[id] = true;

    var el = tiles[id];
    var on = !!state.sel[id];
    el.classList.toggle('on', on);
    el.setAttribute('aria-pressed', on);
    updateSelection();
  }

  // Normaliza para buscar: minúsculas y sin símbolos (Kai'Sa -> kaisa)
  function norm(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function visibleIds() {
    return state.all.filter(function (c) { return !tiles[c.id].hidden; })
      .map(function (c) { return c.id; });
  }

  function applyFilter() {
    var q = norm(state.query);
    var shown = 0;

    state.all.forEach(function (c) {
      var okRole = !state.role || tags(c).indexOf(state.role) !== -1;
      var okName = !q || norm(c.name).indexOf(q) !== -1;
      var vis = okRole && okName;
      tiles[c.id].hidden = !vis;
      if (vis) shown++;
    });

    $('gempty').hidden = shown > 0;
  }

  // Etiquetas filtrables de un campeón: roles + líneas + especies (Darkin, Yordle) + región
  function tags(c) {
    return c.roles.concat(c.lanes || [], c.species || [], c.region || []);
  }

  function buildRoles() {
    var set = {};
    var lanes = {};
    var spec = {};
    var regs = {};
    state.all.forEach(function (c) {
      c.roles.forEach(function (r) { set[r] = true; });
      (c.lanes || []).forEach(function (l) { lanes[l] = true; });
      (c.species || []).forEach(function (s) { spec[s] = true; });
      if (c.region) regs[c.region] = true;
    });

    var box = $('roles');
    // Una línea por grupo: roles, líneas, regiones y especies
    var groups = [[''].concat(Object.keys(set).sort()), Object.keys(lanes).sort(), Object.keys(regs).sort(), Object.keys(spec).sort()];
    var names = [];
    groups.forEach(function (g, i) {
      if (i > 0) names.push(null);
      names = names.concat(g);
    });

    names.forEach(function (r) {
      if (r === null) {
        var br = document.createElement('span');
        br.className = 'rbreak';
        box.appendChild(br);
        return;
      }
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'role' + (r === '' ? ' on' : '');
      b.dataset.r = r;
      b.textContent = r || 'Todos';
      box.appendChild(b);
    });

    box.onclick = function (e) {
      var b = e.target.closest('.role');
      if (!b || state.busy) return;
      state.role = b.dataset.r;
      box.querySelectorAll('.role').forEach(function (x) {
        x.classList.toggle('on', x === b);
      });
      applyFilter();
    };
  }

  function buildGrid() {
    var grid = $('grid');
    var frag = document.createDocumentFragment();

    state.all.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tile';
      b.dataset.id = c.id;
      b.setAttribute('aria-pressed', 'false');
      b.title = c.name + ' — ' + c.roles.join(', ');

      var img = document.createElement('img');
      img.src = iconSrc(c);
      img.alt = '';
      img.width = 128;
      img.height = 128;
      img.loading = 'lazy';
      img.decoding = 'async';

      var nm = document.createElement('span');
      nm.textContent = c.name;

      b.appendChild(img);
      b.appendChild(nm);
      frag.appendChild(b);
      tiles[c.id] = b;
    });

    grid.appendChild(frag);

    grid.onclick = function (e) {
      var t = e.target.closest('.tile');
      if (!t || state.busy) return;
      toggle(t.dataset.id);
    };
  }

  function initPicker() {
    $('q').addEventListener('input', function () {
      state.query = this.value;
      applyFilter();
    });

    $('a-all').onclick = function () {
      if (state.busy) return;
      visibleIds().forEach(function (id) {
        state.sel[id] = true;
        tiles[id].classList.add('on');
        tiles[id].setAttribute('aria-pressed', 'true');
      });
      updateSelection();
    };

    $('a-none').onclick = function () {
      if (state.busy) return;
      Object.keys(state.sel).forEach(function (id) {
        tiles[id].classList.remove('on');
        tiles[id].setAttribute('aria-pressed', 'false');
      });
      state.sel = {};
      updateSelection();
    };
  }

  // ---------- Carga de datos (JSON estático, solo lectura) ----------
  function loadData() {
    $('cnt').textContent = 'Cargando campeones…';

    return fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (list) {
        state.all = list;
        buildRoles();
        buildGrid();
        restoreSelection();
        updateSelection();
      })
      .catch(function (err) {
        $('cnt').textContent = 'No se pudieron cargar los campeones (' + err.message + '). ' +
          'Abre la página desde un servidor (GitHub Pages o Live Server), no con doble clic.';
      });
  }

  // ---------- Confetti ----------
  function confetti() {
    var c = $('cf');
    var x = c.getContext('2d');
    var cs = ['#c89b3c', '#f0e6d2', '#0ac8b9', '#0397ab', '#c8aa6e'];
    var ps = [];
    var f = 0;

    c.width = innerWidth;
    c.height = innerHeight;

    for (var i = 0; i < 150; i++) {
      ps.push({
        x: innerWidth / 2,
        y: innerHeight * .4,
        vx: (Math.random() - .5) * 16,
        vy: -Math.random() * 15 - 4,
        s: 6 + Math.random() * 6,
        c: cs[i % 5],
        r: Math.random() * 6
      });
    }

    (function a() {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach(function (p) {
        p.vy += .35;
        p.x += p.vx;
        p.y += p.vy;
        p.r += .2;
        x.save();
        x.translate(p.x, p.y);
        x.rotate(p.r);
        x.fillStyle = p.c;
        x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6);
        x.restore();
      });
      if (++f < 160) requestAnimationFrame(a);
      else x.clearRect(0, 0, c.width, c.height);
    })();
  }

  // ---------- Tabs + preview ----------
  function preview() {
    if (state.busy) return;
    var g = games[state.tab];
    if (g && g.preview) g.preview();
  }

  function initTabs() {
    $('tabs').onclick = function (e) {
      var b = e.target.closest('.tab');
      if (!b || state.busy) return;
      state.tab = b.dataset.v;

      document.querySelectorAll('.tab').forEach(function (t) {
        t.classList.toggle('on', t === b);
        $('s-' + t.dataset.v).hidden = t !== b;
      });

      state.res.textContent = '';
      refresh();

      var g = games[state.tab];
      if (g && g.onShow) g.onShow();
      preview();
    };
  }

  // ---------- Arranque ----------
  function init() {
    state.res = $('res');
    initTabs();
    initPicker();
    refresh();
    loadData();
  }

  // ---------- API pública ----------
  return {
    // estado y DOM
    state: state,
    $: $,
    games: games,
    registerGame: registerGame,

    // utilidades
    randInt: randInt,
    rnd: rnd,
    perm: perm,
    col: col,
    cv: cv,
    trunc: trunc,
    iconSrc: iconSrc,

    // flujo
    showRes: showRes,
    setBusy: setBusy,
    refresh: refresh,
    ok: ok,
    preview: preview,
    confetti: confetti,

    // arranque manual (se llama desde el final de games.js)
    init: init
  };
})();
