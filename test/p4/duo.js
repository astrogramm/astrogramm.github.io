/* Astrogramm · window.AGDUO — free part of the pair (#12, 29.09.2026)
 *
 * Keys of the pair bank (duo_*, bank/tz/2-13_pair_v1.md) that the phone can compute without the server: the «цикл»
 * class of the pair — bazi of the pair, Tzolkin of the pair, gua of the pair. Port of skills/astrogramm-core/pair.py
 * (bazi_pair, tzolkin_pair, gua_pair) + skills/astrogramm-prompts/pair/duo.py select(); synastry and Human Design of
 * the pair (class «планеты») stay on the server — they are part of the paid pair reading.
 * Parity with duo.py: app/native/tests/duo_check.py (random pairs, keys and order must be equal).
 *
 * Input for each person: {p: {hour, day, month, year} — pillars 'StemBranch' (hour may be null when the time is
 * unknown: then the hour pillar takes no part), kin: 1..260, gua: 1..9}.
 *   AGDUO.keys(A, B)  → [{key, why}]           free keys in duo.py order
 *   AGDUO.facts(A, B) → {god_ab, god_ba, cycle, day: {a, b, rel: [...], same}, combo, trios: [...], kin_rel: [...],
 *                        same_tone, same_seal, same_color, kin_pair, gua: {a, b, same}}
 */
