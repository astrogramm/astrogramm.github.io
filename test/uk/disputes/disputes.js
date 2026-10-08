/* Astrogramm · disputes between M2 classes — reference picker for the app (P3, TZ #2-18, chat #2, wave 3, 29.09.2026).
 *
 * Pure function, no DOM, no network, no dependencies. Same result as skills/astrogramm-qa/disputes.py pick()/agree()
 * (checked by skills/astrogramm-qa/disputes_js_check.mjs on bank/audit/disputes_vectors.json and on 1 200 engine charts).
 *
 *   const lib = <bank/APP_DISPUTES.json>;                 // the page embeds it (quotes may be stripped)
 *   const chart = AGE.chartJson(input);                   // engine, contract chart.json/1
 *   AGD.pick(chart, lib, 3)   -> [dispute, …]              // up to 3 disputes on distinct axes, best first
 *   AGD.agree(chart, lib)     -> convergence | null        // only when pick() is empty (honest «где сходятся»)
 *   AGD.resolve(chart)        -> {key: class}              // bank keys the engine can prove for this chart
 *
 * dispute = {id, axis, title, question, a:{key, class, label, source_plain, pole, line, tier}, b:{…}, bridge, curated}
 *   question — axis heading as a question about life; source_plain — «Откуда» in plain words (#13, library v2).
 *   a — the «+» side of the axis, b — the «−» side; tier 1..2 = number of classes on that side (never above 2, M2).
 * Works in a browser (window.AGD), in Node / Deno (module.exports or globalThis.AGD).
 */
