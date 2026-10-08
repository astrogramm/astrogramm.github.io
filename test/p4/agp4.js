/* Astrogramm · window.AGP4 — reading inside the app (P4) · #10 wave 3 · contract v1 (DESIGN-SYSTEM §9)
 *
 * Data (bundled next to the page by app/p4/make_bundle.py, no network):
 *   p4/catalog.json          46 spheres: id, title, kit, kit_title; tiers of the sample chart (founder)
 *   p4/sample/sphere_3.1.json the free sample sphere (APP-SPEC §4.1: always the same, founder's chart, «пример разбора»)
 *   p4/readings/<key>/sphere_<id>.json  spheres of a bought reading (wave 4: from Supabase reading_spheres)
 *   p4/founder/sphere_<id>.json the founder's 46 spheres — only next to the web page v12, for the test mode (never in www/iOS)
 * Product rule 29.09 (APP-SPEC §4): one paid product, the full reading. Without it every sphere opens partly: what the
 * sphere looks at (catalog `looks`, CLIENT TEMPLATE v2.1) + free bank cards of this chart for the sphere's systems
 * (window.AGP4_FREE from the page, FREE_BANK, no generation) + one line about the full reading + one buy button.
 * Rendering follows DESIGN-SYSTEM §6 (sphere card) and §3 (tier badge) with the v12 tokens.
 * Uses window.AGN (purchases, locks, distress) when present; without it everything is read-only.
 */
