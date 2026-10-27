/* Who Took the Christmas Star? Case generator (pure logic, no DOM).
   Every game: a new thief, new rooms and new clues, and always solvable:
   each innocent's 10:30 alibi is vouched for by another innocent, and every room the thief
   could claim is occupied, watched or sealed by an innocent's clue. test_party.mjs checks this. */
(function (root) {
  'use strict';

  var CHARS = [
    { id: 'ivy', name: 'Grandma Ivy', role: 'owner of Holly House', look: 'a green velvet dress',
      intro: "It's my house and it was my mother's star. I want it back on that tree by midnight.",
      secret: 'Last month you quietly insured the star for far more than it is worth. If that comes out, it will look bad.' },
    { id: 'rex', name: 'Uncle Rex', role: 'the family joker', look: 'a reindeer jumper with a flashing nose',
      intro: "Don't look at me. I'm the fun one.",
      secret: "You're broke. This week you asked three people in this house for a loan." },
    { id: 'delia', name: 'Aunt Delia', role: 'the perfectionist', look: 'a white silk blouse and pearl earrings',
      intro: "That star was tarnished and crooked. I'm upset, of course. Just not very.",
      secret: 'You secretly ordered a brand-new star online. It arrives tomorrow.' },
    { id: 'milo', name: 'Cousin Milo', role: '17, a gamer', look: 'a hoodie with headphones round the neck',
      intro: 'I was busy. Ask anyone. Actually, maybe don\'t ask anyone.',
      secret: 'Last Christmas you snapped a point off the star and glued it back. Nobody knows.' },
    { id: 'nora', name: 'Nora Bell', role: 'the cook, a friend of the family for 20 years', look: 'a striped apron',
      intro: "I've cooked in this house for twenty years. I notice things.",
      secret: 'You know where Grandma hides the spare key to the hall cabinet.' },
    { id: 'basil', name: 'Dr. Basil Finch', role: 'the neighbour, an antiques collector', look: 'a tweed jacket with a magnifying glass in the pocket',
      intro: 'A remarkable piece, that star. Victorian, I believe. My interest is purely professional.',
      secret: 'Years ago you offered Grandma a lot of money for the star. She laughed and said no.' },
    { id: 'jules', name: 'Jules Marlow', role: "Delia's new partner, first Christmas here", look: 'a sparkly bow tie',
      intro: "I've known you all for six hours. I'm the only one with no reason to take it.",
      secret: 'Last night you searched online for how much antique silver stars sell for.' },
    { id: 'otto', name: 'Captain Otto Frost', role: "a retired sailor, Grandma's oldest friend", look: "a captain's cap and an unlit pipe",
      intro: 'Forty years at sea and I never lost a thing that was not nailed down.',
      secret: "As a young sailor you 'borrowed' a ship's bell as a prank and never gave it back." }
  ];

  var HALL = 'Great Hall';
  var ROOMS = {
    'Library':      { doing: 'reading by the fire', photo: 'the fire and the tall bookshelves', pair: 'Study', via: 'the glass doors' },
    'Study':        { doing: 'hunting for sticky tape in the old desk', photo: 'the old desk and the globe', pair: 'Library', via: 'the glass doors' },
    'Kitchen':      { doing: 'stirring the mulled wine', photo: 'the steaming pot of mulled wine', pair: 'Dining Room', via: 'the serving hatch' },
    'Dining Room':  { doing: "laying the table for tomorrow's lunch", photo: 'the half-laid table', pair: 'Kitchen', via: 'the serving hatch' },
    'Music Room':   { doing: 'playing carols on the old piano', photo: 'the piano and its sheet music', pair: 'Conservatory', via: 'the big window' },
    'Conservatory': { doing: 'watching the snow fall', photo: 'snow on the glass roof', pair: 'Music Room', via: 'the big window' }
  };
  var ROOM_NAMES = Object.keys(ROOMS);

  var TRAITS = {
    glitter: { look: 'red glitter on both sleeves', why: 'you wrapped presents in red glitter paper at 7 PM',
      evidence: 'Red glitter is stuck to the top branches, right where the star hung. Whoever took it has glitter on them.' },
    flour:   { look: 'flour on the hands', why: 'you helped roll pastry for mince pies at 9 PM',
      evidence: 'There is a floury fingerprint on the top branch. Whoever took the star had flour on their hands.' },
    snow:    { look: 'wet, snowy boots', why: 'you went out to the woodshed for logs at 10 PM',
      evidence: 'A puddle of melted snow sits right under the tree, where someone stood on tiptoe. The thief has snowy boots.' },
    wax:     { look: 'a drip of red candle wax on one cuff', why: 'you lit the red candles at 8 PM',
      evidence: 'Fresh red candle wax has dripped down the branches below the star. The thief brushed past a candle: look for wax.' },
    sap:     { look: 'sticky pine sap on the fingers', why: 'you hung the wreath on the front door at 6 PM',
      evidence: 'The top branch is bent and sticky with sap. Whoever took the star got pine sap on their fingers.' }
  };
  var TRAIT_IDS = Object.keys(TRAITS);

  var HIDES = ['inside the grandfather clock', 'in the toe of a Christmas stocking', 'under the piano bench lid',
    'in the coal scuttle by the fire', 'inside a hollow book in the Library', 'in the dog\'s basket, under the blanket'];

  function rngFrom(seed) {
    var a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(arr, rnd) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }
  function listNames(names) {
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  // Split the innocents into groups of 1-3, at least one person alone when there are 3+.
  function groupSizes(k, rnd) {
    for (var tries = 0; tries < 50; tries++) {
      var sizes = [], left = k;
      while (left > 0) { var s = 1 + Math.floor(rnd() * Math.min(3, left)); if (s === 3 && rnd() < 0.6) s = 2; sizes.push(Math.min(s, left)); left -= sizes[sizes.length - 1]; }
      if (sizes.length <= 5 && (k < 3 || sizes.indexOf(1) >= 0)) return sizes;
    }
    return [k];
  }

  function generate(playerNames, seed) {
    var rnd = rngFrom(seed);
    var n = playerNames.length;
    if (n < 4 || n > 8) throw new Error('4 to 8 players');
    var chars = shuffle(CHARS, rnd).slice(0, n);
    var P = playerNames.map(function (nm, i) { return { name: nm, c: chars[i], clues: [] }; });
    var thief = Math.floor(rnd() * n);
    var inno = P.map(function (_, i) { return i; }).filter(function (i) { return i !== thief; });

    // Rooms at 10:30
    var sizes = groupSizes(inno.length, rnd);
    var order = shuffle(inno, rnd), rooms = shuffle(ROOM_NAMES, rnd), at = {}, occ = {};
    ROOM_NAMES.forEach(function (r) { occ[r] = []; });
    sizes.forEach(function (s, g) { var r = rooms[g]; order.splice(0, s).forEach(function (i) { at[i] = r; occ[r].push(i); }); });
    at[thief] = HALL;

    var vouch = {};  // innocent index -> how they're vouched for (for the reveal)
    var checks = {}; // room -> how a false claim about it is caught
    function nm(i) { return P[i].c.name; }

    // Co-occupants vouch for each other.
    ROOM_NAMES.forEach(function (r) {
      var o = occ[r];
      if (o.length > 1) o.forEach(function (i) {
        vouch[i] = 'was with ' + listNames(o.filter(function (j) { return j !== i; }).map(nm)) + ' in the ' + r;
      });
      if (o.length) checks[r] = listNames(o.map(nm)) + (o.length > 1 ? ' were' : ' was') + ' in there';
    });
    // Sight lines: everyone in a room sees into its paired room when the lights come back.
    ROOM_NAMES.forEach(function (r) {
      var o = occ[r]; if (!o.length) return;
      var q = ROOMS[r].pair, seen = occ[q];
      var what = seen.length ? listNames(seen.map(nm)) + (seen.length > 1 ? ' were' : ' was') + ' in there, nobody else' : 'it was empty';
      o.forEach(function (i) { P[i].clues.push('When the lights came back on, you could see into the ' + q + ' through ' + ROOMS[r].via + ': ' + what + '.'); });
      seen.forEach(function (j) { if (!vouch[j]) vouch[j] = 'was seen in the ' + q + ' by ' + listNames(o.map(nm)) + ' through ' + ROOMS[r].via; });
      checks[q] = (checks[q] ? checks[q] + ', and ' : '') + listNames(o.map(nm)) + ' could see into it from the ' + r + (seen.length ? '' : ' (empty)');
    });
    // Anyone still alone and unseen texted a time-stamped photo to another innocent.
    inno.forEach(function (i) {
      if (vouch[i]) return;
      var to = pick(inno.filter(function (j) { return j !== i; }), rnd), r = at[i];
      P[to].clues.push('At 10:30, right as the lights flickered, ' + nm(i) + ' texted you a photo from the ' + r + ': ' + ROOMS[r].photo + ', time-stamped 10:30.');
      vouch[i] = 'texted ' + nm(to) + ' a 10:30 photo from the ' + r;
    });
    // Rooms nobody was in or could see into: an innocent knows they were sealed.
    ROOM_NAMES.forEach(function (r) {
      if (checks[r]) return;
      var who = pick(inno, rnd);
      var mop = rnd() < 0.5;
      P[who].clues.push(mop ? 'You mopped the ' + r + ' floor at 10:15. At 10:45 it was still spotless: nobody had walked in.'
                            : 'You locked the ' + r + ' at 10 PM to hide presents in there. The only key has been in your pocket ever since.');
      checks[r] = mop ? nm(who) + ' mopped its floor at 10:15 and it stayed spotless' : nm(who) + ' had locked it with the only key';
    });

    // Public traits: the evidence trait is on the thief and 1-2 innocents (decoys).
    var ev = pick(TRAIT_IDS, rnd);
    var decoys = shuffle(inno, rnd).slice(0, n >= 6 ? 2 : 1);
    P.forEach(function (p, i) {
      p.trait = (i === thief || decoys.indexOf(i) >= 0) ? ev : pick(TRAIT_IDS.filter(function (t) { return t !== ev; }), rnd);
    });

    // Flavour lines (true, harmless, never part of the solution)
    var others = function (i) { return P.map(function (_, j) { return j; }).filter(function (j) { return j !== i; }); };
    inno.forEach(function (i) {
      var x = nm(pick(others(i), rnd));
      var f = pick([
        'At dinner you caught ' + x + ' staring at the star for a long time.',
        'This afternoon you heard ' + x + ' ask how much the star is worth.',
        'At 10:15 you heard footsteps on the stairs. You did not see who it was.',
        'At 9 PM the star was already a little crooked, as if someone had touched it.',
        x + ' left the dinner table early, at about 9:45, and looked nervous.'
      ], rnd);
      P[i].clues.push(f);
    });

    // The thief's cover story: suggest a room with nobody in it if possible, else a lone person's room.
    var empty = ROOM_NAMES.filter(function (r) { return !occ[r].length; });
    var lone = ROOM_NAMES.filter(function (r) { return occ[r].length === 1; });
    var claim = empty.length ? pick(empty, rnd) : (lone.length ? pick(lone, rnd) : pick(ROOM_NAMES, rnd));
    var hide = pick(HIDES, rnd);

    return { seed: seed, n: n, thief: thief, at: at, occ: occ, ev: ev, decoys: decoys, claim: claim, hide: hide,
      vouch: vouch, checks: checks,
      players: P.map(function (p) { return { name: p.name, cid: p.c.id, trait: p.trait, clues: p.clues }; }) };
  }

  var api = { CHARS: CHARS, ROOMS: ROOMS, ROOM_NAMES: ROOM_NAMES, HALL: HALL, TRAITS: TRAITS, generate: generate,
    charById: function (id) { for (var i = 0; i < CHARS.length; i++) if (CHARS[i].id === id) return CHARS[i]; return null; },
    listNames: listNames };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StarCase = api;
})(this);
