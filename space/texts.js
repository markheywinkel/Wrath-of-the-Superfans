/*
 * Alle Texte des Spiels an einem Ort.
 * Hier einfach die Lorem-Ipsum-Platzhalter ersetzen – am Code muss nichts geändert werden.
 */
window.SPACE_TEXTS = {
  intro: 'Gute Reise!',
  hint: 'Tippe irgendwo hin, um zu fliegen',
  dialogNext: 'Weiter',
  dialogClose: 'Tschüss!',

  /* Figuren aus Capybara Media. Bild = Datei im Ordner img/ */
  characters: {
    quentin: { name: 'Quentin', tier: 'Capybara', img: 'img/quentin.png' },
    gwen: { name: 'Gwen', tier: 'Eichhörnchen', img: 'img/gwen.png' },
    norman: { name: 'Norman', tier: 'Waschbär', img: 'img/norman.png' },
    lizzy: { name: 'Lizzy', tier: 'Echse', img: 'img/lizzy.png' },
    sid: { name: 'Sid', tier: 'Känguru', img: 'img/sid.png' },
    bruno: { name: 'Bruno', tier: 'Koala', img: 'img/bruno.png' },
    ivy: { name: 'Ivy', tier: 'Schildkröte', img: 'img/ivy.png' },
    totoro: { name: 'Totoro', tier: 'Bär', img: 'img/totoro.png' },
    west: { name: 'West', tier: 'Eule', img: 'img/west.png' },
    ursula: { name: 'Ursula', tier: 'Krake', img: 'img/ursula.png' },
  },

  /*
   * Die drei Raumschiffe, die durchs System fliegen.
   * lines: [Sprecher, Text] – beliebig viele Zeilen, Sprecher = Schlüssel aus characters.
   */
  ships: [
    {
      name: 'Lorem-Kreuzer',
      crew: ['quentin', 'gwen'],
      lines: [
        ['quentin', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit!'],
        ['gwen', 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'],
        ['quentin', 'Ut enim ad minim veniam, quis nostrud exercitation.'],
        ['gwen', 'Duis aute irure dolor in reprehenderit. Gute Reise!'],
      ],
    },
    {
      name: 'Ipsum-Fähre',
      crew: ['norman', 'lizzy'],
      lines: [
        ['norman', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'],
        ['lizzy', 'Excepteur sint occaecat cupidatat non proident?'],
        ['norman', 'Sunt in culpa qui officia deserunt mollit anim id est laborum.'],
      ],
    },
    {
      name: 'Dolor-Shuttle',
      crew: ['sid', 'bruno'],
      lines: [
        ['sid', 'Lorem ipsum! Dolor sit amet, consectetur adipiscing elit.'],
        ['bruno', 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur.'],
        ['sid', 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.'],
      ],
    },
  ],

  /* Die beiden Raumstationen */
  stations: {
    inner: {
      kicker: 'Raumstation',
      name: 'Station Lorem',
      crew: ['ivy', 'totoro'],
      lines: [
        ['ivy', 'Lorem ipsum dolor sit amet, willkommen an Bord!'],
        ['totoro', 'Consectetur adipiscing elit, sed do eiusmod tempor.'],
        ['ivy', 'Ut labore et dolore magna aliqua. Bis bald!'],
      ],
    },
    outer: {
      kicker: 'Raumstation',
      name: 'Station Ipsum',
      crew: ['west', 'ursula'],
      lines: [
        ['west', 'Lorem ipsum dolor sit amet, so weit draußen sieht man uns selten.'],
        ['ursula', 'Quis nostrud exercitation ullamco laboris nisi ut aliquip.'],
        ['west', 'Duis aute irure dolor in reprehenderit in voluptate.'],
      ],
    },
  },
  coinsLabel: 'Münzen',

  bodies: {
    sun: {
      kicker: 'Stern',
      name: 'Sol',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      facts: [
        ['Lorem', 'Ipsum dolor'],
        ['Sit amet', 'Consectetur'],
      ],
    },
    ember: {
      kicker: 'Planet I',
      name: 'Ember',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      facts: [
        ['Lorem', 'Ipsum dolor'],
        ['Sit amet', 'Consectetur'],
      ],
    },
    aqua: {
      kicker: 'Planet II',
      name: 'Aqua',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      facts: [
        ['Lorem', 'Ipsum dolor'],
        ['Sit amet', 'Consectetur'],
      ],
    },
    thalassa: {
      kicker: 'Planet III',
      name: 'Thalassa',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      facts: [
        ['Lorem', 'Ipsum dolor'],
        ['Sit amet', 'Consectetur'],
      ],
    },
    gigas: {
      kicker: 'Planet IV · 3 Monde',
      name: 'Gigas',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
      facts: [
        ['Lorem', 'Ipsum dolor'],
        ['Sit amet', 'Consectetur'],
      ],
    },
    glacies: {
      kicker: 'Planet V',
      name: 'Glacies',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
      facts: [
        ['Lorem', 'Ipsum dolor'],
        ['Sit amet', 'Consectetur'],
      ],
    },
  },

  reward: {
    title: 'Lorem ipsum!',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Du hast alle 30 Münzen gefunden. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    continue: 'Weiterfliegen',
    restart: 'Nochmal sammeln',
  },
};