(function () {
  'use strict';
  var W = window, D = document;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function cap(s) { s = String(s || '').trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
  function A() { return W.AGN || null; }
  // texts: UI_RU p4.* through the bridge (AGN.t), fallback — the draft here
  var T0 = {
    'p4.free_note': 'Бесплатно в каждой сфере: что она смотрит и твои открытые карточки по её системам. Полный текст всех 46 — в полном разборе.',
    'p4.looks': 'Что смотрит сфера', 'p4.cards': 'Открыто по твоей карте',
    'p4.cards_none': 'По системам этой сферы открытых карточек нет — они в полном разборе.',
    'p4.full_line': 'В полном разборе: спор систем, ярус, цепочка, рекомендации, вердикт.',
    'p4.buy': 'Полный разбор — {price}', 'p4.buy_note': '{price} разово: все 46 сфер, части 4–10 и PDF. Не подписка.',
    'p4.wait_title': 'Разбор готовится',
    'p4.pair_wait': 'Текст пишется по вашим картам и проходит проверку — это не мгновенно. Статус: {status}. Сферы появятся здесь по мере готовности.',
    'p4.wait': 'Текст пишется по твоей карте и проходит проверку — это не мгновенно. Статус: {status}. Сферы появятся здесь по мере готовности.',
    'p4.wait_toc': 'Разбор готовится: сферы появятся по мере готовности.',
    'p4.pair_cap': 'Вы вдвоём', 'p4.pair_lead': 'Что возникает между вами: где вы усиливаете друг друга и где трётесь. Без процентов «совместимости» и прогнозов, чем закончится союз.',
    'p4.pair_who': 'Кто вы друг для друга', 'p4.pair_for_a': '{b} для тебя', 'p4.pair_for_b': 'Как тебя видит {b}',
    'p4.pair_today': 'Сегодня у вас двоих', 'p4.pair_between': 'Что между вами', 'p4.pair_spheres': '12 сфер пары',
    'p4.pair_free_note': 'Бесплатно в каждой сфере: что она смотрит и ваши открытые карточки. Полный текст — в разборе пары.',
    'p4.pair_cards': 'Открыто по вашей паре', 'p4.pair_cards_none': 'Открытых карточек для этой сферы нет — они в разборе пары.',
    'p4.pair_full_line': 'В разборе пары: синастрия, связи систем, ярус, горящие точки, рекомендации для двоих, вердикт.',
    'p4.pair_buy': 'Разбор пары — {price}', 'p4.pair_buy_note': '{price} разово: 12 сфер пары, фон на 12 месяцев, вердикт союза и PDF. Не подписка.',
    'p4.pair_minor': 'Разбор пары доступен, когда обоим есть 18.', 'p4.pair_final': 'Итог: горящие точки, фон на год, вердикт союза',
    'p4.pair_wait_title': 'Разбор пары готовится', 'p4.pair_wait_toc': 'Разбор пары готовится: сферы появятся по мере готовности.',
    // #15: «части 4–10» словами; пара не-партнёров — без романтики и слова «союз» (черновики, итог — #16 в UI_RU)
    'p4.buy_note2': '{price} разово: все 46 сфер, связи между системами, план на год, горящие точки, итоговый вердикт и PDF. Не подписка.',
    'p4.pair_lead_other': 'Что возникает между вами: где вы усиливаете друг друга и где трётесь. Без процентов и прогнозов.',
    'p4.pair_spheres_other': 'Сферы пары', 'p4.pair_buy_note_other': '{price} разово: сферы пары, фон на 12 месяцев, итог и PDF. Не подписка.',
    'p4.pair_final_other': 'Итог: горящие точки и фон на год',
    'p4.about': 'О чём эта сфера', 'p4.systems': 'Смотрят системы: {list}', 'p4.systems_nt': 'Без времени рождения — без Дизайна человека и домов гороскопа.',
    'p4.pair_full_line2': 'В разборе пары: сравнение натальных карт, связи систем, насколько надёжен каждый вывод, горящие точки, советы для двоих и итог.',
    'p4.cards_more': 'Ещё карточки твоей карты · {n}',
    'p4.pair_mutual': 'Друг для друга',
    'p4.teaser3': 'По твоей карте в тему «{title}» уже идут расчёты {n} разных систем: {list}. Разбор сведёт их в один текст: где они совпадают — опора, где расходятся — твой выбор, и к каждому выводу — что делать.',
    'p4.todo_label': 'Что с этим делать', 'p4.teaser_h': 'Что сойдётся в полном разборе', 'p4.teaser2': 'В разборе темы «{title}» эти системы сводятся в один текст: где они совпадают — опора, где расходятся — твой выбор, и к каждому выводу — что делать.', 'p4.teaser_tail': 'Разбор сведёт это в один текст: где источники согласны, где спорят и что с этим делать.',
    'p4.pair_only': 'Только в разборе пары',
    'p4.rel_q': 'Кто это тебе? От этого зависят названия сфер пары.',
    'p4.status.queued': 'в очереди', 'p4.status.writing': 'пишется', 'p4.status.review': 'на проверке', 'p4.status.ready': 'готова'
  };
  // 1.0 without purchases (AGN.flags.iap false, decision 01.10): buy buttons and locks are off through
  // purchases.buttonsVisible(); lines that promise the full reading take UI_RU p4.soon.* («скоро в приложении», no price)
  function iapOn() { var a = A(); return !!(a && a.flags && a.flags.iap); }
  function tx(key, vars) {
    if (!iapOn() && key.indexOf('p4.') === 0) {
      var so = uiP4('soon'), k2 = key.slice(3);
      if (so && typeof so[k2] === 'string') return so[k2].replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
    }
    var a = A(), s = a && a.t ? a.t(key, vars) : key;
    if (s === key) s = ((key.indexOf('p4.') === 0 && typeof uiP4(key.slice(3)) === 'string' && uiP4(key.slice(3))) || T0[key] || key).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
    return s;
  }
  function priceFull() { var a = A(); return a && a.purchases.price ? a.purchases.price('ag_reading_full') : '$39'; }
  function testOn() { var a = A(); return !!(a && a.test && a.test.on()); }
  var BASE = (W.AGP4_BASE || 'p4/');

  var TIER_CAP = { 3: 'Сходятся три независимых источника', 2: 'Сходятся два независимых источника', 1: 'Один источник' };
  var TIER_TXT = {
    3: 'Этот вывод видно из трёх независимых источников сразу: планет, чисел и циклов. На это можно полагаться.',
    2: 'Вывод подтверждают два независимых источника из трёх. Скорее всего так, но сверь с жизнью.',
    1: 'Вывод виден только из одного источника. Это нюанс, а не опора для решений.'
  };
  var CLASS_TXT = { 'цикл': 'циклы', 'цифры': 'числа', 'планеты': 'планеты' };
  var LINES = { 3: 'M4 13v-3 M8 13v-6 M12 13v-9', 2: 'M4 13v-3 M8 13v-6', 1: 'M4 13v-3' }, DIM = { 3: '', 2: 'M12 13v-9', 1: 'M8 13v-6 M12 13v-9' };   // #15: столбики «сигнала»
  // #15: уровень словами рядом с линиями (у сферы); в оглавлении — только линии
  var TIER_WORD = { 3: 'три разные системы', 2: 'две разные системы', 1: 'одна система' };
  function badge(n, words) {
    if (!LINES[n]) return '';
    var tw = (W.W3 && W.W3.TIER_WORD) || TIER_WORD;
    return '<button class="yb t' + n + ' agp-yb" data-tier="' + n + '" aria-label="достоверность: ' + n + ' из 3, подробнее"><i><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="' + LINES[n] + '"/>' + (DIM[n] ? '<path d="' + DIM[n] + '" opacity=".28"/>' : '') + '</svg></i>' + (words ? '<span class="ybw">' + esc(tw[n]) + '</span>' : '') + '</button>';
  }
  var LOCK = '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>';

  var CSS = '.agp{font-family:var(--font-body,system-ui,sans-serif);color:var(--text,#ece7f6)}'
    + '.agp-kit{margin:18px 0 6px;display:flex;align-items:baseline;justify-content:space-between;gap:8px}'
    + '.agp-kit h4{margin:0;font:600 11.5px var(--font-body,system-ui,sans-serif);letter-spacing:.1em;text-transform:uppercase;color:var(--gold,#e9c46a)}'
    + '.agp-kit span{font-size:12px;color:var(--muted,#a097c3)}'
    + '.agp-row{display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 0;border-bottom:1px solid var(--line-soft,rgba(236,231,246,.08));cursor:pointer}'
    + '.agp-row .n{font-size:12px;color:var(--dim,#6f6892);width:30px;font-variant-numeric:tabular-nums}.agp-row .tt{flex:1;min-width:0}.agp-row .lk{color:var(--muted,#a097c3)}'
    + '.agp-row.open .tt{color:var(--gold-light,#ffd76b)}.agp-sample{margin:10px 0 4px;padding:12px 14px;border:1px solid var(--line,rgba(201,169,74,.22));border-radius:var(--r-card,16px);cursor:pointer;background:var(--surface,#151033)}'
    + '.agp-sample b{font-family:var(--font-display,Georgia,serif);font-size:19px;font-weight:600}.agp-note{font-size:13px;color:var(--muted,#a097c3);margin:6px 0}'
    + '.agp-scr{position:fixed;inset:0;z-index:8500;background:var(--bg,#0a0820);overflow-y:auto;-webkit-overflow-scrolling:touch}'
    + '.agp-in{max-width:560px;margin:0 auto;padding:max(12px,env(safe-area-inset-top)) 16px max(28px,env(safe-area-inset-bottom))}'
    + '.agp-top{display:flex;justify-content:space-between;align-items:center;min-height:44px}.agp-top button{background:none;border:0;color:var(--muted,#a097c3);font-size:15px;min-height:44px;cursor:pointer}'
    + '.agp-cap{font-size:12px;color:var(--muted,#a097c3);letter-spacing:.04em}.agp-h1{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}'
    + '.agp-h1 h1{font-family:var(--font-display,Georgia,serif);font-weight:600;font-size:36px;line-height:1.08;margin:4px 0 8px;text-wrap:balance}'
    + '.agp-state{font-size:13px;color:var(--muted,#a097c3);margin:0 0 10px}'
    + '.agp-sit{font-family:var(--font-display,Georgia,serif);font-weight:500;font-size:21px;line-height:1.35;margin:6px 0 18px}'
    + '.agp-sec{font:600 11.5px var(--font-body,system-ui,sans-serif);letter-spacing:.1em;text-transform:uppercase;color:var(--gold,#e9c46a);margin:20px 0 8px}'
    + '.agp-pl{background:var(--surface,#151033);border-radius:var(--r-inner,12px);padding:12px 14px;margin:0 0 8px}.agp-pl .cl{font-size:12px;color:var(--muted,#a097c3);display:block;margin-bottom:4px}'
    + '.agp-vs{text-align:center;font-family:var(--font-display,Georgia,serif);font-style:italic;color:var(--gold-light,#ffd76b);margin:2px 0 8px}'
    + '.agp-hot{margin:0 0 12px}.agp-hot b{display:block;color:var(--gold-light,#ffd76b);font-weight:600}.agp-yb{background:none;border:0;padding:0;margin:0;color:inherit;cursor:pointer;font:inherit}.agp-hot .act{margin-top:4px}'
    + '.agp-verd{position:relative;margin:26px 4px 18px;padding:22px 16px 16px;border:1px solid var(--gold-deep,#c9a94a);outline:1px solid var(--gold-deep,#c9a94a);outline-offset:4px;text-align:center}'
    + '.agp-verd:before{content:"✦";position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--bg,#0a0820);padding:0 8px;color:var(--gold,#e9c46a)}'
    + '.agp-verd small{display:block;font:600 11px var(--font-body,system-ui,sans-serif);letter-spacing:.12em;color:var(--gold,#e9c46a);margin-bottom:8px}'
    + '.agp-syn{border-left:2px solid var(--gold,#d4a843);padding:2px 0 2px 12px;margin:0 0 14px}.agp-syn p{margin:0 0 8px}.agp-syn-h{display:flex;align-items:center;gap:8px}.agp-syn-l{margin:0 0 10px;padding:0 0 0 16px}.agp-syn-l li{margin:0 0 4px}.agp-syn-same{color:var(--muted,#a097c3)}.agp-tint{margin:0 0 12px}.agp-pull a{color:var(--gold-light,#ffd76b)}'
    + '.agp-verd p{font-family:var(--font-display,Georgia,serif);font-style:italic;font-weight:500;font-size:22px;line-height:1.3;color:var(--gold-light,#ffd76b);margin:0}'
    + '.agp-acc{border-top:1px solid var(--line-soft,rgba(236,231,246,.08))}.agp-acc summary{list-style:none;display:flex;justify-content:space-between;align-items:center;min-height:48px;cursor:pointer;font-weight:500}'
    + '.agp-acc summary::-webkit-details-marker{display:none}.agp-acc summary:after{content:"+";color:var(--gold,#e9c46a);font-size:20px}.agp-acc[open] summary:after{content:"–"}'
    + '.agp-acc .bd{padding:0 0 14px;white-space:pre-line}.agp-acc ul{margin:0;padding-left:18px}'
    + '.agp-tip{background:var(--surface-2,#1f1842);border:1px solid var(--line,rgba(201,169,74,.22));border-radius:var(--r-inner,12px);padding:12px 14px;margin:8px 0}'
    + '.agp-btn{display:block;width:100%;min-height:48px;border-radius:12px;border:1px solid var(--gold,#e9c46a);background:var(--gold,#e9c46a);color:var(--ink,#0a0820);font:600 16px var(--font-body,system-ui,sans-serif);cursor:pointer;margin-top:12px}';
  function ensureCss() { if (D.getElementById('agp-css')) return; var s = D.createElement('style'); s.id = 'agp-css'; s.textContent = CSS; (D.head || D.documentElement).appendChild(s); }

  // ------------------------------------------------------------------ data
  var cat = null, catP = null, cache = {};
  function getJSON(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }); }
  function catalog() { if (cat) return Promise.resolve(cat); catP = catP || getJSON(BASE + 'catalog.json').then(function (c) { cat = c; return c; }); return catP; }
  function isSample(profile) { return !!(cat && profile && cat.sample_chart && profile.d === cat.sample_chart.d && (profile.t || '') === cat.sample_chart.t); }
  function sphereJSON(id, profile, sample) {
    var key = sample ? 'sample/' + id : 'readings/' + encodeURIComponent(A() ? A().purchases.chartKey(profile) : '') + '/' + id;
    if (cache[key]) return Promise.resolve(cache[key]);
    var url = sample ? BASE + 'sample/sphere_' + id + '.json' : BASE + 'readings/' + encodeURIComponent(A().purchases.chartKey(profile)) + '/sphere_' + id + '.json';
    return getJSON(url).then(function (j) { cache[key] = j; return j; });
  }
  function owned(profile) { var a = A(); return !!(a && a.purchases.can('full', { profile: profile })); }
  function founder(profile) { return isSample(profile); }

  // ------------------------------------------------------------------ table of contents (46 spheres by kit)
  // feedback 08.10 (tester): the full card at the bottom of every sphere reads like an error — full card until the sample
  // has been opened once, then one quiet line
  function sampleSeen() { try { return localStorage.getItem('ag_sample_seen') === '1'; } catch (e) { return false; } }
  function sampleCard() {
    if (sampleSeen()) return '<p class="agp-note agp-sample-line"><a href="#" data-sample-open="1">Как выглядит полный текст сферы →</a></p>';
    return '<div class="agp-sample" data-sample-open="1" role="button" tabindex="0"><div class="agp-cap">Пример полного текста · карта основателя</div><b>Сфера ' + esc(cat.sample_id) + ' — ' + esc(cat.sample_title || '') + '</b><div class="agp-note">Так выглядит сфера целиком: все системы вместе — в чём совпадают и о чём спорят, что делать и итог.</div></div>';
  }
  function tocHTML(c, profile, opts) {
    var sample = isSample(profile), a = A(), salesOff = a ? !a.purchases.buttonsVisible() : true, full = owned(profile);
    var tiers = sample ? (c.sample_tiers || {}) : {};
    var h = '<div class="agp-sample" data-open="' + esc(c.sample_id) + '" data-sample="1" role="button"><div class="agp-cap">' + (iapOn() ? 'Пример разбора' : 'Пример сферы') + ' · карта основателя</div><b>Сфера ' + esc(c.sample_id) + ' — ' + esc(c.sample_title) + '</b><div class="agp-note">' + (full ? 'Так выглядит каждая из 46 сфер.' : iapOn() ? 'Открыта бесплатно: так выглядит каждая из 46 сфер.' : 'Так выглядит полный текст сферы.') + '</div></div>';   // #15, баг 9; 1.0: the reading is not a product yet (review 06.10c)
    if (full && !sample) h += '<p class="agp-note">' + esc(tx('p4.wait_toc')) + '</p>';
    else if (!full && !(opts && opts.groups)) h += '<p class="agp-note">' + esc(tx('p4.free_note')) + '</p>';   // #15 (A48): в пути «Карты» это уже сказано вводной шага 5
    // #14: opts.groups — показ по шести группам вопросов человека ({title, what, ids}); без него — киты шаблона v2.1
    var byId = {}; c.spheres.forEach(function (s) { byId[s.id] = s; });
    var blocks = opts && opts.groups ? opts.groups.map(function (g) { return { title: g.title, what: g.what, list: g.ids.map(function (id) { return byId[id]; }).filter(Boolean) }; })
      : c.kits.map(function (k) { return { title: k.title, list: c.spheres.filter(function (s) { return s.kit === k.kit; }) }; });
    blocks.forEach(function (k) {
      var list = k.list;
      var cnt = { 3: 0, 2: 0, 1: 0 }; list.forEach(function (s) { var n = tiers[s.id]; if (cnt[n] != null) cnt[n]++; });
      h += '<div class="agp-kit"><h4>' + esc(k.title) + '</h4><span>' + (list.length + ' ' + (list.length % 10 >= 2 && list.length % 10 <= 4 && (list.length % 100 < 12 || list.length % 100 > 14) ? 'сферы' : (list.length % 10 === 1 && list.length % 100 !== 11 ? 'сфера' : 'сфер')))   /* слова ярусов — только на экране-справке (штаб 29.09) */ + '</span></div>'
        + (k.what ? '<p class="agp-note" style="margin:0 0 4px">' + esc(k.what) + '</p>' : '');
      list.forEach(function (s) {
        var open = full || (sample && s.id === c.sample_id);
        h += '<div class="agp-row' + (open ? ' open' : '') + '" data-open="' + esc(s.id) + '" role="button" tabindex="0">' + (opts && opts.groups ? '' : '<span class="n">' + esc(s.id) + '</span>') + '<span class="tt">' + esc(s.title) + '</span>'
          + (tiers[s.id] ? badge(tiers[s.id]) : '') + (open || salesOff ? '' : '<span class="lk" aria-label="полный текст — в разборе">' + LOCK + '</span>') + '</div>';
      });
    });
    if (!full && !salesOff) h += buyHTML();
    return h;
  }
  // the only buy button (K5: the price is on the button and in the line before it; closing the paywall is one tap)
  function buyHTML() {
    var pr = priceFull();
    return '<p class="agp-note" style="margin-top:14px">' + esc(tx('p4.buy_note2', { price: pr })) + '</p><button class="agp-btn" data-buyfull="1">' + esc(tx('p4.buy', { price: pr })) + '</button>';
  }
  function bindBuy(root, profile, after) {
    var b = root.querySelector('[data-buyfull]'); if (!b) return;
    b.addEventListener('click', function (e) {
      e.stopPropagation(); var a = A(); if (!a) return;
      a.purchases.paywall({ product: 'ag_reading_full', profile: profile }).then(function (r) { if (r && r.bought && after) after(); });
    });
  }
  function renderToc(el, profile, opts) {
    if (!el) return Promise.resolve();
    ensureCss(); el.classList.add('agp'); el.__agpProfile = profile; el.__agpOpts = opts || null;
    return catalog().then(function (c) {
      el.innerHTML = tocHTML(c, profile, opts); el.style.display = '';
      bindBuy(el, profile, function () { renderToc(el, profile, opts); });
      el.onclick = function (e) {
        var yb = e.target.closest && e.target.closest('.agp-yb'); if (yb) { e.stopPropagation(); tierTip(yb); return; }
        if (e.target.closest && e.target.closest('[data-buyfull]')) return;
        var r = e.target.closest && e.target.closest('[data-open]'); if (!r) return;
        open(r.getAttribute('data-open'), r.getAttribute('data-sample') ? { sample: true } : profile);
      };
    }).catch(function (e) { el.style.display = 'none'; if (W.console) console.warn('AGP4 toc', e); });
  }

  // ------------------------------------------------------------------ one sphere (DESIGN-SYSTEM §6)
  function acc(title, body) { return body ? '<details class="agp-acc"><summary>' + esc(title) + '</summary><div class="bd">' + body + '</div></details>' : ''; }
  // #18 (ревью 06.10-final, мелкое 1): пункт «Синтез» образца — «Как это связано», термин вне «Профессионально» — словами
  function plainSyn(t) { return String(t || '').replace(/Селена во втором доме/g, 'Светлая точка карты в зоне денег').replace(/и Селена бьют/g, 'и эта точка бьют'); }
  function sphereHTML(s, meta) {
    meta = meta || {};
    var tl = +s.tier_lines || 0, st = '';
    if (s.state === 'тонкая' || s.thin) st = 'Опора тоньше обычной.';
    if (s.state === 'короткая') st = s.note || 'Эта сфера будет дополнена в следующей версии разбора.';
    if (s.depends_on_time) st += (st ? ' ' : '') + 'Часть выводов зависит от точного времени рождения.';
    var h = '<div class="agp-cap">' + esc(meta.caption || ('Сфера ' + s.id + ' · ' + (s.kit_title || ''))) + '</div>'
      + '<div class="agp-h1"><h1>' + esc(s.title) + '</h1>' + badge(tl, 1) + '</div>'
      + (st ? '<p class="agp-state">' + esc(st) + '</p>' : '')
      + '<p class="agp-sit">' + esc(s.situation) + '</p>';
    if (s.dispute && s.dispute.a) {
      h += '<div class="agp-sec">Где системы спорят</div>'
        + '<div class="agp-pl"><span class="cl">' + esc(CLASS_TXT[s.dispute.a.class] || s.dispute.a.class || '') + '</span>' + esc(cap(s.dispute.a.text)) + '</div>'
        + '<div class="agp-vs">против</div>'
        + '<div class="agp-pl"><span class="cl">' + esc(CLASS_TXT[s.dispute.b.class] || s.dispute.b.class || '') + '</span>' + esc(cap(s.dispute.b.text)) + '</div>'
        + (s.dispute.bridge ? '<p>' + esc(cap(s.dispute.bridge).replace(/([^.!?…»])$/, '$1.')) + '</p>' : '')   // bridge may be a clause of the ◈ sentence (#11);
    } else if (s.converge && s.converge.text) {
      h += '<div class="agp-sec">Где системы сходятся</div><div class="agp-pl">' + esc(s.converge.text)
        + (tl === 3 ? '<span class="cl" style="margin:6px 0 0">спора нет: три независимых пути говорят одно</span>' : '') + '</div>';
    }
    if (s.hot && s.hot.length) {
      h += '<div class="agp-sec">Что делать</div>';
      s.hot.forEach(function (p) {
        if (p.title && p.body) { h += '<div class="agp-hot"><b>' + esc(p.title) + '</b>' + esc(cap(p.body)) + (p.action ? '<div class="act">Действие: ' + esc(p.action) + '</div>' : '') + '</div>'; return; }   // v3 format
        var name = p.point && p.point.length <= 40 && p.text && p.text.indexOf(p.point + ':') === 0 ? p.point : '';
        var body = name ? p.text.slice(name.length + 1).split(/ — | Действие:/)[0].trim() : (p.action ? p.point : p.text);
        h += '<div class="agp-hot">' + (name ? '<b>' + esc(name) + '</b>' : '') + esc(cap(body)) + (p.action ? '<div class="act">Действие: ' + esc(p.action) + '</div>' : '') + '</div>';
      });
    }
    if (s.verdict) h += '<div class="agp-verd"><small>ФИНАЛЬНЫЙ ВЕРДИКТ</small><p>' + esc(s.verdict) + '</p></div>';
    var ch = s.chain || {};
    var chain = s.chain_text ? esc(s.chain_text) : ch.energy ? ['Энергия', 'Качество', 'Событие', 'Действие сейчас'].map(function (l, i) { var v = [ch.energy, ch.quality, ch.event, ch.action][i]; return v ? '<p><b>' + l + ':</b> ' + esc(v) + '</p>' : ''; }).join('') : '';
    h += acc('Ещё рекомендации', s.recs && s.recs.length ? '<ul>' + s.recs.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '')
      + acc('Просто', esc(s.simple)) + acc('Профессионально', esc(s.pro)) + acc('Мосты между системами', esc(s.bridges))
      + acc('Как это связано', esc(plainSyn(s.synthesis))) + acc('Почему такой ярус', esc(s.tier_text)) + acc('Как это разворачивается', chain);
    return h;
  }
  function screen(html, label) {
    ensureCss(); close();
    var el = D.createElement('div'); el.className = 'agp agp-scr'; el.id = 'agp-screen'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', label || 'Сфера');
    el.innerHTML = '<div class="agp-in"><div class="agp-top"><button data-x="1">← Назад</button></div>' + html + '</div>';
    el.addEventListener('click', function (e) {
      if (e.target.getAttribute && e.target.getAttribute('data-x')) { close(); return; }
      var yb = e.target.closest && e.target.closest('.agp-yb'); if (yb) tierTip(yb);
      var so = e.target.closest && e.target.closest('[data-sample-open]'); if (so && cat) { if (e.preventDefault) e.preventDefault(); try { localStorage.setItem('ag_sample_seen', '1'); } catch (x) {} open(cat.sample_id, { sample: true }); return; }
      var dl = e.target.closest && e.target.closest('[data-agp-dispute]');   // «подробнее в споре» — шаг 4 «Карты» (спор карты)
      if (dl) { e.preventDefault(); close(); try { if (W.W3 && W.W3.pathOpen) W.W3.pathOpen(4); } catch (x) {} }
    });
    D.body.appendChild(el); el.scrollTop = 0;
    if (W.W3 && W.W3.polish) try { W.W3.polish(el); } catch (e) {}   // термины по тапу и русская подпись у стволов и ветвей (v12)
    return el;
  }
  function close() { var el = D.getElementById('agp-screen'); if (el) el.parentNode.removeChild(el); }
  function tierTip(yb) {
    var n = +yb.getAttribute('data-tier'), box = yb.closest('.agp-h1,.agp-row') || yb.parentNode, old = D.getElementById('agp-tip');
    if (old) { old.parentNode.removeChild(old); if (old.getAttribute('data-for') === String(n)) return; }
    var tip = D.createElement('div'); tip.id = 'agp-tip'; tip.className = 'agp-tip'; tip.setAttribute('data-for', n);
    tip.innerHTML = '<b>' + esc(TIER_CAP[n]) + '</b><br>' + esc(TIER_TXT[n]);
    box.parentNode.insertBefore(tip, box.nextSibling);
  }
  // bought (or test mode) but the text is not here yet → the honest status of the order (APP-SPEC §5.4)
  function waitHTML(s, profile) {
    return partialHTML(s, profile, true);
  }
  function waitNote(profile) {
    var a = A(), ord = a ? a.purchases.order(profile) : null, st = ord ? ord.status : 'queued';
    return '<p class="agp-sit">' + esc(tx('p4.wait_title')) + '.</p><p class="agp-note">' + esc(tx('p4.wait', { status: tx('p4.status.' + st) })) + '</p>';
  }
  // free partial view: what the sphere looks at + own free bank cards + one line + one button
  var SYS_RU = { natal: 'натальная карта', bazi: 'китайский календарь', matrix: 'Матрица судьбы', hd: 'Дизайн человека', numerology: 'нумерология',
    tzolkin: 'календарь майя', nakshatra: 'накшатры', gua: 'фэн-шуй', vedic: 'накшатры', fengshui: 'фэн-шуй' };   // = review «d» (d89af2a); with AG_SYNTH the names come from syn.looksNames
  // #0 (06.10, review 06.10e п. 1): the list comes from the same source as «Где сходятся системы» — syn.looks (sphere spec
  // + systems of this chart's cards and converging blocks, sfSynthAll) with the same names (p4.syn_sys); no syn — the spec
  function sysLine(s, profile, syn) {
    var nt = !!(profile && profile.nt), ids = syn && syn.looks ? syn.looks : (s.systems || []), nm = syn && syn.looksNames;
    var list = [];
    ids.forEach(function (x, i) { if (!(nt && x === 'hd')) list.push(nm ? nm[i] : (SYS_RU[x] || x)); });
    list = list.filter(function (x, i) { return list.indexOf(x) === i; });
    if (!list.length) return '';
    return '<p class="agp-note">' + esc(tx('p4.systems', { list: list.join(', ') }).replace(/([^.])$/, '$1.')) + (nt && ids.indexOf('hd') >= 0 ? ' ' + esc(tx('p4.systems_nt')) : '') + '</p>';
  }
  // #0 (01.10, A51 #19 п. 4): названия групп систем — UI_RU p4.sys_names; пустая сфера — p4.teaser0 по systems сферы,
  // карточки одной группы — p4.teaser1, двух и больше — p4.teaser3
  var SYS_NAMES0 = { natal: 'планеты', hd: 'планеты', nakshatra: 'планеты', matrix: 'числа даты', numerology: 'числа даты', gua: 'фэн-шуй', bazi: 'китайский календарь', tzolkin: 'календарь майя' };
  function sysNames(list) {
    var m = uiP4('sys_names') || SYS_NAMES0, out = [];
    (list || []).forEach(function (x) { var n = m[x] || SYS_NAMES0[x]; if (n && out.indexOf(n) < 0) out.push(n); });
    return out;
  }
  function andList(a) { return a.length > 1 ? a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1] : a[0] || ''; }
  function teaserText(cards, s, profile) {
    var title = String(s.title || '').toLowerCase();
    if (!(cards || []).length) {
      var nt = !!(profile && profile.nt), names = sysNames((s.systems || []).filter(function (x) { return !(nt && x === 'hd'); }));
      return names.length ? tx('p4.teaser0', { list: andList(names), title: title }) : '';
    }
    var g = sysNames(cards.map(function (k) { return k.sys; }));
    return g.length > 1 ? tx('p4.teaser3', { n: ({ 2: 'двух', 3: 'трёх', 4: 'четырёх', 5: 'пяти' })[g.length] || String(g.length), k: g.length, list: andList(g), title: title })
      : tx('p4.teaser1', { title: title });
  }
  function disputeLine(s, profile, syn) {   // the pull line of «Что видят системы» already links to this dispute — not twice
    try { var d = W.W3 && W.W3.sphereDisputeOf ? W.W3.sphereDisputeOf(profile, s.id) : null;
      if (d && syn && syn.pullLink && syn.pullAxis === d.axis) return '';
      return W.W3 && W.W3.sphereDispute ? W.W3.sphereDispute(profile, s.id) : ''; } catch (e) { return ''; } }
  // #0 (06.10, review 06.10d → 06.10e → 06.10f, HQ decision): free «◈ Что видят системы» — existing bank blocks per system
  // (W.AGP4_SYNTH, app/v12/w3.js → sfSynthAll), not a written synthesis. ≥ 2 classes (M2): up to 3 «system — plain label»,
  // «Здесь системы сходятся: <тема>.» only with a common bank keyword, «тянут в разные стороны» for opposite dispute sides
  // (link to the dispute only when it is in the chart and on this sphere's topic), then the paragraph of one SHOWN item;
  // 1 class — one plain hint line. No method words in this layer.
  // owner decision 06.10 15:43: the block is NOT in 1.0 (package П2) — AGN.flags.synth via agSynth() (build AG_SYNTH=1), default off
  function synthOn() { try { return typeof W.agSynth === 'function' ? !!W.agSynth() : !!(A() && A().flags && A().flags.synth); } catch (e) { return false; } }
  function synthOf(s, profile) { if (!synthOn()) return null; try { return typeof W.AGP4_SYNTH === 'function' ? W.AGP4_SYNTH(profile, s.id) : null; } catch (e) { if (W.console) console.warn('AGP4_SYNTH', e); return null; } }
  function synthHTML(y) {
    if (!y) return '';
    if (y.kind === 'tint') return y.line ? '<p class="agp-note agp-tint">' + esc(y.line) + '</p>' : '';
    if (y.kind !== 'synth' || !(y.items && y.items.length) && !y.text) return '';
    return '<div class="agp-sec agp-syn-h">' + esc(uiP4('syn_h') || '◈ Что видят системы') + ' ' + badge(y.n) + '</div><div class="agp-syn">'
      + (y.items && y.items.length ? '<ul class="agp-syn-l">' + y.items.map(function (x) { return '<li' + (x.same ? ' class="agp-syn-same"' : '') + '><b>' + esc(x.sys) + '</b> — ' + esc(x.label) + '</li>'; }).join('') + '</ul>' : '')
      + (y.agree ? '<p class="agp-note agp-agree">' + esc(y.agree) + '</p>' : '')
      + (y.pull ? '<p class="agp-note agp-pull">' + esc(y.pull) + (y.pullLink ? ' <a href="#" data-agp-dispute="' + esc(y.pullAxis) + '">' + esc(uiP4('syn_pull_more') || 'подробнее в споре') + '</a>' : '') + '</p>' : '')
      + (y.text ? y.text.split(/\n\n/).map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') : '') + '</div>';
  }
  function teaserHTML(cards, s, profile, syn) {
    var p = teaserText(cards, s, profile), dl = disputeLine(s, profile, syn);
    if (!p && !dl) return '';
    return '<div class="agp-sec">' + esc(tx('p4.teaser_h')) + '</div>' + (p ? '<p class="agp-teaser">' + esc(p) + '</p>' : '')
      + (dl ? '<p class="agp-note">' + esc(dl) + '</p>' : '');
  }
  function partialHTML(s, profile, wait) {
    var a = A(), salesOff = a ? !a.purchases.buttonsVisible() : true;
    var cards = [];
    try { if (typeof W.AGP4_FREE === 'function') cards = W.AGP4_FREE(profile, s.systems || [], s.id) || []; } catch (e) { if (W.console) console.warn('AGP4_FREE', e); }
    var h = '<div class="agp-cap">Сфера ' + esc(s.id) + ' · ' + esc(s.kit_title) + '</div><div class="agp-h1"><h1>' + esc(s.title) + '</h1></div>';
    if (wait) h += waitNote(profile);   // куплено, текст пишется: статус сверху, бесплатная часть остаётся
    if (!synthOn()) {   // 1.0 (decision 06.10): sphere as at review «d» (d89af2a), the next version promised once (review 06.10d)
      if (s.about || s.looks) h += '<div class="agp-sec">' + esc(tx(s.about ? 'p4.about' : 'p4.looks')) + '</div><p>' + esc(s.about || s.looks) + '.</p>' + sysLine(s, profile);   // #15: без терминов; системы — отдельной строкой, без часа — без ЧД
      if (!wait) h += teaserHTML(cards, s, profile);   // #15 r10: смысл сферы одной фразой + спор твоей карты по теме этой сферы (1.0: спор — факт, без обещания)
    } else {
      var syn = synthOf(s, profile);
      if (s.about || s.looks) h += '<div class="agp-sec">' + esc(tx(s.about ? 'p4.about' : 'p4.looks')) + '</div><p>' + esc(s.about || s.looks) + '.</p>' + sysLine(s, profile, syn);   // #15: без терминов; системы — отдельной строкой, без часа — без ЧД
      if (!wait && syn && syn.drop) cards = cards.filter(function (k) { return k.key !== syn.key; });   // the convergence paragraph is that card's text — not twice
      if (!wait) h += synthHTML(syn);
      if (!wait && iapOn()) h += teaserHTML(cards, s, profile, syn);   // #15 r10: what the paid reading adds + the chart's dispute on this topic
      else if (!wait) { var dl = disputeLine(s, profile, syn); if (dl) h += '<p class="agp-note">' + esc(dl) + '</p>'; }   // 1.0: the dispute as a fact, no promise
    }
    var card = function (k) { return hierCard(k.key, k.label, k.head, k.body); };
    if (cards.length) h += '<div class="agp-sec">' + esc(tx('p4.cards')) + '</div>';
    if (cards.length) { h += cards.slice(0, 3).map(function (k, i) { var c = card(k); return i ? c : c.replace('<details class="agp-acc agp-card"', '<details open class="agp-acc agp-card"'); }).join('');   // первая — раскрыта   // #15: три ближайшие к сфере, остальные — свёрнуто
      if (cards.length > 3) h += '<details class="agp-acc agp-more"><summary>' + esc(tx('p4.cards_more', { n: cards.length - 3 })) + '</summary><div class="bd" style="padding:0">' + cards.slice(3).map(card).join('') + '</div></details>'; }
    else if (wait || (synthOn() && !iapOn()) || !teaserText(cards, s, profile)) h += '<div class="agp-sec">' + esc(tx('p4.cards')) + '</div><p class="agp-note">' + esc(tx('p4.cards_none')) + '</p>';   // пустую сферу объясняет p4.teaser0, если он показан
    if (wait) return h;
    // 1.0: the next version is promised once per sphere (review 06.10d) — the teaser / empty-sphere note, else p4.full_line at the bottom
    var soonSaid = !iapOn() && (!cards.length || (!synthOn() && !!teaserText(cards, s, profile)));
    if (!soonSaid) h += '<p class="agp-note" style="margin-top:14px">' + esc(tx('p4.full_line')) + '</p>';
    if (!iapOn() && cat && cat.sample_id && s.id !== cat.sample_id) h += sampleCard();   // audit 08.10: instead of «скоро» — open the full text of one sphere (founder chart)
    if (!salesOff) h += buyHTML();
    return h;
  }
  var MINOR_HIDDEN = { '2.4': 1, '4.1': 1, '4.2': 1 };            // APP-SPEC §3.1: до 18 — без этих сфер, и по прямой ссылке тоже
  function minorProfile(p) { try { return !!(p && p.d && typeof W.isMinor === 'function' && W.isMinor(p.d)); } catch (e) { return false; } }
  function open(id, profile) {
    var sampleMode = profile && profile.sample;
    if (!sampleMode && MINOR_HIDDEN[id] && minorProfile(profile)) return Promise.resolve(null);
    return catalog().then(function (c) {
      var s = c.spheres.filter(function (x) { return x.id === id; })[0]; if (!s) throw new Error('no sphere ' + id);
      var sample = sampleMode || (isSample(profile) && id === c.sample_id && !owned(profile));
      if (sample) return sphereJSON(c.sample_id, null, true).then(function (j) { screen(sphereHTML(j, { caption: (iapOn() ? 'Пример разбора' : 'Пример сферы') + ' · карта основателя · сфера ' + j.id }), j.title); });
      if (owned(profile)) {
        // test mode on the founder's chart: the whole accepted reading (clients/kovalbeka, 46 spheres)
        var show = function (j) { if (!j || j.state === 'короткая') { screen(waitHTML(s, profile), s.title); return; }   // недописанная сфера — «готовится», а не заглушка
          j = Object.assign({}, j, { title: s.title, kit_title: s.kit_title }); screen(sphereHTML(j), j.title); };   // название — как в списке сфер
        if (testOn() && founder(profile)) return founderJSON(id).then(show)
          .catch(function () { screen(waitHTML(s, profile), s.title); });
        if (testOn()) {   // audit 08.10: test mode on another chart — no false «в очереди»; the founder's sphere as an honest example
          return founderJSON(id).then(function (j) { j = Object.assign({}, j, { title: s.title, kit_title: s.kit_title });
            screen(sphereHTML(j, { caption: 'Пример полного текста · карта основателя. Для этой карты полный разбор не заказан' }), j.title); })
            .catch(function () { screen('<p class="agp-note">Для этой карты полный разбор не заказан — ниже бесплатная часть сферы.</p>' + partialHTML(s, profile), s.title); }); }   // bundle without the founder's spheres (store build)
        return sphereJSON(id, profile, false).then(show)
          .catch(function () { screen(waitHTML(s, profile), s.title); });   // bought, text not delivered yet → honest status
      }
      var el = screen(partialHTML(s, profile), s.title);
      bindBuy(el, profile, function () { open(id, profile); });
    });
  }
  function founderJSON(id) {
    var key = 'founder/' + id; if (cache[key]) return Promise.resolve(cache[key]);
    return getJSON(BASE + 'founder/sphere_' + id + '.json').then(function (j) { cache[key] = j; return j; });
  }

  // ================================================================== pair «Вы вдвоём» (#12, 29.09, PAIR-SPEC, APP-SPEC §4)
  // Free: who you are for each other (gods of the day masters), what is between you (the «цикл» blocks of the pair bank
  // computed on the phone by AGDUO = duo.py), today for both, 12 spheres of the pair partly (what the sphere looks at +
  // own free cards). Paid: «Разбор пары» ($29, ag_reading_pair) — 12 spheres in full, synastry, final part, PDF.
  // Data from the page: window.AGP4_PAIR(a, b) → {A, B (AGDUO input), nameA, nameB, minor, today:{a,b}}.
  var pcat = null, pcatP = null, pfree = null, pfounder = null;
  function pairCatalog() {
    if (pcat) return Promise.resolve(pcat);
    pcatP = pcatP || Promise.all([getJSON(BASE + 'pair/catalog.json'), getJSON(BASE + 'pair/duo_free.json')])
      .then(function (r) { pcat = r[0]; pfree = r[1]; return pcat; });
    return pcatP;
  }
  function samePD(p, q) { return !!(p && q && p.d === q.d && (p.t || '') === (q.t || '')); }
  function isSamplePair(a, b) { var s = pcat && pcat.sample; return !!(s && ((samePD(a, s.a) && samePD(b, s.b)) || (samePD(a, s.b) && samePD(b, s.a)))); }
  function pairOwned(a, b) { var x = A(); return !!(x && x.purchases.can('pair', { profile: a, partner: b })); }
  var ROMANTIC = { 'П1': 1, 'П6': 1 };                        // under 18 — no romance (AI-SAFETY §2, §6); #15: only for a partner
  // #15 (решение штаба 30.09 08:40): «кто это тебе» — партнёр / родные / друг / коллега. Не партнёру — без П1, П6, «химии»,
  // звезды обаяния и слова «союз»: нейтральные названия и строки.
  function romantic(D) { return D.rel === 'partner' && !D.minor; }
  var NEUTRAL_TITLE = { 'П10': 'Трудные периоды и рост', 'П12': 'Смысл этой связи' };
  function neutral(s) { return String(s || '').replace(/союз стволов дня/g, 'сочетание стволов дня').replace(/союзы ветвей/g, 'сочетания ветвей')
    .replace(/этот союз/g, 'эта связь').replace(/союза/g, 'связи').replace(/союз/g, 'связь'); }
  function uiP4(k) { try { var u = typeof UI_RU !== 'undefined' ? UI_RU : W.UI_RU; return u && u.p4 && u.p4[k]; } catch (e) { return null; } }
  function sph(s, D) { if (romantic(D) || !s) return s; var nt = uiP4('pair_titles_other') || NEUTRAL_TITLE; return { id: s.id, title: nt[s.id] || NEUTRAL_TITLE[s.id] || neutral(s.title), looks: neutral(s.looks), about: s.about, prefs: s.prefs }; }
  function relHTML(D) {
    if (D.rel || !(W.W3 && W.W3.relChips)) return '';
    return '<div class="agp-sec">' + esc(tx('p4.rel_q')) + '</div>' + W.W3.relChips('', 'data-prel');
  }
  var GOD_LINE = {
    'Опора': 'похожий характер: рядом с этим человеком опираешься на себя', 'Соперник': 'похожий характер, но другой темп: рядом легко соревноваться',
    'Выход-творчество': 'рядом с этим человеком легче выражать себя мягко', 'Выход-бунт': 'рядом с этим человеком тянет говорить прямо и ломать шаблоны',
    'Деньги косвенные': 'через этого человека приходят сделки и случай', 'Деньги прямые': 'с этим человеком легче зарабатывать своим трудом',
    'Пресс жёсткий': 'этот человек даёт давление, вызов и дисциплину', 'Долг и власть': 'этот человек задаёт рамку: правила и ответственность',
    'Ресурс нестандартный': 'от этого человека приходят неожиданные знания и поддержка', 'Ресурс тёплый': 'от этого человека приходит тёплая поддержка'
  };
  var CAP_RU = { 'Бацзы пары': 'по китайскому календарю', 'Гуа пары': 'по фэн-шуй', 'Цолкин пары': 'по календарю майя', 'Матрица пары': 'по Матрице судьбы',
    'Нумерология пары': 'по нумерологии', 'Синастрия': 'по натальным картам', 'Накшатры пары': 'по накшатрам' };
  var GOD_LINE_B = {
    'Опора': 'похожий характер: рядом с тобой этот человек опирается на себя', 'Соперник': 'похожий характер, но другой темп: с тобой легко соревноваться',
    'Выход-творчество': 'рядом с тобой этому человеку легче выражать себя', 'Выход-бунт': 'рядом с тобой этого человека тянет говорить прямо и ломать шаблоны',
    'Деньги косвенные': 'через тебя к этому человеку приходят сделки и случай', 'Деньги прямые': 'с тобой этому человеку легче зарабатывать трудом',
    'Пресс жёсткий': 'ты для этого человека — вызов и дисциплина', 'Долг и власть': 'ты задаёшь этому человеку рамку: правила и ответственность',
    'Ресурс нестандартный': 'от тебя этот человек получает неожиданные знания и поддержку', 'Ресурс тёплый': 'от тебя этот человек получает тёплую поддержку'
  };
  function godLineB(g) { var s = GOD_LINE_B[g] || GOD_LINE[g] || g || ''; return s.charAt(0).toUpperCase() + s.slice(1) + '.'; }
  function godLine(g) { var s = GOD_LINE[g] || g || ''; return s.charAt(0).toUpperCase() + s.slice(1) + '.'; }
  function pairCards(s, keys) {
    var have = {}; (keys || []).forEach(function (k) { have[k.key] = 1; });
    var cards = [], n = 0;
    (s.prefs || []).forEach(function (p) { Object.keys(have).forEach(function (k) { if (k.indexOf(p) === 0 && cards.indexOf(k) < 0 && n < 5 && pfree && pfree[k]) { cards.push(k); n++; } }); });
    return cards;
  }
  function pdata(a, b) { try { return typeof W.AGP4_PAIR === 'function' ? W.AGP4_PAIR(a, b) : null; } catch (e) { if (W.console) console.warn('AGP4_PAIR', e); return null; } }
  function cardHTML(k, label) {
    var b = pfree && pfree[k]; if (!b) return '';
    var t = String(b[0]), i = t.indexOf(': '), cap = label || (i > 0 && i < 30 ? t.slice(0, i) : ''), head = i > 0 && i < 30 ? t.slice(i + 2) : t;
    cap = CAP_RU[cap] || cap; head = head.replace(/\s*[\u3400-\u9fff]+/g, ''); if (W.W3 && W.W3.termWords) head = W.W3.termWords(head);
    var dash = head.indexOf(' — '); if (dash > 0 && dash < 45) { head = head.slice(dash + 3); head = head.charAt(0).toUpperCase() + head.slice(1); }   // «Столкновение дворцов дня — движение…» → «Движение…»   // #15: подпись системы словами, иероглиф — в тексте по тапу   // «Бацзы пары: …» → подпись + заголовок
    return hierCard(k, cap, head, b[1]);
  }
  // #15 · иерархия карточки (DESIGN-SYSTEM v1.2 §2.8): вывод-заголовок → как проявляется → «Что с этим делать» → сноска-источник
  function hierCard(key, cap, head, body) {
    var hm = /^(.{2,70}?): (.+)$/.exec(String(head || '')), fact = hm ? hm[1] + '.' : '';   // «Гора: Не теряешь голову…» → вывод «Не теряешь голову…», факт «Гора.»
    if (hm) head = hm[2].charAt(0).toUpperCase() + hm[2].slice(1);
    var b = String(body || ''), m = /\s*Что делать:\s*/.exec(b), how = m ? b.slice(0, m.index) : b, todo = m ? b.slice(m.index + m[0].length) : '';
    return '<details class="agp-acc agp-card" data-key="' + esc(key) + '"><summary><span class="agp-hh">' + esc(head) + '</span></summary><div class="bd">'
      + (fact ? '<div class="pcmine">' + esc(fact) + '</div>' : '') + (how.trim() ? '<div class="pchow">' + esc(how.trim()) + '</div>' : '')
      + (todo.trim() ? '<div class="pctodo"><div class="pcl">' + esc(tx('p4.todo_label')) + '</div><div class="pct">' + esc(todo.trim().charAt(0).toUpperCase() + todo.trim().slice(1)) + '</div></div>' : '')
      + (cap ? '<div class="w3foot"><span class="pci" aria-hidden="true">ⓘ</span>' + esc(cap) + '</div>' : '') + '</div></details>';
  }
  D.addEventListener('click', function (e) {   // открыта одна карточка
    var sm = e.target && e.target.closest && e.target.closest('details.agp-card>summary'); if (!sm) return;
    var d = sm.parentNode, box = d.parentNode; if (d.open || !box) return;
    box.querySelectorAll('details.agp-card[open]').forEach(function (o) { if (o !== d) o.open = false; });
  }, true);
  function pairBuyHTML(minor, D) {
    if (minor) return '<p class="agp-note" style="margin-top:14px">' + esc(tx('p4.pair_minor')) + '</p>';
    var pr = A() && A().purchases.price ? A().purchases.price('ag_reading_pair') : '$29';
    return '<p class="agp-note" style="margin-top:14px">' + esc(tx(D && !romantic(D) ? 'p4.pair_buy_note_other' : 'p4.pair_buy_note', { price: pr })) + '</p><button class="agp-btn" data-buypair="1">' + esc(tx('p4.pair_buy', { price: pr })) + '</button>';
  }
  function bindPairBuy(el, a, b, D, after) {
    var bt = el.querySelector('[data-buypair]'); if (!bt) return;
    bt.addEventListener('click', function (e) {
      e.stopPropagation(); var x = A(); if (!x) return;
      x.purchases.paywall({ product: 'ag_reading_pair', profile: a, partner: b, minor: D.minor, nameA: D.nameA, nameB: D.nameB, rel: D.rel || '' })
        .then(function (r) { if (r && r.bought && after) after(); });
    });
  }
  function openPair(a, b) {
    return pairCatalog().then(function (c) {
      var D = pdata(a, b); if (!D) throw new Error('AGP4_PAIR');
      var x = A(), salesOff = x ? !x.purchases.buttonsVisible() : true, owned = pairOwned(a, b), F = W.AGDUO.facts(D.A, D.B), keys = W.AGDUO.keys(D.A, D.B);
      if (!romantic(D)) keys = keys.filter(function (k) { return k.key !== 'duo_peach' && k.key.indexOf('duo_gua') !== 0; });   // обаяние и «общая спальня» по гуа — только партнёру   // обаяние одного в столпах другого — только партнёру
      var h = '<div class="agp-cap">' + esc(tx('p4.pair_cap')) + '</div><div class="agp-h1"><h1>' + esc(D.nameA) + ' и ' + esc(D.nameB) + '</h1></div>'
        + '<p class="agp-note">' + esc(tx(romantic(D) ? 'p4.pair_lead' : 'p4.pair_lead_other')) + '</p>' + relHTML(D)
        + '<div class="agp-sec">' + esc(tx('p4.pair_who')) + '</div>'
        + (F.god_ba === F.god_ab ? '<div class="agp-pl"><span class="cl">' + esc(tx('p4.pair_mutual')) + '</span>' + esc(godLine(F.god_ba)) + '</div>'   // один и тот же бог в обе стороны — одна строка
          : '<div class="agp-pl"><span class="cl">' + esc(tx('p4.pair_for_a', { b: D.nameB })) + '</span>' + esc(godLine(F.god_ba)) + '</div>'
          + '<div class="agp-pl"><span class="cl">' + esc(tx('p4.pair_for_b', { b: D.nameB })) + '</span>' + esc(godLineB(F.god_ab)) + '</div>');
      if (D.today) h += '<div class="agp-sec">' + esc(tx('p4.pair_today')) + '</div><div class="agp-pl">' + esc(D.nameA) + ': ' + esc(D.today.a) + '<br>' + esc(D.nameB) + ': ' + esc(D.today.b) + '</div>';
      h += '<div class="agp-sec">' + esc(tx('p4.pair_between')) + '</div>' + keys.map(function (k) { return cardHTML(k.key); }).join('');
      var nSph = c.spheres.filter(function (s0) { return romantic(D) || !ROMANTIC[s0.id]; }).length;   // #18 (REST-GAPS п. 7): одно число — столько, сколько сфер в списке
      h += '<div class="agp-sec">' + esc(nSph + ' ' + (nSph % 10 === 1 && nSph % 100 !== 11 ? 'сфера' : nSph % 10 >= 2 && nSph % 10 <= 4 && (nSph % 100 < 10 || nSph % 100 >= 20) ? 'сферы' : 'сфер') + ' пары') + '</div>';
      if (!owned) h += '<p class="agp-note">' + esc(tx('p4.pair_free_note')) + '</p>';
      else if (!isSamplePair(a, b)) h += '<p class="agp-note">' + esc(tx('p4.pair_wait_toc')) + '</p>';
      var only = [];   // #15: сфера без открытых карточек пары — не пустой экран, а строка «только в разборе пары»
      c.spheres.forEach(function (s0) {
        if (!romantic(D) && ROMANTIC[s0.id]) return;
        var s = sph(s0, D);
        if (!owned && !pairCards(s, keys).length) { only.push(s); return; }
        h += '<div class="agp-row' + (owned ? ' open' : '') + '" data-psph="' + esc(s.id) + '" role="button" tabindex="0"><span class="tt">' + esc(s.title) + '</span>'
          + (owned || salesOff ? '' : '<span class="lk" aria-label="полный текст — в разборе пары">' + LOCK + '</span>') + '</div>';
      });
      if (only.length) h += '<div class="agp-sec">' + esc(tx('p4.pair_only')) + '</div><p class="agp-note" data-only="' + only.length + '">' + only.map(function (s) { return esc(s.title); }).join(' · ') + '</p>';
      if (owned && isSamplePair(a, b)) h += '<div class="agp-row open" data-psph="final" role="button" tabindex="0"><span class="n">·</span><span class="tt">' + esc(tx(romantic(D) ? 'p4.pair_final' : 'p4.pair_final_other')) + '</span></div>';
      if (!owned && !salesOff) h += pairBuyHTML(D.minor, D);
      var el = screen(h, tx('p4.pair_cap'));
      el.addEventListener('click', function (e) {
        var rl = e.target.closest && e.target.closest('[data-prel]');
        if (rl && W.W3 && W.W3.setPersonRel) { W.W3.setPersonRel(b, rl.getAttribute('data-prel')); openPair(a, b); return; }
        var r = e.target.closest && e.target.closest('[data-psph]'); if (!r) return;
        openPairSphere(r.getAttribute('data-psph'), a, b, D, keys);
      });
      bindPairBuy(el, a, b, D, function () { openPair(a, b); });
      return el;
    });
  }
  function founderPair() { if (pfounder) return Promise.resolve(pfounder); return getJSON(BASE + 'pair/founder.json').then(function (j) { pfounder = j; return j; }); }
  function pairFinalHTML(j) {
    var f = j.final, h = '<div class="agp-cap">' + esc(tx('p4.pair_cap')) + '</div><div class="agp-h1"><h1>' + esc(tx('p4.pair_final')) + '</h1></div>';
    h += '<div class="agp-sec">Горящие точки союза</div>' + f.hot.map(function (x) { return '<div class="agp-hot"><b>' + esc(x.title) + '</b>' + esc(x.text) + '</div>'; }).join('');
    h += '<div class="agp-sec">Фон на 12 месяцев</div><p class="agp-note">' + esc(f.plan_intro) + '</p>'
      + f.plan_rows.map(function (r) { return '<div class="agp-pl"><span class="cl">' + esc(r[0]) + '</span>' + esc(r[1]) + '</div>'; }).join('')
      + (f.plan_note ? '<p class="agp-note">' + esc(f.plan_note) + '</p>' : '');
    h += '<div class="agp-verd"><small>ВЕРДИКТ СОЮЗА</small><p>' + esc(f.verdict) + '</p></div>'
      + acc('О разборе', esc(j.intro)) + acc('Карта данных пары', esc(j.data.replace(/\*\*/g, '')));
    return h;
  }
  function openPairSphere(id, a, b, D, keys) {
    var s = sph(pcat.spheres.filter(function (x) { return x.id === id; })[0], D);
    if (pairOwned(a, b)) {
      if (testOn() && isSamplePair(a, b)) {
        return founderPair().then(function (j) {
          if (id === 'final') { screen(pairFinalHTML(j), tx('p4.pair_final')); return; }
          var sp = j.spheres.filter(function (x) { return x.id === id; })[0];
          screen(sphereHTML(sp, { caption: tx('p4.pair_cap') + ' · сфера пары' }), sp.title);
        }).catch(function () { screen(pairWaitHTML(s, a, b), s ? s.title : ''); });
      }
      screen(pairWaitHTML(s, a, b), s ? s.title : ''); return;   // bought, text not delivered yet (wave 4: from Supabase)
    }
    if (!s) return;
    var cards = pairCards(s, keys);
    var x = A(), salesOff = x ? !x.purchases.buttonsVisible() : true;
    var h = '<div class="agp-cap">' + esc(tx('p4.pair_cap')) + ' · сфера пары</div><div class="agp-h1"><h1>' + esc(s.title) + '</h1></div>'
      + '<div class="agp-sec">' + esc(tx(s.about ? 'p4.about' : 'p4.looks')) + '</div><p>' + esc(s.about || s.looks) + '.</p>'
      + '<div class="agp-sec">' + esc(tx('p4.pair_cards')) + '</div>'
      + (cards.length ? cards.map(function (k) { return cardHTML(k); }).join('') : '<p class="agp-note">' + esc(tx('p4.pair_cards_none')) + '</p>')
      + '<p class="agp-note" style="margin-top:14px">' + esc(tx('p4.pair_full_line2')) + '</p>'
      + (salesOff ? '' : pairBuyHTML(D.minor, D));
    var el = screen(h, s.title);
    bindPairBuy(el, a, b, D, function () { openPair(a, b); });
  }
  function pairWaitHTML(s, a, b) {
    var x = A(), ord = x ? x.purchases.order(a, b) : null, st = ord ? ord.status : 'queued';
    return '<div class="agp-cap">' + esc(tx('p4.pair_cap')) + (s ? ' · сфера пары' : '') + '</div><div class="agp-h1"><h1>' + esc(s ? s.title : tx('p4.pair_final')) + '</h1></div>'
      + '<p class="agp-sit">' + esc(tx('p4.pair_wait_title')) + '.</p><p class="agp-note">' + esc(tx('p4.pair_wait', { status: tx('p4.status.' + st) })) + '</p>';
  }

  W.AGP4 = { version: '1.2.0', openPair: openPair, pairCatalog: pairCatalog, renderToc: renderToc, open: open, renderSphere: function (el, j, meta) { ensureCss(); el.classList.add('agp'); el.innerHTML = sphereHTML(j, meta); }, close: close, catalog: catalog, _html: sphereHTML };
  D.addEventListener('agn:purchases', function () { var slot = D.getElementById('agp4-slot'); if (slot && slot.__agpProfile) renderToc(slot, slot.__agpProfile, slot.__agpOpts); });
  D.addEventListener('agn:locks', function () { var slot = D.getElementById('agp4-slot'); if (slot && slot.__agpProfile) renderToc(slot, slot.__agpProfile, slot.__agpOpts); });
})();
