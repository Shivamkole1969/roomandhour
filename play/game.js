/* Room & Hour: murder-mystery logic puzzles in the browser.
   Plain JavaScript, no frameworks, no network requests (the CrazyGames and GameMonetize SDKs are only loaded behind flags).
   The top part (Logic) is pure and is exported for Node tests (test_game.mjs); the rest is the UI. */
(function () {
  'use strict';

  var CONFIG = {
    title: 'Room & Hour',                 // working title: change the game's name here only
    edition: 'web',                       // 'web' (itch.io / own site: share + book links), 'crazygames' or 'gamemonetize' (portals: no links, no promotion); set by package.py
    testDate: '',                         // 'YYYY-MM-DD' pretends today is that date (also ?date=YYYY-MM-DD); used by tests and screenshots
    crazygames: false,                    // build flag: true loads the CrazyGames SDK v3 (also on with ?crazygames=1)
    crazySdkUrl: 'https://sdk.crazygames.com/crazygames-sdk-v3.js',
    gamemonetize: false,                  // build flag: true loads the GameMonetize SDK (one ad when a case opens, never on a timer)
    gmGameId: '',                         // GameMonetize game ID; set by package.py
    gmSdkUrl: 'https://api.gamemonetize.com/sdk.js',
    storageKey: 'roomhour.v1',
    wrongPenalty: 30,                     // seconds added to the clock for a wrong accusation
    version: '1.1.0',
    /*WEB-ONLY-BEGIN*/
    // Web edition only (package.py strips this block from the CrazyGames build). Swap in the product URLs after launch.
    siteUrl: 'https://shivamkole1969.itch.io/room-and-hour',
    books: {
      en: 'https://www.amazon.com/s?k=Room+%26+Hour+Murder+Mystery+Advent+Calendar',
      de: 'https://www.amazon.de/s?k=Room+%26+Hour+Krimi+Adventskalender',
      fr: 'https://www.amazon.fr/s?k=Room+%26+Hour+Calendrier+de+l%27Avent+des+Enqu%C3%AAtes',
      vol1: 'https://www.amazon.com/s?k=Room+%26+Hour+Murder+Mystery+Puzzle+Book+Volume+1'
    },
    /*WEB-ONLY-END*/
    adventYearDays: 24
  };

  // =================================================================================================== strings (EN / DE / FR)
  // Every UI string lives here. Case texts (title, story, clues ...) stay in cases.json: a case may carry
  // text: { de: {...}, fr: {...} } with the same shape as the English fields; missing parts fall back to English.
  var LANGS = ['en', 'de', 'fr'], LOCALE = { en: 'en-GB', de: 'de-DE', fr: 'fr-FR' };
  var STR = {
    en: {
      tagline: 'Murder-mystery logic puzzles. Three hours, one door at a time.',
      lv_easy: 'Easy', lv_medium: 'Medium', lv_hard: 'Hard',
      set_manor: 'Country house', set_lodge: 'Ski lodge', set_theatre: 'Theatre', set_museum: 'Museum', set_train: 'Night train',
      clues_n: '{n} clues',
      case_short: 'Case {n}', case_level: '{level} {n}',
      aria_howto: 'How to play', aria_sound: 'Sound', aria_lang: 'Language', aria_close: 'Close', aria_cases: 'All cases',
      daily_case: 'Daily case', daily_kicker: 'Daily case · {date}',
      case_meta: '{setting} · {clues} clues · {sus} suspects',
      solved_in: 'Solved in {t}', review: 'Review', cont: 'Continue', play_today: "Play today's case", streak_n: '{n}-day streak',
      stat_solved: 'Solved', stat_stars: 'Stars', stat_streak: 'Day streak',
      cont_continue: 'Continue {label}, {title}', cont_next: 'Next: {label}, {title}',
      all_closed: 'Every case closed. The daily case keeps coming.',
      foot: 'Every case has exactly one solution, reachable by deduction alone.',
      clues: 'Clues', tap_strike: 'tap to strike out', floorplan: 'Floor plan', tap_room: 'Tap a room to spot its letter',
      casefile: 'Case file', timetable: 'Timetable', tap_letter: 'Tap a letter: once to cross out, twice to circle', solve: 'Solve',
      hint: 'Hint', accuse: 'Accuse', play_again: 'Play again',
      known_facts: 'Known facts', suspects: 'The suspects', objects: 'The objects',
      objects_note: 'Each suspect carried one of these all evening, and no two carried the same one.', howto: 'How to play',
      case_closed: 'Case closed', solvedbar: 'in {t} · {hints} · {wrong} wrong', hint_one: '{n} hint', hint_other: '{n} hints',
      col_object: 'Object', victim: 'Victim', undo: 'Undo', clear: 'Clear',
      tip_grid: 'Cross out what the clues rule out. Circle the one that is left. Letters are coloured by {by}.',
      by_floor: 'floor', by_train: 'half of the train', by_side: 'side',
      aria_cell: '{who}, {hour}, {room}', aria_obj: '{who} carried {obj}',
      hint_earlier: 'Earlier hint', hint_later: 'Later hint', hint_hide: 'Hide hint',
      hint_n: 'Hint {n}', hint_head_err: 'Hint {n} · check your grid', hint_head_final: 'Hint {n} · the verdict', fill_it: 'Fill it in',
      hint_done: 'Your timetable already holds everything the clues can tell you. Make your accusation.',
      err_obj: "Something in {who}'s object column does not fit the evidence. Take another look at it.",
      err_cell: 'Your marks for {who} at {hour} do not fit the evidence. Take another look at that cell.',
      leg_conn: 'connection (a door)', leg_door: 'door', leg_stairs: 'stairs (count as a door)', leg_window: 'window',
      nothing_undo: 'Nothing to undo', clear_q: 'Clear the timetable?',
      clear_text: 'Every cross and circle is removed. Your clock, hints and struck-out clues stay as they are.', cancel: 'Cancel',
      rule1_t: 'The map', rule1: 'Each room has a letter. Doors are gaps in the walls, and a staircase counts as a door. “Next door” means joined by a door or a staircase.',
      rule2_t: 'The clock', rule2: 'Each case covers three hours. At each hour, every suspect was in exactly one room. The clues only talk about those three hours.',
      rule3_t: 'The One-Door Rule', rule3: 'From one hour to the next, a person either stayed put or walked through exactly one door.',
      rule4_t: 'The objects', rule4: 'Each suspect carried one of the listed objects all evening, and no two carried the same one. An object is always wherever its carrier is.',
      rule5_t: 'The words', rule5: 'When a clue names two people, they are two different people. “Alone” means nobody else, not even the victim, was in the room. Counts such as “exactly two suspects” count suspects only.',
      rule6_t: 'The killer', rule6: 'Exactly one suspect was ever alone with the victim. That meeting was the murder: its room, its hour, and the object the killer carried.',
      rule7_t: 'Fair play', rule7: 'Every case has exactly one solution, and you can reach it by deduction alone. No guessing, ever.',
      howto_intro: 'Every case is a closed world: a floor plan, three hours on the clock, a handful of suspects and one victim. Work out who was in which room at each hour and what each suspect was carrying. Then the killer gives themselves away.',
      got_it: 'Got it',
      tip_a: 'In the timetable, tap a room letter <b>once</b> to cross it out, <b>twice</b> to circle it, a third time to clear it. Object numbers work the same way.',
      tip_b: '<b>Hint</b> reveals the next deduction step (and spots mistakes in your grid). When you know who, where, when and with what, press <b>Accuse</b>. A wrong accusation adds {n} seconds.',
      intro_start: 'Start investigating',
      acc_title: 'Make your accusation', acc_killer: 'Killer', acc_room: 'Room', acc_hour: 'Hour', acc_weapon: 'Weapon', not_yet: 'Not yet',
      acc_wrong: "That doesn't hold up. Keep investigating. (+{n} s)",
      time: 'Time', hints: 'Hints', wrong_guesses: 'Wrong guesses',
      streak_days: 'Daily streak: {n} days', daily_done: 'Daily case solved. Come back tomorrow for a new one.', new_best: 'New personal best',
      best_t: 'Best: {t}', closed_of: '{n} of {m} cases closed', all_cases: 'All cases', next_case: 'Next case',
      replay_q: 'Play this case again?', replay_text: 'Your timetable, hints and clock start fresh. Your best result is kept.',
      load_err: 'Could not load the cases. Please reload the page.',
      advent: 'Advent calendar', advent_sub: 'A new case behind a door every day, 1 to 24 December.',
      advent_teaser: 'Door 1 opens on {date}.', advent_wait: 'Until then, play the regular cases.',
      advent_progress: '{n} of 24 doors solved', advent_open_n: 'Doors open: {n} of 24', advent_regular: 'Play the regular cases',
      door_n: 'Door {n}', door_opens: 'Opens {date}', door_locked: 'This door opens on {date}.',
      next_door: 'Next door', calendar: 'Calendar', door_open_label: 'Door {n}, open', door_done_label: 'Door {n}, solved', door_locked_label: 'Door {n}, locked'
    },
    de: {
      tagline: 'Krimi-Logikrätsel. Drei Stunden, eine Tür nach der anderen.',
      lv_easy: 'Leicht', lv_medium: 'Mittel', lv_hard: 'Schwer',
      set_manor: 'Landhaus', set_lodge: 'Skihütte', set_theatre: 'Theater', set_museum: 'Museum', set_train: 'Nachtzug',
      clues_n: '{n} Hinweise',
      case_short: 'Fall {n}', case_level: '{level} {n}',
      aria_howto: 'Spielanleitung', aria_sound: 'Ton', aria_lang: 'Sprache', aria_close: 'Schließen', aria_cases: 'Alle Fälle',
      daily_case: 'Tagesfall', daily_kicker: 'Tagesfall · {date}',
      case_meta: '{setting} · {clues} Hinweise · {sus} Verdächtige',
      solved_in: 'Gelöst in {t}', review: 'Ansehen', cont: 'Weiter', play_today: 'Heutigen Fall spielen', streak_n: '{n} Tage in Folge',
      stat_solved: 'Gelöst', stat_stars: 'Sterne', stat_streak: 'Tage in Folge',
      cont_continue: 'Weiter: {label}, {title}', cont_next: 'Als Nächstes: {label}, {title}',
      all_closed: 'Alle Fälle gelöst. Der Tagesfall kommt jeden Tag neu.',
      foot: 'Jeder Fall hat genau eine Lösung, die sich durch Logik finden lässt.',
      clues: 'Hinweise', tap_strike: 'zum Durchstreichen tippen', floorplan: 'Grundriss', tap_room: 'Raum antippen, um den Buchstaben zu sehen',
      casefile: 'Fallakte', timetable: 'Zeitplan', tap_letter: 'Buchstabe antippen: einmal streichen, zweimal einkreisen', solve: 'Lösen',
      hint: 'Tipp', accuse: 'Anklagen', play_again: 'Nochmal spielen',
      known_facts: 'Bekannte Fakten', suspects: 'Die Verdächtigen', objects: 'Die Gegenstände',
      objects_note: 'Jeder Verdächtige trug den ganzen Abend einen dieser Gegenstände, und keine zwei denselben.', howto: 'Spielanleitung',
      case_closed: 'Fall gelöst', solvedbar: 'in {t} · {hints} · {wrong} falsch', hint_one: '{n} Tipp', hint_other: '{n} Tipps',
      col_object: 'Gegenstand', victim: 'Opfer', undo: 'Zurück', clear: 'Leeren',
      tip_grid: 'Streichen Sie, was die Hinweise ausschließen. Kreisen Sie ein, was übrig bleibt. Die Buchstaben sind nach {by} gefärbt.',
      by_floor: 'Stockwerk', by_train: 'Zughälfte', by_side: 'Seite',
      aria_cell: '{who}, {hour}, {room}', aria_obj: '{who} trug {obj}',
      hint_earlier: 'Früherer Tipp', hint_later: 'Späterer Tipp', hint_hide: 'Tipp ausblenden',
      hint_n: 'Tipp {n}', hint_head_err: 'Tipp {n} · prüfen Sie Ihr Raster', hint_head_final: 'Tipp {n} · die Auflösung', fill_it: 'Eintragen',
      hint_done: 'Ihr Zeitplan enthält schon alles, was die Hinweise hergeben. Erheben Sie Ihre Anklage.',
      err_obj: 'In der Gegenstandsspalte von {who} passt etwas nicht zu den Hinweisen. Sehen Sie noch einmal genau hin.',
      err_cell: 'Ihre Markierungen für {who} um {hour} passen nicht zu den Hinweisen. Sehen Sie sich dieses Feld noch einmal an.',
      leg_conn: 'Verbindung (eine Tür)', leg_door: 'Tür', leg_stairs: 'Treppe (zählt als Tür)', leg_window: 'Fenster',
      nothing_undo: 'Nichts zum Zurücknehmen', clear_q: 'Zeitplan leeren?',
      clear_text: 'Alle Kreuze und Kreise werden entfernt. Uhr, Tipps und durchgestrichene Hinweise bleiben erhalten.', cancel: 'Abbrechen',
      rule1_t: 'Der Plan', rule1: 'Jeder Raum hat einen Buchstaben. Türen sind Lücken in den Wänden, eine Treppe zählt als Tür. „Nebenan“ heißt: durch eine Tür oder eine Treppe verbunden.',
      rule2_t: 'Die Uhr', rule2: 'Jeder Fall umfasst drei Stunden. Zu jeder Stunde war jeder Verdächtige in genau einem Raum. Die Hinweise beziehen sich nur auf diese drei Stunden.',
      rule3_t: 'Die Ein-Tür-Regel', rule3: 'Von einer Stunde zur nächsten blieb eine Person, wo sie war, oder ging durch genau eine Tür.',
      rule4_t: 'Die Gegenstände', rule4: 'Jeder Verdächtige trug den ganzen Abend einen der aufgeführten Gegenstände bei sich, und keine zwei denselben. Ein Gegenstand ist immer dort, wo sein Träger ist.',
      rule5_t: 'Die Wörter', rule5: 'Wenn ein Hinweis zwei Personen nennt, sind es zwei verschiedene Personen. „Allein“ heißt: Niemand sonst, auch nicht das Opfer, war im Raum. Zahlen wie „genau zwei Verdächtige“ zählen nur Verdächtige.',
      rule6_t: 'Der Täter', rule6: 'Genau ein Verdächtiger war je allein mit dem Opfer. Diese Begegnung war der Mord: Raum, Stunde und der Gegenstand, den der Täter trug.',
      rule7_t: 'Faires Spiel', rule7: 'Jeder Fall hat genau eine Lösung, und Sie erreichen sie allein durch Logik. Nie durch Raten.',
      howto_intro: 'Jeder Fall ist eine geschlossene Welt: ein Grundriss, drei Stunden auf der Uhr, eine Handvoll Verdächtiger und ein Opfer. Finden Sie heraus, wer zu welcher Stunde in welchem Raum war und was jeder Verdächtige bei sich trug. Dann verrät sich der Täter.',
      got_it: 'Verstanden',
      tip_a: 'Tippen Sie im Zeitplan <b>einmal</b> auf einen Raumbuchstaben, um ihn zu streichen, <b>zweimal</b>, um ihn einzukreisen, ein drittes Mal, um die Markierung zu löschen. Gegenstandsnummern funktionieren genauso.',
      tip_b: '<b>Tipp</b> zeigt den nächsten Schlussfolgerungsschritt (und findet Fehler in Ihrem Raster). Wenn Sie wissen, wer, wo, wann und womit, tippen Sie auf <b>Anklagen</b>. Eine falsche Anklage kostet {n} Sekunden.',
      intro_start: 'Ermittlung starten',
      acc_title: 'Erheben Sie Ihre Anklage', acc_killer: 'Täter', acc_room: 'Raum', acc_hour: 'Stunde', acc_weapon: 'Waffe', not_yet: 'Noch nicht',
      acc_wrong: 'Das stimmt so nicht. Ermitteln Sie weiter. (+{n} s)',
      time: 'Zeit', hints: 'Tipps', wrong_guesses: 'Falsche Anklagen',
      streak_days: 'Tage in Folge: {n}', daily_done: 'Tagesfall gelöst. Morgen wartet ein neuer.', new_best: 'Neue Bestleistung',
      best_t: 'Bestzeit: {t}', closed_of: '{n} von {m} Fällen gelöst', all_cases: 'Alle Fälle', next_case: 'Nächster Fall',
      replay_q: 'Diesen Fall noch einmal spielen?', replay_text: 'Zeitplan, Tipps und Uhr beginnen von vorn. Ihr Bestergebnis bleibt erhalten.',
      load_err: 'Die Fälle konnten nicht geladen werden. Bitte laden Sie die Seite neu.',
      advent: 'Adventskalender', advent_sub: 'Jeden Tag ein neuer Fall hinter einem Türchen, vom 1. bis 24. Dezember.',
      advent_teaser: 'Türchen 1 öffnet sich am {date}.', advent_wait: 'Bis dahin können Sie die normalen Fälle spielen.',
      advent_progress: '{n} von 24 Türchen gelöst', advent_open_n: 'Offene Türchen: {n} von 24', advent_regular: 'Normale Fälle spielen',
      door_n: 'Türchen {n}', door_opens: 'Öffnet am {date}', door_locked: 'Dieses Türchen öffnet sich am {date}.',
      next_door: 'Nächstes Türchen', calendar: 'Kalender', door_open_label: 'Türchen {n}, offen', door_done_label: 'Türchen {n}, gelöst', door_locked_label: 'Türchen {n}, verschlossen'
    },
    fr: {
      tagline: "Énigmes de logique criminelles. Trois heures, une porte après l'autre.",
      lv_easy: 'Facile', lv_medium: 'Moyen', lv_hard: 'Difficile',
      set_manor: 'Manoir', set_lodge: 'Chalet de ski', set_theatre: 'Théâtre', set_museum: 'Musée', set_train: 'Train de nuit',
      clues_n: '{n} indices',
      case_short: 'Affaire {n}', case_level: '{level} {n}',
      aria_howto: 'Règles du jeu', aria_sound: 'Son', aria_lang: 'Langue', aria_close: 'Fermer', aria_cases: 'Toutes les affaires',
      daily_case: 'Affaire du jour', daily_kicker: 'Affaire du jour · {date}',
      case_meta: '{setting} · {clues} indices · {sus} suspects',
      solved_in: 'Résolue en {t}', review: 'Revoir', cont: 'Continuer', play_today: "Jouer l'affaire du jour", streak_n: '{n} jours de suite',
      stat_solved: 'Résolues', stat_stars: 'Étoiles', stat_streak: 'Jours de suite',
      cont_continue: 'Continuer : {label}, {title}', cont_next: 'Suivante : {label}, {title}',
      all_closed: "Toutes les affaires sont classées. L'affaire du jour revient chaque jour.",
      foot: 'Chaque affaire a une seule solution, que la déduction permet de trouver.',
      clues: 'Indices', tap_strike: 'touchez pour barrer', floorplan: 'Plan', tap_room: 'Touchez une pièce pour voir sa lettre',
      casefile: 'Dossier', timetable: 'Emploi du temps', tap_letter: 'Touchez une lettre : une fois pour barrer, deux fois pour entourer', solve: 'Résoudre',
      hint: 'Indice', accuse: 'Accuser', play_again: 'Rejouer',
      known_facts: 'Faits connus', suspects: 'Les suspects', objects: 'Les objets',
      objects_note: "Chaque suspect a porté l'un de ces objets toute la soirée, et deux suspects n'ont jamais porté le même.", howto: 'Règles du jeu',
      case_closed: 'Affaire classée', solvedbar: 'en {t} · {hints} · erreurs : {wrong}', hint_one: '{n} indice', hint_other: '{n} indices',
      col_object: 'Objet', victim: 'Victime', undo: 'Annuler', clear: 'Effacer',
      tip_grid: 'Barrez ce que les indices excluent. Entourez ce qui reste. Les lettres sont colorées selon {by}.',
      by_floor: "l'étage", by_train: 'la moitié du train', by_side: "l'aile",
      aria_cell: '{who}, {hour}, {room}', aria_obj: '{who} portait {obj}',
      hint_earlier: 'Indice précédent', hint_later: 'Indice suivant', hint_hide: "Masquer l'indice",
      hint_n: 'Indice {n}', hint_head_err: 'Indice {n} · vérifiez votre grille', hint_head_final: 'Indice {n} · le verdict', fill_it: 'Remplir',
      hint_done: "Votre emploi du temps contient déjà tout ce que les indices permettent de savoir. Portez votre accusation.",
      err_obj: "Quelque chose dans la colonne d'objets de {who} ne colle pas avec les preuves. Regardez-la de plus près.",
      err_cell: 'Vos marques pour {who} à {hour} ne collent pas avec les preuves. Regardez cette case de plus près.',
      leg_conn: 'liaison (une porte)', leg_door: 'porte', leg_stairs: 'escalier (compte comme une porte)', leg_window: 'fenêtre',
      nothing_undo: 'Rien à annuler', clear_q: "Effacer l'emploi du temps ?",
      clear_text: 'Toutes les croix et tous les cercles sont retirés. Le chrono, les indices et les indices barrés sont conservés.', cancel: 'Annuler',
      rule1_t: 'Le plan', rule1: 'Chaque pièce a une lettre. Les portes sont des ouvertures dans les murs, et un escalier compte comme une porte. « À côté » signifie relié par une porte ou un escalier.',
      rule2_t: "L'horloge", rule2: 'Chaque affaire couvre trois heures. À chaque heure, chaque suspect se trouvait dans une seule pièce. Les indices ne portent que sur ces trois heures.',
      rule3_t: "La règle d'une porte", rule3: "D'une heure à la suivante, une personne restait où elle était ou franchissait exactement une porte.",
      rule4_t: 'Les objets', rule4: "Chaque suspect a porté un des objets listés toute la soirée, et deux suspects n'ont jamais porté le même. Un objet est toujours là où se trouve son porteur.",
      rule5_t: 'Les mots', rule5: "Quand un indice nomme deux personnes, ce sont deux personnes différentes. « Seul » veut dire que personne d'autre, victime comprise, n'était dans la pièce. Les nombres comme « exactement deux suspects » ne comptent que les suspects.",
      rule6_t: 'Le coupable', rule6: "Un seul suspect s'est un jour trouvé seul avec la victime. Cette rencontre, c'est le meurtre : la pièce, l'heure et l'objet que portait le coupable.",
      rule7_t: 'Jeu équitable', rule7: 'Chaque affaire a une seule solution, que vous atteignez par la seule déduction. Jamais en devinant.',
      howto_intro: "Chaque affaire est un monde clos : un plan, trois heures au compteur, quelques suspects et une victime. Trouvez qui était dans quelle pièce à chaque heure et ce que chaque suspect portait. Alors le coupable se trahit.",
      got_it: "C'est compris",
      tip_a: "Dans le tableau, touchez une lettre de pièce <b>une fois</b> pour la barrer, <b>deux fois</b> pour l'entourer, une troisième fois pour l'effacer. Les numéros d'objets fonctionnent de la même façon.",
      tip_b: "<b>Indice</b> révèle la prochaine étape de déduction (et repère les erreurs dans votre grille). Quand vous savez qui, où, quand et avec quoi, touchez <b>Accuser</b>. Une fausse accusation ajoute {n} secondes.",
      intro_start: "Commencer l'enquête",
      acc_title: 'Portez votre accusation', acc_killer: 'Coupable', acc_room: 'Pièce', acc_hour: 'Heure', acc_weapon: 'Arme', not_yet: 'Pas encore',
      acc_wrong: "Cela ne tient pas. Poursuivez l'enquête. (+{n} s)",
      time: 'Temps', hints: 'Indices', wrong_guesses: 'Fausses accusations',
      streak_days: 'Jours de suite : {n}', daily_done: "Affaire du jour résolue. Revenez demain pour une nouvelle.", new_best: 'Nouveau record',
      best_t: 'Record : {t}', closed_of: '{n} affaires sur {m} classées', all_cases: 'Toutes les affaires', next_case: 'Affaire suivante',
      replay_q: 'Rejouer cette affaire ?', replay_text: 'Votre emploi du temps, vos indices et le chrono repartent de zéro. Votre meilleur résultat est conservé.',
      load_err: 'Impossible de charger les affaires. Veuillez recharger la page.',
      advent: "Calendrier de l'Avent", advent_sub: "Chaque jour, une nouvelle affaire derrière une case, du 1er au 24 décembre.",
      advent_teaser: 'La case 1 ouvre le {date}.', advent_wait: "D'ici là, jouez les affaires habituelles.",
      advent_progress: '{n} cases sur 24 résolues', advent_open_n: 'Cases ouvertes : {n} sur 24', advent_regular: 'Jouer les affaires habituelles',
      door_n: 'Case {n}', door_opens: 'Ouvre le {date}', door_locked: 'Cette case ouvre le {date}.',
      next_door: 'Case suivante', calendar: 'Calendrier', door_open_label: 'Case {n}, ouverte', door_done_label: 'Case {n}, résolue', door_locked_label: 'Case {n}, verrouillée'
    }
  };
  /*WEB-STR-BEGIN*/
  // Web edition only (itch.io / own site): share + book panel. Stripped from the CrazyGames build by package.py.
  var WEBSTR = {
    en: { share: 'Share', copied: 'Copied', sh_zero: 'Solved with no hints', sh_one: 'Solved with {n} hint', sh_other: 'Solved with {n} hints',
          book_title: 'Get all 24 cases in the book', book_text: 'The printed advent calendar: one murder-mystery puzzle for every night until Christmas.',
          book_cta: 'View on Amazon', book_vol1: 'Also: Volume 1' },
    de: { share: 'Teilen', copied: 'Kopiert', sh_zero: 'Gelöst ohne Tipps', sh_one: 'Gelöst mit {n} Tipp', sh_other: 'Gelöst mit {n} Tipps',
          book_title: 'Alle 24 Fälle im Buch', book_text: 'Der gedruckte Krimi-Adventskalender: ein Rätsel für jeden Abend bis Weihnachten.',
          book_cta: 'Bei Amazon.de ansehen', book_vol1: '' },
    fr: { share: 'Partager', copied: 'Copié', sh_zero: 'Résolu sans indice', sh_one: 'Résolu avec {n} indice', sh_other: 'Résolu avec {n} indices',
          book_title: 'Les 24 affaires dans le livre', book_text: "Le calendrier de l'Avent imprimé : une énigme criminelle pour chaque soir jusqu'à Noël.",
          book_cta: 'Voir sur Amazon.fr', book_vol1: '' }
  };
  /*WEB-STR-END*/
  if (WEBSTR) LANGS.forEach(function (l) { Object.keys(WEBSTR[l]).forEach(function (k) { STR[l][k] = WEBSTR[l][k]; }); });


  // =================================================================================================== pure logic
  function answerOf(arr) {
    // the player's answer for one cell: the circled value, or the only value not crossed out; -1 = open, -2 = conflict
    var circled = [], open = [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === 2) circled.push(i);
      if (arr[i] !== 1) open.push(i);
    }
    if (circled.length > 1) return -2;
    if (circled.length === 1) return circled[0];
    return open.length === 1 ? open[0] : -1;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var Logic = {
    CONFIG: CONFIG,
    answerOf: answerOf,

    /** Compare an accusation {killer, room, hour, object} (indices) with the case solution. */
    checkAccusation: function (c, a) {
      var s = c.solution;
      var complete = [a.killer, a.room, a.hour, a.object].every(function (v) { return typeof v === 'number' && v >= 0; });
      var parts = { killer: a.killer === s.killer, room: a.room === s.room, hour: a.hour === s.hour, object: a.object === s.object };
      return { complete: complete, correct: complete && parts.killer && parts.room && parts.hour && parts.object, parts: parts };
    },

    /** Every (suspect, hour) where a suspect was alone with the victim, for a full timetable. A valid case has one. */
    aloneWithVictim: function (c, paths, objs) {
      var V = c.known.victimPath, out = [];
      for (var t = 0; t < V.length; t++) {
        var here = [];
        for (var s = 0; s < paths.length; s++) if (paths[s][t] === V[t]) here.push(s);
        if (here.length === 1) out.push({ killer: here[0], hour: t, room: V[t], object: objs[here[0]] });
      }
      return out;
    },

    emptyMarks: function (c) {
      var S = c.suspects.length, T = c.hours.length, R = c.map.rooms.length, p = [], o = [];
      for (var s = 0; s < S; s++) {
        var row = [];
        for (var t = 0; t < T; t++) row.push(new Array(R).fill(0));
        p.push(row);
        o.push(new Array(S).fill(0));
      }
      return { p: p, o: o };
    },

    /** 0 blank -> 1 crossed out -> 2 circled -> 0 */
    cycle: function (v) { return (v + 1) % 3; },

    /** First cell whose marks contradict the solution (true value crossed out, or a wrong value circled). */
    firstError: function (c, m) {
      var sol = c.solution, S = c.suspects.length, T = c.hours.length;
      for (var s = 0; s < S; s++) {
        for (var t = 0; t < T; t++) {
          var a = m.p[s][t], r = sol.paths[s][t];
          if (a[r] === 1 || a.some(function (v, j) { return v === 2 && j !== r; })) return { kind: 'p', s: s, t: t };
        }
      }
      for (s = 0; s < S; s++) {
        var b = m.o[s], o = sol.objs[s];
        if (b[o] === 1 || b.some(function (v, j) { return v === 2 && j !== o; })) return { kind: 'o', s: s };
      }
      return null;
    },

    stepDone: function (step, m) {
      return step.cells.every(function (x) { return answerOf(m.p[x[0]][x[1]]) === x[2]; }) &&
             step.objs.every(function (x) { return answerOf(m.o[x[0]]) === x[1]; });
    },

    /** What the hint button shows next: a mistake in the grid first, then the first walkthrough step not yet on the grid. */
    nextHint: function (c, m, revealed) {
      var err = Logic.firstError(c, m);
      if (err) return { type: 'error', where: err };
      for (var i = 0; i < c.walkthrough.length; i++) {
        if (revealed.indexOf(i) >= 0) continue;
        var w = c.walkthrough[i];
        if (w.final || !Logic.stepDone(w, m)) return { type: 'step', i: i };
      }
      return { type: 'done' };
    },

    gridSolved: function (c, m) {
      var sol = c.solution;
      for (var s = 0; s < c.suspects.length; s++) {
        for (var t = 0; t < c.hours.length; t++) if (answerOf(m.p[s][t]) !== sol.paths[s][t]) return false;
        if (answerOf(m.o[s]) !== sol.objs[s]) return false;
      }
      return true;
    },

    /** Circle the settled value of each cell in a walkthrough step and cross out the rest. Returns the changes. */
    applyStep: function (m, step) {
      var ch = [];
      function setRow(arr, keep, tag) {
        for (var j = 0; j < arr.length; j++) {
          var v = j === keep ? 2 : 1;
          if (arr[j] !== v) { ch.push({ tag: tag, j: j, prev: arr[j] }); arr[j] = v; }
        }
      }
      step.cells.forEach(function (x) { setRow(m.p[x[0]][x[1]], x[2], ['p', x[0], x[1]]); });
      step.objs.forEach(function (x) { setRow(m.o[x[0]], x[1], ['o', x[0]]); });
      return ch;
    },

    solutionMarks: function (c) {
      var m = Logic.emptyMarks(c), sol = c.solution;
      for (var s = 0; s < c.suspects.length; s++) {
        for (var t = 0; t < c.hours.length; t++) m.p[s][t] = m.p[s][t].map(function (_, j) { return j === sol.paths[s][t] ? 2 : 1; });
        m.o[s] = m.o[s].map(function (_, j) { return j === sol.objs[s] ? 2 : 1; });
      }
      return m;
    },

    stars: function (hints, wrong) { return hints === 0 && wrong === 0 ? 3 : (hints <= 3 && wrong <= 1 ? 2 : 1); },

    fmtTime: function (sec) {
      sec = Math.max(0, Math.floor(sec));
      var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
      return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
    },

    dateKey: function (d) {
      d = d || new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },

    dayNumber: function (key) {
      var p = key.split('-').map(Number);
      return Math.floor(Date.UTC(p[0], p[1] - 1, p[2]) / 86400000);
    },

    /** Daily level by weekday (Monday first): easy early in the week, hard on Friday and Sunday. */
    DAILY_PATTERN: ['easy', 'medium', 'easy', 'medium', 'hard', 'medium', 'hard'],
    dailyLevel: function (key) {
      var d = Logic.dayNumber(key);
      return Logic.DAILY_PATTERN[(((d + 3) % 7) + 7) % 7];          // day 0 (1970-01-01) was a Thursday
    },
    /** Daily Case (index into cases): the weekday picks the level; within a level, every run of that level's daily
        slots shows each of its cases once, in an order seeded by the run number. Same date = same case for everyone. */
    dailyIndex: function (key, cases) {
      var d = Logic.dayNumber(key), wd = (((d + 3) % 7) + 7) % 7, week = Math.floor((d + 3) / 7), P = Logic.DAILY_PATTERN, L = P[wd];
      var slots = [], pool = [], i;
      for (i = 0; i < 7; i++) if (P[i] === L) slots.push(i);
      for (i = 0; i < cases.length; i++) if (cases[i].level === L) pool.push(i);
      if (!pool.length) { for (i = 0; i < cases.length; i++) pool.push(i); slots = [0, 1, 2, 3, 4, 5, 6]; }
      var k = week * slots.length + slots.indexOf(wd), n = pool.length, cyc = Math.floor(k / n), pos = ((k % n) + n) % n;
      function shuffled(cy) {
        var rnd = mulberry32((cy * 2654435761) ^ (L.length * 0x5bd1e995)), perm = pool.slice();
        for (var a = n - 1; a > 0; a--) { var j = Math.floor(rnd() * (a + 1)), x = perm[a]; perm[a] = perm[j]; perm[j] = x; }
        return perm;
      }
      var perm = shuffled(cyc), prev = shuffled(cyc - 1);
      if (n > 1 && perm[0] === prev[n - 1]) { var t0 = perm[0]; perm[0] = perm[1]; perm[1] = t0; }   // no repeat across runs
      return perm[pos];
    },

    STR: STR,
    LANGS: LANGS,
    /** The 24 advent doors: 8 easy, 8 medium, 8 hard cases, each group by rising model rating (door 1 easiest, door 24 hardest). */
    ADVENT_IDS: ['e02', 'e10', 'e09', 'e05', 'e03', 'e08', 'e07', 'e06', 'm07', 'm02', 'm09', 'm05', 'm04', 'm03', 'm06', 'm01',
                 'h04', 'h06', 'h10', 'h05', 'h03', 'h08', 'h09', 'h07'],
    /** Doors open on a date key: door N opens on 1 December + N - 1. Before December none, from 24 December all. */
    adventOpen: function (key) {
      var p = key.split('-').map(Number);
      return p[1] === 12 ? Math.max(0, Math.min(p[2], 24)) : 0;
    },
    /** Deep-merge translated case text onto a clone of the English case: objects by key, arrays by index, strings replace. */
    mergeText: function (base, over) {
      if (over == null) return base;
      if (Array.isArray(base) && Array.isArray(over)) return base.map(function (v, i) { return i < over.length ? Logic.mergeText(v, over[i]) : v; });
      if (base && over && typeof base === 'object' && typeof over === 'object' && !Array.isArray(base)) {
        var o = {};
        Object.keys(base).forEach(function (k) { o[k] = k in over ? Logic.mergeText(base[k], over[k]) : base[k]; });
        return o;
      }
      return typeof over === typeof base ? over : base;
    },
    /** A case in the given language: cases[i].text = { de: {...}, fr: {...} } in the same shape as the English fields; English fills the gaps. */
    localizeCase: function (c, l) {
      return l !== 'en' && c.text && c.text[l] ? Logic.mergeText(c, c.text[l]) : c;
    },
    streak: function (dailyRecords, todayKey) {
      var day = Logic.dayNumber(todayKey), n = 0;
      var keys = {};
      Object.keys(dailyRecords || {}).forEach(function (k) { keys[Logic.dayNumber(k)] = true; });
      if (!keys[day]) day -= 1;                 // today not solved yet: the streak still counts up to yesterday
      while (keys[day]) { n++; day--; }
      return n;
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = Logic; return; }

  // =================================================================================================== UI helpers
  var doc = document, app = doc.getElementById('app');
  var CASES = [], BY_ID = {};
  var LEVELS = ['easy', 'medium', 'hard'], RAW = [];
  var lang = 'en', missing = [];
  function tr(key, vars) {
    var v = STR[lang][key];
    if (v == null) { if (missing.indexOf(lang + ':' + key) < 0) missing.push(lang + ':' + key); v = STR.en[key]; }
    if (v == null) return '[[' + key + ']]';
    return vars ? v.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] == null ? m : vars[k]; }) : v;
  }
  function lvName(l) { return tr('lv_' + l); }
  function setName(x) { return tr('set_' + x); }
  function isWeb() { return CONFIG.edition === 'web' && !wantCrazy(); }
  function detectLang() {
    var n = String((window.navigator.languages && window.navigator.languages[0]) || window.navigator.language || 'en').slice(0, 2).toLowerCase();
    return LANGS.indexOf(n) >= 0 ? n : 'en';
  }
  function nowDate() {
    var m = /[?&]date=(\d{4}-\d{2}-\d{2})(&|$)/.exec(window.location.search), k = CONFIG.testDate || (m ? m[1] : '');
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
    return p ? new Date(+p[1], +p[2] - 1, +p[3], 12) : new Date();
  }
  function fmtDay(month, day) { return new Date(nowDate().getFullYear(), month - 1, day).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long' }); }
  function buildCases() {
    CASES = RAW.map(function (c) { return Logic.localizeCase(c, lang); });
    BY_ID = {}; CASES.forEach(function (c) { BY_ID[c.id] = c; });
  }
  function setLang(l) {
    if (LANGS.indexOf(l) < 0) return;
    lang = l; doc.documentElement.lang = l; doc.title = CONFIG.title;
    if (RAW.length) buildCases();
  }
  var SUS_COLORS = ['#F59E0B', '#34D399', '#F472B6', '#60A5FA', '#C084FC'];
  var ZONE = ['#38BDF8', '#A78BFA'];

  function esc(s) { return String(s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var ICONS = {
    back: '<path d="M15 18l-6-6 6-6"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.2"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>',
    map: '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    grid: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke-width="3"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H10"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    sound: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    mute: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>',
    help: '<circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 1 1 3.9 2.6c-.7.3-1.2 1-1.2 1.8v.6"/><path d="M12 17.3h.01" stroke-width="3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    lock: '<rect x="5" y="11" width="14" height="9.5" rx="2.2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    share: '<path d="M12 15V3.5M7.5 8L12 3.5 16.5 8"/><path d="M5 12v7.5h14V12"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5C10 8.5 7.5 7.5 8 5.5s3.2-.5 4 3c.8-3.500 3.500-5 4-3s-2 3-4 3z"/>',
    play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    replay: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v5h-5"/>',
    next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
    flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2.5-5 .3 1.6 1 2.5 2 3-.6-2.8-.2-5.4.5-8z"/>',
    manor: '<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/><path d="M16 7V4.5h2V9"/>',
    lodge: '<path d="M2 20L9 7.5l4 6.5 3-4 6 10z"/><path d="M7.2 10.7L9 7.5l1.9 3.1"/>',
    theatre: '<path d="M3 3.5h18"/><path d="M4.5 3.5c0 6.5 1.8 11.5 5.5 16.5M19.5 3.5c0 6.5-1.8 11.5-5.5 16.5"/><path d="M4.5 4c2.4 2.6 4.8 3.2 7.5 3.2s5.1-.6 7.5-3.2"/>',
    museum: '<path d="M3 9l9-5 9 5"/><path d="M5.5 9.5v8.5M10 9.5v8.5M14 9.5v8.5M18.5 9.5v8.5"/><path d="M3 20.5h18"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10.5h14"/><path d="M9 14h.01M15 14h.01" stroke-width="2.6"/><path d="M8.5 21l2-4M15.5 21l-2-4"/>'
  };
  function ic(name, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' +
      (extra || '') + ' aria-hidden="true">' + ICONS[name] + '</svg>';
  }
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5L2.6 9.4l6.5-.8z"/></svg>';
  function starsHTML(n, cls) {
    var h = '<span class="' + (cls || 'stars') + '">';
    for (var i = 0; i < 3; i++) h += STAR.replace('<svg', '<svg class="' + (i < n ? 'on' : '') + '"');
    return h + '</span>';
  }

  // =================================================================================================== storage
  var CG = { on: false, sdk: null, playing: false };
  var Store = {
    get: function (k) {
      try { if (CG.on && CG.sdk.data) return CG.sdk.data.getItem(k); return window.localStorage.getItem(k); } catch (e) { return null; }
    },
    set: function (k, v) {
      try { if (CG.on && CG.sdk.data) CG.sdk.data.setItem(k, v); else window.localStorage.setItem(k, v); } catch (e) { /* storage off: play on */ }
    }
  };
  var save = { v: 1, states: {}, best: {}, daily: {}, seenIntro: false, muted: false, level: 'easy', lang: '' };
  function loadSave() {
    try {
      var raw = Store.get(CONFIG.storageKey);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.v === 1) save = Object.assign(save, d);
      }
    } catch (e) { /* corrupt or blocked storage: start fresh */ }
  }
  var saveTimer = null;
  function persist(now) {
    clearTimeout(saveTimer);
    if (now) { Store.set(CONFIG.storageKey, JSON.stringify(save)); return; }
    saveTimer = setTimeout(function () { Store.set(CONFIG.storageKey, JSON.stringify(save)); }, 400);
  }

  // =================================================================================================== sound (synthesised)
  var Sound = {
    ctx: null,
    muted: function () {
      var cgMute = false;
      try { cgMute = CG.on && CG.sdk.game.settings && CG.sdk.game.settings.muteAudio; } catch (e) { cgMute = false; }
      return save.muted || cgMute || GM.ad;
    },
    tone: function (freq, start, dur, type, vol) {
      var ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime + start);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, ctx.currentTime + start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur + 0.05);
    },
    play: function (kind) {
      if (this.muted()) return;
      try {
        if (!this.ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC(); }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (kind === 'tap') this.tone(1150, 0, 0.05, 'sine', 0.025);
        else if (kind === 'circle') { this.tone(880, 0, 0.08, 'sine', 0.035); }
        else if (kind === 'hint') { this.tone(660, 0, 0.18, 'triangle', 0.05); this.tone(990, 0.09, 0.25, 'triangle', 0.05); }
        else if (kind === 'wrong') { this.tone(220, 0, 0.22, 'triangle', 0.08); this.tone(165, 0.12, 0.3, 'triangle', 0.08); }
        else if (kind === 'win') { [523, 659, 784, 1047, 1319].forEach(function (f, i) { Sound.tone(f, i * 0.09, 0.9, 'sine', 0.07); }); }
      } catch (e) { /* audio unavailable */ }
    }
  };

  // =================================================================================================== CrazyGames SDK (optional)
  function wantCrazy() { return CONFIG.crazygames || /[?&]crazygames=1(&|$)/.test(window.location.search); }
  function loadCrazy() {
    return new Promise(function (resolve) {
      if (!wantCrazy()) return resolve(false);
      var done = false;
      function finish(v) { if (!done) { done = true; resolve(v); } }
      var s = doc.createElement('script');
      s.src = CONFIG.crazySdkUrl;
      s.onload = function () {
        try {
          var sdk = window.CrazyGames && window.CrazyGames.SDK;
          if (!sdk) return finish(false);
          Promise.resolve(sdk.init()).then(function () {
            if (sdk.environment === 'disabled') return finish(false);
            CG.sdk = sdk; CG.on = true;
            try { sdk.game.addSettingsChangeListener(function () { /* muteAudio is read on every sound */ }); } catch (e) { /* older SDK */ }
            finish(true);
          }).catch(function () { finish(false); });
        } catch (e) { finish(false); }
      };
      s.onerror = function () { finish(false); };
      doc.head.appendChild(s);
      setTimeout(function () { finish(false); }, 8000);
    });
  }
  function cg(fn) { if (CG.on) { try { fn(CG.sdk); } catch (e) { /* never let the SDK break the game */ } } }
  function cgPlay(on) {
    if (CG.playing === on) return;
    CG.playing = on;
    cg(function (sdk) { if (on) sdk.game.gameplayStart(); else sdk.game.gameplayStop(); });
  }

  // =================================================================================================== GameMonetize SDK (optional)
  // One ad when a case opens (a natural break; GameMonetize forbids ads on timers). While an ad plays the SDK sends
  // SDK_GAME_PAUSE: the clock stops and sounds are muted until SDK_GAME_START. The SDK exposes itself as window.sdk.
  var GM = { on: false, ad: false };
  function loadGM() {
    if (!CONFIG.gamemonetize || !CONFIG.gmGameId || !CONFIG.gmSdkUrl) return;
    window.SDK_OPTIONS = {
      gameId: CONFIG.gmGameId,
      onEvent: function (e) {
        var name = e && e.name;
        if (name === 'SDK_READY') GM.on = true;
        else if (name === 'SDK_GAME_PAUSE') { GM.ad = true; if (ui.screen === 'case') stopTimer(); }
        else if (name === 'SDK_GAME_START') { GM.ad = false; if (ui.screen === 'case') startTimer(); }
      }
    };
    if (doc.getElementById('gamemonetize-sdk')) return;
    var s = doc.createElement('script');
    s.id = 'gamemonetize-sdk';
    s.src = CONFIG.gmSdkUrl;
    doc.head.appendChild(s);
  }
  function gmAd() {
    try { if (GM.on && window.sdk && typeof window.sdk.showBanner === 'function') window.sdk.showBanner(); } catch (e) { /* never let ads break the game */ }
  }

  // =================================================================================================== layout
  var ui = { screen: 'boot', mode: 'L3', key: null, c: null, st: null, undo: [], spot: -1, timerOn: false, lastTick: 0,
             accuse: null, modal: null, mapKey: '' };

  function applyLayout() {
    var w = window.innerWidth, h = window.innerHeight;
    var landscape = w >= h * 1.15 && w >= 620;
    var rem = landscape ? clamp(Math.min(w / 80, h / 45), 14, 22) : clamp(w / 24.4, 13, 18);   // >= 14px keeps text legible in small iframes
    doc.documentElement.style.fontSize = rem.toFixed(2) + 'px';
    var mode = !landscape ? 'P' : (w / rem >= 74 && h / rem >= 36 ? 'L3' : 'L2');
    var changed = mode !== ui.mode;
    ui.mode = mode;
    return changed;
  }

  // =================================================================================================== map (SVG from the case geometry)
  function tw(s, fs) {
    var w = 0;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      w += ch === ' ' ? 0.28 : /[A-Z]/.test(ch) ? 0.68 : /[il.,'’]/.test(ch) ? 0.28 : /[mw]/.test(ch) ? 0.82 : 0.56;
    }
    return w * fs;
  }
  function wrapText(s, maxW, fs) {
    var words = s.split(' '), lines = [], cur = '';
    words.forEach(function (wd) {
      var t = cur ? cur + ' ' + wd : wd;
      if (tw(t, fs) <= maxW || !cur) cur = t; else { lines.push(cur); cur = wd; }
    });
    lines.push(cur);
    return lines;
  }

  function mapCandidates(m) {
    var out = [], pad = 14, cw = 100, T = 24, k;
    if (m.layout === 'floors') {
      var c0 = m.grids[0][0], r0 = m.grids[0][1], c1 = m.grids[1][0], r1 = m.grids[1][1];
      [64, 76, 90].forEach(function (ch) {
        out.push({ kind: 'stack', cw: cw, ch: ch, W: 2 * pad + Math.max(c0, c1) * cw, H: 2 * pad + 2 * T + (r0 + r1) * ch + 16,
                   panels: { 1: { x: pad, y: pad + T }, 0: { x: pad, y: pad + T + r1 * ch + 16 + T } } });
        out.push({ kind: 'side', cw: cw, ch: ch, W: 2 * pad + (c0 + c1) * cw + 36, H: 2 * pad + T + Math.max(r0, r1) * ch,
                   panels: { 0: { x: pad, y: pad + T }, 1: { x: pad + c0 * cw + 36, y: pad + T } } });
      });
    } else if (m.layout === 'wings') {
      var c = m.grids[0][0], r = m.grids[0][1];
      [62, 74, 88].forEach(function (ch) {
        out.push({ kind: 'wings', cw: cw, ch: ch, W: 2 * pad + c * cw, H: 2 * pad + T + r * ch, panels: { 0: { x: pad, y: pad + T } } });
      });
    } else {
      var n = m.rooms.length, half = m.rooms.filter(function (q) { return q.zone === 0; }).length;
      [44, 52].forEach(function (carH) {                                // one column, engine on top
        var y = pad + 44, pos = [];
        for (k = 0; k < n; k++) {
          if (k === 0 || k === half) y += 20;
          pos.push({ x: pad, y: y, w: 270, h: carH });
          y += carH + 16;
        }
        out.push({ kind: 'col', W: 2 * pad + 270, H: y - 16 + pad, cars: pos, half: half });
      });
      [70, 84].forEach(function (carH) {                                // one row, engine on the left
        var x = pad + 62, pos = [];
        for (k = 0; k < n; k++) { pos.push({ x: x, y: pad + T, w: 118, h: carH }); x += 136; }
        out.push({ kind: 'row', W: x - 18 + pad, H: 2 * pad + T + carH, cars: pos, half: half });
      });
      var x0 = pad + 62, carW = 118, gap = 18, carH = 72, pos2 = [];   // U shape: front half on top, rear half back underneath
      for (k = 0; k < n; k++) {
        if (k < half) pos2.push({ x: x0 + k * (carW + gap), y: pad + T, w: carW, h: carH });
        else pos2.push({ x: x0 + (half - 1 - (k - half)) * (carW + gap), y: pad + T + carH + 44, w: carW, h: carH });
      }
      out.push({ kind: 'u', W: x0 + half * (carW + gap) - gap + 40 + pad, H: pad + T + carH + 44 + carH + T + pad, cars: pos2, half: half });
    }
    return out;
  }

  function pickLayout(m, bw, bh) {
    var best = null;
    mapCandidates(m).forEach(function (cand) {
      var s = Math.min(bw / cand.W, bh / cand.H);
      var fill = (cand.W * cand.H * s * s) / (bw * bh);
      var score = s * (0.86 + 0.14 * fill);
      if (!best || score > best.score + 1e-9) { best = cand; best.score = score; }
    });
    return best;
  }

  var WALL = '#B4C0D6', DOOR = '#38BDF8', GLASS = '#7DD3FC', LABEL = '#E2E8F2';
  var HALO = ' stroke="#121A2B" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"';

  function featureIcon(kind, x, y) {
    var s = 'stroke="#E8C66A" stroke-width="1.4"';
    if (kind === 'fireplace') {
      return '<g transform="translate(' + x + ',' + y + ')"><rect width="17" height="13" rx="1.5" fill="rgba(255,215,0,0.12)" ' + s + '/>' +
        '<path d="M4.2 13V8.2Q8.5 3.8 12.8 8.2V13" fill="#0B0F19" ' + s + '/><path d="M8.5 12.3c-1.7-1-1.1-2.6 0-3.8c1 1.2 1.7 2.6 0 3.8z" fill="#FFB020"/></g>';
    }
    if (kind === 'mirror') {
      return '<g transform="translate(' + x + ',' + y + ')"><ellipse cx="7" cy="7.5" rx="5.6" ry="7" fill="rgba(125,211,252,0.14)" ' + s + '/>' +
        '<path d="M4.6 5.2l2.6-2" stroke="#E8C66A" stroke-width="1.3" stroke-linecap="round"/></g>';
    }
    if (kind === 'skylight') {
      return '<g transform="translate(' + x + ',' + y + ')"><rect width="16" height="13" rx="1.5" fill="rgba(125,211,252,0.14)" ' + s + '/>' +
        '<path d="M8 0v13M0 6.5h16" ' + s + '/></g>';
    }
    if (kind === 'berths') {
      return '<g transform="translate(' + x + ',' + y + ')"><rect width="18" height="5" rx="1.5" fill="rgba(255,215,0,0.12)" ' + s + '/>' +
        '<rect y="8" width="18" height="5" rx="1.5" fill="rgba(255,215,0,0.12)" ' + s + '/></g>';
    }
    return '';
  }
  function stairsGlyph(x, y, w, h) {
    var p = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="rgba(56,189,248,0.12)" stroke="' + GLASS + '" stroke-width="1.4"/>';
    for (var i = 1; i < 5; i++) {
      var yy = y + h * i / 5;
      p += '<line x1="' + x + '" y1="' + yy + '" x2="' + (x + w) + '" y2="' + yy + '" stroke="' + GLASS + '" stroke-width="1.2"/>';
    }
    return p;
  }
  function labelSVG(r, cx, cy, maxW, maxH) {
    var fs = 13, lines = wrapText(r.name, maxW, fs);
    if (lines.length > 2) { fs = 11.5; lines = wrapText(r.name, maxW, fs); }
    var lh = fs * 1.15, block = 27 + 4 + lines.length * lh, out = '';
    if (block > maxH - 4) {                                              // too flat: badge left of the name
      var tx = cx - (Math.max.apply(null, lines.map(function (l) { return tw(l, fs); })) + 30) / 2;
      out += '<circle cx="' + (tx + 12.5) + '" cy="' + cy + '" r="12.5" fill="#FFD700"/>' +
        '<text x="' + (tx + 12.5) + '" y="' + (cy + 5.3) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#141000">' + esc(r.code) + '</text>';
      var ty = cy - (lines.length - 1) * lh / 2 + fs * 0.36;
      lines.forEach(function (ln) {
        out += '<text x="' + (tx + 30) + '" y="' + ty.toFixed(1) + '" font-size="' + fs + '" font-weight="600" fill="' + LABEL + '"' + HALO + '>' + esc(ln) + '</text>';
        ty += lh;
      });
      return out;
    }
    var top = cy - block / 2;
    out += '<circle cx="' + cx + '" cy="' + (top + 13.5) + '" r="13" fill="#FFD700"/>' +
      '<text x="' + cx + '" y="' + (top + 19) + '" text-anchor="middle" font-size="15.5" font-weight="800" fill="#141000">' + esc(r.code) + '</text>';
    var y = top + 27 + 4 + fs * 0.9;
    lines.forEach(function (ln) {
      out += '<text x="' + cx + '" y="' + y.toFixed(1) + '" text-anchor="middle" font-size="' + fs + '" font-weight="600" fill="' + LABEL + '"' + HALO + '>' + esc(ln) + '</text>';
      y += lh;
    });
    return out;
  }

  function mapSVG(c, bw, bh) {
    var m = c.map, L = pickLayout(m, bw, bh);
    var body = m.layout === 'train' ? drawTrain(c, L) : drawGrid(c, L);
    return '<svg viewBox="0 0 ' + L.W.toFixed(1) + ' ' + L.H.toFixed(1) + '" preserveAspectRatio="xMidYMid meet" ' +
      'font-family="-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif" role="img" aria-label="' + esc(tr('floorplan')) + '">' + body + '</svg>';
  }

  function drawGrid(c, L) {
    var m = c.map, cw = L.cw, ch = L.ch, parts = [];
    function P(f, gx, gy) { return [L.panels[f].x + gx * cw, L.panels[f].y + gy * ch]; }
    var titleStyle = 'font-size="11.5" font-weight="800" letter-spacing="1.6"';
    if (m.layout === 'floors') {
      [0, 1].forEach(function (f) {
        var p = P(f, 0, 0);
        parts.push('<text x="' + p[0] + '" y="' + (p[1] - 8) + '" ' + titleStyle + ' fill="' + ZONE[f] + '">' + esc(m.zoneNames[f].toUpperCase()) + '</text>');
      });
    } else {
      var split = 0;
      m.rooms.forEach(function (r) { if (r.zone === 0) split = Math.max(split, r.x + r.w); });
      var cols = m.grids[0][0];
      [[0, split], [split, cols]].forEach(function (ab, z) {
        var a = P(0, ab[0], 0), b = P(0, ab[1], 0);
        parts.push('<text x="' + ((a[0] + b[0]) / 2) + '" y="' + (a[1] - 8) + '" text-anchor="middle" ' + titleStyle + ' fill="' + ZONE[z] + '">' +
          esc(m.zoneNames[z].toUpperCase()) + '</text>');
        parts.push('<path d="M' + (a[0] + 4) + ' ' + (a[1] - 13) + 'v6M' + (b[0] - 4) + ' ' + (a[1] - 13) + 'v6" stroke="' + ZONE[z] + '" stroke-width="1.3" opacity="0.7"/>');
      });
    }
    // room fills (tap targets)
    m.rooms.forEach(function (r) {
      var p = P(r.floor, r.x, r.y);
      parts.push('<rect class="m-room' + (ui.spot === r.id ? ' spot' : '') + '" data-act="room" data-r="' + r.id + '" x="' + p[0] + '" y="' + p[1] +
        '" width="' + r.w * cw + '" height="' + r.h * ch + '" fill="' + ZONE[r.zone] + '" fill-opacity="0.2"/>');
    });
    // walls, split into unit segments so doors and windows can open them
    var segs = {};
    function key(f, x1, y1, x2, y2) { if (x2 < x1 || y2 < y1) { var t = x1; x1 = x2; x2 = t; t = y1; y1 = y2; y2 = t; } return f + ':' + x1 + ',' + y1 + ',' + x2 + ',' + y2; }
    function addSeg(f, x1, y1, x2, y2, rid) {
      var k = key(f, x1, y1, x2, y2);
      if (!segs[k]) segs[k] = { f: f, x1: Math.min(x1, x2), y1: Math.min(y1, y2), x2: Math.max(x1, x2), y2: Math.max(y1, y2), rooms: [] };
      segs[k].rooms.push(rid);
    }
    m.rooms.forEach(function (r) {
      for (var x = r.x; x < r.x + r.w; x++) { addSeg(r.floor, x, r.y, x + 1, r.y, r.id); addSeg(r.floor, x, r.y + r.h, x + 1, r.y + r.h, r.id); }
      for (var y = r.y; y < r.y + r.h; y++) { addSeg(r.floor, r.x, y, r.x, y + 1, r.id); addSeg(r.floor, r.x + r.w, y, r.x + r.w, y + 1, r.id); }
    });
    m.doors.forEach(function (d) {
      if (d.kind !== 'door') return;
      var k = key(d.floor, d.seg[0][0], d.seg[0][1], d.seg[1][0], d.seg[1][1]);
      if (segs[k]) segs[k].door = d;
    });
    m.rooms.forEach(function (r) {
      if (!r.windowSeg) return;
      var k = key(r.floor, r.windowSeg[0][0], r.windowSeg[0][1], r.windowSeg[1][0], r.windowSeg[1][1]);
      if (segs[k]) segs[k].win = r;
    });
    var walls = [], extras = [];
    Object.keys(segs).forEach(function (k) {
      var s = segs[k], a = P(s.f, s.x1, s.y1), b = P(s.f, s.x2, s.y2), ext = s.rooms.length === 1;
      var sw = ext ? 4.6 : 2.8;
      function piece(t0, t1) {
        walls.push('<line x1="' + (a[0] + (b[0] - a[0]) * t0).toFixed(1) + '" y1="' + (a[1] + (b[1] - a[1]) * t0).toFixed(1) + '" x2="' +
          (a[0] + (b[0] - a[0]) * t1).toFixed(1) + '" y2="' + (a[1] + (b[1] - a[1]) * t1).toFixed(1) + '" stroke-width="' + sw + '"/>');
      }
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len;
      if (s.door) {
        var o0 = 0.27, o1 = 0.73;
        piece(0, o0); piece(o1, 1);
        var g0 = [a[0] + (b[0] - a[0]) * o0, a[1] + (b[1] - a[1]) * o0], g1 = [a[0] + (b[0] - a[0]) * o1, a[1] + (b[1] - a[1]) * o1];
        var Ld = len * (o1 - o0), ra = c.map.rooms[s.door.a];
        var rc = P(ra.floor, ra.x + ra.w / 2, ra.y + ra.h / 2), nx = -uy, ny = ux;
        if ((rc[0] - g0[0]) * nx + (rc[1] - g0[1]) * ny < 0) { nx = -nx; ny = -ny; }
        var leaf = [g0[0] + nx * Ld, g0[1] + ny * Ld], sweep = (ux * ny - uy * nx) < 0 ? 1 : 0;
        extras.push('<line x1="' + g0[0].toFixed(1) + '" y1="' + g0[1].toFixed(1) + '" x2="' + leaf[0].toFixed(1) + '" y2="' + leaf[1].toFixed(1) +
          '" stroke="' + DOOR + '" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M' + leaf[0].toFixed(1) + ' ' + leaf[1].toFixed(1) + ' A' + Ld.toFixed(1) + ' ' + Ld.toFixed(1) + ' 0 0 ' + sweep + ' ' +
          g1[0].toFixed(1) + ' ' + g1[1].toFixed(1) + '" fill="none" stroke="' + DOOR + '" stroke-width="1.2" stroke-dasharray="3 2.5" opacity="0.85"/>');
      } else if (s.win) {
        piece(0, 0.2); piece(0.8, 1);
        var w0 = [a[0] + (b[0] - a[0]) * 0.2, a[1] + (b[1] - a[1]) * 0.2], w1 = [a[0] + (b[0] - a[0]) * 0.8, a[1] + (b[1] - a[1]) * 0.8];
        var qx = -uy, qy = ux;
        [-2.3, 2.3].forEach(function (off) {
          extras.push('<line x1="' + (w0[0] + qx * off).toFixed(1) + '" y1="' + (w0[1] + qy * off).toFixed(1) + '" x2="' + (w1[0] + qx * off).toFixed(1) +
            '" y2="' + (w1[1] + qy * off).toFixed(1) + '" stroke="' + GLASS + '" stroke-width="1.3"/>');
        });
        [w0, w1].forEach(function (g) {
          extras.push('<line x1="' + (g[0] + qx * 3.4).toFixed(1) + '" y1="' + (g[1] + qy * 3.4).toFixed(1) + '" x2="' + (g[0] - qx * 3.4).toFixed(1) +
            '" y2="' + (g[1] - qy * 3.4).toFixed(1) + '" stroke="' + GLASS + '" stroke-width="1.3"/>');
        });
      } else {
        piece(0, 1);
      }
    });
    parts.push('<g stroke="' + WALL + '" stroke-linecap="square">' + walls.join('') + '</g>');
    parts.push(extras.join(''));
    // stairs: same grid cell on both floors
    var obst = {};                                                     // room id -> boxes a label must avoid
    function addObst(id, b) { (obst[id] = obst[id] || []).push(b); }
    if (m.layout === 'floors' && m.stairs) {
      var st = m.doors.filter(function (d) { return d.kind === 'stairs'; })[0];
      [0, 1].forEach(function (f) {
        var room = m.rooms[st.a].floor === f ? m.rooms[st.a] : m.rooms[st.b];
        var other = room.id === st.a ? m.rooms[st.b] : m.rooms[st.a];
        var p = P(f, m.stairs[0], m.stairs[1]), gw = 17, gh = Math.min(34, ch - 30);
        var gx = p[0] + 8, gy = p[1] + ch - gh - 7;
        parts.push(stairsGlyph(gx, gy, gw, gh));
        parts.push('<text x="' + gx + '" y="' + (gy - 5) + '" font-size="10.5" font-weight="800" fill="' + GLASS + '">to ' + esc(other.code) + '</text>');
        addObst(room.id, [gx - 3, gy - 16, gx + 26, gy + gh + 2]);
      });
    }
    // features and labels
    m.rooms.forEach(function (r) {
      var p0 = P(r.floor, r.x, r.y), rw = r.w * cw, rh = r.h * ch;
      if (r.feature) { parts.push(featureIcon(m.feature, p0[0] + rw - 24, p0[1] + 8)); addObst(r.id, [p0[0] + rw - 27, p0[1] + 5, p0[0] + rw - 4, p0[1] + 24]); }
      var best = null, boxes = obst[r.id] || [];
      [0, -0.12, 0.12, -0.22, 0.22, -0.3, 0.3].forEach(function (fx) {
        [0, -0.14, 0.14].forEach(function (fy) {
          var cx = p0[0] + rw / 2 + fx * rw, cy = p0[1] + rh / 2 + fy * rh;
          var maxW = Math.min(rw - 16, 2 * Math.min(cx - p0[0], p0[0] + rw - cx) - 8);
          if (maxW < 40) return;
          var lines = wrapText(r.name, maxW, 13), wB = Math.max(26, Math.max.apply(null, lines.map(function (l) { return tw(l, 13); })));
          var hB = 31 + lines.length * 15, box = [cx - wB / 2, cy - hB / 2, cx + wB / 2, cy + hB / 2];
          if (box[1] < p0[1] + 2 || box[3] > p0[1] + rh - 2) return;
          var hit = boxes.reduce(function (acc, o) {
            return acc + Math.max(0, Math.min(box[2], o[2]) - Math.max(box[0], o[0])) * Math.max(0, Math.min(box[3], o[3]) - Math.max(box[1], o[1]));
          }, 0) + Math.abs(fx) * 40 + Math.abs(fy) * 40;
          if (!best || hit < best.hit) best = { hit: hit, cx: cx, cy: cy, maxW: maxW };
        });
      });
      if (!best) best = { cx: p0[0] + rw / 2, cy: p0[1] + rh / 2, maxW: rw - 16 };
      parts.push(labelSVG(r, best.cx, best.cy, best.maxW, rh));
    });
    return parts.join('');
  }

  function drawTrain(c, L) {
    var m = c.map, parts = [], cars = L.cars, n = cars.length;
    var titleStyle = 'font-size="11.5" font-weight="800" letter-spacing="1.6"';
    // engine
    var a0 = cars[0];
    if (L.kind === 'col') {
      var ex = a0.x + a0.w / 2 - 26, ey = a0.y - 20 - 34;
      parts.push('<path d="M' + ex + ' ' + (ey + 30) + 'V' + (ey + 10) + 'Q' + ex + ' ' + ey + ' ' + (ex + 10) + ' ' + ey + 'H' + (ex + 42) + 'Q' + (ex + 52) + ' ' + ey + ' ' +
        (ex + 52) + ' ' + (ey + 10) + 'V' + (ey + 30) + 'Z" fill="#1C2742" stroke="' + WALL + '" stroke-width="2"/>' +
        '<rect x="' + (ex + 9) + '" y="' + (ey + 6) + '" width="34" height="9" rx="2.5" fill="#0B0F19" stroke="' + GLASS + '" stroke-width="1.2"/>' +
        '<circle cx="' + (ex + 26) + '" cy="' + (ey + 22) + '" r="3.5" fill="#FFD700"/>');
    } else {
      var lx = a0.x - 58, ly = a0.y + a0.h / 2 - 22;
      parts.push('<path d="M' + (lx + 48) + ' ' + ly + 'H' + (lx + 14) + 'Q' + lx + ' ' + ly + ' ' + lx + ' ' + (ly + 14) + 'V' + (ly + 44) + 'H' + (lx + 48) + 'Z" fill="#1C2742" stroke="' +
        WALL + '" stroke-width="2"/><rect x="' + (lx + 8) + '" y="' + (ly + 8) + '" width="12" height="14" rx="2.5" fill="#0B0F19" stroke="' + GLASS +
        '" stroke-width="1.2"/><circle cx="' + (lx + 8) + '" cy="' + (ly + 34) + '" r="3.5" fill="#FFD700"/>');
    }
    // couplings (the doors of a train)
    for (var i = 0; i < n - 1; i++) {
      var p = cars[i], q = cars[i + 1];
      if (L.kind === 'col') {
        parts.push('<rect x="' + (p.x + p.w / 2 - 9) + '" y="' + (p.y + p.h) + '" width="18" height="' + (q.y - p.y - p.h) + '" fill="#1C2742" stroke="' + DOOR + '" stroke-width="1.3"/>');
      } else if (Math.abs(p.y - q.y) < 1) {
        var left = p.x < q.x ? p : q, right = p.x < q.x ? q : p;
        parts.push('<rect x="' + (left.x + left.w) + '" y="' + (p.y + p.h / 2 - 9) + '" width="' + (right.x - left.x - left.w) + '" height="18" fill="#1C2742" stroke="' + DOOR + '" stroke-width="1.3"/>');
      } else {                                                         // U turn on the right
        var xr = p.x + p.w, y1 = p.y + p.h / 2, y2 = q.y + q.h / 2;
        parts.push('<path d="M' + xr + ' ' + y1 + 'h14a14 14 0 0 1 14 14V' + (y2 - 14) + 'a14 14 0 0 1 -14 14h-14" fill="none" stroke="#1C2742" stroke-width="18"/>' +
          '<path d="M' + xr + ' ' + y1 + 'h14a14 14 0 0 1 14 14V' + (y2 - 14) + 'a14 14 0 0 1 -14 14h-14" fill="none" stroke="' + DOOR + '" stroke-width="1.3" stroke-dasharray="4 3"/>');
      }
    }
    // cars
    cars.forEach(function (p, k) {
      var r = m.rooms[k];
      parts.push('<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" rx="10" fill="#0F1524" stroke="' + WALL + '" stroke-width="2.4"/>');
      parts.push('<rect class="m-room' + (ui.spot === r.id ? ' spot' : '') + '" data-act="room" data-r="' + r.id + '" x="' + p.x + '" y="' + p.y + '" width="' + p.w +
        '" height="' + p.h + '" rx="10" fill="' + ZONE[r.zone] + '" fill-opacity="0.2"/>');
      if (r.feature) parts.push(featureIcon('berths', p.x + p.w - 26, p.y + 8));
      if (L.kind === 'col') {
        var cy = p.y + p.h / 2;
        parts.push('<circle cx="' + (p.x + 22) + '" cy="' + cy + '" r="12.5" fill="#FFD700"/><text x="' + (p.x + 22) + '" y="' + (cy + 5.3) +
          '" text-anchor="middle" font-size="15" font-weight="800" fill="#141000">' + esc(r.code) + '</text>' +
          '<text x="' + (p.x + 44) + '" y="' + (cy + 5) + '" font-size="14" font-weight="600" fill="' + LABEL + '"' + HALO + '>' + esc(r.name) + '</text>');
      } else {
        parts.push(labelSVG(r, p.x + p.w / 2, p.y + p.h / 2 + 2, p.w - 14, p.h));
      }
    });
    // zone labels
    var half = L.half;
    [[0, half], [half, n]].forEach(function (ab, z) {
      if (ab[0] >= ab[1]) return;
      var first = cars[ab[0]], last = cars[ab[1] - 1];
      var txt = esc(m.zoneNames[z].toUpperCase());
      if (L.kind === 'col') {
        parts.push('<text x="' + first.x + '" y="' + (first.y - 7) + '" ' + titleStyle + ' fill="' + ZONE[z] + '">' + txt + '</text>');
      } else {
        var xa = Math.min(first.x, last.x), xb = Math.max(first.x + first.w, last.x + last.w);
        var below = L.kind === 'u' && z === 1;
        var y = below ? first.y + first.h + 18 : first.y - 8;
        parts.push('<text x="' + ((xa + xb) / 2) + '" y="' + y + '" text-anchor="middle" ' + titleStyle + ' fill="' + ZONE[z] + '">' + txt + '</text>');
      }
    });
    return parts.join('');
  }

  function legendHTML(c) {
    var m = c.map, h = '';
    function sv(inner) { return '<svg viewBox="0 0 26 18" aria-hidden="true">' + inner + '</svg>'; }
    m.zoneNames.forEach(function (nm, z) { h += '<span style="color:' + ZONE[z] + '"><i class="sw" style="background:' + ZONE[z] + '33"></i><b style="color:var(--muted);font-weight:600">' + esc(nm) + '</b></span>'; });
    if (m.layout === 'train') {
      h += '<span>' + sv('<rect x="1" y="5" width="7" height="8" rx="2" fill="none" stroke="' + WALL + '" stroke-width="1.5"/><rect x="8" y="6.5" width="10" height="5" fill="#1C2742" stroke="' + DOOR + '" stroke-width="1.2"/><rect x="18" y="5" width="7" height="8" rx="2" fill="none" stroke="' + WALL + '" stroke-width="1.5"/>') + esc(tr('leg_conn')) + '</span>';
    } else {
      h += '<span>' + sv('<path d="M1 16h6M19 16h6" stroke="' + WALL + '" stroke-width="2.4"/><path d="M7 16V5" stroke="' + DOOR + '" stroke-width="1.8"/><path d="M7 5A11 11 0 0 1 18 16" fill="none" stroke="' + DOOR + '" stroke-width="1.1" stroke-dasharray="2.5 2"/>') + esc(tr('leg_door')) + '</span>';
    }
    if (m.layout === 'floors') h += '<span>' + sv(stairsGlyph(7, 1, 12, 16)) + esc(tr('leg_stairs')) + '</span>';
    if (m.windows) h += '<span>' + sv('<path d="M1 9h4M21 9h4" stroke="' + WALL + '" stroke-width="2.4"/><path d="M5 6.7h16M5 11.3h16M5 5.5v7M21 5.5v7" stroke="' + GLASS + '" stroke-width="1.2"/>') + esc(tr('leg_window')) + '</span>';
    h += '<span>' + sv(featureIcon(m.feature, 4, 2)) + esc(m.featureLegend) + '</span>';
    return h;
  }

  // =================================================================================================== state per case
  function stateKey(c, daily) { return daily ? 'd:' + daily : c.id; }
  function getState(key, c) {
    var st = save.states[key];
    if (!st || !st.m || st.m.p.length !== c.suspects.length) {
      st = save.states[key] = { id: c.id, m: Logic.emptyMarks(c), clues: [], hints: [], wrong: 0, t: 0, solved: false, started: false };
    }
    return st;
  }
  function hintsUsed(st) { return st.hints.length; }
  function hintsText(n) { return tr(n === 1 ? 'hint_one' : 'hint_other', { n: n }); }
  function solvedIds() { return Object.keys(save.best); }
  function todayKey() { return Logic.dateKey(nowDate()); }
  function dailyCase(key) { return CASES[Logic.dailyIndex(key || todayKey(), CASES)]; }

  // =================================================================================================== home screen
  function caseLabel(c, short) {
    var idx = CASES.filter(function (x) { return x.level === c.level; }).indexOf(c) + 1;
    return short ? tr('case_short', { n: idx }) : tr('case_level', { level: lvName(c.level), n: idx });
  }
  function langSwitchHTML() {
    return '<div class="langsw" role="group" aria-label="' + esc(tr('aria_lang')) + '">' + LANGS.map(function (l) {
      return '<button class="' + (l === lang ? 'on' : '') + '" data-act="lang" data-l="' + l + '" lang="' + l + '">' + l.toUpperCase() + '</button>';
    }).join('') + '</div>';
  }
  function adventOpen() { return Logic.adventOpen(todayKey()); }
  function adventDone() { return Logic.ADVENT_IDS.filter(function (id) { return save.best[id]; }).length; }
  function bookPanelHTML() {
    if (!isWeb() || !CONFIG.books) return '';
    var b = CONFIG.books, main = b[lang] || b.en;
    var link = function (href, cls, label) { return '<a class="' + cls + '" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>'; };
    return '<div class="bookpanel">' + ic('book') + '<div class="bp-t"><b>' + esc(tr('book_title')) + '</b><span>' + esc(tr('book_text')) + '</span></div>' +
      '<div class="bp-a">' + link(main, 'btn gold sm', esc(tr('book_cta'))) +
      (lang === 'en' && b.vol1 ? link(b.vol1, 'bp-2', esc(tr('book_vol1'))) : '') + '</div></div>';
  }
  function renderHome() {
    leaveCase();
    ui.screen = 'home'; ui.fromAdvent = false; ui.door = 0;
    var tk = todayKey(), dc = dailyCase(tk), dKey = 'd:' + tk, dst = save.states[dKey], drec = save.daily[tk];
    var solved = solvedIds().length, starsTot = 0;
    Object.keys(save.best).forEach(function (k) { starsTot += save.best[k].stars || 0; });
    var streak = Logic.streak(save.daily, tk);
    var dateText = nowDate().toLocaleDateString(LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long' });
    var cont = null;
    for (var i = 0; i < CASES.length && !cont; i++) { var s0 = save.states[CASES[i].id]; if (s0 && s0.started && !s0.solved) cont = CASES[i]; }
    for (i = 0; i < CASES.length && !cont; i++) if (!save.best[CASES[i].id]) cont = CASES[i];
    var lv = save.level || 'easy', aOpen = adventOpen();
    var h = '<div class="home"><div class="home-in">' +
      '<div class="home-head"><div class="brand"><h1>' + esc(CONFIG.title) + '</h1><p>' + esc(tr('tagline')) + '</p></div>' +
      '<div class="head-btns">' + langSwitchHTML() + '<button class="ibtn" data-act="howto" aria-label="' + esc(tr('aria_howto')) + '">' + ic('help') + '</button>' +
      '<button class="ibtn" data-act="mute" aria-label="' + esc(tr('aria_sound')) + '">' + ic(save.muted ? 'mute' : 'sound') + '</button></div></div>' +
      '<button class="card advent-card' + (aOpen ? ' live' : '') + '" data-act="advent">' + ic('gift') + '<span class="at"><b>' + esc(tr('advent')) + '</b><small>' +
      esc(aOpen ? tr('advent_progress', { n: adventDone() }) + ' · ' + tr('advent_open_n', { n: aOpen }) : tr('advent_teaser', { date: fmtDay(12, 1) })) + '</small></span>' +
      '<span class="chev-r">' + ic('next') + '</span></button>' +
      '<div class="hero"><div class="card daily"><div class="kicker gold-t" style="display:flex;gap:.4rem;align-items:center">' + ic('calendar', ' style="width:1rem;height:1rem"') +
      esc(tr('daily_kicker', { date: dateText })) + '</div><h2>' + esc(dc.title) + '</h2>' +
      '<div class="row"><span class="chip lv-' + dc.level + '">' + esc(lvName(dc.level)) + '</span><span class="muted" style="font-size:.85rem">' +
      esc(tr('case_meta', { setting: setName(dc.setting), clues: dc.clues.length, sus: dc.suspects.length })) + '</span></div>' +
      '<div class="go">' + (drec
        ? '<span class="tick on">' + ic('check') + '</span><span style="font-weight:700">' + esc(tr('solved_in', { t: Logic.fmtTime(drec.t) })) + '</span>' + starsHTML(drec.stars) +
          '<button class="btn ghost sm" data-act="daily">' + esc(tr('review')) + '</button>'
        : '<button class="btn gold" data-act="daily">' + ic('play') + esc(dst && dst.started ? tr('cont') : tr('play_today')) + '</button>') +
      (streak ? '<span class="muted" style="font-size:.82rem;display:inline-flex;gap:.3rem;align-items:center">' + ic('flame', ' style="width:1rem;height:1rem;color:#FB923C"') +
        esc(tr('streak_n', { n: streak })) + '</span>' : '') + '</div></div>' +
      '<div class="card stats"><div class="stat"><b>' + solved + '<span style="font-size:.9rem;color:var(--muted)"> / ' + CASES.length + '</span></b><span>' + esc(tr('stat_solved')) + '</span></div>' +
      '<div class="stat"><b class="gold-t">' + starsTot + '</b><span>' + esc(tr('stat_stars')) + '</span></div><div class="stat"><b>' + streak + '</b><span>' + esc(tr('stat_streak')) + '</span></div>' +
      (cont ? '<div class="cont"><button class="btn sky" style="width:100%" data-act="open" data-id="' + cont.id + '">' + ic('play') +
        esc(tr(save.states[cont.id] && save.states[cont.id].started ? 'cont_continue' : 'cont_next', { label: caseLabel(cont), title: cont.title })) + '</button></div>'
        : '<div class="cont muted" style="font-size:.85rem;text-align:center">' + esc(tr('all_closed')) + '</div>') +
      '</div></div><div class="seg" role="tablist">';
    LEVELS.forEach(function (l) {
      var all = CASES.filter(function (c) { return c.level === l; }), done = all.filter(function (c) { return save.best[c.id]; }).length;
      h += '<button class="lv-' + l + (l === lv ? ' on' : '') + '" data-act="level" data-l="' + l + '">' + esc(lvName(l)) + ' <small>' + done + '/' + all.length + '</small></button>';
    });
    h += '</div><div class="grid-cases">';
    CASES.filter(function (c) { return c.level === lv; }).forEach(function (c, k) {
      var b = save.best[c.id], st = save.states[c.id];
      var prog = st && st.started && !st.solved;
      h += '<button class="ccard' + (b ? ' solved' : '') + '" data-act="open" data-id="' + c.id + '" style="animation-delay:' + (k * 0.03) + 's">' +
        '<span class="ico">' + ic(c.setting) + '</span><span><span class="t">' + esc(c.title) + '</span><span class="s" style="display:block">' +
        esc(caseLabel(c)) + ' · ' + esc(setName(c.setting)) + ' · ' + esc(tr('clues_n', { n: c.clues.length })) + '</span></span>' +
        '<span class="st"><span class="tick' + (b ? ' on' : prog ? ' prog' : '') + '">' + ic('check') + '</span>' +
        (b ? starsHTML(b.stars) + '<span>' + Logic.fmtTime(b.t) + '</span>' : prog ? '<span>' + Logic.fmtTime(st.t) + '</span>' : '') + '</span></button>';
    });
    h += '</div><div class="foot">' + esc(CONFIG.title) + ' · v' + CONFIG.version + ' · ' + esc(tr('foot')) + '</div></div></div>';
    app.innerHTML = h;
  }

  // =================================================================================================== advent calendar
  function renderAdvent() {
    leaveCase();
    ui.screen = 'advent';
    var open = adventOpen(), ids = Logic.ADVENT_IDS, done = adventDone();
    var h = '<div class="home advent"><div class="home-in"><div class="home-head">' +
      '<button class="ibtn" data-act="home" aria-label="' + esc(tr('aria_cases')) + '">' + ic('back') + '</button>' +
      '<div class="brand"><h1>' + esc(tr('advent')) + '</h1><p>' + esc(open ? tr('advent_progress', { n: done }) + ' · ' + tr('advent_open_n', { n: open }) : tr('advent_sub')) + '</p></div>' +
      '<div class="head-btns">' + langSwitchHTML() + '</div></div>';
    if (!open) {
      h += '<div class="card teaser">' + ic('gift') + '<div><b>' + esc(tr('advent_teaser', { date: fmtDay(12, 1) })) + '</b><p>' + esc(tr('advent_wait')) + '</p></div>' +
        '<button class="btn gold" data-act="home">' + esc(tr('advent_regular')) + '</button></div>';
    }
    h += '<div class="doors">';
    ids.forEach(function (id, i) {
      var n = i + 1, b = save.best[id], isOpen = n <= open;
      var cls = 'door ' + (!isOpen ? 'locked' : b ? 'solved' : 'open') + (isOpen && n === open && !b ? ' today' : '');
      var label = tr(!isOpen ? 'door_locked_label' : b ? 'door_done_label' : 'door_open_label', { n: n });
      h += '<button class="' + cls + '" data-act="door" data-n="' + n + '" aria-label="' + esc(label) + '" style="animation-delay:' + (i * 0.02) + 's"><span class="dn">' + n + '</span>' +
        '<span class="ds">' + (!isOpen ? ic('lock') + '<small>' + esc(fmtDay(12, n)) + '</small>' : b ? starsHTML(b.stars, 'dstars') : '<small>' + esc(lvName(BY_ID[id].level)) + '</small>') + '</span></button>';
    });
    h += '</div>' + bookPanelHTML() + '</div></div>';
    app.innerHTML = h;
  }
  function openDoor(n) {
    var open = adventOpen();
    if (n < 1 || n > 24) return;
    if (n > open) { toast(tr('door_locked', { date: fmtDay(12, n) })); return; }
    openCase(Logic.ADVENT_IDS[n - 1], null, n);
  }
  function nextDoor(n) {
    var open = adventOpen();
    for (var k = 1; k < 24; k++) {
      var m = ((n - 1 + k) % 24) + 1;
      if (m <= open && !save.best[Logic.ADVENT_IDS[m - 1]]) return m;
    }
    return 0;
  }

  // =================================================================================================== case screen
  function openCase(id, daily, door) {
    var c = BY_ID[id];
    if (!c) return;
    if (ui.screen === 'case') { stopTimer(); persist(true); }
    closeModal();
    ui.door = door || 0; ui.fromAdvent = !!door;
    ui.c = c; ui.key = stateKey(c, daily); ui.daily = daily || null; ui.st = getState(ui.key, c);
    ui.undo = []; ui.spot = -1; ui.screen = 'case'; ui.mapKey = ''; ui.hintView = null; ui.hintHidden = false;
    ui.ltab = ui.ltab || 'clues';
    ui.ptab = ui.st.started ? 'solve' : 'case';
    ui.drawerMin = false;
    ui.accuse = { killer: -1, room: -1, hour: -1, object: -1 };
    renderCase();
    gmAd();
    if (ui.st.solved) { cgPlay(false); return; }
    if (!ui.st.started) showIntro(); else startPlay();
  }
  function startPlay() {
    ui.st.started = true;
    persist();
    startTimer();
    cgPlay(true);
  }
  function leaveCase() {
    if (ui.screen === 'case') { stopTimer(); persist(true); }
    cgPlay(false);
    closeModal();
    ui.screen = 'home';
  }
  function labelOf(short) { return ui.door ? tr('door_n', { n: ui.door }) : ui.daily ? tr('daily_case') : caseLabel(ui.c, short); }

  function renderCase() {
    var c = ui.c, st = ui.st;
    var cls = 'cs ' + ui.mode + ' lt-' + ui.ltab + ' pt-' + ui.ptab + (ui.drawerMin ? ' drawer-min' : '');
    var h = '<div class="' + cls + '" id="cs">' + topbarHTML() +
      '<nav class="coltabs">' + tabBtn('ltab', 'clues', 'list', tr('clues')) + tabBtn('ltab', 'map', 'map', tr('floorplan')) + tabBtn('ltab', 'case', 'book', tr('casefile')) + '</nav>' +
      '<section class="panel p-clues"><div class="ph" data-act="drawer"><span class="kicker">' + esc(tr('clues')) + ' <span style="color:var(--faint);letter-spacing:.04em;text-transform:none;font-weight:600">· ' + esc(tr('tap_strike')) + '</span></span>' +
      '<span class="drawer-only chev muted">' + ic('chev', ' style="width:1.1rem;height:1.1rem"') + '</span></div>' +
      (ui.mode === 'P' ? '<div class="hintbar" id="hintbar">' + hintBarHTML() + '</div>' : '') + '<div class="pb" id="clues">' + cluesHTML() + '</div></section>' +
      '<section class="panel p-map"><div class="ph"><span class="kicker">' + esc(tr('floorplan')) + '</span><span class="muted" style="font-size:.7rem">' + esc(tr('tap_room')) + '</span></div>' +
      '<div class="mapbox" id="mapbox"></div><div class="legend">' + legendHTML(c) + '</div></section>' +
      '<section class="panel p-case"><div class="ph"><span class="kicker">' + esc(tr('casefile')) + '</span></div><div class="pb">' + caseFileHTML() + '</div></section>' +
      '<section class="panel p-grid"><div class="ph"><span class="kicker">' + esc(tr('timetable')) + '</span><span class="muted" style="font-size:.7rem">' + esc(tr('tap_letter')) + '</span></div>' +
      '<div class="pb" id="gridpb">' + gridHTML() + '</div>' + (ui.mode === 'P' ? '' : '<div class="hintbar" id="hintbar">' + hintBarHTML() + '</div>') + '</section>' +
      '<nav class="bnav">' + tabBtn('ptab', 'case', 'book', tr('casefile')) + tabBtn('ptab', 'map', 'map', tr('floorplan')) + tabBtn('ptab', 'solve', 'grid', tr('solve')) + '</nav></div>';
    app.innerHTML = h;
    updateTimerText();
    updateAccuseGlow();
    requestAnimationFrame(renderMap);
  }
  function tabBtn(which, val, icon, label) {
    var on = ui[which] === val;
    return '<button class="' + (on ? 'on' : '') + '" data-act="' + which + '" data-v="' + val + '">' + ic(icon) + '<span>' + label + '</span></button>';
  }
  function topbarHTML() {
    var c = ui.c, st = ui.st;
    return '<header class="topbar"><button class="ibtn" data-act="home" aria-label="' + esc(tr('aria_cases')) + '">' + ic('back') + '</button>' +
      '<div class="ttl"><b>' + esc(c.title) + '</b><span><span class="chip lv-' + c.level + '">' + esc(lvName(c.level)) + '</span>' +
      esc(labelOf(ui.mode !== 'P')) + ' · ' + esc(setName(c.setting)) + '</span></div>' +
      '<div class="timer">' + ic('clock') + '<span id="tm">0:00</span></div>' +
      '<button class="btn ghost btn-case" data-act="casefile">' + ic('book') + '<span class="lbl">' + esc(tr('casefile')) + '</span></button>' +
      (st.solved
        ? '<button class="btn sky" data-act="replay">' + ic('replay') + '<span class="lbl">' + esc(tr('play_again')) + '</span></button>'
        : '<button class="btn sky" data-act="hint" aria-label="' + esc(tr('hint')) + '">' + ic('bulb') + '<span class="lbl">' + esc(tr('hint')) + '</span><span class="hintcount" id="hc">' + hintsUsed(st) + '</span></button>' +
          '<button class="btn gold accuse" id="accusebtn" data-act="accuse">' + ic('target') + '<span class="lbl">' + esc(tr('accuse')) + '</span></button>') +
      (ui.mode === 'P' ? '' : '<button class="ibtn" data-act="howto" aria-label="' + esc(tr('aria_howto')) + '">' + ic('help') + '</button>') + '</header>';
  }
  function cluesHTML() {
    var c = ui.c, st = ui.st;
    var h = '<div class="facts"><div class="kicker">' + esc(tr('known_facts')) + '</div>' + esc(c.known.facts) + ' ' + esc(c.known.found) + '</div>' +
      '<p class="question">' + esc(c.question) + '</p><ol class="clues">';
    c.clues.forEach(function (cl, i) {
      h += '<li class="clue' + (st.clues.indexOf(i) >= 0 ? ' done' : '') + '" data-act="clue" data-i="' + i + '"><span class="n">' + (i + 1) +
        '</span><span class="tx">' + esc(cl.text) + '</span></li>';
    });
    return h + '</ol>';
  }
  function caseFileHTML() {
    var c = ui.c;
    var h = '<p class="story">' + esc(c.setup) + '</p><div class="facts"><div class="kicker">' + esc(tr('known_facts')) + '</div>' + esc(c.known.facts) + ' ' + esc(c.known.found) + '</div>' +
      '<div class="kicker" style="margin-top:.7rem">' + esc(tr('suspects')) + '</div><div class="suspects">';
    c.suspects.forEach(function (s, i) {
      h += '<div class="sus"><span class="avatar" style="background:' + SUS_COLORS[i] + '">' + esc(s.short[0]) + '</span><div><b>' + esc(s.name) + '</b><p>' + esc(s.blurb) + '</p></div></div>';
    });
    h += '</div><div class="kicker">' + esc(tr('objects')) + '</div><p class="muted" style="font-size:.8rem;margin:.2rem 0 .45rem">' + esc(tr('objects_note')) + '</p><div class="objs">';
    c.objects.forEach(function (o, i) { h += '<span><span class="onum">' + (i + 1) + '</span>' + esc(o) + '</span>'; });
    h += '</div>';
    if (ui.mode === 'P') h += '<div style="margin-top:1rem"><button class="btn ghost sm" data-act="howto">' + ic('help') + esc(tr('howto')) + '</button></div>';
    return h;
  }

  function pmClass(arr, j, base) {
    var v = arr[j], cls = 'pm ' + base;
    if (v === 1) cls += ' x'; else if (v === 2) cls += ' o';
    else if (arr.indexOf(2) < 0 && arr.filter(function (x) { return x !== 1; }).length === 1) cls += ' last';
    return cls;
  }
  function gridHTML() {
    var c = ui.c, st = ui.st, m = st.m, S = c.suspects.length, R = c.map.rooms.length;
    var oc = S <= 4 ? 2 : 3, pmh = ui.mode === 'P' ? 1.62 : 1.38;
    var h = '';
    if (st.solved) {
      var b = save.best[c.id];
      h += '<div class="solvedbar">' + ic('check', ' style="width:1.2rem;height:1.2rem;color:var(--gold)"') + '<span><b>' + esc(tr('case_closed')) + '</b> ' + esc(tr('solvedbar', { t: Logic.fmtTime(st.t), hints: hintsText(hintsUsed(st)), wrong: st.wrong })) + '</span>' + (b ? starsHTML(b.stars) : '') + '</div>';
    }
    h += '<div class="ttwrap"><div class="olegend">';
    c.objects.forEach(function (o, i) { h += '<span><span class="onum">' + (i + 1) + '</span>' + esc(o) + '</span>'; });
    h += '</div><div class="tt' + (st.solved ? ' locked' : '') + '" style="--objcol:' + (oc * 1.75 + 0.5) + 'rem;--oc:' + oc + ';--pmh:' + pmh + 'rem;' +
      (st.solved ? 'pointer-events:none;' : '') + '">';
    h += '<div class="hd blank"></div>';
    c.hours.forEach(function (hr) { h += '<div class="hd">' + esc(hr) + '</div>'; });
    h += '<div class="hd">' + esc(tr('col_object')) + '</div>';
    h += '<div class="nm vnm"><b>' + esc(c.victim.short) + '</b><small>' + esc(tr('victim')) + '</small></div>';
    c.known.victimPath.forEach(function (r) {
      var room = c.map.rooms[r];
      h += '<div class="vic">' + esc(room.code) + '<small>' + esc(room.name) + '</small></div>';
    });
    h += '<div class="vic" style="color:var(--faint)">–</div>';
    for (var s = 0; s < S; s++) {
      h += '<div class="nm"><b><i style="background:' + SUS_COLORS[s] + '"></i>' + esc(c.suspects[s].short) + '</b></div>';
      for (var t = 0; t < c.hours.length; t++) {
        h += '<div class="cell' + cellExtra(m.p[s][t], st.solved) + '" id="c' + s + '-' + t + '">';
        for (var r = 0; r < R; r++) {
          var room = c.map.rooms[r];
          h += '<button class="' + pmClass(m.p[s][t], r, 'z' + room.zone) + (ui.spot === r ? ' spot' : '') + '" data-act="pm" data-s="' + s + '" data-t="' + t + '" data-r="' + r +
            '" aria-label="' + esc(tr('aria_cell', { who: c.suspects[s].short, hour: c.hours[t], room: room.name })) + '">' + esc(room.code) + '</button>';
        }
        h += '</div>';
      }
      h += '<div class="cell obj' + cellExtra(m.o[s], st.solved) + '" id="c' + s + '-o">';
      for (var o = 0; o < S; o++) {
        h += '<button class="' + pmClass(m.o[s], o, '') + '" data-act="om" data-s="' + s + '" data-o="' + o + '" aria-label="' +
          esc(tr('aria_obj', { who: c.suspects[s].short, obj: c.objects[o] })) + '">' + (o + 1) + '</button>';
      }
      h += '</div>';
    }
    h += '</div></div>';
    if (!st.solved) {
      h += '<div class="tools"><button class="btn sm" data-act="undo">' + ic('undo') + esc(tr('undo')) + '</button><button class="btn sm ghost" data-act="clear">' + ic('trash') + esc(tr('clear')) + '</button>' +
        '<span class="tip">' + esc(tr('tip_grid', { by: tr(c.map.layout === 'floors' ? 'by_floor' : c.map.layout === 'train' ? 'by_train' : 'by_side') })) + '</span></div>';
    }
    return h;
  }
  function cellExtra(arr, solved) { return (arr.indexOf(2) >= 0 ? ' has-o' : '') + (solved ? ' won' : ''); }

  function hintBarHTML() {
    var c = ui.c, st = ui.st, n = st.hints.length;
    if (!n || ui.hintHidden) return '';
    var k = ui.hintView == null ? n - 1 : clamp(ui.hintView, 0, n - 1), hn = st.hints[k], latest = k === n - 1;
    var nav = '<span class="hnav">' + (n > 1 ? '<button data-act="hprev" aria-label="' + esc(tr('hint_earlier')) + '"' + (k === 0 ? ' disabled' : '') + '>‹</button><span>' + (k + 1) + '/' + n +
      '</span><button data-act="hnext" aria-label="' + esc(tr('hint_later')) + '"' + (latest ? ' disabled' : '') + '>›</button>' : '') +
      '<button data-act="hclose" aria-label="' + esc(tr('hint_hide')) + '">✕</button></span>';
    var head, body, cls = 'hcard' + (latest ? '' : ' old'), extra = '';
    if (hn.type === 'error') {
      cls += ' err'; head = tr('hint_head_err', { n: k + 1 }); body = errorText(hn.where);
    } else if (hn.type === 'step') {
      var w = c.walkthrough[hn.i];
      head = w.final ? tr('hint_head_final', { n: k + 1 }) : tr('hint_n', { n: k + 1 });
      body = w.text;
      if (latest && !w.final && !st.solved && !Logic.stepDone(w, st.m)) extra = '<button class="fill" data-act="fillhint" data-i="' + hn.i + '">' + esc(tr('fill_it')) + '</button>';
    } else {
      head = tr('hint_n', { n: k + 1 }); body = tr('hint_done');
    }
    return '<div class="' + cls + '"><div class="kicker"><span>' + head + '</span>' + nav + '</div><div class="hbody">' + esc(body) + extra + '</div></div>';
  }
  function refreshHintBar() { var hb = $('#hintbar'); if (hb) hb.innerHTML = hintBarHTML(); }
  function errorText(where) {
    var c = ui.c, who = c.suspects[where.s].short;
    if (where.kind === 'o') return tr('err_obj', { who: who });
    return tr('err_cell', { who: who, hour: c.hours[where.t] });
  }

  function renderMap() {
    var box = $('#mapbox');
    if (!box || !ui.c) return;
    var w = box.clientWidth, h = box.clientHeight;
    if (w < 20 || h < 20) return;
    box.innerHTML = mapSVG(ui.c, w - 12, h - 4);
    ui.mapKey = w + 'x' + h;
  }

  function refreshCell(s, t) {
    var c = ui.c, st = ui.st, isObj = t === 'o';
    var arr = isObj ? st.m.o[s] : st.m.p[s][t];
    var cell = $('#c' + s + '-' + t);
    if (!cell) return;
    cell.className = 'cell' + (isObj ? ' obj' : '') + cellExtra(arr, st.solved);
    $$('button', cell).forEach(function (b, j) {
      b.className = pmClass(arr, j, isObj ? '' : 'z' + c.map.rooms[j].zone) + (!isObj && ui.spot === j ? ' spot' : '');
    });
  }
  function refreshAllCells() {
    var c = ui.c;
    for (var s = 0; s < c.suspects.length; s++) {
      for (var t = 0; t < c.hours.length; t++) refreshCell(s, t);
      refreshCell(s, 'o');
    }
    updateAccuseGlow();
  }
  function updateAccuseGlow() {
    var b = $('#accusebtn');
    if (b) b.classList.toggle('ready', Logic.gridSolved(ui.c, ui.st.m));
  }

  // =================================================================================================== timer
  function startTimer() {
    if (!ui.st || ui.st.solved || !ui.st.started || doc.hidden || GM.ad) return;
    ui.timerOn = true; ui.lastTick = performance.now();
  }
  function stopTimer() { tick(); ui.timerOn = false; }
  function tick() {
    if (!ui.timerOn || !ui.st) return;
    var now = performance.now();
    ui.st.t += (now - ui.lastTick) / 1000;
    ui.lastTick = now;
  }
  function updateTimerText() {
    var el = $('#tm');
    if (el && ui.st) el.textContent = Logic.fmtTime(ui.st.t);
  }
  var lastSaveTick = 0;
  setInterval(function () {
    if (ui.screen !== 'case' || !ui.timerOn) return;
    tick(); updateTimerText();
    if (performance.now() - lastSaveTick > 5000) { lastSaveTick = performance.now(); persist(); }
  }, 250);

  // =================================================================================================== actions
  function mark(kind, s, a) {
    var st = ui.st;
    if (st.solved) return;
    var arr = kind === 'p' ? st.m.p[s][a.t] : st.m.o[s], j = kind === 'p' ? a.r : a.o;
    ui.undo.push([{ tag: kind === 'p' ? ['p', s, a.t] : ['o', s], j: j, prev: arr[j] }]);
    if (ui.undo.length > 300) ui.undo.shift();
    arr[j] = Logic.cycle(arr[j]);
    Sound.play(arr[j] === 2 ? 'circle' : 'tap');
    refreshCell(s, kind === 'p' ? a.t : 'o');
    updateAccuseGlow();
    persist();
  }
  function applyChanges(changes, undo) {
    var st = ui.st, touched = {};
    changes.forEach(function (chg) {
      var arr = chg.tag[0] === 'p' ? st.m.p[chg.tag[1]][chg.tag[2]] : st.m.o[chg.tag[1]];
      if (undo) arr[chg.j] = chg.prev;
      touched[chg.tag.join('-')] = chg.tag;
    });
    Object.keys(touched).forEach(function (k) { var tg = touched[k]; refreshCell(tg[1], tg[0] === 'p' ? tg[2] : 'o'); });
    updateAccuseGlow();
    persist();
  }
  function undo() {
    var last = ui.undo.pop();
    if (!last) { toast(tr('nothing_undo')); return; }
    applyChanges(last.slice().reverse(), true);
    Sound.play('tap');
  }
  function clearGrid() {
    confirmBox(tr('clear_q'), tr('clear_text'), tr('clear'), function () {
      var st = ui.st, ch = [], c = ui.c;
      for (var s = 0; s < c.suspects.length; s++) {
        for (var t = 0; t < c.hours.length; t++) st.m.p[s][t].forEach(function (v, j) { if (v) { ch.push({ tag: ['p', s, t], j: j, prev: v }); st.m.p[s][t][j] = 0; } });
        st.m.o[s].forEach(function (v, j) { if (v) { ch.push({ tag: ['o', s], j: j, prev: v }); st.m.o[s][j] = 0; } });
      }
      if (ch.length) ui.undo.push(ch);
      refreshAllCells();
      persist();
    });
  }
  function toggleClue(i) {
    var st = ui.st, k = st.clues.indexOf(i);
    if (k >= 0) st.clues.splice(k, 1); else st.clues.push(i);
    var li = $('.clue[data-i="' + i + '"]');
    if (li) li.classList.toggle('done', k < 0);
    Sound.play('tap');
    persist();
  }
  function setSpot(r) {
    ui.spot = ui.spot === r ? -1 : r;
    $$('.m-room').forEach(function (el) { el.classList.toggle('spot', +el.getAttribute('data-r') === ui.spot); });
    $$('.pm[data-r]').forEach(function (el) { el.classList.toggle('spot', +el.getAttribute('data-r') === ui.spot); });
    if (ui.spot >= 0) toast(ui.c.map.rooms[r].code + ' · ' + ui.c.map.rooms[r].name);
  }

  function hint() {
    var c = ui.c, st = ui.st;
    if (st.solved) return;
    var revealed = st.hints.filter(function (x) { return x.type === 'step'; }).map(function (x) { return x.i; });
    var nx = Logic.nextHint(c, st.m, revealed);
    st.hints.push(nx);
    Sound.play('hint');
    persist();
    var hc = $('#hc'); if (hc) hc.textContent = hintsUsed(st);
    ui.hintView = null; ui.hintHidden = false; refreshHintBar();
    if (ui.mode === 'P' && ui.drawerMin) { ui.drawerMin = false; var csx = $('#cs'); if (csx) csx.classList.remove('drawer-min'); }
    $$('.cell.hint, .cell.err').forEach(function (el) { el.classList.remove('hint', 'err'); });
    $$('.clue.ref').forEach(function (el) { el.classList.remove('ref'); });
    if (ui.mode === 'P' && ui.ptab !== 'solve') setTab('ptab', 'solve');
    if (nx.type === 'error') {
      var cell = $('#c' + nx.where.s + '-' + (nx.where.kind === 'o' ? 'o' : nx.where.t));
      if (cell) { cell.classList.add('err'); cell.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    } else if (nx.type === 'step') {
      var w = c.walkthrough[nx.i];
      w.clues.forEach(function (n) { var li = $('.clue[data-i="' + (n - 1) + '"]'); if (li) li.classList.add('ref'); });
      if (w.clues.length) {
        if (ui.mode === 'L2' && ui.ltab !== 'clues') setTab('ltab', 'clues');
        var first = $('.clue[data-i="' + (w.clues[0] - 1) + '"]');
        if (first) first.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      w.cells.forEach(function (x) { var el = $('#c' + x[0] + '-' + x[1]); if (el) el.classList.add('hint'); });
      w.objs.forEach(function (x) { var el = $('#c' + x[0] + '-o'); if (el) el.classList.add('hint'); });
    }
    setTimeout(function () { $$('.cell.hint').forEach(function (el) { el.classList.remove('hint'); }); }, 4000);
  }
  function fillHint(i) {
    var w = ui.c.walkthrough[i];
    var ch = Logic.applyStep(ui.st.m, w);
    if (ch.length) { ui.undo.push(ch); applyChanges(ch, false); }
    Sound.play('circle');
    refreshHintBar();
  }

  function setTab(which, v) {
    ui[which] = v;
    var cs = $('#cs');
    if (!cs) return;
    cs.className = cs.className.replace(which === 'ltab' ? /\blt-\w+/ : /\bpt-\w+/, (which === 'ltab' ? 'lt-' : 'pt-') + v);
    $$('[data-act="' + which + '"]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === v); });
    if (v === 'map') requestAnimationFrame(renderMap);
  }

  // =================================================================================================== modals
  function showModal(html, opts) {
    closeModal();
    var ov = doc.createElement('div');
    ov.className = 'ov' + (opts && opts.cls ? ' ' + opts.cls : '');
    ov.innerHTML = html;
    ov.addEventListener('click', function (e) { if (e.target === ov && opts && opts.dismiss) dismissModal(); });
    app.appendChild(ov);
    ui.modal = ov;
    return ov;
  }
  function closeModal() { if (ui.modal) { ui.modal.remove(); ui.modal = null; } }
  function dismissModal() {
    closeModal();
    if (ui.screen === 'case' && ui.st && !ui.st.started && !ui.st.solved) showIntro();   // back to the case intro if play has not started
  }
  function confirmBox(title, text, ok, fn) {
    var ov = showModal('<div class="modal"><div class="mh"><h2>' + esc(title) + '</h2></div><div class="mb"><p class="muted" style="margin:0">' + esc(text) + '</p></div>' +
      '<div class="mf"><button class="btn ghost" data-act="close">' + esc(tr('cancel')) + '</button><button class="btn gold" data-act="ok">' + esc(ok) + '</button></div></div>', { dismiss: true });
    $('[data-act="ok"]', ov).addEventListener('click', function (e) { e.stopPropagation(); closeModal(); fn(); });
  }
  function rulesHTML() {
    var h = '<ol class="rules">';
    for (var i = 1; i <= 7; i++) h += '<li><i>' + i + '</i><div><b>' + esc(tr('rule' + i + '_t')) + '</b><p>' + esc(tr('rule' + i)) + '</p></div></li>';
    return h + '</ol>' + tipboxHTML();
  }
  function tipboxHTML() {
    return '<div class="tipbox"><span class="demo"><span class="pm z0">A</span><span class="pm z0 x">B</span><span class="pm z0 o">C</span></span>' +
      '<span>' + tr('tip_a') + '</span>' +
      '<span class="demo" style="justify-content:center">' + ic('bulb', ' style="width:1.3rem;height:1.3rem;color:var(--sky)"') + '</span>' +
      '<span>' + tr('tip_b', { n: CONFIG.wrongPenalty }) + '</span></div>';
  }
  function showCaseFile() {
    showModal('<div class="modal wide"><div class="mh"><h2>' + esc(ui.c.title) + '</h2><button class="ibtn" data-act="close" aria-label="' + esc(tr('aria_close')) + '">✕</button></div><div class="mb">' +
      caseFileHTML() + '</div><div class="mf"><button class="btn gold" data-act="close">Back to the case</button></div></div>', { dismiss: true });
  }
  function showHowTo() {
    showModal('<div class="modal wide"><div class="mh"><h2>' + esc(tr('howto')) + '</h2><button class="ibtn" data-act="close" aria-label="' + esc(tr('aria_close')) + '">✕</button></div><div class="mb">' +
      '<p class="muted" style="margin:0 0 .8rem">' + esc(tr('howto_intro')) + '</p>' + rulesHTML() +
      '</div><div class="mf"><button class="btn gold" data-act="close">' + esc(tr('got_it')) + '</button></div></div>', { dismiss: true });
  }
  function showIntro() {
    var c = ui.c, first = !save.seenIntro;
    showModal('<div class="modal wide"><div class="mh"><div style="flex:1"><div class="kicker" style="display:flex;gap:.5rem;align-items:center"><span class="chip lv-' + c.level + '">' +
      esc(lvName(c.level)) + '</span>' + esc(labelOf(true)) + ' · ' + esc(setName(c.setting)) + '</div><h2 style="margin-top:.35rem">' + esc(c.title) + '</h2></div></div>' +
      '<div class="mb"><p class="story">' + esc(c.setup) + '</p><div class="facts intro-facts"><div class="kicker">' + esc(tr('known_facts')) + '</div>' + esc(c.known.facts) + ' ' + esc(c.known.found) + '</div>' +
      '<p class="question" style="margin:.4rem 0 0">' + esc(c.question) + '</p>' + (first ? tipboxHTML() : '') + '</div>' +
      '<div class="mf"><button class="btn ghost" data-act="howto">' + ic('help') + esc(tr('howto')) + '</button><button class="btn gold" data-act="start">' + ic('play') + esc(tr('intro_start')) + '</button></div></div>');
  }
  function showAccuse() {
    var c = ui.c, a = ui.accuse;
    function group(label, key, items) {
      var h = '<div class="agroup"><div class="kicker">' + label + '</div><div class="opts">';
      items.forEach(function (it, i) { h += '<button class="opt' + (a[key] === i ? ' on' : '') + '" data-act="pick" data-k="' + key + '" data-i="' + i + '">' + it + '</button>'; });
      return h + '</div></div>';
    }
    var ov = showModal('<div class="modal wide" id="accmodal"><div class="mh"><h2>' + esc(tr('acc_title')) + '</h2><button class="ibtn" data-act="close" aria-label="' + esc(tr('aria_close')) + '">✕</button></div><div class="mb">' +
      '<p class="accuse-q">' + esc(c.question) + '</p>' +
      group(esc(tr('acc_killer')), 'killer', c.suspects.map(function (s, i) { return '<i style="width:.6rem;height:.6rem;border-radius:50%;background:' + SUS_COLORS[i] + '"></i>' + esc(s.short); })) +
      group(esc(tr('acc_room')), 'room', c.map.rooms.map(function (r) { return '<span class="code">' + esc(r.code) + '</span>' + esc(r.name); })) +
      group(esc(tr('acc_hour')), 'hour', c.hours.map(esc)) +
      group(esc(tr('acc_weapon')), 'object', c.objects.map(function (o, i) { return '<span class="onum">' + (i + 1) + '</span>' + esc(o); })) +
      '</div><div class="mf"><span class="verdict-msg" id="vmsg"></span><button class="btn ghost" data-act="close">' + esc(tr('not_yet')) + '</button>' +
      '<button class="btn gold" data-act="doaccuse" id="doacc"' + (Logic.checkAccusation(c, a).complete ? '' : ' disabled') + '>' + ic('target') + esc(tr('accuse')) + '</button></div></div>', { dismiss: true });
    return ov;
  }
  function pick(key, i) {
    ui.accuse[key] = ui.accuse[key] === i ? -1 : i;
    $$('.opt[data-k="' + key + '"]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-i') === ui.accuse[key]); });
    var btn = $('#doacc'); if (btn) btn.disabled = !Logic.checkAccusation(ui.c, ui.accuse).complete;
    var msg = $('#vmsg'); if (msg) msg.textContent = '';
    Sound.play('tap');
  }
  function doAccuse() {
    var c = ui.c, st = ui.st, res = Logic.checkAccusation(c, ui.accuse);
    if (!res.complete) return;
    if (!res.correct) {
      st.wrong += 1;
      st.t += CONFIG.wrongPenalty;
      updateTimerText();
      persist();
      Sound.play('wrong');
      var md = $('#accmodal');
      if (md) { md.classList.remove('shake'); void md.offsetWidth; md.classList.add('shake'); }
      var msg = $('#vmsg'); if (msg) msg.textContent = tr('acc_wrong', { n: CONFIG.wrongPenalty });
      return;
    }
    solve();
  }
  function solve() {
    var c = ui.c, st = ui.st;
    stopTimer();
    st.solved = true;
    st.m = Logic.solutionMarks(c);
    var hints = hintsUsed(st), stars = Logic.stars(hints, st.wrong);
    var prev = save.best[c.id], rec = { t: Math.round(st.t), hints: hints, wrong: st.wrong, stars: stars };
    var newBest = !prev || stars > prev.stars || (stars === prev.stars && rec.t < prev.t);
    if (newBest) save.best[c.id] = rec;
    if (ui.daily && !save.daily[ui.daily]) save.daily[ui.daily] = { id: c.id, t: rec.t, hints: hints, wrong: st.wrong, stars: stars };
    persist(true);
    cgPlay(false);
    cg(function (sdk) { sdk.game.happytime(); });
    Sound.play('win');
    closeModal();
    renderCase();
    showSolved(rec, newBest && !!prev, prev);
  }
  function shareText(rec) {
    var hs = rec.hints === 0 ? tr('sh_zero') : tr(rec.hints === 1 ? 'sh_one' : 'sh_other', { n: rec.hints });
    return CONFIG.title + ' – ' + labelOf(false) + ' ' + (ui.door ? '🎄' : '🧩') + ' ' + hs + ' 🕵️ ' + CONFIG.siteUrl;
  }
  function copyText(txt, done) {
    function fallback() {
      try {
        var ta = doc.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
        doc.body.appendChild(ta); ta.select(); doc.execCommand('copy'); ta.remove(); done();
      } catch (e) { /* no clipboard: nothing to do */ }
    }
    try {
      if (window.navigator.clipboard && window.navigator.clipboard.writeText) window.navigator.clipboard.writeText(txt).then(done, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }
  function doShare() {
    var txt = ui.shareMsg;
    if (!txt) return;
    if (window.navigator.share) { window.navigator.share({ text: txt }).catch(function () { /* cancelled */ }); return; }
    copyText(txt, function () { toast(tr('copied')); });
  }
  function showSolved(rec, improved, prev) {
    var c = ui.c, final = c.walkthrough[c.walkthrough.length - 1].text;
    var next = ui.door ? nextDoor(ui.door) : nextCase(c);
    var streak = ui.daily ? Logic.streak(save.daily, todayKey()) : 0;
    ui.shareMsg = isWeb() ? shareText(rec) : '';
    var conf = '<div class="confetti">';
    var cols = ['#FFD700', '#38BDF8', '#A78BFA', '#F472B6', '#FFFFFF'];
    for (var i = 0; i < 70; i++) {
      conf += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-duration:' + (2.2 + Math.random() * 2.2).toFixed(2) +
        's;animation-delay:' + (Math.random() * 0.6).toFixed(2) + 's;--dx:' + ((Math.random() - 0.5) * 30).toFixed(1) + 'vw;--rot:' + Math.round(Math.random() * 900) + 'deg"></i>';
    }
    conf += '</div>';
    var acts = '<button class="btn ghost" data-act="close">' + esc(tr('review')) + '</button>' +
      (ui.door ? '<button class="btn" data-act="advent">' + ic('gift') + esc(tr('calendar')) + '</button>' : '<button class="btn" data-act="home">' + ic('home') + esc(tr('all_cases')) + '</button>') +
      (ui.shareMsg ? '<button class="btn sky" data-act="share">' + ic('share') + esc(tr('share')) + '</button>' : '') +
      (next ? (ui.door ? '<button class="btn gold" data-act="door" data-n="' + next + '">' + ic('next') + esc(tr('next_door')) + '</button>'
                       : '<button class="btn gold" data-act="open" data-id="' + next.id + '">' + ic('next') + esc(tr('next_case')) + '</button>') : '');
    showModal(conf + '<div class="modal solved"><div class="stamp">' + esc(tr('case_closed')) + '</div>' + starsHTML(rec.stars, 'bigstars') +
      '<p class="verdict">' + esc(final) + '</p><div class="nums"><div><b>' + Logic.fmtTime(rec.t) + '</b><span>' + esc(tr('time')) + '</span></div><div><b>' + rec.hints + '</b><span>' + esc(tr('hints')) + '</span></div>' +
      '<div><b>' + rec.wrong + '</b><span>' + esc(tr('wrong_guesses')) + '</span></div></div>' +
      '<div class="best">' + esc(ui.daily ? (streak > 1 ? tr('streak_days', { n: streak }) : tr('daily_done')) : improved ? tr('new_best') :
        (prev ? tr('best_t', { t: Logic.fmtTime(prev.t) }) : tr('closed_of', { n: solvedIds().length, m: CASES.length }))) + '</div>' +
      '<div class="acts">' + acts + '</div>' + bookPanelHTML() + '</div>', { cls: 'solved-ov' });
  }
  function nextCase(c) {
    var i = CASES.indexOf(c);
    for (var k = 1; k <= CASES.length; k++) { var x = CASES[(i + k) % CASES.length]; if (!save.best[x.id]) return x; }
    return CASES[(i + 1) % CASES.length];
  }
  function replay() {
    confirmBox(tr('replay_q'), tr('replay_text'), tr('play_again'), function () {
      var c = ui.c;
      save.states[ui.key] = { id: c.id, m: Logic.emptyMarks(c), clues: [], hints: [], wrong: 0, t: 0, solved: false, started: true };
      ui.st = save.states[ui.key];
      ui.undo = []; ui.accuse = { killer: -1, room: -1, hour: -1, object: -1 };
      ui.ptab = 'solve';
      persist();
      renderCase();
      startPlay();
    });
  }
  var toastTimer = null;
  function toast(msg) {
    var old = $('.toast'); if (old) old.remove();
    var t = doc.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    app.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 2700);
  }

  // =================================================================================================== events
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || !app.contains(el)) return;
    var act = el.getAttribute('data-act'), d = function (k) { return el.getAttribute('data-' + k); };
    switch (act) {
      case 'pm': mark('p', +d('s'), { t: +d('t'), r: +d('r') }); break;
      case 'om': mark('o', +d('s'), { o: +d('o') }); break;
      case 'clue': toggleClue(+d('i')); break;
      case 'room': setSpot(+d('r')); break;
      case 'open': openCase(d('id')); break;
      case 'daily': { var tk = todayKey(); openCase(dailyCase(tk).id, tk); break; }
      case 'home': if (ui.screen === 'case' && ui.fromAdvent) renderAdvent(); else renderHome(); break;
      case 'advent': renderAdvent(); break;
      case 'door': openDoor(+d('n')); break;
      case 'share': doShare(); break;
      case 'lang': setLang(d('l')); save.lang = lang; persist(); if (ui.screen === 'advent') renderAdvent(); else renderHome(); break;
      case 'level': save.level = d('l'); persist(); renderHome(); break;
      case 'howto': showHowTo(); break;
      case 'mute': save.muted = !save.muted; persist(); el.innerHTML = ic(save.muted ? 'mute' : 'sound'); if (!save.muted) Sound.play('circle'); break;
      case 'close': dismissModal(); break;
      case 'start': save.seenIntro = true; closeModal(); ui.ptab = 'solve'; setTab('ptab', 'solve'); startPlay(); break;
      case 'hint': hint(); break;
      case 'fillhint': fillHint(+d('i')); break;
      case 'hprev': ui.hintView = clamp((ui.hintView == null ? ui.st.hints.length - 1 : ui.hintView) - 1, 0, ui.st.hints.length - 1); refreshHintBar(); break;
      case 'hnext': ui.hintView = (ui.hintView == null ? ui.st.hints.length - 1 : ui.hintView) + 1; if (ui.hintView >= ui.st.hints.length - 1) ui.hintView = null; refreshHintBar(); break;
      case 'hclose': ui.hintHidden = true; refreshHintBar(); break;
      case 'casefile': showCaseFile(); break;
      case 'accuse': showAccuse(); break;
      case 'pick': pick(d('k'), +d('i')); break;
      case 'doaccuse': doAccuse(); break;
      case 'undo': undo(); break;
      case 'clear': clearGrid(); break;
      case 'replay': replay(); break;
      case 'ltab': setTab('ltab', d('v')); break;
      case 'ptab': setTab('ptab', d('v')); break;
      case 'drawer':
        if (ui.mode === 'P') { ui.drawerMin = !ui.drawerMin; var cs = $('#cs'); if (cs) cs.classList.toggle('drawer-min', ui.drawerMin); }
        break;
    }
  });
  app.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var changed = applyLayout();
      if (ui.screen === 'case') {
        if (changed) { renderCase(); } else { renderMap(); }
      }
    }, 120);
  });
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) { if (ui.screen === 'case') { stopTimer(); persist(true); } }
    else if (ui.screen === 'case' && ui.st && ui.st.started && !ui.st.solved) startTimer();
  });
  window.addEventListener('pagehide', function () { if (ui.screen === 'case') stopTimer(); persist(true); });

  // =================================================================================================== boot
  function loadCases() {
    if (window.ROOM_HOUR_CASES) return Promise.resolve(window.ROOM_HOUR_CASES);
    return fetch('cases.json').then(function (r) { return r.json(); });
  }
  function boot() {
    doc.title = CONFIG.title;
    applyLayout();
    loadGM();
    loadCrazy().then(function () {
      cg(function (sdk) { sdk.game.loadingStart(); });
      loadSave();
      var q = /[?&]lang=(en|de|fr)(&|$)/.exec(window.location.search);
      setLang(q ? q[1] : (LANGS.indexOf(save.lang) >= 0 ? save.lang : detectLang()));
      return loadCases();
    }).then(function (data) {
      RAW = data.cases;
      buildCases();
      renderHome();
      cg(function (sdk) { sdk.game.loadingStop(); });
    }).catch(function (err) {
      app.innerHTML = '<div class="boot"><div><div class="logo">' + esc(CONFIG.title) + '</div><p>' + esc(tr('load_err')) + '</p></div></div>';
      if (window.console) console.error(err);
    });
  }

  // small API for automated screenshots and QA (no effect on normal play)
  window.RoomHour = {
    config: CONFIG,
    open: function (id) { openCase(id); },
    start: function () { if (ui.modal) closeModal(); save.seenIntro = true; ui.ptab = 'solve'; setTab('ptab', 'solve'); startPlay(); },
    fillSolution: function (fraction) {
      var c = ui.c, sol = Logic.solutionMarks(c), S = c.suspects.length, n = 0, total = S * c.hours.length;
      for (var s = 0; s < S; s++) for (var t = 0; t < c.hours.length; t++) { if (n++ < total * (fraction || 1)) ui.st.m.p[s][t] = sol.p[s][t]; }
      if (!fraction || fraction >= 1) for (s = 0; s < S; s++) ui.st.m.o[s] = sol.o[s];
      refreshAllCells();
    },
    accuse: function (k, r, h, o) { ui.accuse = { killer: k, room: r, hour: h, object: o }; doAccuse(); },
    solveNow: function () { var s = ui.c.solution; ui.accuse = { killer: s.killer, room: s.room, hour: s.hour, object: s.object }; doAccuse(); },
    hint: function () { hint(); },
    strike: function (i) { toggleClue(i); },
    tab: function (which, v) { setTab(which, v); },
    home: function () { renderHome(); },
    advent: function () { renderAdvent(); },
    openDoor: function (n) { openDoor(n); },
    lang: function (l) { if (l) { setLang(l); } return lang; },
    missing: function () { return missing.slice(); },
    isWeb: isWeb,
    cases: function () { return CASES; },
    mode: function () { return ui.mode; },
    logic: Logic
  };

  boot();
})();