(function (root) {
  'use strict';
  var AXES = ['tempo', 'support', 'stage', 'finish', 'risk', 'order'];
  var CLASSES = ["планети", "цифри", 'цикл'];
  var SIGN_SLUG = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  var SIGN_RU = ['Овен', "Телець", "Близнюки", 'Рак', 'Лев', "Діва", "Терези", "Скорпіон", "Стрілець", "Козеріг", "Водолій", "Риби"];
  var PLANETS = [["Сонце", 'sun'], ["Місяць", 'moon'], ["Меркурій", 'mercury'], ['Венера', 'venus'], ['Марс', 'mars'], ["Юпітер", 'jupiter'], ['Сатурн', 'saturn']];
  var GAN = '甲乙丙丁戊己庚辛壬癸';
  var STEM_SLUG = ['jia', 'yi', 'bing', 'ding', 'wu', 'ji', 'geng', 'xin', 'ren', 'gui'];
  var ARC_SLUG = [null, 'magician', 'priestess', 'empress', 'emperor', 'hierophant', 'lovers', 'chariot', 'justice', 'hermit', 'wheel', 'strength',
    'hanged', 'death', 'temperance', 'devil', 'tower', 'star', 'moon', 'sun', 'judgement', 'world', 'fool'];
  var POS = [null, 'essence', 'social', 'code', 'spirit'];

  function resolve(ch) {
    var nt = !!ch.input.time_unknown, borders = {}, keys = {};
    (ch.borders || []).forEach(function (b) { borders[b] = 1; });
    PLANETS.forEach(function (p) {
      if (p[0] === "Місяць" && nt) return;                 // Moon sign of the day is not certain without the hour
      if (nt && borders['sign:' + p[0]]) return;           // ingress day: the sign depends on the hour
      var pl = ch.natal.planets[p[0]];
      keys[p[1] + '_' + SIGN_SLUG[SIGN_RU.indexOf(pl.sign)]] = "планети";
    });
    keys['daymaster_' + STEM_SLUG[GAN.indexOf(ch.bazi.dm)]] = 'цикл';
    keys['tz_seal_' + ch.tzolkin.seal] = 'цикл';
    keys['tz_tone_' + ch.tzolkin.tone] = 'цикл';
    keys['gua_' + ch.gua] = 'цикл';
    keys['life_path_' + ch.numerology.life_path] = "цифри";
    var mx = ch.matrix;
    [[1, mx.center], [2, mx.D], [3, mx.code], [4, mx.spirit]].forEach(function (x) {
      keys['pos_' + x[0] + '_' + POS[x[0]] + '_' + ARC_SLUG[x[1]]] = "цифри";
    });
    return keys;
  }

  // First 8 hex digits of SHA-1 as an integer — the same tie-break as Python (hashlib.sha1(...).hexdigest()[:8]).
  function sha1hex8(str) {
    var bytes = unescape(encodeURIComponent(str)), n = bytes.length, words = [], i;
    for (i = 0; i < n; i++) words[i >> 2] |= bytes.charCodeAt(i) << (24 - (i % 4) * 8);
    words[n >> 2] |= 0x80 << (24 - (n % 4) * 8);
    words[(((n + 8) >> 6) + 1) * 16 - 1] = n * 8;
    var h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0, w = [];
    for (var blk = 0; blk < words.length; blk += 16) {
      var a = h0, b = h1, c = h2, d = h3, e = h4;
      for (var t = 0; t < 80; t++) {
        w[t] = t < 16 ? (words[blk + t] | 0) : rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
        var f = t < 20 ? ((b & c) | (~b & d)) + 0x5A827999 : t < 40 ? (b ^ c ^ d) + 0x6ED9EBA1 :
          t < 60 ? ((b & c) | (b & d) | (c & d)) + 0x8F1BBCDC : (b ^ c ^ d) + 0xCA62C1D6;
        var tmp = (rotl(a, 5) + f + e + w[t]) | 0;
        e = d; d = c; c = rotl(b, 30); b = a; a = tmp;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
    }
    return h0 >>> 0;
  }
  function rotl(x, k) { return (x << k) | (x >>> (32 - k)); }

  function cpair(a, b) { return CLASSES.indexOf(a) <= CLASSES.indexOf(b) ? a + '|' + b : b + '|' + a; }

  function candidates(keys, lib) {
    var tags = lib.tags, out = [], ks = Object.keys(keys);
    AXES.forEach(function (ax) {
      var plus = [], minus = [];
      ks.forEach(function (k) {
        var t = tags[k] && tags[k][ax];
        if (!t) return;
        (t.pole === '+' ? plus : minus).push({ k: k, c: keys[k], t: t });
      });
      if (!plus.length || !minus.length) return;
      var cp = {}, cm = {};
      plus.forEach(function (x) { cp[x.c] = 1; });
      minus.forEach(function (x) { cm[x.c] = 1; });
      var tierP = Object.keys(cp).filter(function (c) { return !cm[c]; }).length || 1;
      var tierM = Object.keys(cm).filter(function (c) { return !cp[c]; }).length || 1;
      tierP = Math.min(tierP, 2); tierM = Math.min(tierM, 2);
      plus.forEach(function (A) {
        minus.forEach(function (B) {
          if (A.c === B.c) return;
          var cur = (lib.curated || {})[A.k + '|' + B.k] || (lib.curated || {})[B.k + '|' + A.k] || null;
          out.push({ axis: ax, a: A.k, b: B.k, ca: A.c, cb: B.c, tier_a: tierP, tier_b: tierM, curated: cur,
            score: A.t.strength * B.t.strength * 10 + (tierP + tierM) * 3 + (cur ? 20 : 0) });
        });
      });
    });
    return out;
  }

  function present(c, lib) {
    var ax = c.axis, ta = lib.tags[c.a][ax], tb = lib.tags[c.b][ax], A = lib.axes[ax];
    return { id: ax + ':' + c.a + '|' + c.b, axis: ax, title: A.title, question: A.question === undefined ? null : A.question,
      a: { key: c.a, 'class': c.ca, label: lib.labels[c.a], source_plain: ta.source_plain === undefined ? null : ta.source_plain, pole: A['+'], line: ta.line, tier: c.tier_a },
      b: { key: c.b, 'class': c.cb, label: lib.labels[c.b], source_plain: tb.source_plain === undefined ? null : tb.source_plain, pole: A['-'], line: tb.line, tier: c.tier_b },
      bridge: lib.bridges[ax][cpair(c.ca, c.cb)], curated: !!c.curated };
  }

  function pick(ch, lib, n) {
    n = n || 3;
    var keys = resolve(ch), seed = ch.input.date + '|' + (ch.input.time || '');
    var cs = candidates(keys, lib);
    cs.forEach(function (c) { c.h = sha1hex8(seed + c.a + c.b); });
    cs.sort(function (x, y) { return (y.score - x.score) || (x.h - y.h); });
    var res = [], used = {};
    for (var i = 0; i < cs.length && res.length < n; i++) {
      if (used[cs[i].axis]) continue;
      used[cs[i].axis] = 1;
      res.push(present(cs[i], lib));
    }
    return res;
  }

  function agree(ch, lib) {
    var keys = resolve(ch), tags = lib.tags, best = null;
    AXES.forEach(function (ax) {
      ['+', '-'].forEach(function (pole) {
        var ks = Object.keys(keys).filter(function (k) { return tags[k] && tags[k][ax] && tags[k][ax].pole === pole; });
        if (!ks.length) return;
        var cls = {}, s = 0;
        ks.forEach(function (k) { cls[keys[k]] = 1; s += tags[k][ax].strength; });
        var sc = [Object.keys(cls).length, s];
        if (!best || sc[0] > best.sc[0] || (sc[0] === best.sc[0] && sc[1] > best.sc[1])) best = { sc: sc, ax: ax, pole: pole, ks: ks };
      });
    });
    if (!best) return null;
    var ax = best.ax;
    best.ks.sort(function (x, y) {
      return (tags[y][ax].strength - tags[x][ax].strength) || (CLASSES.indexOf(keys[x]) - CLASSES.indexOf(keys[y])) || (x < y ? -1 : x > y ? 1 : 0);
    });
    var q = lib.axes[ax].question;
    return { axis: ax, title: lib.axes[ax].title, question: q === undefined ? null : q, pole: lib.axes[ax][best.pole], tier: best.sc[0],
      keys: best.ks.slice(0, 3).map(function (k) { var sp = tags[k][ax].source_plain;
        return { key: k, 'class': keys[k], label: lib.labels[k], source_plain: sp === undefined ? null : sp, line: tags[k][ax].line }; }) };
  }

  var AGD = { version: 1, resolve: resolve, pick: pick, agree: agree, _sha1hex8: sha1hex8 };
  if (typeof module !== 'undefined' && module.exports) module.exports = AGD;
  root.AGD = AGD;
})(typeof window !== 'undefined' ? window : globalThis);
