/* ============================================================
   games.js — Registro de los juegos (Carrete, Ruleta, Plinko, Gachapón, Tragaperras, Carrera, Cartas, Batalla, Blackjack)
   Depende de core.js (debe cargarse después)
   ============================================================ */

(function () {
  'use strict';

  // Atajos a la API de Core
  var $ = Core.$;
  var S = Core.state;


  // ============================================================
  // 1) CARRETE
  // ============================================================
  (function () {
    var L = [$('l0'), $('l1'), $('l2')];
    var reel = $('reel');
    var ICONS_MAX = 24;   // por encima, solo nombres (sin iconos que parpadeen)

    function show(i) {
      var n = S.opts.length;
      var ic = n <= ICONS_MAX;
      [-1, 0, 1].forEach(function (d, k) {
        var j = (i + d + n) % n;
        Core.label(L[k], S.opts[j], S.champs[j], ic);
      });
      reel.classList.remove('tick');
      void reel.offsetWidth;
      reel.classList.add('tick');
    }

    $('c-go').onclick = function () {
      if (!Core.ok()) return;
      Core.setBusy(true);
      S.res.textContent = '';
      reel.classList.remove('win');
      reel.classList.add('spin');

      var n = S.opts.length;
      var t = Core.randInt(n);
      var pos = Core.randInt(n);
      var steps = n * 3 + ((t - pos + n) % n) + 8;
      var i = 0;

      // Con muchos campeones no damos vueltas completas: duración fija
      if (n > 12) {
        steps = 50;
        pos = ((t - steps) % n + n) % n;
      }

      (function tick() {
        pos = (pos + 1) % n;
        show(pos);
        i++;
        if (i >= steps) {
          reel.classList.remove('tick', 'spin');
          reel.classList.add('win');
          Core.confetti();
          Core.showRes(S.opts[pos], S.champs[pos]);
          Core.setBusy(false);
          return;
        }
        setTimeout(tick, 60 + Math.pow(i / steps, 3) * 420);
      })();
    };

    Core.registerGame('c', {
      preview: function () {
        reel.classList.remove('win');
        if (S.opts.length >= 2) {
          if (S.opts.length <= ICONS_MAX) Core.preload(S.champs);
          show(0);
        } else {
          L[0].innerHTML = '&nbsp;';
          L[1].textContent = I18N.t('reelIdle');
          L[2].innerHTML = '&nbsp;';
        }
      }
    });
  })();

  // ============================================================
  // 2) RULETA
  // ============================================================
  (function () {
    var wa = 0;
    var LABELS_MAX = 36;   // por encima, los nombres no caben en los sectores
    var ICONS_MAX = 16;    // por encima, solo nombre (el icono ya no cabe)
    var imgs = {};         // id -> Image (cache para el canvas)

    function icon(c) {
      var im = imgs[c.id];
      if (!im) {
        im = imgs[c.id] = new Image();
        im.onload = function () { if (!S.busy) draw(wa); };
        im.src = Core.iconSrc(c);
      }
      return im;
    }

    function draw(a) {
      var c = $('wc').getContext('2d');
      var n = S.opts.length;
      var s = 2 * Math.PI / n;
      var ic = n <= ICONS_MAX;
      c.clearRect(0, 0, 320, 320);
      if (n < 2) return;

      for (var i = 0; i < n; i++) {
        c.beginPath();
        c.moveTo(160, 160);
        c.arc(160, 160, 150, a + i * s, a + (i + 1) * s);
        c.fillStyle = Core.col(i);
        c.fill();

        if (n <= LABELS_MAX) {
          c.save();
          c.translate(160, 160);
          c.rotate(a + (i + .5) * s);
          if (ic) {
            var im = icon(S.champs[i]);
            if (im.complete && im.naturalWidth) {
              // icono redondo en el borde exterior del sector
              c.save();
              c.beginPath();
              c.arc(122, 0, 17, 0, 7);
              c.clip();
              c.drawImage(im, 105, -17, 34, 34);
              c.restore();
              c.beginPath();
              c.arc(122, 0, 17, 0, 7);
              c.lineWidth = 2;
              c.strokeStyle = '#c8aa6e';
              c.stroke();
            }
          }
          c.fillStyle = '#fff';
          c.font = 'bold 13px system-ui';
          c.textAlign = 'right';
          c.fillText(Core.trunc(S.opts[i], ic ? 10 : 13), ic ? 98 : 138, 5);
          c.restore();
        }
      }

      c.beginPath();
      c.arc(160, 160, 16, 0, 7);
      c.fillStyle = Core.cv('--card');
      c.fill();

      c.beginPath();
      c.moveTo(148, 0);
      c.lineTo(172, 0);
      c.lineTo(160, 26);
      c.fillStyle = Core.cv('--text');
      c.fill();
    }

    $('w-go').onclick = function () {
      if (!Core.ok()) return;
      Core.setBusy(true);
      S.res.textContent = '';

      var n = S.opts.length;
      var s = 2 * Math.PI / n;
      var t = Core.randInt(n);
      var need = -Math.PI / 2 - ((t + .5) * s + (Math.random() - .5) * .7 * s);
      var d = ((need - wa) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      var st = wa;
      var end = wa + d + 10 * Math.PI;
      var t0 = performance.now();

      (function f() {
        var u = Math.max(0, Math.min((performance.now() - t0) / 5000, 1));
        wa = st + (end - st) * (1 - Math.pow(1 - u, 3));
        draw(wa);

        if (u < 1) requestAnimationFrame(f);
        else {
          Core.confetti();
          Core.showRes(S.opts[t], S.champs[t]);
          Core.setBusy(false);
        }
      })(t0);
    };

    Core.registerGame('w', {
      preview: function () {
        $('w-note').hidden = S.opts.length <= LABELS_MAX;
        draw(wa);
      }
    });
  })();

  // ============================================================
  // 3) PLINKO
  // ============================================================
  (function () {
    var PW = 340, PH = 400;
    var MAX = 20;   // más casillas no caben en el tablero

    function geo() {
      var n = S.opts.length;
      var r = n - 1;
      var sp = PW / n;
      return {
        n: n, rows: r, sp: sp, top: 30, rh: (PH - 140) / r,
        br: Math.min(7, sp * .32),    // radio de la bola
        pr: Math.min(3.5, sp * .14)   // radio de los clavos
      };
    }

    function draw(g, ball, win) {
      var c = $('pc').getContext('2d');
      c.clearRect(0, 0, PW, PH);
      if (g.n < 2) return;

      if (g.n > MAX) {
        c.save();
        c.fillStyle = Core.cv('--muted');
        c.font = '14px system-ui';
        c.textAlign = 'center';
        c.fillText(I18N.t('plinkoMax', { max: MAX }), PW / 2, PH / 2);
        c.restore();
        return;
      }

      c.fillStyle = Core.cv('--muted');
      for (var r = 0; r < g.rows; r++) {
        for (var j = 0; j <= r; j++) {
          c.beginPath();
          c.arc(PW / 2 + (2 * j - r) * g.sp / 2, g.top + r * g.rh, g.pr, 0, 7);
          c.fill();
        }
      }

      for (var i = 0; i < g.n; i++) {
        c.globalAlpha = win === i ? 1 : .28;
        c.fillStyle = Core.col(i);
        c.fillRect(i * g.sp + 1, PH - 90, g.sp - 2, 90);
        c.globalAlpha = 1;

        c.save();
        c.translate(i * g.sp + g.sp / 2, PH - 6);
        c.rotate(-Math.PI / 2);
        c.fillStyle = win === i ? '#fff' : Core.cv('--text');
        c.font = 'bold 12px system-ui';
        c.textAlign = 'left';
        c.fillText(Core.trunc(S.opts[i], 11), 0, 4);
        c.restore();
      }

      if (ball) {
        c.beginPath();
        c.arc(ball.x, ball.y, g.br, 0, 7);
        c.fillStyle = Core.cv('--accent');
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 2;
        c.stroke();
      }
    }

    $('p-go').onclick = function () {
      if (!Core.ok()) return;
      Core.setBusy(true);
      S.res.textContent = '';

      var g = geo();
      var t = Core.randInt(g.n);
      var st = [], i;

      for (i = 0; i < t; i++) st.push(1);
      while (st.length < g.rows) st.push(0);
      for (i = st.length - 1; i > 0; i--) {
        var j = Core.randInt(i + 1);
        var x = st[i]; st[i] = st[j]; st[j] = x;
      }

      var pts = [{ x: PW / 2, y: 8 }];
      var k = 0;
      for (i = 0; i <= g.rows; i++) {
        if (i > 0) k += st[i - 1];
        pts.push({ x: PW / 2 + (2 * k - i) * g.sp / 2, y: g.top + i * g.rh - 9 });
      }
      pts.push({ x: pts[pts.length - 1].x, y: PH - 48 });

      var D = 170;
      var t0 = performance.now();

      (function f() {
        var e = Math.max(0, performance.now() - t0);
        var idx = Math.floor(e / D);

        if (idx >= pts.length - 1) {
          draw(g, pts[pts.length - 1], t);
          Core.confetti();
          Core.showRes(S.opts[t], S.champs[t]);
          Core.setBusy(false);
          return;
        }

        var u = (e % D) / D;
        var a = pts[idx];
        var b = pts[idx + 1];
        draw(g, {
          x: a.x + (b.x - a.x) * u,
          y: a.y + (b.y - a.y) * u - (idx < pts.length - 2 ? 12 * Math.sin(Math.PI * u) : 0)
        });
        requestAnimationFrame(f);
      })(t0);
    };

    Core.registerGame('p', {
      max: MAX,
      preview: function () { draw(geo()); }
    });
  })();

  // ============================================================
  // 4) GACHAPON (deseo con estrella fugaz)
  // ============================================================
  (function () {
    var GW = 340, GH = 380;
    var gs = [];
    for (var q = 0; q < 70; q++) {
      gs.push({
        x: Math.random() * GW,
        y: Math.random() * GH,
        r: Math.random() * 1.4 + .3,
        p: Math.random() * 6
      });
    }

    function sky(c, t) {
      var g = c.createLinearGradient(0, 0, 0, GH);
      g.addColorStop(0, '#0b1030');
      g.addColorStop(1, '#2a1f55');
      c.fillStyle = g;
      c.fillRect(0, 0, GW, GH);

      gs.forEach(function (o) {
        c.globalAlpha = .4 + .6 * Math.abs(Math.sin(t / 600 + o.p));
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(o.x, o.y, o.r, 0, 7);
        c.fill();
      });
      c.globalAlpha = 1;
    }

    function star(c, x, y, R, col) {
      c.beginPath();
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5;
        var r = i % 2 ? R * .45 : R;
        c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      c.closePath();
      c.fillStyle = col;
      c.fill();
    }

    function rr(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    function idle() {
      var c = $('gc').getContext('2d');
      sky(c, 0);
      star(c, GW / 2, GH / 2 - 20, 36, '#ffd978');
      c.fillStyle = '#ffd978';
      c.textAlign = 'center';
      c.font = 'bold 15px system-ui';
      c.fillText(I18N.t('wish'), GW / 2, GH / 2 + 50);
    }

    $('g-go').onclick = function () {
      if (!Core.ok()) return;
      Core.setBusy(true);
      S.res.textContent = '';

      var t = Core.randInt(S.opts.length);
      var name = S.opts[t];
      var champ = S.champs[t];
      var portrait = new Image();
      portrait.src = Core.iconSrc(champ);
      var c = $('gc').getContext('2d');
      var t0 = performance.now();
      var trail = [];
      var sp = [];

      (function f() {
        var T = Math.max(0, performance.now() - t0);
        var i;

        sky(c, T);

        if (T < 2450) {
          var u = Math.min(T / 2200, 1);
          var e = u * u * (3 - 2 * u);
          var m = 1 - e;
          var hx = m * m * -20 + 2 * m * e * 150 + e * e * 170;
          var hy = m * m * 40 + 2 * m * e * 10 + e * e * 200;

          trail.push({ x: hx, y: hy });
          if (trail.length > 40) trail.shift();

          for (i = 0; i < trail.length; i++) {
            var k = i / trail.length;
            c.globalAlpha = k * .7;
            c.fillStyle = '#ffd978';
            c.beginPath();
            c.arc(trail[i].x, trail[i].y, 1 + k * 6, 0, 7);
            c.fill();
          }
          c.globalAlpha = 1;

          var g = c.createRadialGradient(hx, hy, 0, hx, hy, 26);
          g.addColorStop(0, '#fff');
          g.addColorStop(.3, 'rgba(255,217,120,.9)');
          g.addColorStop(1, 'rgba(255,217,120,0)');
          c.fillStyle = g;
          c.beginPath();
          c.arc(hx, hy, 26, 0, 7);
          c.fill();
        } else {
          var R = T - 2450;

          c.save();
          c.translate(GW / 2, GH / 2);
          c.rotate(T / 2500);
          c.fillStyle = 'rgba(255,217,120,.16)';
          for (i = 0; i < 12; i++) {
            c.rotate(Math.PI / 6);
            c.beginPath();
            c.moveTo(0, 0);
            c.arc(0, 0, 300, -.1, .1);
            c.fill();
          }
          c.restore();

          c.save();
          c.translate(GW / 2, GH / 2);
          var sc = Math.min(1, .6 + R / 750);
          c.scale(sc, sc);
          c.translate(-GW / 2, -GH / 2);
          c.globalAlpha = Math.min(1, R / 250);

          rr(c, 60, 50, 220, 280, 18);
          c.fillStyle = 'rgba(20,14,50,.93)';
          c.fill();
          c.lineWidth = 3;
          c.strokeStyle = '#ffd978';
          c.stroke();

          c.textAlign = 'center';

          // Retrato del campeón
          var PS = 96;
          var px = GW / 2 - PS / 2;
          var py = 104;
          if (portrait.complete && portrait.naturalWidth) {
            c.save();
            rr(c, px, py, PS, PS, 14);
            c.clip();
            c.drawImage(portrait, px, py, PS, PS);
            c.restore();
          }
          rr(c, px, py, PS, PS, 14);
          c.lineWidth = 3;
          c.strokeStyle = '#ffd978';
          c.stroke();

          var size = 28;
          c.font = 'bold ' + size + 'px system-ui';
          while (c.measureText(name).width > 190 && size > 11) {
            size--;
            c.font = 'bold ' + size + 'px system-ui';
          }
          c.fillStyle = '#fff';
          c.fillText(name, GW / 2, 236);

          c.font = '12px system-ui';
          c.fillStyle = 'rgba(255,233,168,.85)';
          c.fillText(champ.roles.map(I18N.tag).join(' · '), GW / 2, 257);

          for (i = 0; i < 5; i++) {
            var q2 = Math.max(0, Math.min(1, (R - 350 - i * 220) / 200));
            if (q2 > 0) star(c, GW / 2 + (i - 2) * 36, 80, 14 * (1.4 - .4 * q2), '#ffd978');
          }

          if (R > 1500) {
            c.globalAlpha = Math.min(1, (R - 1500) / 300);
            c.fillStyle = '#ffd978';
            c.font = 'bold 13px system-ui';
            c.fillText(I18N.t('champion'), GW / 2, 302);
          }
          c.restore();

          for (i = 0; i < 2; i++) {
            sp.push({
              x: GW / 2 + (Math.random() - .5) * 220,
              y: GH / 2 + (Math.random() - .5) * 260,
              vy: -.4 - Math.random(),
              l: 1
            });
          }
          sp = sp.filter(function (o) {
            o.y += o.vy;
            o.l -= .02;
            if (o.l > 0) {
              c.globalAlpha = o.l;
              star(c, o.x, o.y, 2 + o.l * 3, '#ffe9a8');
            }
            return o.l > 0;
          });
          c.globalAlpha = 1;
        }

        if (T > 2100 && T < 2800) {
          var a2 = T < 2450 ? (T - 2100) / 350 : 1 - (T - 2450) / 350;
          c.fillStyle = 'rgba(255,248,220,' + Math.max(0, Math.min(1, a2)) + ')';
          c.fillRect(0, 0, GW, GH);
        }

        if (T < 4600) requestAnimationFrame(f);
        else {
          Core.showRes(name, S.champs[t]);
          Core.confetti();
          Core.setBusy(false);
        }
      })();
    };

    Core.registerGame('g', { preview: idle });
  })();

  // ============================================================
  // 5) TRAGAPERRAS
  // ============================================================
  (function () {
    var RW = [0, 1, 2].map(function (i) { return $('r' + i); });
    var rp = [0, 0, 0];
    var ICONS_MAX = 24;   // por encima, solo nombres (sin iconos que parpadeen)

    function showR(r, p) {
      var n = S.opts.length;
      var d = RW[r].children;
      var ic = n <= ICONS_MAX;
      [-1, 0, 1].forEach(function (o, k) {
        var j = (p + o + n) % n;
        Core.label(d[k], S.opts[j], S.champs[j], ic);
      });
      RW[r].classList.remove('tk');
      void RW[r].offsetWidth;
      RW[r].classList.add('tk');
    }

    function previewSlots() {
      if (S.opts.length >= 2 && S.opts.length <= ICONS_MAX) Core.preload(S.champs);
      RW.forEach(function (e, r) {
        if (S.opts.length < 2) {
          [].forEach.call(e.children, function (c) { c.textContent = ''; });
          return;
        }
        rp[r] %= S.opts.length;
        showR(r, rp[r]);
      });
    }

    function spin(o, fast, cb) {
      var n = S.opts.length;
      var prev = 0;
      var done = 0;

      RW.forEach(function (e, r) {
        var base = fast ? 4 + 3 * r : 10 + 6 * r;
        var st, s;
        var i = 0;

        if (n > 20) {
          // Muchos campeones: giro de duración fija que termina en o[r]
          s = base;
          st = ((o[r] - s) % n + n) % n;
        } else {
          st = Core.randInt(n);
          s = Math.ceil(base / n) * n + ((o[r] - st + n) % n);
          while (s < prev + (fast ? 3 : 5)) s += n;
        }
        prev = s;
        var pos = st;

        (function tick() {
          pos = (pos + 1) % n;
          i++;
          rp[r] = pos;
          showR(r, pos);

          if (i >= s) {
            if (++done === 3) cb();
            return;
          }
          setTimeout(tick, fast ? 35 + Math.pow(i / s, 3) * 110 : 45 + Math.pow(i / s, 3) * 230);
        })();
      });
    }

    $('s-go').onclick = function () {
      if (!Core.ok()) return;
      Core.setBusy(true);
      S.res.textContent = '';

      var n = S.opts.length;
      var all = [];
      var w = -1;
      var lev = $('lev');
      var k = 0;

      while (w < 0 && all.length < 2000) {
        var o = [Core.randInt(n), Core.randInt(n), Core.randInt(n)];
        all.push(o);
        if (o[0] === o[1] || o[0] === o[2]) w = o[0];
        else if (o[1] === o[2]) w = o[1];
      }

      if (w < 0) {
        w = Core.randInt(n);
        all.push([w, w, w]);
      }

      var fails = all.slice(0, -1);
      var list = fails.slice(0, 4).concat([all[all.length - 1]]);

      (function play() {
        var o = list[k];
        var last = k === list.length - 1;

        lev.classList.add('pull');
        setTimeout(function () { lev.classList.remove('pull'); }, 400);

        RW.forEach(function (e) { e.classList.remove('win', 'lose'); });

        spin(o, !last, function () {
          if (!last) {
            S.res.textContent = I18N.t('slotFail', { k: k + 1 });
            k++;
            setTimeout(play, 700);
            return;
          }
          var m = o.filter(function (x) { return x === w; }).length;
          RW.forEach(function (e, r) {
            e.classList.add(o[r] === w ? 'win' : 'lose');
          });
          Core.confetti();
          Core.showRes(S.opts[w] + ' (' + I18N.t('hits', { m: m }) + (all.length > 1 ? ', ' + I18N.t('attempt', { n: all.length }) : '') + ')', S.champs[w]);
          Core.setBusy(false);
        });
      })();
    };

    Core.registerGame('s', { preview: previewSlots });
  })();

  // ============================================================
  // 6) CARRERA
  // ============================================================
  (function () {
    var RMAX = 16;       // más carriles no caben en pantalla

    function raceInit() {
      var t = $('trk');
      t.innerHTML = '';
      if (S.opts.length < 2 || S.opts.length > RMAX) return;

      S.opts.forEach(function (o, i) {
        var l = document.createElement('div');
        var nm = document.createElement('span');
        var im = document.createElement('img');
        l.className = 'ln';
        nm.className = 'rn';
        nm.textContent = o;
        im.className = 'rr';
        im.alt = '';
        im.src = Core.iconSrc(S.champs[i]);
        l.appendChild(nm);
        l.appendChild(im);
        t.appendChild(l);
      });
    }

    $('r-go').onclick = function () {
      if (!Core.ok()) return;
      Core.setBusy(true);
      S.res.textContent = '';
      raceInit();

      var n = S.opts.length;
      var pos = [];
      var ls = $('trk').children;
      var F = 140;
      var i;

      for (i = 0; i < n; i++) pos.push(0);

      (function step() {
        var done = [];

        for (i = 0; i < n; i++) {
          pos[i] += 1 + Core.randInt(4) + (Core.randInt(10) === 0 ? 5 : 0);
          ls[i].lastChild.style.left = Math.min(pos[i] / F, 1) * 88 + '%';
          if (pos[i] >= F) done.push(i);
        }

        if (done.length) {
          var mx = Math.max.apply(null, done.map(function (j) { return pos[j]; }));
          var c2 = done.filter(function (j) { return pos[j] === mx; });
          var w = c2[Core.randInt(c2.length)];
          ls[w].classList.add('win');
          Core.confetti();
          Core.showRes(S.opts[w], S.champs[w]);
          Core.setBusy(false);
          return;
        }
        setTimeout(step, 80);
      })();
    };

    Core.registerGame('r', { max: RMAX, preview: raceInit });
  })();

  // ============================================================
  // 7) CARTAS
  // ============================================================
  (function () {
    var CMAX = 16;       // 4 columnas x 4 filas
    var CH = 100;        // alto de cada carta
    var GAP = 8;
    var kc = [];
    var kst = 'idle';
    var kslot = [];

    function layout() {
      var n = kc.length;
      if (!n) { $('kbox').style.height = '0px'; return; }
      var cols = Math.min(n, 4);
      var rows = Math.ceil(n / cols);
      $('kbox').style.height = (rows * (CH + GAP)) + 'px';

      kc.forEach(function (e, i) {
        var sl = kslot[i];
        e.style.width = (100 / cols - 2) + '%';
        e.style.height = CH + 'px';
        e.style.left = ((sl % cols) * (100 / cols) + 1) + '%';
        e.style.top = (Math.floor(sl / cols) * (CH + GAP)) + 'px';
      });
    }

    function kInit() {
      var b = $('kbox');
      b.innerHTML = '';
      kc = [];
      kst = 'idle';
      kslot = [];
      if (S.opts.length < 2 || S.opts.length > CMAX) { layout(); return; }

      S.opts.forEach(function (o, i) {
        var e = document.createElement('div');
        var im = document.createElement('img');
        var nm = document.createElement('span');
        var f;

        e.className = 'kc';
        e.innerHTML = '<div class="ki"><div class="kb"></div><div class="kf"></div></div>';

        im.alt = '';
        im.src = Core.iconSrc(S.champs[i]);
        nm.textContent = o;
        f = e.querySelector('.kf');
        f.appendChild(im);
        f.appendChild(nm);

        e.onclick = function () { kPick(i); };
        b.appendChild(e);
        kc.push(e);
        kslot.push(i);
      });
      layout();
    }

    function kPick(i) {
      if (kst !== 'pick') return;
      kst = 'done';
      kc[i].classList.add('up', 'win');
      Core.confetti();
      Core.showRes(S.opts[i], S.champs[i]);
      setTimeout(function () {
        kc.forEach(function (e, j) {
          if (j !== i) e.classList.add('up', 'dim');
        });
      }, 800);
    }

    $('k-go').onclick = function () {
      if (!Core.ok()) return;
      Core.setBusy(true);
      S.res.textContent = '';
      kInit();

      setTimeout(function () {
        kc.forEach(function (e) { e.classList.add('up'); });
      }, 100);

      setTimeout(function () {
        kc.forEach(function (e) { e.classList.remove('up'); });
        var r = 0;

        (function mix() {
          kslot = Core.perm(kc.length);
          layout();
          if (++r < 5) setTimeout(mix, 650);
          else setTimeout(function () {
            kst = 'pick';
            S.res.textContent = I18N.t('pickCard');
            Core.setBusy(false);
          }, 700);
        })();
      }, 1700);
    };

    Core.registerGame('k', { max: CMAX, preview: kInit });
  })();

  // ============================================================
  // 8) BATALLA (esferas que chocan; el rol define vida, daño y velocidad)
  // ============================================================
  (function () {
    var BW = 340, BH = 400;
    var BMAX = 24;   // más esferas no caben en el ring
    // rol -> [vida, daño por golpe, velocidad]
    var STATS = {
      Juggernaut: [140, 12, 1.0], Vanguard: [150, 9, .9], Warden: [150, 8, .9],
      Burst: [80, 18, 1.1], Assassin: [75, 20, 1.4], Diver: [100, 14, 1.2],
      Skirmisher: [100, 13, 1.2], Battlemage: [105, 12, 1.0], Specialist: [100, 12, 1.1],
      Catcher: [100, 11, 1.1], Artillery: [80, 17, .9], Marksman: [85, 16, 1.0],
      Enchanter: [90, 8, 1.0]
    };
    var imgs = {};
    var ps = [];
    var winner = -1;

    function icon(c) {
      var im = imgs[c.id];
      if (!im) {
        im = imgs[c.id] = new Image();
        im.onload = function () { if (!S.busy) draw(); };
        im.src = Core.iconSrc(c);
      }
      return im;
    }

    function setup() {
      var n = S.champs.length;
      var r = n > 12 ? 14 : 18;
      winner = -1;
      ps = S.champs.map(function (c, i) {
        var st = STATS[c.roles[0]] || [100, 12, 1];
        var a = Core.rnd() * 2 * Math.PI;
        var sp = st[2] * 2.2;
        return {
          c: c, i: i, r: r, hp: st[0], max: st[0], atk: st[1], sp: sp,
          x: r + Core.rnd() * (BW - 2 * r), y: r + Core.rnd() * (BH - 2 * r),
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp
        };
      });
    }

    function draw() {
      var c = $('bc').getContext('2d');
      c.clearRect(0, 0, BW, BH);
      c.strokeStyle = Core.cv('--line');
      c.lineWidth = 2;
      c.strokeRect(1, 1, BW - 2, BH - 2);
      if (S.opts.length < 2 || S.opts.length > BMAX) return;

      ps.forEach(function (p) {
        if (p.hp <= 0) return;
        var im = icon(p.c);

        c.save();
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, 7);
        c.clip();
        if (im.complete && im.naturalWidth) c.drawImage(im, p.x - p.r, p.y - p.r, 2 * p.r, 2 * p.r);
        else { c.fillStyle = Core.col(p.i); c.fill(); }
        c.restore();

        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, 7);
        c.lineWidth = winner === p.i ? 4 : 2;
        c.strokeStyle = winner === p.i ? '#ffd978' : Core.col(p.i);
        c.stroke();

        var w = p.r * 2, f = Math.max(0, p.hp / p.max);
        c.fillStyle = 'rgba(0,0,0,.55)';
        c.fillRect(p.x - p.r, p.y - p.r - 8, w, 4);
        c.fillStyle = f > .5 ? '#0ac8b9' : f > .25 ? '#c8aa6e' : '#be1e37';
        c.fillRect(p.x - p.r, p.y - p.r - 8, w * f, 4);
      });
    }

    $('b-go').onclick = function () {
      if (!Core.ok()) return;
      Core.setBusy(true);
      S.res.textContent = '';
      setup();

      var n = ps.length;
      var last = {};          // "i-j" -> instante del último golpe del par
      var t0 = performance.now();
      var prev = t0;

      (function f(now) {
        var dt = Math.min((now - prev) / 16.67, 3);
        var rage = 1 + Math.max(0, (now - t0 - 30000) / 10000);   // muerte súbita tras 30 s
        var dead = [];
        var i, j, a, b;
        prev = now;

        for (i = 0; i < n; i++) {
          a = ps[i];
          if (a.hp <= 0) continue;
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          if (a.x < a.r) { a.x = a.r; a.vx = Math.abs(a.vx); }
          if (a.x > BW - a.r) { a.x = BW - a.r; a.vx = -Math.abs(a.vx); }
          if (a.y < a.r) { a.y = a.r; a.vy = Math.abs(a.vy); }
          if (a.y > BH - a.r) { a.y = BH - a.r; a.vy = -Math.abs(a.vy); }
        }

        for (i = 0; i < n; i++) {
          for (j = i + 1; j < n; j++) {
            a = ps[i]; b = ps[j];
            if (a.hp <= 0 || b.hp <= 0) continue;
            var dx = b.x - a.x, dy = b.y - a.y;
            var d = Math.sqrt(dx * dx + dy * dy) || .01;
            if (d >= a.r + b.r) continue;

            var nx = dx / d, ny = dy / d;
            var push = (a.r + b.r - d) / 2;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;

            // rebote elástico (misma masa), conservando la velocidad propia de cada rol
            var vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (vn > 0) {
              a.vx -= vn * nx; a.vy -= vn * ny;
              b.vx += vn * nx; b.vy += vn * ny;
              [a, b].forEach(function (p) {
                var m = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
                p.vx *= p.sp / m; p.vy *= p.sp / m;
              });
            }

            var key = i + '-' + j;
            if (now - (last[key] || -1e9) > 350) {
              last[key] = now;
              a.hp -= b.atk * rage;
              b.hp -= a.atk * rage;
              if (a.hp <= 0) dead.push(a.i);
              if (b.hp <= 0) dead.push(b.i);
            }
          }
        }

        var alive = ps.filter(function (p) { return p.hp > 0; });
        if (alive.length <= 1) {
          winner = alive.length ? alive[0].i : dead[Core.randInt(dead.length)];
          ps[winner].hp = Math.max(ps[winner].hp, 1);
          draw();
          Core.confetti();
          Core.showRes(S.opts[winner], S.champs[winner]);
          Core.setBusy(false);
          return;
        }
        draw();
        requestAnimationFrame(f);
      })(t0);
    };

    Core.registerGame('b', {
      max: BMAX,
      preview: function () { setup(); draw(); }
    });
  })();

  // ============================================================
  // 9) BLACKJACK (cada campeón juega su mano; gana el más cerca de 21)
  // ============================================================
  (function () {
    var JMAX = 12;   // una fila por campeón
    var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    var rows = [];

    function val(r) { return r === 'A' ? 11 : isNaN(r) ? 10 : +r; }

    function total(h) {
      var s = 0, aces = 0;
      h.forEach(function (r) { s += val(r); if (r === 'A') aces++; });
      while (s > 21 && aces-- > 0) s -= 10;
      return s;
    }

    function jInit() {
      var b = $('jbox');
      b.innerHTML = '';
      rows = [];
      if (S.opts.length < 2 || S.opts.length > JMAX) return;

      S.opts.forEach(function (o, i) {
        var e = document.createElement('div');
        var im = document.createElement('img');
        var nm = document.createElement('span');
        var cs = document.createElement('span');
        var tt = document.createElement('b');

        e.className = 'jr';
        im.alt = '';
        im.src = Core.iconSrc(S.champs[i]);
        nm.className = 'jn';
        nm.textContent = o;
        cs.className = 'jc';
        tt.className = 'jt';

        [im, nm, cs, tt].forEach(function (x) { e.appendChild(x); });
        b.appendChild(e);
        rows.push({ el: e, cards: cs, tot: tt, hand: [] });
      });
    }

    function deal(r, rank) {
      var c = document.createElement('span');
      c.className = 'jcard';
      c.textContent = rank;
      r.cards.appendChild(c);
      r.hand.push(rank);
      var t = total(r.hand);
      r.tot.textContent = t > 21 ? t + ' 💥' : t;
    }

    $('j-go').onclick = function () {
      if (!Core.ok()) return;
      Core.setBusy(true);
      S.res.textContent = '';
      jInit();

      (function round(k) {
        var drew = false;
        rows.forEach(function (r) {
          if (k < 2 || total(r.hand) < 17) {
            deal(r, RANKS[Core.randInt(RANKS.length)]);
            drew = true;
          }
        });
        if (drew) { setTimeout(function () { round(k + 1); }, 450); return; }

        var tots = rows.map(function (r) { return total(r.hand); });
        var ok = tots.filter(function (t) { return t <= 21; });
        // si todos se pasan, gana el que menos se pasó
        var best = ok.length ? Math.max.apply(null, ok) : Math.min.apply(null, tots);
        var c2 = [];
        tots.forEach(function (t, i) { if (t === best) c2.push(i); });
        var w = c2[Core.randInt(c2.length)];

        rows.forEach(function (r, i) {
          r.el.classList.toggle('bust', tots[i] > 21);
          r.el.classList.toggle('win', i === w);
        });
        Core.confetti();
        Core.showRes(S.opts[w] + ' (' + tots[w] + ')', S.champs[w]);
        Core.setBusy(false);
      })(0);
    };

    Core.registerGame('j', { max: JMAX, preview: jInit });
  })();

  // ============================================================
  // Arranque: todo registrado → inicializamos Core
  // ============================================================
  Core.init();
})();