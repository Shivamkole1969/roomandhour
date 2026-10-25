/* Money Mystery Daily: guess the company from clues about how it really makes money.
   Plain JavaScript, no libraries, no network requests (only outbound links). Works from disk.
   The top part (Logic) is pure and exported for Node tests (test_game.mjs); the rest is the UI. */
(function () {
  'use strict';

  var CONFIG = {
    title: 'Money Mystery Daily',
    siteUrl: 'https://shivamkole1969.github.io/roomandhour/money-mystery/',                 // public URL for the share text; set at deploy. Empty: the page URL when served over http(s), nothing from disk
    storageKey: 'moneymystery.v1',
    maxGuesses: 4,
    testDate: '',                // 'YYYY-MM-DD' pretends today is that date (also ?date=YYYY-MM-DD)
    book: {
      pitch: 'Want 19 more stories like this?',
      title: 'How Companies Really Make Money',
      format: 'Kindle',
      url: 'https://www.amazon.com/dp/B0HNT16VYC'
    },
    version: '0.1.0'
  };

  var DAY_MS = 86400000;

  // =================================================================================================== logic (pure)
  var Logic = {
    CONFIG: CONFIG,
    /** [y, m, d] from 'YYYY-MM-DD', or null if it is not a real calendar date. */
    parseKey: function (key) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ''));
      if (!m) return null;
      var y = +m[1], mo = +m[2], d = +m[3], t = new Date(Date.UTC(y, mo - 1, d));
      return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? [y, mo, d] : null;
    },
    /** The player's local calendar date as 'YYYY-MM-DD'. */
    dateKey: function (date) {
      var p = function (n) { return (n < 10 ? '0' : '') + n; };
      return date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate());
    },
    /** Day number: start date = 1. Counted on calendar dates (UTC arithmetic), so clock changes never skip or repeat a day. */
    dayNumber: function (key, start) {
      var a = Logic.parseKey(key), b = Logic.parseKey(start);
      if (!a || !b) return 1;
      return Math.round((Date.UTC(a[0], a[1] - 1, a[2]) - Date.UTC(b[0], b[1] - 1, b[2])) / DAY_MS) + 1;
    },
    /** Puzzle index for a day number: day 1 = puzzles[0]; after the last one the rotation loops. Days before the start show puzzle 1. */
    puzzleIndex: function (day, count) {
      var d = Math.max(1, day);
      return (d - 1) % count;
    },
    /** Everything the page needs for a date: { day, index, puzzle }. Days before the start count as day 1. */
    puzzleFor: function (key, data) {
      var day = Math.max(1, Logic.dayNumber(key, data.start));
      var index = Logic.puzzleIndex(day, data.puzzles.length);
      return { day: day, index: index, puzzle: data.puzzles[index] };
    },
    /** Small deterministic PRNG. */
    mulberry32: function (a) {
      return function () {
        a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    /** The six options for a puzzle on a day: answer + decoys, shuffled the same way on every reload. */
    options: function (puzzle, day) {
      var list = [puzzle.answer].concat(puzzle.decoys), seed = day * 2654435761;
      for (var i = 0; i < puzzle.id.length; i++) seed = (seed ^ puzzle.id.charCodeAt(i)) * 16777619;
      var rnd = Logic.mulberry32(seed | 0);
      for (var a = list.length - 1; a > 0; a--) { var j = Math.floor(rnd() * (a + 1)), x = list[a]; list[a] = list[j]; list[j] = x; }
      return list;
    },
    /** Round state from the picks so far. */
    result: function (picks, answer, max) {
      max = max || CONFIG.maxGuesses;
      var won = picks.indexOf(answer) !== -1;
      var guesses = won ? picks.indexOf(answer) + 1 : picks.length;
      return { won: won, lost: !won && picks.length >= max, done: won || picks.length >= max, guesses: guesses, wrong: won ? guesses - 1 : picks.length };
    },
    /** How many clues are visible: one to start, one more per wrong pick, all once the round is over. */
    cluesShown: function (puzzle, picks, max) {
      var r = Logic.result(picks, puzzle.answer, max);
      return r.done ? puzzle.clues.length : Math.min(puzzle.clues.length, r.wrong + 1);
    },
    /** Spoiler-free emoji row: a red square per wrong pick, green for the right one. */
    grid: function (picks, answer) {
      var r = Logic.result(picks, answer), s = '';
      for (var i = 0; i < r.wrong; i++) s += '🟥';
      if (r.won) s += '🟩';
      return s;
    },
    /** The text a player shares. Never names the company. */
    shareText: function (day, picks, puzzle, url) {
      var r = Logic.result(picks, puzzle.answer);
      var how = !r.won ? 'not solved' : r.guesses <= puzzle.clues.length ? 'solved on clue ' + r.guesses : 'solved on guess ' + r.guesses;
      return CONFIG.title + ' #' + day + ' ' + Logic.grid(picks, puzzle.answer) + ' (' + how + ')' + (url ? '\n' + url : '');
    },
    /** Stats from saved rounds { [day]: { picks, won, done } }. Streak = days won in a row up to today (or yesterday if today is open). */
    stats: function (games, today) {
      var played = 0, wins = 0, dist = [0, 0, 0, 0], days = [];
      Object.keys(games || {}).forEach(function (k) {
        var g = games[k];
        if (!g || !g.done) return;
        played++;
        if (g.won) { wins++; dist[Math.min(dist.length, g.guesses) - 1]++; days.push(+k); }
      });
      var d = today;
      if (!(games[d] && games[d].done)) d -= 1;
      var streak = 0;
      while (games[d] && games[d].won) { streak++; d--; }
      days.sort(function (a, b) { return a - b; });
      var best = 0, run = 0;
      for (var i = 0; i < days.length; i++) { run = i && days[i] === days[i - 1] + 1 ? run + 1 : 1; if (run > best) best = run; }
      return { played: played, wins: wins, winPct: played ? Math.round(100 * wins / played) : 0, streak: streak, best: best, dist: dist };
    },
    /** Short label for a source link: the host without "www.". */
    host: function (url) {
      var m = /^https?:\/\/([^/?#]+)/i.exec(url || '');
      return m ? m[1].replace(/^www\./i, '') : url;
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = Logic; return; }

  // =================================================================================================== UI
  var doc = document, win = window;
  var DATA = win.MMD_DATA;
  var app = doc.getElementById('app');
  if (!DATA || !DATA.puzzles || !DATA.puzzles.length) { app.innerHTML = '<p class="fatal">The puzzles did not load.</p>'; return; }

  var ICON = {
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2.1-2.5 3.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.9" r="1.1" fill="currentColor"/></svg>',
    stats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V12M12 20V5M19 20v-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    ext: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    mark: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="17" cy="17" r="11.5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M25.5 25.5 34 34" stroke="currentColor" stroke-width="3.6" stroke-linecap="round"/><path d="M19.6 12.6c-.6-.9-1.6-1.4-2.8-1.4-1.7 0-2.9.9-2.9 2.3 0 3.1 6.1 1.6 6.1 4.9 0 1.4-1.3 2.4-3.1 2.4-1.3 0-2.5-.6-3.1-1.6M16.8 9.4v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  // --------------------------------------------------------------------------------------------- storage (optional)
  var Store = {
    get: function () { try { return win.localStorage.getItem(CONFIG.storageKey); } catch (e) { return null; } },
    set: function (v) { try { win.localStorage.setItem(CONFIG.storageKey, v); } catch (e) { /* storage off: keep playing in memory */ } }
  };
  var save = { v: 1, games: {}, seenHelp: false };
  (function load() {
    try {
      var raw = Store.get();
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && d.v === 1 && d.games && typeof d.games === 'object') { save.games = d.games; save.seenHelp = !!d.seenHelp; }
    } catch (e) { /* corrupt or blocked: start fresh */ }
  })();
  function persist() { try { Store.set(JSON.stringify(save)); } catch (e) { /* ignore */ } }

  // --------------------------------------------------------------------------------------------- dates
  function testDate() {
    var q = '';
    try { q = new URLSearchParams(win.location.search).get('date') || ''; } catch (e) { q = ''; }
    if (Logic.parseKey(q)) return q;
    return Logic.parseKey(CONFIG.testDate) ? CONFIG.testDate : '';
  }
  var pinned = testDate();
  function todayKey() { return pinned || Logic.dateKey(new Date()); }
  function prettyDate(key) {
    var p = Logic.parseKey(key);
    try { return new Date(p[0], p[1] - 1, p[2], 12).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
    catch (e) { return key; }
  }
  function untilMidnight() {
    var now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return Math.max(0, next - now);
  }
  function hms(ms) {
    var s = Math.floor(ms / 1000), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60);
  }

  // --------------------------------------------------------------------------------------------- state
  var ui = { key: '', day: 1, p: null, opts: [], picks: [], fresh: -1, modal: '', toastT: 0, timer: 0 };
  function loadDay() {
    ui.key = todayKey();
    var f = Logic.puzzleFor(ui.key, DATA);
    ui.day = f.day; ui.p = f.puzzle;
    ui.opts = Logic.options(ui.p, ui.day);
    var g = save.games[ui.day];
    ui.picks = g && g.id === ui.p.id && Array.isArray(g.picks) ? g.picks.filter(function (x) { return ui.opts.indexOf(x) !== -1; }) : [];
    ui.fresh = -1;
  }
  function round() { return Logic.result(ui.picks, ui.p.answer, CONFIG.maxGuesses); }
  function record() {
    var r = round();
    save.games[ui.day] = { id: ui.p.id, picks: ui.picks.slice(), done: r.done, won: r.won, guesses: r.guesses };
    persist();
  }

  // --------------------------------------------------------------------------------------------- helpers
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function shareUrl() {
    if (CONFIG.siteUrl) return CONFIG.siteUrl;
    try { if (/^https?:$/.test(win.location.protocol)) return win.location.origin + win.location.pathname; } catch (e) { /* ignore */ }
    return '';
  }
  function srcLinks(list) {
    var seen = {};
    return list.filter(function (u) { if (seen[u]) return false; seen[u] = true; return true; }).map(function (u) {
      return '<a class="src" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(Logic.host(u)) + ICON.ext + '</a>';
    }).join('');
  }
  function toast(msg, kind) {
    var el = doc.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast on' + (kind ? ' ' + kind : '');
    clearTimeout(ui.toastT);
    ui.toastT = setTimeout(function () { el.className = 'toast'; }, 2600);
  }
  function triesHTML(r) {
    var h = '<div class="tries" aria-label="' + (CONFIG.maxGuesses - ui.picks.length) + ' guesses left">';
    for (var i = 0; i < CONFIG.maxGuesses; i++) {
      var cls = i < r.wrong ? 'bad' : (r.won && i === r.wrong ? 'good' : '');
      h += '<i class="' + cls + '"></i>';
    }
    var left = CONFIG.maxGuesses - ui.picks.length;
    return h + '<span>' + (r.done ? '' : left + (left === 1 ? ' guess left' : ' guesses left')) + '</span></div>';
  }

  // --------------------------------------------------------------------------------------------- views
  function header() {
    return '<header class="top">' +
      '<div class="brand"><span class="mark">' + ICON.mark + '</span><div><h1>Money Mystery</h1><span class="kicker">Daily</span></div></div>' +
      '<div class="head-btns">' +
      '<button class="ibtn" data-act="help" aria-label="How to play">' + ICON.help + '</button>' +
      '<button class="ibtn" data-act="stats" aria-label="Your stats">' + ICON.stats + '</button>' +
      '</div></header>';
  }
  function cluesHTML(withSources) {
    var p = ui.p, shown = Logic.cluesShown(p, ui.picks, CONFIG.maxGuesses), h = '<ol class="clues">';
    for (var i = 0; i < p.clues.length; i++) {
      if (i < shown) {
        h += '<li class="clue' + (i === ui.fresh ? ' fresh' : '') + '"><span class="n">' + (i + 1) + '</span><div class="ct"><p>' + esc(p.clues[i].text) + '</p>' +
          (withSources ? '<div class="srcs">' + srcLinks(p.clues[i].src) + '</div>' : '') + '</div></li>';
      } else {
        h += '<li class="clue locked"><span class="n">' + ICON.lock + '</span><div class="ct"><p>Clue ' + (i + 1) + ' unlocks after a wrong pick</p></div></li>';
      }
    }
    return h + '</ol>';
  }
  function playView() {
    var p = ui.p, r = round();
    var h = '<section class="card puzzle">' +
      '<div class="meta"><span class="kicker">#' + ui.day + ' · ' + esc(prettyDate(ui.key)) + '</span><span class="chip">' + esc(p.world) + '</span></div>' +
      '<h2>Which company makes money like this?</h2>' +
      cluesHTML(false) + triesHTML(r) + '</section>';
    h += '<section class="opts" role="group" aria-label="Pick the company">';
    ui.opts.forEach(function (o, i) {
      var wrong = ui.picks.indexOf(o) !== -1;
      h += '<button class="opt' + (wrong ? ' wrong' : '') + '" data-act="pick" data-i="' + i + '"' + (wrong ? ' disabled aria-disabled="true"' : '') + '>' +
        '<span class="k">' + (i + 1) + '</span><span class="nm">' + esc(o) + '</span></button>';
    });
    h += '</section>';
    h += '<p class="hint">Hardest clue first. Each wrong pick unlocks the next one.</p>';
    return h;
  }
  function statsHTML(s) {
    var max = Math.max.apply(null, s.dist.concat([1])), r = round();
    var h = '<div class="nums">' +
      '<div class="num"><b>' + s.played + '</b><span>Played</span></div>' +
      '<div class="num"><b>' + s.winPct + '%</b><span>Solved</span></div>' +
      '<div class="num"><b>' + s.streak + '</b><span>Streak</span></div>' +
      '<div class="num"><b>' + s.best + '</b><span>Best</span></div></div>';
    h += '<div class="dist" aria-label="Solved on guess">';
    s.dist.forEach(function (n, i) {
      var me = r.done && r.won && r.guesses === i + 1;
      h += '<div class="row"><span>' + (i + 1) + '</span><div class="bar"><i class="' + (me ? 'me' : '') + '" style="width:' + Math.max(8, Math.round(100 * n / max)) + '%">' + n + '</i></div></div>';
    });
    return h + '</div>';
  }
  function resultView() {
    var p = ui.p, r = round(), s = Logic.stats(save.games, ui.day);
    var head = r.won ? (r.guesses === 1 ? 'Solved on the first clue' : r.guesses <= p.clues.length ? 'Solved on clue ' + r.guesses : 'Solved on guess ' + r.guesses) : 'Not this time';
    var h = '<section class="card result ' + (r.won ? 'won' : 'lost') + '">' +
      '<div class="meta"><span class="kicker">#' + ui.day + ' · ' + esc(prettyDate(ui.key)) + '</span><span class="chip">' + esc(p.world) + '</span></div>' +
      '<div class="verdict">' + esc(head) + '</div>' +
      '<h2>' + (r.won ? 'It’s ' : 'It was ') + '<b>' + esc(p.answer) + '</b></h2>' +
      triesHTML(r) +
      '<div class="act"><button class="btn gold" data-act="share">' + ICON.share + 'Share result</button></div>' +
      (pinned ? '<div class="next">Test date ' + esc(pinned) + '</div>' : '<div class="next">Next mystery in <b id="cd">' + hms(untilMidnight()) + '</b></div>') +
      '</section>';
    h += '<section class="card explain"><div class="kicker gold-t">So that’s how they make money</div>' +
      '<p class="lede">' + esc(p.explain) + '</p>' +
      '<div class="srcs">' + srcLinks(p.explainSrc || []) + '</div></section>';
    h += '<section class="card recap"><div class="kicker">The clues, with sources</div>' + cluesHTML(true) + '</section>';
    h += '<section class="card statcard"><div class="kicker">Your stats</div>' + statsHTML(s) + '</section>';
    h += '<aside class="card book"><span class="bico">' + ICON.book + '</span><div class="bt">' +
      '<p>' + esc(CONFIG.book.pitch) + '</p>' +
      '<a class="booklink" href="' + esc(CONFIG.book.url) + '" target="_blank" rel="noopener">' + esc(CONFIG.book.title) + ' <span>(' + esc(CONFIG.book.format) + ')</span>' + ICON.ext + '</a>' +
      '</div></aside>';
    h += '<p class="note">For explanation only, not financial advice.</p>';
    return h;
  }
  function footer() {
    return '<footer class="foot">Every clue is a sourced, public fact. Brand names appear as plain text only; no company here is affiliated with or endorses this game.</footer>';
  }
  function modalHTML() {
    if (ui.modal === 'help') {
      return '<div class="ov" data-act="backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mh">' +
        '<button class="ibtn x" data-act="close" aria-label="Close">' + ICON.close + '</button>' +
        '<h3 id="mh">How to play</h3>' +
        '<ol class="steps"><li><b>One company a day.</b> The clues describe how it really makes money.</li>' +
        '<li><b>Pick from six names.</b> You start with the hardest clue.</li>' +
        '<li><b>Each wrong pick unlocks the next clue.</b> Four wrong picks and the round is over.</li>' +
        '<li><b>Then see the answer explained,</b> with a source for every fact.</li></ol>' +
        '<p class="muted small">A new mystery at midnight, your time. Share your result without spoiling it.</p>' +
        '<div class="act"><button class="btn gold" data-act="close">Play</button></div></div></div>';
    }
    if (ui.modal === 'stats') {
      return '<div class="ov" data-act="backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="ms">' +
        '<button class="ibtn x" data-act="close" aria-label="Close">' + ICON.close + '</button>' +
        '<h3 id="ms">Your stats</h3>' + statsHTML(Logic.stats(save.games, ui.day)) +
        '<p class="muted small">Stats stay in this browser only.</p></div></div>';
    }
    return '';
  }
  function render() {
    var r = round();
    app.innerHTML = '<div class="wrap">' + header() + (r.done ? resultView() : playView()) + footer() + '</div>' +
      modalHTML() + '<div id="toast" class="toast" role="status" aria-live="polite"></div>';
    clearInterval(ui.timer);
    if (r.done && !pinned) {
      ui.timer = setInterval(function () {
        var el = doc.getElementById('cd');
        if (todayKey() !== ui.key) { loadDay(); render(); return; }
        if (el) el.textContent = hms(untilMidnight());
      }, 1000);
    }
  }

  // --------------------------------------------------------------------------------------------- actions
  function pick(i) {
    var r = round(), name = ui.opts[i];
    if (r.done || !name || ui.picks.indexOf(name) !== -1) return;
    ui.picks.push(name);
    record();
    var after = round();
    if (after.done) {
      ui.fresh = -1;
      render();
      win.scrollTo(0, 0);
      return;
    }
    var shown = Logic.cluesShown(ui.p, ui.picks, CONFIG.maxGuesses), unlocked = shown === after.wrong + 1;
    ui.fresh = unlocked ? shown - 1 : -1;
    render();
    var left = CONFIG.maxGuesses - ui.picks.length;
    var msg = 'Not ' + name + '. ' + (unlocked ? 'Clue ' + shown + ' unlocked.' : 'No more clues, ' + left + (left === 1 ? ' guess' : ' guesses') + ' left.');
    toast(msg, 'bad');
    var btn = app.querySelector('.opt[data-i="' + i + '"]');
    if (btn) { btn.classList.add('shake'); }
    var fresh = app.querySelector('.clue.fresh');
    if (fresh && fresh.scrollIntoView) { try { fresh.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* old browsers */ } }
  }
  function copyText(txt, done) {
    function fallback() {
      try {
        var ta = doc.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
        doc.body.appendChild(ta); ta.select(); doc.execCommand('copy'); ta.remove(); done();
      } catch (e) { toast('Copy failed. Long-press to copy: ' + txt); }
    }
    try {
      if (win.navigator.clipboard && win.navigator.clipboard.writeText) win.navigator.clipboard.writeText(txt).then(done, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }
  function share() {
    var txt = Logic.shareText(ui.day, ui.picks, ui.p, shareUrl());
    var coarse = false;
    try { coarse = win.matchMedia && win.matchMedia('(pointer: coarse)').matches; } catch (e) { coarse = false; }
    if (coarse && win.navigator.share) {
      win.navigator.share({ text: txt }).catch(function () { /* cancelled */ });
      return;
    }
    copyText(txt, function () { toast('Result copied. Paste it anywhere.'); });
  }
  function openModal(m) { ui.modal = m; render(); var b = app.querySelector('.modal .btn, .modal .x'); if (b) b.focus(); }
  function closeModal() {
    if (ui.modal === 'help' && !save.seenHelp) { save.seenHelp = true; persist(); }
    ui.modal = ''; render();
  }

  app.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (act === 'backdrop' && e.target !== t) return;
    if (act === 'pick') pick(+t.getAttribute('data-i'));
    else if (act === 'share') share();
    else if (act === 'help') openModal('help');
    else if (act === 'stats') openModal('stats');
    else if (act === 'close' || act === 'backdrop') closeModal();
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && ui.modal) { closeModal(); return; }
    if (ui.modal || e.metaKey || e.ctrlKey || e.altKey) return;
    var n = +e.key;
    if (n >= 1 && n <= ui.opts.length) pick(n - 1);
  });
  doc.addEventListener('visibilitychange', function () {
    if (!doc.hidden && todayKey() !== ui.key) { loadDay(); render(); }
  });

  // test hooks for screens.mjs (no effect on play)
  win.MoneyMystery = {
    state: function () { return { day: ui.day, id: ui.p.id, picks: ui.picks.slice(), options: ui.opts.slice(), done: round().done }; },
    pick: function (name) { var i = ui.opts.indexOf(name); if (i !== -1) pick(i); return round(); },
    share: function () { return Logic.shareText(ui.day, ui.picks, ui.p, shareUrl()); }
  };

  loadDay();
  if (!save.seenHelp && !round().done) ui.modal = 'help';
  render();
})();
