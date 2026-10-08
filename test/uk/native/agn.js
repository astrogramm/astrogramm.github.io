/* Astrogramm · window.AGN — bridge from the v12 page to the phone (Capacitor) · #10 wave 3 · contract v1
 *
 * Contract: product/DESIGN-SYSTEM.md §9 «Мост AGN / AGP4». Load BEFORE the page script:
 *   <script src="native/agn.js"></script>          (plain script, no module, no network)
 * In a browser (artifact page, Chromium tests) every call works on a stub: storage = localStorage,
 * notifications = log, purchases = the full reading at the K4 price and no real payment.
 *
 * Parts: store (Capacitor Preferences mirrored into localStorage), charts (own charts vs people, bug 4),
 * session + distress (shared with v12 w3 layer: ag_session, ag_distress, window.agDistress), notify (morning
 * notifications, bug 6), purchases (RevenueCat, one product — the full reading, APP-SPEC §4, paywall K5), test mode
 * (web page only), deleteData (device + Supabase).
 * Texts: window.UI_RU (app/texts/ui_ru.json, owner #2) keys push.*, paywall.*, settings.*; fallbacks below.
 *
 * In-app purchases flag (owner decision 01.10: version 1.0 ships with NO purchases; they return in 1.1):
 * native/config.json `iap` (build: AG_IAP=1), default false. With iap off: no RevenueCat, no paywall, no buy, no restore,
 * buttonsVisible() = false (AGP4 hides buy buttons and locks), AGN.flags.iap = false (the page hides prices and sales cards).
 * The purchase code stays as it is for 1.1 — only gated.
 *
 * Sphere synthesis flag (owner decision 06.10 15:43: «◈ Что видят системы» is NOT in 1.0, it moves to package П2):
 * native/config.json `synth` (build: AG_SYNTH=1), default false → AGN.flags.synth; the page reads it through agSynth().
 */
