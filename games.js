/* ============================================================
   games.js — Registro de los juegos (Carrete, Ruleta, Plinko, Gachapón, Tragaperras, Carrera, Cartas)
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

    function show(i) {
      var n = S.opts.length;
      L[0].textContent = S.opts[(i - 1 + n) % n];
      L[1].textContent = S.opts[i % n];
      L[2].textContent = S.opts[(i + 1) % n];
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
        if (S.opts.length >= 2) show(0);
        else {
          L[0].innerHTML = '&nbsp;';
          L[1].textContent = '¿QUIÉN SERÁ?';
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

    function draw(a) {
      var c = $('wc').getContext('2d');
      var n = S.opts.length;
      var s = 2 * Math.PI / n;
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
          c.fillStyle = '#fff';
          c.font = 'bold 13px system-ui';
          c.textAlign = 'right';
          c.fillText(Core.trunc(S.opts[i], 13), 138, 5);
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
        c.fillText('Disponible con ' + MAX + ' campeones o menos', PW / 2, PH / 2);
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
      name: 'El Plinko',
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
      c.fillText('Haz un deseo', GW / 2, GH / 2 + 50);
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
          c.fillText(champ.roles.join(' · '), GW / 2, 257);

          for (i = 0; i < 5; i++) {
            var q2 = Math.max(0, Math.min(1, (R - 350 - i * 220) / 200));
            if (q2 > 0) star(c, GW / 2 + (i - 2) * 36, 80, 14 * (1.4 - .4 * q2), '#ffd978');
          }

          if (R > 1500) {
            c.globalAlpha = Math.min(1, (R - 1500) / 300);
            c.fillStyle = '#ffd978';
            c.font = 'bold 13px system-ui';
            c.fillText('★ ¡CAMPEÓN! ★', GW / 2, 302);
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

    function showR(r, p) {
      var n = S.opts.length;
      var d = RW[r].children;
      d[0].textContent = S.opts[(p - 1 + n) % n];
      d[1].textContent = S.opts[p % n];
      d[2].textContent = S.opts[(p + 1) % n];
      RW[r].classList.remove('tk');
      void RW[r].offsetWidth;
      RW[r].classList.add('tk');
    }

    function previewSlots() {
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
            S.res.textContent = 'Intento ' + (k + 1) + ': sin aciertos, giro extra…';
            k++;
            setTimeout(play, 700);
            return;
          }
          var m = o.filter(function (x) { return x === w; }).length;
          RW.forEach(function (e, r) {
            e.classList.add(o[r] === w ? 'win' : 'lose');
          });
          Core.confetti();
          Core.showRes(S.opts[w] + ' (' + m + ' aciertos' + (all.length > 1 ? ', intento ' + all.length : '') + ')', S.champs[w]);
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

    Core.registerGame('r', { name: 'La Carrera', max: RMAX, preview: raceInit });
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
            S.res.textContent = 'Elige una carta 👆';
            Core.setBusy(false);
          }, 700);
        })();
      }, 1700);
    };

    Core.registerGame('k', { name: 'El juego de Cartas', max: CMAX, preview: kInit });
  })();

  // ============================================================
  // Arranque: todo registrado → inicializamos Core
  // ============================================================
  Core.init();
})();