(function () {
  'use strict';
  var GAN = '甲乙丙丁戊己庚辛壬癸', ZHI = '子丑寅卯辰巳午未申酉戌亥';
  var ANIM = ['Крыса', 'Бык', 'Тигр', 'Кролик', 'Дракон', 'Змея', 'Лошадь', 'Коза', 'Обезьяна', 'Петух', 'Собака', 'Свинья'];
  var ELS = ['Дерево', 'Огонь', 'Земля', 'Металл', 'Вода'];
  var PILL = ['hour', 'day', 'month', 'year'];
  var PILL_RU = { hour: 'час', day: 'день', month: 'месяц', year: 'год' };
  var STEM_COMBO = { '甲己': 'Земля', '乙庚': 'Металл', '丙辛': 'Вода', '丁壬': 'Дерево', '戊癸': 'Огонь' };
  var COMBO_KEY = { 'Земля': 'earth', 'Металл': 'metal', 'Вода': 'water', 'Дерево': 'wood', 'Огонь': 'fire' };
  var SIX = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
  var CLASH = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
  var HARM = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌'];
  var PUN2 = ['子卯'];
  var PUN_PART = ['寅巳', '巳申', '寅申', '丑戌', '戌未', '丑未'];
  var PUN3 = ['寅巳申', '丑戌未'];
  var TRIO = [['申子辰', 'Вода'], ['亥卯未', 'Дерево'], ['寅午戌', 'Огонь'], ['巳酉丑', 'Металл']];
  var NOBLE = { '甲': '丑未', '戊': '丑未', '庚': '丑未', '乙': '子申', '己': '子申', '丙': '亥酉', '丁': '亥酉', '壬': '卯巳', '癸': '卯巳', '辛': '寅午' };
  var PEACH = {}; [['寅午戌', '卯'], ['申子辰', '酉'], ['巳酉丑', '午'], ['亥卯未', '子']].forEach(function (x) { x[0].split('').forEach(function (z) { PEACH[z] = x[1]; }); });
  var GOD_KEY = { 'Опора': 'friend', 'Соперник': 'rob_wealth', 'Выход-творчество': 'eating_god', 'Выход-бунт': 'hurting_officer',
    'Деньги косвенные': 'indirect_wealth', 'Деньги прямые': 'direct_wealth', 'Пресс жёсткий': 'seven_killings',
    'Долг и власть': 'direct_officer', 'Ресурс нестандартный': 'indirect_resource', 'Ресурс тёплый': 'direct_resource' };
  var DAY = { 'союз': 'he', 'столкновение': 'chong', 'вред': 'hai' };
  var EAST = [1, 3, 4, 9];

  function tenGod(dm, g) {                                  // chart.py ten_god (= engine/src/day.js tenGodName)
    var a = GAN.indexOf(dm), b = GAN.indexOf(g), ea = a >> 1, eb = b >> 1, same = a % 2 === b % 2;
    if (ea === eb) return same ? 'Опора' : 'Соперник';
    if ((ea + 1) % 5 === eb) return same ? 'Выход-творчество' : 'Выход-бунт';
    if ((ea + 2) % 5 === eb) return same ? 'Деньги косвенные' : 'Деньги прямые';
    if ((eb + 2) % 5 === ea) return same ? 'Пресс жёсткий' : 'Долг и власть';
    return same ? 'Ресурс нестандартный' : 'Ресурс тёплый';
  }
  function br(X) { var o = {}; PILL.forEach(function (k) { if (X.p[k]) o[k] = X.p[k].charAt(1); }); return o; }
  function vals(o) { return Object.keys(o).map(function (k) { return o[k]; }); }
  function between(ba, bb, pairs, kind) {                  // pair.py _pairs_between (pillar order час, день, месяц, год)
    var out = [];
    PILL.forEach(function (pa) {
      PILL.forEach(function (pb) {
        var za = ba[pa], zb = bb[pb]; if (!za || !zb || za === zb) return;
        pairs.forEach(function (uv) { if ((uv[0] === za && uv[1] === zb) || (uv[0] === zb && uv[1] === za)) out.push({ kind: kind, z: za + zb, pa: pa, pb: pb }); });
      });
    });
    return out;
  }
  function kinOf(tone, seal) { for (var k = 1; k <= 260; k++) if ((k - 1) % 13 + 1 === tone && (k - 1) % 20 + 1 === seal) return k; return null; }
  function oracle(kin) {                                    // chart.py oracle (without «ведущий»: pair.py skips it)
    var tone = (kin - 1) % 13 + 1, seal = (kin - 1) % 20 + 1, w = function (s) { return ((s - 1) % 20 + 20) % 20 + 1; };
    return [['аналог', kinOf(tone, w(19 - seal))], ['антипод', kinOf(tone, w(seal + 10))], ['оккультный', kinOf(14 - tone, w(21 - seal))]];
  }

  function facts(A, B) {
    var dma = A.p.day.charAt(0), dmb = B.p.day.charAt(0), ba = br(A), bb = br(B);
    var combo = dma !== dmb ? (STEM_COMBO[dma + dmb] || STEM_COMBO[dmb + dma] || null) : null;
    var ia = GAN.indexOf(dma) >> 1, ib = GAN.indexOf(dmb) >> 1, cycle;
    if (ia === ib) cycle = 'same'; else if ((ia + 1) % 5 === ib) cycle = 'a_feeds_b'; else if ((ib + 1) % 5 === ia) cycle = 'b_feeds_a';
    else if ((ia + 2) % 5 === ib) cycle = 'a_controls_b'; else cycle = 'b_controls_a';
    var inter = between(ba, bb, SIX.map(split2), 'союз').concat(between(ba, bb, CLASH.map(split2), 'столкновение'),
      between(ba, bb, HARM.map(split2), 'вред'), between(ba, bb, PUN2.map(split2), 'наказание неучтивости'),
      between(ba, bb, PUN_PART.map(split2), 'наказание (2 из 3)'));
    var va = vals(ba), vb = vals(bb), all = va.concat(vb), trios = [];
    TRIO.forEach(function (t) {
      var s = t[0].split('');
      if (s.every(inArr(all)) && !s.every(inArr(va)) && !s.every(inArr(vb))) trios.push({ type: 'тройка пары', z: t[0], el: t[1] });
    });
    PUN3.forEach(function (t) {
      var s = t.split(''), ha = s.filter(inArr(va)), hb = s.filter(inArr(vb)), both = uniq(ha.concat(hb));
      if (both.length === 3 && ha.length !== 3 && hb.length !== 3) trios.push({ type: 'наказание пары', z: t });
    });
    var day = inter.filter(function (r) { return r.pa === 'day' && r.pb === 'day'; });
    function stars(X, Y) {                                   // pair.py stars_for: stars of X found in the pillars of Y
      var dm = X.p.day.charAt(0), dz = X.p.day.charAt(1), ys = X.p.year.charAt(0), yz = X.p.year.charAt(1), yb = br(Y), res = [];
      [['peach_day', PEACH[dz]], ['peach_year', PEACH[yz]], ['noble_day', NOBLE[dm]], ['noble_year', NOBLE[ys]]].forEach(function (x) {
        var hit = PILL.filter(function (k) { return yb[k] && x[1].indexOf(yb[k]) >= 0; });
        if (hit.length) res.push({ star: x[0], signs: x[1], hit: hit });
      });
      return res;
    }
    var ka = A.kin, kb = B.kin, rel = [];
    oracle(ka).forEach(function (x) { if (x[1] === kb) rel.push({ who: 'b_of_a', name: x[0] }); });
    oracle(kb).forEach(function (x) { if (x[1] === ka) rel.push({ who: 'a_of_b', name: x[0] }); });
    var sa = (ka - 1) % 20, sb = (kb - 1) % 20;
    return {
      dm: { a: dma, b: dmb }, god_ba: tenGod(dma, dmb), god_ab: tenGod(dmb, dma),   // god_ba — who B is for A
      cycle: cycle, combo: combo, inter: inter,
      day: { a: ba.day, b: bb.day, rel: day.map(function (r) { return r.kind; }), same: ba.day === bb.day },
      trios: trios, stars_a_in_b: stars(A, B), stars_b_in_a: stars(B, A),
      kin_rel: rel, same_tone: (ka - 1) % 13 === (kb - 1) % 13, same_seal: sa === sb, same_color: sa % 4 === sb % 4,
      kin_pair: (ka + kb - 1) % 260 + 1,
      gua: { a: A.gua, b: B.gua, same: (EAST.indexOf(A.gua) >= 0) === (EAST.indexOf(B.gua) >= 0) }
    };
  }
  function split2(s) { return [s.charAt(0), s.charAt(1)]; }
  function inArr(a) { return function (z) { return a.indexOf(z) >= 0; }; }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  function keys(A, B) {                                     // duo.py select(), cycle-class part, same order
    var F = facts(A, B), out = [];
    function add(k, why) { if (!out.some(function (x) { return x.key === k; })) out.push({ key: k, why: why }); }
    add('duo_god_' + GOD_KEY[F.god_ba], 'для 1 другой — ' + F.god_ba);
    add('duo_god_' + GOD_KEY[F.god_ab], 'для 2 другой — ' + F.god_ab);
    if (F.combo) add('duo_combo_' + COMBO_KEY[F.combo], 'союз стволов дня → ' + F.combo);
    F.day.rel.forEach(function (t) { add('duo_day_' + (t.indexOf('наказание') === 0 ? 'xing' : DAY[t]), 'ветви дня: ' + t); });
    if (F.day.same) add('duo_day_same', 'одна ветвь дня');
    F.trios.forEach(function (t) { if (t.type === 'наказание пары') add('duo_xing3_' + (t.z === '寅巳申' ? 'yinsishen' : 'chouxuwei'), 'наказание ' + t.z + ' складывается вдвоём'); });
    // pair.py order: stars of 1 in the pillars of 2, then stars of 2 in the pillars of 1; within: peach day, peach year, noble day, noble year
    [F.stars_a_in_b, F.stars_b_in_a].forEach(function (list) {
      ['peach_day', 'peach_year', 'noble_day', 'noble_year'].forEach(function (nm) {
        list.forEach(function (s) { if (s.star === nm) add(nm.indexOf('noble') === 0 ? 'duo_noble' : 'duo_peach', nm); });
      });
    });
    if (F.same_seal) add('duo_tz_seal', 'одна печать');
    if (F.same_tone) add('duo_tz_tone', 'один тон');
    if (F.same_color) add('duo_tz_color', 'один цвет');
    F.kin_rel.forEach(function (r) {
      [['аналог', 'analog'], ['антипод', 'antipode'], ['оккульт', 'occult']].forEach(function (x) { if (r.name.indexOf(x[0]) >= 0) add('duo_tz_' + x[1], r.name); });
    });
    add(F.gua.same ? 'duo_gua_same' : 'duo_gua_diff', 'гуа ' + F.gua.a + ' и ' + F.gua.b);
    return out;
  }

  var AGDUO = { version: '1.0.0', keys: keys, facts: facts, tenGod: tenGod, ANIM: ANIM, ZHI: ZHI, PILL_RU: PILL_RU };
  if (typeof window !== 'undefined') window.AGDUO = AGDUO;
  if (typeof module !== 'undefined' && module.exports) module.exports = AGDUO;
})();