(function () {
  'use strict';
  var W = window, D = document, C = W.Capacitor;
  var NATIVE = !!(C && C.isNativePlatform && C.isNativePlatform());
  var PLATFORM = NATIVE ? C.getPlatform() : 'web';
  var VERSION = '1.0.0';

  function plugin(name) {
    if (!NATIVE) return null;
    try { return (C.Plugins && C.Plugins[name]) || (C.registerPlugin ? C.registerPlugin(name) : null); } catch (e) { return null; }
  }
  function qs(name) { try { return new URLSearchParams(W.location.search).get(name); } catch (e) { return null; } }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function parseJSON(s, dflt) { try { var v = JSON.parse(s); return v == null ? dflt : v; } catch (e) { return dflt; } }
  function emit(name, detail) { try { D.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) {} }
  function log() { if (W.AGN_DEBUG) try { console.log.apply(console, ['[AGN]'].concat([].slice.call(arguments))); } catch (e) {} }

  // ------------------------------------------------------------------ texts (ui_ru.json → fallback)
  var T0 = {
    'push.morning.title': '{weekday}, {date}',
    'push.morning.body': '{action}.{hours}',
    'push.morning.hours': " Сильні години — {list}.",
    'push.morning.fallback': "Заглянь у «Сьогодні»: головна дія дня вже пораховано",
    'push.goal.title': "Познач вікно під ціль: {goal}",
    'push.goal.body': "Познач у плані {date} для цілі «{goal}». Сильні години — {hours}.",
    'push.ask.title': "Ранок дня — одним сповіщенням",
    'push.ask.lead': "Так виглядало б сповіщення на сьогодні за твоєю картою:",
    'push.ask.rules': "Одне на день, о {time}. Без реклами та нагадувань «повернись». Вимикається будь-коли в налаштуваннях.",
    'push.ask.yes': "Увімкнути",
    'push.ask.no': "Не зараз",
    'paywall.title.full': "Повний розбір",
    'paywall.lead.full': "46 сфер життя та частини 4–10 за твоєю картою, і PDF. Усе інше в застосунку безкоштовно.",
    // #15: «части 4–10» словами (черновик; итоговый текст — #16 в UI_RU paywall.lead.full2 / pair_other)
    'paywall.lead.full2': "За твоєю картою: усі 46 сфер, зв’язки між системами, суперечки систем у карті, план на рік, гарячі точки, підсумковий вердикт і PDF. Усе інше в застосунку безкоштовно.",
    'paywall.lead.pair_other': "Що виникає між вами: сфери пари, порівняння натальних карт, гарячі точки, тло на 12 місяців, підсумок і PDF.",
    'paywall.buy.once': "Купити за {price}",
    'paywall.lead.pair2': "Що виникає між вами: 12 сфер пари, порівняння натальних карт, гарячі точки, тло на 12 місяців, вердикт і PDF.",
    'paywall.title.pair': "Розбір пари",
    'paywall.lead.pair': "Що виникає між вами: 12 сфер пари, синастрія, гарячі точки, тло на 12 місяців і вердикт союзу, та PDF.",
    'paywall.consent': "Людина, чиї дані я вводжу, погоджується, що її дата, час і місто народження підуть на розрахунок розбору пари.",
    'paywall.once': "{price}, одноразово. Не підписка — повторних списань немає.",
    'paywall.eta': "Розбір пишеться й перевіряється, не миттєво: орієнтир — до {days} днів. Сфери з’являються в міру готовності.",
    'paywall.data': "Для розбору дата, час і місто народження передаються на наш сервер — лише щоб написати й перевірити текст. Решту застосунок рахує на телефоні.",
    'paywall.data_pair': "Для розбору пари дати, час і міста народження обох передаються на наш сервер — лише щоб написати й перевірити текст.",
    'paywall.nt': "Карта без часу народження: у розборі не буде асцендента, домів, години народження та Дизайну людини. Час можна додати в «Карті» до покупки.",
    'paywall.eta_pair': "Розбір пишеться й перевіряється, це не миттєво: орієнтир — до {days} днів. Готові сфери пари з’являться в «Зв’язках», на екрані «ви вдвох».",
    'paywall.close': "Не зараз",
    'paywall.restore': "Відновити покупки",
    'paywall.terms': "Умови",
    'paywall.privacy': "Конфіденційність",
    'paywall.unavailable': "Покупки працюють у версії з App Store. Тут — лише перегляд цін.",
    'paywall.error': "Покупка не пройшла. Гроші не списано. Спробуй ще раз пізніше.",
    'paywall.done': "Готово. Дякуємо!",
    'settings.delete.title': "Видалити мої дані",
    'settings.delete.body': "Зітремо з цього телефона карти, людей зі «Зв’язків», журнал, листи й налаштування. Якщо в тебе є акаунт — ще й акаунт, замовлення та файли розборів на сервері. Повернути це буде неможливо.",
    'settings.delete.body_local': "Зітремо з цього телефона карти, людей зі «Зв’язків», журнал, листи в майбутнє, налаштування та заплановані сповіщення. Ця версія застосунку зберігає все лише на телефоні й нічого не надсилає на сервер, тому стирати там нічого. Повернути це буде неможливо.",   // 1.0 (AG_IAP off, no account): only the device
    'settings.delete.store': "Покупку розбору це не скасовує: повернення грошей — через Apple, reportaproblem.apple.com.",
    'settings.delete.yes': "Видалити все",
    'settings.delete.no': "Скасувати",
    'settings.delete.done': "Дані видалено.",
    'settings.delete.server_failed': "На телефоні все стерто, а сервер зараз не відповів. Відкрий цей екран пізніше й натисни ще раз — видалимо акаунт.",
    'settings.restore.done': "Покупку розбору знайдено.",
    'settings.restore.none': "Покупок на цьому Apple ID не знайдено.",
    'settings.restore.test': "Режим «Тест»: купувати й відновлювати нічого не треба — замки вже зняті.",
    'settings.restore.web': "Покупки відновлюються в застосунку Astrogramm з App Store: там само, де їх зроблено.",   // #15, баг 9
    'distress.sales_off': "Зараз покупки вимкнені. Повернуться згодом самі."
  };
  function tget(obj, path) { var p = path.split('.'), o = obj; for (var i = 0; i < p.length; i++) { if (!o || typeof o !== 'object') return undefined; o = o[p[i]]; } return typeof o === 'string' ? o : undefined; }
  function t(key, vars) {
    var ui = W.UI_RU; if (!ui) { try { ui = UI_RU; } catch (e) { ui = null; } }   // v12 embeds `const UI_RU` (not a window property)
    var s = (ui && tget(ui, key)) || T0[key] || key;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; });
  }

  // ------------------------------------------------------------------ config (native/config.json, written by the build)
  var CFG = { rcIosKey: '', supabaseUrl: '', supabaseAnonKey: '', legal: { terms: '', privacy: '', support: '' }, etaDays: 7, storeBuild: false, iap: false, synth: false };
  function iapOn() { return CFG.iap === true; }      // 1.0: false — no purchase surface anywhere (see header)
  function applyCfg(x) { if (x && typeof x === 'object') for (var k in x) if (Object.prototype.hasOwnProperty.call(x, k)) CFG[k] = x[k]; }
  applyCfg(W.AGN_CONFIG);

  // ------------------------------------------------------------------ store: Preferences ⇄ localStorage mirror
  // v11/v12 read and write localStorage synchronously (ST_get / ST_set, w3 layer). On the phone WKWebView may purge
  // localStorage, so every write of an ag_* key is mirrored into Capacitor Preferences (UserDefaults), and on start
  // Preferences is copied back before the page reads anything (await AGN.ready). First native start: localStorage → Preferences.
  var Pref = plugin('Preferences');
  var LS = null; try { LS = W.localStorage; LS.getItem('ag__probe'); } catch (e) { LS = null; }
  var MEM = {};
  var MIGR_KEY = 'ag__store_v';
  function isAg(k) { return typeof k === 'string' && k.indexOf('ag_') === 0; }
  var q = Promise.resolve();
  function persist(k, v) {
    if (!Pref || !isAg(k)) return;
    q = q.then(function () { return v === null ? Pref.remove({ key: k }) : Pref.set({ key: k, value: v }); }).catch(function (e) { log('persist', k, e); });
  }
  var rawSet = null, rawRemove = null, rawClear = null;
  if (LS && W.Storage && Storage.prototype) {
    var sp = Storage.prototype; rawSet = sp.setItem; rawRemove = sp.removeItem; rawClear = sp.clear;
    sp.setItem = function (k, v) { rawSet.call(this, k, v); if (this === LS && isAg(k)) { MEM[k] = String(v); persist(k, String(v)); } };
    sp.removeItem = function (k) { rawRemove.call(this, k); if (this === LS && isAg(k)) { delete MEM[k]; persist(k, null); } };
  }
  var store = {
    get: function (k) { if (LS) { try { return LS.getItem(k); } catch (e) {} } return Object.prototype.hasOwnProperty.call(MEM, k) ? MEM[k] : null; },
    set: function (k, v) { v = String(v); MEM[k] = v; if (LS) { try { LS.setItem(k, v); return; } catch (e) {} } persist(k, v); },
    remove: function (k) { delete MEM[k]; if (LS) { try { LS.removeItem(k); return; } catch (e) {} } persist(k, null); },
    getJSON: function (k, dflt) { var v = store.get(k); return v === null ? dflt : parseJSON(v, dflt); },
    setJSON: function (k, v) { store.set(k, JSON.stringify(v)); },
    keys: function () {
      var out = {}, i; for (var k in MEM) if (isAg(k)) out[k] = 1;
      if (LS) try { for (i = 0; i < LS.length; i++) { var kk = LS.key(i); if (isAg(kk)) out[kk] = 1; } } catch (e) {}
      return Object.keys(out).sort();
    },
    flush: function () { return q; },
    backend: Pref ? 'preferences' : (LS ? 'localStorage' : 'memory')
  };
  function lsWrite(k, v) { MEM[k] = v; if (LS && rawSet) try { rawSet.call(LS, k, v); } catch (e) {} }

  function hydrate() {
    if (!Pref) return Promise.resolve({ backend: store.backend, migrated: 0, restored: 0 });
    return Pref.keys().then(function (r) {
      var keys = (r && r.keys || []).filter(isAg);
      if (keys.indexOf(MIGR_KEY) < 0) {                    // first native start: copy what localStorage has
        var src = store.keys().filter(function (k) { return k !== MIGR_KEY; });
        return src.reduce(function (p, k) { return p.then(function () { return Pref.set({ key: k, value: store.get(k) }); }); }, Promise.resolve())
          .then(function () { return Pref.set({ key: MIGR_KEY, value: '1' }); })
          .then(function () { return { backend: 'preferences', migrated: src.length, restored: 0 }; });
      }
      var n = 0;
      return keys.reduce(function (p, k) {
        return p.then(function () { return Pref.get({ key: k }); }).then(function (g) { if (g && g.value != null) { lsWrite(k, g.value); n++; } });
      }, Promise.resolve()).then(function () { return { backend: 'preferences', migrated: 0, restored: n }; });
    }).catch(function (e) { log('hydrate failed', e); return { backend: 'localStorage', migrated: 0, restored: 0, error: String(e) }; });
  }

  // ------------------------------------------------------------------ charts: own charts vs people (bug 4)
  // v11 kept every computed chart in ag_people, so own charts counted as people and would break the «2 free» limit.
  // Own charts → ag_mine; people added in «Связи» → ag_people. Migration: entries equal to the active chart move to ag_mine.
  var FREE_PEOPLE = Infinity;                          // no limit since 29.09: one paid product, the full reading
  function same(a, b) { return !!a && !!b && a.n === b.n && a.d === b.d && (a.t || '') === (b.t || ''); }
  var charts = {
    FREE_PEOPLE: FREE_PEOPLE,
    mine: function () { return store.getJSON('ag_mine', []); },
    people: function () { return store.getJSON('ag_people', []); },
    saveMine: function (p) {
      var a = charts.mine().filter(function (x) { return !same(x, p); }); a.push(p); store.setJSON('ag_mine', a);
      var ppl = charts.people(), f = ppl.filter(function (x) { return !same(x, p); });
      if (f.length !== ppl.length) store.setJSON('ag_people', f);
      return a;
    },
    removeMine: function (i) { var a = charts.mine(); a.splice(i, 1); store.setJSON('ag_mine', a); return a; },
    canAddPerson: function () { return true; },     // «Связи» без лимита — бесплатно (решение Саши 29.09, APP-SPEC §4.1)
    migrate: function () {
      if (store.get('ag_mine') !== null) return { moved: 0 };
      var active = store.getJSON('ag_active', null), ppl = charts.people(), mine = [], rest = [];
      ppl.forEach(function (p) { (active && same(p, active) ? mine : rest).push(p); });
      store.setJSON('ag_mine', mine);
      if (mine.length) store.setJSON('ag_people', rest);
      return { moved: mine.length };
    }
  };

  // ------------------------------------------------------------------ session + distress (format of the v12 w3 layer)
  function sessionNo() { var n = parseInt(store.get('ag_session') || '0', 10); return n > 0 ? n : 1; }
  var DISTRESS_H = 72;
  var distress = {
    // sales: this session and the next one (APP-SPEC §4.4); morning notifications: 72 h (APP-SPEC §8.3 п. 5)
    active: function () {
      if (typeof W.agDistress === 'function') { try { return !!W.agDistress(); } catch (e) {} }
      var d = store.getJSON('ag_distress', null);
      return !!(d && d.until_session && sessionNo() <= d.until_session);
    },
    notifyQuietUntil: function () {
      var d = store.getJSON('ag_distress', null); if (!d || !d.since) return null;
      var u = new Date(new Date(d.since).getTime() + DISTRESS_H * 3600e3);
      return u > new Date() ? u : null;
    },
    set: function () {                                  // v12 w3 sets the flag itself; this is for pages without w3
      store.setJSON('ag_distress', { since: new Date().toISOString(), until_session: sessionNo() + 1 });
      emit('ag:distress', { source: 'agn' });
    }
  };
  D.addEventListener('ag:distress', function () {
    closeOverlay('paywall');
    notify.cancelAll().then(function () { log('distress: notifications cancelled'); });
    purchases.refreshLocks();
  });

  // ------------------------------------------------------------------ overlay helper (Design System tokens, v12 stylesheet)
  var CSS = '.agn-ov{position:fixed;inset:0;z-index:9000;background:var(--bg,#0a0820);color:var(--text,#ece7f6);overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:var(--font-body,system-ui,sans-serif);font-size:15px;line-height:1.5}'
    + '.agn-in{max-width:520px;margin:0 auto;padding:max(16px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom))}'
    + '.agn-x{display:flex;justify-content:flex-start}.agn-x button{background:none;border:0;color:var(--muted,#a097c3);font-size:15px;padding:10px 4px;min-height:44px;min-width:56px;cursor:pointer}'
    + '.agn-h{font-family:var(--font-display,Georgia,serif);font-weight:600;font-size:28px;line-height:1.15;margin:6px 0 10px;text-wrap:balance}'
    + '.agn-lead{color:var(--text-2,#d9d3ea);margin:0 0 16px}.agn-sm{font-size:13px;color:var(--muted,#a097c3);margin:8px 0}'
    + '.agn-card{background:var(--surface,#151033);border:1px solid var(--line,rgba(201,169,74,.22));border-radius:var(--r-card,16px);padding:16px;margin:0 0 12px}'
    + '.agn-card h3{font-family:var(--font-display,Georgia,serif);font-weight:600;font-size:21px;margin:0 0 6px}'
    + '.agn-card p{margin:0 0 8px}.agn-btn{display:block;width:100%;min-height:48px;border-radius:12px;border:1px solid var(--gold,#e9c46a);background:var(--gold,#e9c46a);color:var(--ink,#0a0820);font:600 16px var(--font-body,system-ui,sans-serif);cursor:pointer;margin-top:10px}'
    + '.agn-btn.ghost{background:transparent;color:var(--gold,#e9c46a)}.agn-btn.warn{background:#D98F5A;border-color:#D98F5A}.agn-btn[disabled]{opacity:.5}'
    + '.agn-links{display:flex;flex-direction:column;align-items:center;gap:0;margin-top:16px}.agn-links a,.agn-links button{color:var(--muted,#a097c3);font-size:13px;background:none;border:0;text-decoration:underline;cursor:pointer;min-height:44px}'
    + '.agn-quote{border-left:2px solid var(--gold-deep,#c9a94a);padding:8px 12px;margin:10px 0 14px;background:var(--surface-2,#1f1842);border-radius:0 12px 12px 0}'
    + '.agn-msg{margin-top:12px;font-size:14px;color:var(--gold-light,#ffd76b);min-height:1em}';
  function ensureCss() { if (D.getElementById('agn-css')) return; var s = D.createElement('style'); s.id = 'agn-css'; s.textContent = CSS; (D.head || D.documentElement).appendChild(s); }
  var OV = {};
  function openOverlay(id, html, label) {
    ensureCss(); closeOverlay(id);
    var el = D.createElement('div'); el.className = 'agn-ov'; el.id = 'agn-' + id; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    if (label) el.setAttribute('aria-label', label);
    el.innerHTML = '<div class="agn-in">' + html + '</div>';
    D.body.appendChild(el); OV[id] = el; return el;
  }
  function closeOverlay(id) { var el = OV[id] || D.getElementById('agn-' + id); if (el && el.parentNode) el.parentNode.removeChild(el); delete OV[id]; }

  // ------------------------------------------------------------------ notify: morning notification of the day
  var LN = plugin('LocalNotifications');
  var ID_BASE = 71000, ID_SPAN = 400, DAYS_AHEAD = 7, QUIET_FROM = 22 * 60, QUIET_TO = 6 * 60;   // #15: morning from 06:00 (review 30.09, bug 11)
  var FORBIDDEN = /небезпе|бережи(?:сь|ся)|остерігай|попередж|ризик|втрат|хвороб|серц|печін|(?:^|[^а-яёіїєґ’])нирк|шлун|леген(?!д)|кишк|кишеч|(?:з|із) тертям|тихий день/i;
  var WD = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота"];
  var MON = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
  function hm2min(s) { var m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function min2hm(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function pushCfg() { var c = store.getJSON('ag_push', {}); return { on: c.on !== false, time: c.time || '08:30', asked: c.asked || null }; }
  function setPushCfg(patch) { var c = pushCfg(); for (var k in patch) c[k] = patch[k]; store.setJSON('ag_push', c); return c; }
  // Bug 6: strong two-hour slots (子 = 23–01 … 亥 = 21–23) are named only if they are still ahead after the notification
  // time and outside the quiet hours: start ≥ notification time, or the slot is running with ≥ 60 min left; start < 22:00.
  function slotStart(i) { return ((23 + 2 * i) % 24) * 60; }
  function slotLabel(i) { var s = slotStart(i) / 60, e = (s + 2) % 24; return pad(s) + '–' + pad(e); }
  function hoursAhead(slots, time) {
    var tm = hm2min(time); if (tm === null) tm = 8 * 60 + 30;
    return (slots || []).filter(function (i) { return i >= 0 && i < 12; })
      .map(function (i) { var s = slotStart(i); if (i === 0) s = -60; return { i: i, s: s, e: s + 120 }; })   // 子 starts the day at 23:00 of the evening before
      .filter(function (x) { return x.s < QUIET_FROM && (x.s >= tm || x.e - tm >= 60); })
      .sort(function (a, b) { return a.s - b.s; })
      .map(function (x) { return slotLabel(x.i); });
  }
  function compose(day, time) {
    var d = new Date(day.date + 'T12:00:00');
    var action = String(day.action || '').trim().replace(/[.\s]+$/, '');
    if (!action || FORBIDDEN.test(action)) action = t('push.morning.fallback');
    action = action.charAt(0).toUpperCase() + action.slice(1);
    var hrs = hoursAhead(day.hours, time).slice(0, 2);
    var body = t('push.morning.body', { action: action, hours: hrs.length ? t('push.morning.hours', { list: hrs.join(" і ") }) : '' });
    return { title: t('push.morning.title', { weekday: WD[d.getDay()], date: d.getDate() + ' ' + MON[d.getMonth()] }), body: body.replace(/\.\./g, '.') };
  }
  // Goal notification (Plus, APP-SPEC §8): the sentence with {hours} is dropped when no strong slot is left after the
  // notification time — never «Сильные часы — .» (#2, A46 §5).
  function composeGoal(goal, day, time) {
    var d = new Date(day.date + 'T12:00:00');
    var hrs = hoursAhead(day.hours, time).slice(0, 2);
    var tpl = t('push.goal.body');
    if (!hrs.length) tpl = tpl.replace(/\s*[^.!?]*\{hours\}[^.!?]*[.!?]?/, '');
    var vars = { goal: goal, date: d.getDate() + ' ' + MON[d.getMonth()], hours: hrs.join(" і ") };
    var body = tpl.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }).trim();
    return { title: t('push.goal.title', { goal: goal }), body: body };
  }
  function notifId(dateISO) { var n = Math.floor(Date.parse(dateISO + 'T00:00:00Z') / 864e5); return ID_BASE + (n % ID_SPAN); }
  var STUB_PENDING = [];
  var notify = {
    DEFAULT_TIME: '08:30',
    compose: compose,
    composeGoal: composeGoal,
    hoursAhead: hoursAhead,
    getTime: function () { return pushCfg().time; },
    setTime: function (hhmm) {                         // quiet hours 22:00–06:00 are never used
      var m = hm2min(hhmm); if (m === null) throw new Error('time HH:MM');
      m = Math.max(QUIET_TO, Math.min(QUIET_FROM - 30, m)); setPushCfg({ time: min2hm(m) }); emit('agn:notify', { time: min2hm(m) }); return min2hm(m);
    },
    enabled: function () { return pushCfg().on; },
    setEnabled: function (on) { setPushCfg({ on: !!on }); if (!on) return notify.cancelAll(); return Promise.resolve(); },
    status: function () {
      if (!LN) return Promise.resolve(qs('agn_push') || 'unavailable');
      return LN.checkPermissions().then(function (r) { var s = r && r.display; return s === 'prompt-with-rationale' ? 'prompt' : (s || 'prompt'); })
        .catch(function () { return 'unavailable'; });
    },
    // APP-SPEC §8.1: not on the first session; our own screen goes before the system one; never while distress is on
    shouldAsk: function () {
      if (pushCfg().asked || distress.active() || sessionNo() < 2) return Promise.resolve(false);
      return notify.status().then(function (s) { return s === 'prompt'; });
    },
    askScreen: function (example) {
      return new Promise(function (resolve) {
        var ex = example && example.date ? compose(example, pushCfg().time) : null;
        var el = openOverlay('push', '<div class="agn-x"><button data-a="no">✕</button></div>'
          + '<h2 class="agn-h">' + esc(t('push.ask.title')) + '</h2>'
          + (ex ? '<p class="agn-lead">' + esc(t('push.ask.lead')) + '</p><div class="agn-quote"><b>' + esc(ex.title) + '</b><br>' + esc(ex.body) + '</div>' : '')
          + '<p class="agn-sm">' + esc(t('push.ask.rules', { time: pushCfg().time })) + '</p>'
          + '<button class="agn-btn" data-a="yes">' + esc(t('push.ask.yes')) + '</button>'
          + '<button class="agn-btn ghost" data-a="no">' + esc(t('push.ask.no')) + '</button>', t('push.ask.title'));
        setPushCfg({ asked: new Date().toISOString() });
        el.addEventListener('click', function (e) {
          var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
          closeOverlay('push');
          if (a === 'no') { resolve('later'); return; }
          var req = LN ? LN.requestPermissions().then(function (r) { return r && r.display === 'granted' ? 'granted' : 'denied'; }) : Promise.resolve('unavailable');
          req.catch(function () { return 'denied'; }).then(function (s) { setPushCfg({ on: s === 'granted' }); emit('agn:notify', { permission: s }); resolve(s); });
        });
      });
    },
    // Called on every app open with the next 7 days computed by the page:
    //   days: [{date:'YYYY-MM-DD', action:'первое действие дня', hours:[indices 0..11 of strong two-hour slots]}]
    // Cancels what was planned and schedules one notification per day at the chosen time (1 per day, APP-SPEC §8.2).
    plan: function (days) {
      var cfg = pushCfg(), quiet = distress.notifyQuietUntil(), now = new Date(), tm = hm2min(cfg.time);
      var list = (days || []).slice(0, DAYS_AHEAD).map(function (d) {
        var at = new Date(d.date + 'T' + cfg.time + ':00');
        var c = compose(d, cfg.time);
        return { id: notifId(d.date), title: c.title, body: c.body, schedule: { at: at, allowWhileIdle: true }, extra: { kind: 'morning', date: d.date } };
      }).filter(function (n) { var at = n.schedule.at; return at > now && !(quiet && at < quiet) && tm >= QUIET_TO && tm < QUIET_FROM; });
      return notify.cancelAll().then(function () {
        if (!cfg.on || !list.length) return { scheduled: 0, reason: !cfg.on ? 'off' : (quiet ? 'distress' : 'none') };
        return notify.status().then(function (s) {
          if (s !== 'granted' || !LN) { STUB_PENDING = LN ? [] : list; return { scheduled: 0, reason: LN ? s : 'stub', preview: list }; }   // #18: веб без плагина при ?agn_push=granted — не падать
          return LN.schedule({ notifications: list }).then(function () { return { scheduled: list.length }; });
        });
      });
    },
    pending: function () {
      if (!LN) return Promise.resolve(STUB_PENDING.slice());
      return LN.getPending().then(function (r) { return (r && r.notifications || []).filter(function (n) { return n.id >= ID_BASE && n.id < ID_BASE + ID_SPAN; }); });
    },
    cancelAll: function () {
      STUB_PENDING = [];
      if (!LN) return Promise.resolve();
      return notify.pending().then(function (p) { return p.length ? LN.cancel({ notifications: p.map(function (n) { return { id: n.id }; }) }) : null; }).catch(function () {});
    }
  };

  // ------------------------------------------------------------------ purchases: one product, the full reading (K5)
  // Product rule of 29.09 (Sasha, HANDOFF «Решения штаба» 21:00; APP-SPEC §4): the only paid thing in v1.0 is the full
  // reading of one's own chart, $39, consumable `ag_reading_full`. No subscription, no trial, no per-sphere purchase.
  // Tools (Today, Calendar 12 months, goal pick, «Связи» without a limit) are free, so can() returns true for them.
  // Display price comes from the store (localized); the USD price below (K4) is shown only on the stub.
  // The iOS build has no Telegram payment and no prices in hryvnias (RELEASE-PLAN §2, 3.1.1).
  var PRODUCTS = {
    ag_reading_full: { type: 'once', price: '$39', amount: 39 },
    ag_reading_pair: { type: 'once', price: '$29', amount: 29 }      // «Разбор пары» (решение Саши 29.09 21:47, PAIR-SPEC)
  };
  var FULL = 'ag_reading_full', PAIR = 'ag_reading_pair';
  // the pair is one order for two charts, the same whichever of the two opens it
  function pairKey(a, b) { var x = [chartKey(a), chartKey(b)].sort(); return x[0] + '+' + x[1]; }
  var FREE_FEATURES = { calendar12: 1, goal_pick: 1, now_active: 1, goal_push: 1, links_unlimited: 1 };   // kept as names for old callers
  var RC = plugin('Purchases');
  var rcReady = null, storeProducts = {};
  function chartKey(p) {
    if (!p) return '';
    var place = p.g ? (Math.round(p.g.lat * 100) / 100) + ',' + (Math.round(p.g.lon * 100) / 100) : 'c' + (p.c == null ? '' : p.c);
    return [p.d, p.nt ? 'x' : (p.t || ''), place].join('|');
  }
  function ent() {
    var e = store.getJSON('ag_ent', null) || {};
    return { full: e.full || [], pairs: e.pairs || [], orders: e.orders || [], found: e.found || 0 };
  }
  function setEnt(e) { store.setJSON('ag_ent', e); emit('agn:purchases', { full: e.full.length }); return e; }
  function stubMode() { return !(RC && CFG.rcIosKey && iapOn()); }
  function initRC() {
    if (!iapOn()) return Promise.resolve(false);       // 1.0: RevenueCat is not even configured
    if (rcReady) return rcReady;
    if (stubMode()) { rcReady = Promise.resolve(false); return rcReady; }
    rcReady = RC.configure({ apiKey: CFG.rcIosKey })
      .then(function () { return RC.getProducts({ productIdentifiers: Object.keys(PRODUCTS), type: 'NON_SUBSCRIPTION' }); })
      .then(function (r) { (r && r.products || []).forEach(function (p) { storeProducts[p.identifier] = p; }); return true; })
      .catch(function (e) { log('RevenueCat init failed', e); return false; });
    return rcReady;
  }
  // consumables have no entitlement: a restore only tells whether this Apple ID bought the reading; the reading itself
  // comes back by the linked Supabase account (wave 4, APP-SPEC §4.4)
  function countFull(ci) {
    return (ci && ci.nonSubscriptionTransactions || []).filter(function (x) { return x.productIdentifier === FULL || x.productIdentifier === PAIR; }).length;
  }
  function price(id) { var p = storeProducts[id]; return p ? p.priceString : PRODUCTS[id].price; }

  // ------------------------------------------------------------------ test mode (web page v12 only, never in the iOS build)
  // Штаб #0, 29.09 20:50: switch in the menu «Тест: как будто оплачено». On → the interface is exactly that of someone who
  // bought the full reading (ag_reading_full bought, buy buttons hidden) on ANY chart. Off → the free view with locks.
  // The state lives in the bridge storage (ag_test → localStorage + Preferences) and survives a reload.
  var test = {
    available: function () { return !NATIVE && !CFG.storeBuild && !(W.AGN && W.AGN.flags && W.AGN.flags.storeBuild); },
    on: function () { return test.available() && store.get('ag_test') === '1'; },
    set: function (v) {
      if (!test.available()) return false;
      if (v) store.set('ag_test', '1'); else store.remove('ag_test');
      emit('agn:test', { on: !!v }); emit('agn:purchases', { test: !!v });
      return test.on();
    }
  };

  var purchases = {
    PRODUCTS: PRODUCTS,
    ready: function () { return initRC(); },
    stub: stubMode,
    price: function (id) { return price(id || FULL); },
    chartKey: chartKey,
    pairKey: pairKey,
    entitlements: ent,
    isPlus: function () { return false; },               // no subscription in v1.0 (kept for old callers)
    iap: iapOn,
    buttonsVisible: function () { return iapOn() && !distress.active() && !test.on(); },
    // feature: full | sphere (paid, by chart); calendar12 | goal_pick | now_active | goal_push | links_unlimited — free
    can: function (feature, ctx) {
      if (FREE_FEATURES[feature]) return true;
      if (feature === 'full' || feature === 'sphere') {
        if (test.on()) return true;
        var k = ctx && ctx.profile ? chartKey(ctx.profile) : '';
        return ent().full.indexOf(k) >= 0;
      }
      if (feature === 'pair') {                                   // ctx: {profile, partner}
        if (test.on()) return true;
        return !!(ctx && ctx.profile && ctx.partner) && ent().pairs.indexOf(pairKey(ctx.profile, ctx.partner)) >= 0;
      }
      return true;
    },
    // the order of the full reading for this chart: {product:'full', status:'queued|writing|review|ready', test?}
    order: function (profile, partner) {
      var pr = partner && typeof partner === 'object', k = pr ? pairKey(profile, partner) : chartKey(profile), kind = pr ? 'pair' : 'full';
      var o = ent().orders.filter(function (x) { return x.chart === k && x.product === kind; })[0] || null;
      if (!o && test.on()) o = { product: kind, chart: k, status: 'queued', test: true };
      return o;
    },
    refreshLocks: function () { emit('agn:locks', { salesOff: !purchases.buttonsVisible() }); },
    // opts: {product:'ag_reading_full', profile} | {product:'ag_reading_pair', profile, partner, minor}.
    // Any other product → {shown:false, reason:'no_product'}. The pair is not sold when one of the two is under 18.
    paywall: function (opts) {
      opts = opts || {};
      if (!iapOn()) return Promise.resolve({ shown: false, reason: 'iap_off' });
      if (distress.active()) return Promise.resolve({ shown: false, reason: 'distress' });
      if (test.on()) return Promise.resolve({ shown: false, reason: 'test' });
      var pid = opts.product || FULL;
      if (pid !== FULL && pid !== PAIR) return Promise.resolve({ shown: false, reason: 'no_product' });
      if (pid === PAIR && (opts.minor || !opts.partner)) return Promise.resolve({ shown: false, reason: opts.minor ? 'minor' : 'no_partner' });
      return initRC().then(function () { return new Promise(function (resolve) { renderPaywall(opts, resolve); }); });
    },
    buy: function (id, ctx) {
      if (!iapOn()) return Promise.resolve({ ok: false, reason: 'iap_off' });
      if (distress.active()) return Promise.resolve({ ok: false, reason: 'distress' });
      if (!PRODUCTS[id]) return Promise.resolve({ ok: false, reason: 'unknown_product' });
      return initRC().then(function (live) {
        if (!live) {
          if (qs('agn_stub') === 'buy' || CFG.stubBuy) return grant(id, ctx, 'stub-' + Date.now()).then(function () { return { ok: true, stub: true }; });
          return { ok: false, reason: 'store_unavailable' };
        }
        var sp = storeProducts[id]; if (!sp) return { ok: false, reason: 'product_not_loaded' };
        return RC.purchaseStoreProduct({ product: sp }).then(function (r) {
          return grant(id, ctx, r.transaction && r.transaction.transactionIdentifier).then(function () { return { ok: true }; });
        }).catch(function (e) { return { ok: false, reason: e && (e.userCancelled || e.code === '1') ? 'cancelled' : 'error', error: String(e && e.message || e) }; });
      });
    },
    // From the settings menu: shows the result itself (a short overlay); the paywall uses _restore() and its own line.
    restore: function (opts) {
      if (!iapOn()) return Promise.resolve({ ok: false, reason: 'iap_off' });
      var p = purchases._restore();
      if (opts && opts.silent) return p;
      var el = openOverlay('restore', '<div class="agn-x"><button data-a="x">✕</button></div><h2 class="agn-h">' + esc(t('paywall.restore')) + '</h2><div class="agn-msg" role="status" aria-live="polite">…</div><button class="agn-btn ghost" data-a="x">OK</button>', t('paywall.restore'));
      el.addEventListener('click', function (e) { if (e.target.getAttribute && e.target.getAttribute('data-a')) closeOverlay('restore'); });
      return p.then(function (r) { var m = el.querySelector('.agn-msg'); if (m) m.textContent = test.on() ? t('settings.restore.test') : !NATIVE && !r.found ? t('settings.restore.web') : r.ok ? (r.found ? t('settings.restore.done') : t('settings.restore.none')) : t('paywall.error'); return r; });
    },
    _restore: function () {
      return initRC().then(function (live) {
        if (!live) { var e0 = ent(); return { ok: true, found: e0.full.length + e0.orders.length, stub: true }; }
        return RC.restorePurchases().then(function (r) {
          var n = countFull(r && r.customerInfo), e = ent(); e.found = n; setEnt(e); return { ok: true, found: n };
        }).catch(function (e) { return { ok: false, error: String(e && e.message || e) }; });
      });
    }
  };
  // Consumable: the order goes to Supabase through the RevenueCat webhook (wave 4); on the phone the order is kept with
  // status 'queued' and the chart counts as bought, so the reading screen shows the honest state (APP-SPEC §5.4).
  function grant(id, ctx, tx) {
    var e = ent(), k = ctx && ctx.profile ? chartKey(ctx.profile) : '';
    if (id === FULL) {
      if (k && e.full.indexOf(k) < 0) e.full.push(k);
      e.orders.push({ product: 'full', chart: k, tx: tx || null, ts: new Date().toISOString(), status: 'queued' });
    }
    if (id === PAIR && ctx && ctx.profile && ctx.partner) {
      var pk = pairKey(ctx.profile, ctx.partner);
      if (e.pairs.indexOf(pk) < 0) e.pairs.push(pk);
      e.orders.push({ product: 'pair', chart: pk, tx: tx || null, ts: new Date().toISOString(), status: 'queued', consent: true });
    }
    setEnt(e); return Promise.resolve(e);
  }
  function renderPaywall(opts, resolve) {
    var id = opts.product === PAIR ? PAIR : FULL, pr = price(id), stub = stubMode(), isPair = id === PAIR;
    var names = isPair ? { a: opts.nameA || '', b: opts.nameB || '' } : null;
    var html = '<div class="agn-x"><button data-a="close" aria-label="' + esc(t('paywall.close')) + '">✕</button></div>'
      + '<h2 class="agn-h">' + esc(t(isPair ? 'paywall.title.pair' : 'paywall.title.full')) + '</h2>'
      + '<p class="agn-lead">' + esc(t(isPair ? (opts.rel && opts.rel !== 'partner' ? 'paywall.lead.pair_other' : 'paywall.lead.pair2') : 'paywall.lead.full2', names)) + '</p>'
      + '<div class="agn-card"><p>' + esc(t('paywall.once', { price: pr })) + '</p>'   // #15: one price line + the button (no big duplicate)
      + '<p class="agn-sm">' + esc(t(isPair ? 'paywall.eta_pair' : 'paywall.eta', { days: CFG.etaDays || 7 })) + '</p>'
      + '<p class="agn-sm">' + esc(t(isPair ? 'paywall.data_pair' : 'paywall.data')) + '</p>'   // #15: честно — для разбора данные уходят на сервер
      + (!isPair && opts.profile && opts.profile.nt ? '<p class="agn-sm">' + esc(t('paywall.nt')) + '</p>' : '')   // #15: без времени рождения — честно, чего не будет
      // the second person's birth data leave the phone only with their consent (PAIR-SPEC, privacy policy)
      + (isPair ? '<label class="agn-sm" style="display:flex;gap:10px;align-items:flex-start;margin:10px 0 0"><input type="checkbox" data-consent="1" style="width:20px;height:20px;flex:none;margin:0">'
        + '<span>' + esc(t('paywall.consent', names)) + '</span></label>' : '')
      + '<button class="agn-btn" data-buy="' + id + '"' + (isPair ? ' disabled' : '') + '>' + esc(t('paywall.buy.once', { price: pr })) + '</button></div>';
    if (stub) html += '<p class="agn-sm">' + esc(t('paywall.unavailable')) + '</p>';
    html += '<button class="agn-btn ghost" data-a="close">' + esc(t('paywall.close')) + '</button>'
      + '<div class="agn-links"><button data-a="restore">' + esc(t('paywall.restore')) + '</button>'
      + (CFG.legal && CFG.legal.terms ? '<a href="' + esc(CFG.legal.terms) + '" target="_blank" rel="noopener">' + esc(t('paywall.terms')) + '</a>' : '')
      + (CFG.legal && CFG.legal.privacy ? '<a href="' + esc(CFG.legal.privacy) + '" target="_blank" rel="noopener">' + esc(t('paywall.privacy')) + '</a>' : '')
      + '</div><div class="agn-msg" role="status" aria-live="polite"></div>';
    var el = openOverlay('paywall', html, t(isPair ? 'paywall.title.pair' : 'paywall.title.full'));
    var cb = el.querySelector('[data-consent]');
    if (cb) cb.addEventListener('change', function () { var bb = el.querySelector('[data-buy]'); if (bb) bb.disabled = !cb.checked; });
    var msg = el.querySelector('.agn-msg'), done = false;
    function finish(r) { if (done) return; done = true; closeOverlay('paywall'); resolve(r); }
    el.addEventListener('click', function (e) {
      var tg = e.target, a = tg.getAttribute && tg.getAttribute('data-a'), b = tg.getAttribute && tg.getAttribute('data-buy');
      if (a === 'close') { finish({ shown: true, bought: false }); return; }
      if (a === 'restore') { msg.textContent = '…'; purchases._restore().then(function (r) { msg.textContent = !NATIVE && !r.found ? t('settings.restore.web') : r.ok ? (r.found ? t('settings.restore.done') : t('settings.restore.none')) : t('paywall.error'); }); return; }
      if (b) {
        var btns = el.querySelectorAll('[data-buy]'); for (var i = 0; i < btns.length; i++) btns[i].disabled = true;
        if (cb && !cb.checked) return;
        purchases.buy(b, { profile: opts.profile, partner: opts.partner }).then(function (r) {
          for (var i = 0; i < btns.length; i++) btns[i].disabled = false;
          if (r.ok) { msg.textContent = t('paywall.done'); setTimeout(function () { finish({ shown: true, bought: true, product: b }); }, 700); }
          else if (r.reason === 'cancelled') msg.textContent = '';
          else msg.textContent = r.reason === 'store_unavailable' ? t('paywall.unavailable') : t('paywall.error');
        });
      }
    });
  }

  // ------------------------------------------------------------------ events (APP-SPEC §11.4): name + short props, never texts
  // Kept on the phone (ag_events, last 200); wave 4 sends them to Supabase `events` (no birth data, no message texts).
  var events = {
    log: function (name, props) {
      var clean = {};
      for (var k in (props || {})) { var v = props[k]; if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length <= 40)) clean[k] = v; }
      var a = store.getJSON('ag_events', []); a.push({ n: String(name).slice(0, 40), p: clean, ts: new Date().toISOString() });
      if (a.length > 200) a = a.slice(a.length - 200);
      store.setJSON('ag_events', a); return true;
    },
    list: function () { return store.getJSON('ag_events', []); }
  };

  // ------------------------------------------------------------------ delete my data (Apple 5.1.1(v), APP-SPEC §9)
  function account() { var s = store.getJSON('ag_sb_session', null); return s && s.access_token ? s : null; }
  var deleteData = {
    hasAccount: function () { return !!account(); },
    run: function () {
      var acc = account();
      var server = !acc ? Promise.resolve('none') : (!CFG.supabaseUrl ? Promise.resolve('failed') :
        fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/functions/v1/delete-account', {
          method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + acc.access_token, apikey: CFG.supabaseAnonKey || '' },
          body: JSON.stringify({ confirm: 'DELETE' })
        }).then(function (r) { return r.ok || r.status === 401 ? 'deleted' : 'failed'; }).catch(function () { return 'failed'; }));
      return server.then(function (srv) {
        return notify.cancelAll().then(function () {
          var keep = srv === 'failed' ? { ag_sb_session: store.get('ag_sb_session') } : {};   // keep the token to retry the server part
          var keys = store.keys();
          keys.forEach(function (k) { store.remove(k); });
          for (var k in keep) if (keep[k] !== null) store.set(k, keep[k]);
          var tail = Pref ? Pref.keys().then(function (r) { return Promise.all((r.keys || []).filter(function (k) { return isAg(k) && !keep[k] && k !== MIGR_KEY; }).map(function (k) { return Pref.remove({ key: k }); })); }) : Promise.resolve();
          return tail.then(function () { return store.flush(); }).then(function () { emit('agn:deleted', { server: srv }); return { device: true, server: srv, keys: keys.length }; });
        });
      });
    },
    screen: function () {
      return new Promise(function (resolve) {
        var el = openOverlay('delete', '<div class="agn-x"><button data-a="no">✕</button></div>'
          + '<h2 class="agn-h">' + esc(t('settings.delete.title')) + '</h2><p class="agn-lead">' + esc(t(iapOn() || account() ? 'settings.delete.body' : 'settings.delete.body_local')) + '</p>'
          + (iapOn() ? '<p class="agn-sm">' + esc(t('settings.delete.store')) + '</p>' : '')
          + '<button class="agn-btn warn" data-a="yes">' + esc(t('settings.delete.yes')) + '</button>'
          + '<button class="agn-btn ghost" data-a="no">' + esc(t('settings.delete.no')) + '</button><div class="agn-msg" role="status" aria-live="polite"></div>', t('settings.delete.title'));
        el.addEventListener('click', function (e) {
          var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
          if (a === 'no') { closeOverlay('delete'); resolve({ deleted: false }); return; }
          e.target.disabled = true;
          deleteData.run().then(function (r) {
            el.querySelector('.agn-msg').textContent = r.server === 'failed' ? t('settings.delete.server_failed') : t('settings.delete.done');
            setTimeout(function () { closeOverlay('delete'); resolve({ deleted: true, server: r.server }); if (r.server !== 'failed') { try { W.location.reload(); } catch (x) {} } }, r.server === 'failed' ? 4000 : 900);
          });
        });
      });
    }
  };

  // ------------------------------------------------------------------ ready
  var t0 = (W.performance && performance.now) ? performance.now() : Date.now();
  var cfgLoad = (W.fetch && !W.AGN_CONFIG) ? fetch('native/config.json').then(function (r) { return r.ok ? r.json() : null; }).then(applyCfg).catch(function () {}) : Promise.resolve();
  var ready = hydrate().then(function (h) {
    var m = charts.migrate();
    return cfgLoad.then(function () {
      var ms = Math.round(((W.performance && performance.now) ? performance.now() : Date.now()) - t0);
      AGN.info = { hydrate: h, charts: m, ms: ms, storeBuild: !!CFG.storeBuild || (NATIVE && PLATFORM === 'ios') };
      AGN.flags.storeBuild = AGN.info.storeBuild;
      AGN.flags.noExternalPay = AGN.info.storeBuild;
      AGN.flags.iap = iapOn();
      AGN.flags.synth = CFG.synth === true;   // «◈ Что видят системы» in the sphere (П2; 1.0: false)
      if (!iapOn()) closeOverlay('paywall');
      initRC();                                       // no await: the store loads in the background
      return AGN.info;
    });
  });

  var AGN = W.AGN = {
    version: VERSION, native: NATIVE, platform: PLATFORM,
    flags: { storeBuild: false, noExternalPay: false, iap: false, synth: false },   // iap: in-app purchases (1.0: false)   // storeBuild: hide Telegram payment, prices in UAH, waitlists
    ready: ready, store: store, charts: charts, session: { count: sessionNo },
    distress: distress, notify: notify, purchases: purchases, deleteData: deleteData, test: test, events: events,
    t: t, _cfg: CFG, _overlay: { open: openOverlay, close: closeOverlay }
  };
  // #15: «Поделиться» картинкой (шаг 1 «Карты», балл дня). WKWebView и браузеры — Web Share API с файлом;
  // без него — текст через Web Share; иначе картинка скачивается. Нативного плагина не нужно (navigator.share есть в WKWebView).
  // o: {canvas|blob, title, text, file}. Результат: {shared} | {saved} | {cancelled} | {failed}.
  AGN.share = function (o) {
    o = o || {};
    return new Promise(function (resolve) {
      function withBlob(bl) {
        var name = o.file || 'astrogramm.png', f = null;
        try { f = bl && W.File ? new File([bl], name, { type: 'image/png' }) : null; } catch (e) { f = null; }
        var nav = W.navigator || {};
        if (f && nav.canShare && nav.canShare({ files: [f] })) {
          nav.share({ files: [f], text: o.text || '' }).then(function () { events.log('share_done', { kind: 'file' }); resolve({ shared: true }); },
            function (e) { resolve(e && e.name === 'AbortError' ? { cancelled: true } : { failed: true }); });
          return;
        }
        if (nav.share) { nav.share({ title: o.title || 'Astrogramm', text: o.text || '' }).then(function () { resolve({ shared: true }); }, function () { resolve({ cancelled: true }); }); return; }
        try {
          var a = D.createElement('a'); a.href = URL.createObjectURL(bl); a.download = name; D.body.appendChild(a); a.click();
          setTimeout(function () { try { URL.revokeObjectURL(a.href); a.parentNode.removeChild(a); } catch (e) {} }, 1500);
          resolve({ saved: true });
        } catch (e) { resolve({ failed: true }); }
      }
      if (o.blob) return withBlob(o.blob);
      if (o.canvas && o.canvas.toBlob) return o.canvas.toBlob(withBlob, 'image/png');
      resolve({ failed: true });
    });
  };
  AGN.hideSplash = function () { var S = plugin('SplashScreen'); return S ? S.hide().catch(function () {}) : Promise.resolve(); };
  // Cold start (RELEASE-PLAN §0: ≤ 1.5 s): first frame after load + bridge ready. The splash is hidden here at the latest,
  // so a page that never calls AGN.hideSplash() still opens. The mark goes to the console (simulator CI reads it).
  W.addEventListener('load', function () {
    ready.then(function () {
      (W.requestAnimationFrame || setTimeout)(function () { (W.requestAnimationFrame || setTimeout)(function () {
        var nav = W.performance && performance.now ? Math.round(performance.now()) : null;
        AGN.info.firstFrameMs = nav;
        try { console.log('AGN_FIRST_FRAME epoch=' + Date.now() + ' nav_ms=' + nav + ' bridge_ms=' + AGN.info.ms); } catch (e) {}
        AGN.hideSplash();
      }); });
    });
  });
})();
