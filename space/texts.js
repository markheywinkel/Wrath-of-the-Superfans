/*
 * Alle Texte des Spiels an einem Ort.
 * Hier einfach die Lorem-Ipsum-Platzhalter ersetzen – am Code muss nichts geändert werden.
 * Dialogzeilen sind Paare aus [Sprecher, Text]; Sprecher = Schlüssel aus »characters«.
 */
window.SPACE_TEXTS = {
  intro: 'Gute Reise!',
  hint: 'Tippe irgendwo hin, um zu fliegen',
  dialogNext: 'Weiter',
  dialogClose: 'Tschüss!',

  /* Spielfigur und Figuren aus Capybara Media. Bild = Datei im Ordner img/ */
  player: 'ember',
  characters: {
    ember: { name: 'Ember', tier: 'Eichhörnchen', img: 'img/ember.png' },
    quentin: { name: 'Quentin', tier: 'Capybara', img: 'img/quentin.png' },
    mia: { name: 'Mia', tier: 'Reh', img: 'img/mia.png' },
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
   * Gegenstände für die Quests. »target« = Planet, zu dem der Gegenstand muss
   * (ignis, aqua, thalassa, gigas, glacies). »deliver« = Dialog bei der Übergabe.
   */
  items: {
    brief: {
      name: 'Liebesbrief', icon: '💌', target: 'aqua',
      deliver: [['ember', 'Lorem ipsum: Der Liebesbrief ist angekommen!']],
    },
    aquarium: {
      name: 'Aquarium mit einem seltenen Fisch', icon: '🐠', target: 'thalassa',
      deliver: [['ember', 'Lorem ipsum: Der seltene Fisch hat ein neues Zuhause.']],
    },
    fotobuch: {
      name: 'Altes Fotobuch mit Erinnerungen an die Schulzeit', icon: '📔', target: 'glacies',
      deliver: [['ember', 'Lorem ipsum: Das Fotobuch ist übergeben.']],
    },
    kaesekuchen: {
      name: 'Leckerer Käsekuchen', icon: '🍰', target: 'gigas',
      deliver: [['ember', 'Lorem ipsum: Der Käsekuchen ist noch ganz frisch!']],
    },
    ocarina: {
      name: 'Ocarina der Zeit', icon: '🎶', target: 'ignis',
      deliver: [['ember', 'Lorem ipsum: Die Ocarina der Zeit ist sicher angekommen.']],
    },
  },

  /*
   * Die drei Raumschiffe. Jedes vergibt eine Quest:
   * offer = beim ersten Treffen (Auftrag), waiting = Auftrag läuft noch, thanks = erledigt.
   */
  ships: [
    {
      name: 'Lorem-Kreuzer',
      crew: ['quentin', 'mia'],
      quest: 'brief',
      offer: [
        ['quentin', 'Lorem ipsum dolor sit amet, Ember! Hast du kurz Zeit?'],
        ['mia', 'Consectetur adipiscing elit: Bringst du diesen Liebesbrief nach Aqua?'],
        ['ember', 'Lorem ipsum, mache ich!'],
      ],
      waiting: [['mia', 'Lorem ipsum – ist der Brief schon auf Aqua?']],
      thanks: [['quentin', 'Lorem ipsum dolor, vielen Dank, Ember!']],
    },
    {
      name: 'Ipsum-Fähre',
      crew: ['norman', 'lizzy'],
      quest: 'aquarium',
      offer: [
        ['norman', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'],
        ['lizzy', 'Sed do eiusmod: Dieses Aquarium muss nach Thalassa.'],
        ['ember', 'Lorem ipsum, ich passe gut auf den Fisch auf.'],
      ],
      waiting: [['lizzy', 'Lorem ipsum – geht es dem Fisch gut?']],
      thanks: [['norman', 'Lorem ipsum, danke dir!']],
    },
    {
      name: 'Dolor-Shuttle',
      crew: ['sid', 'bruno'],
      quest: 'fotobuch',
      offer: [
        ['sid', 'Lorem ipsum! Dolor sit amet, consectetur adipiscing elit.'],
        ['bruno', 'Nemo enim ipsam: Bringst du das Fotobuch nach Glacies?'],
        ['ember', 'Lorem ipsum, klar!'],
      ],
      waiting: [['bruno', 'Lorem ipsum – Glacies liegt ganz außen.']],
      thanks: [['sid', 'Lorem ipsum, großartig!']],
    },
  ],

  /* Die beiden Raumstationen, ebenfalls mit je einer Quest */
  stations: {
    inner: {
      kicker: 'Raumstation',
      name: 'Station Lorem',
      crew: ['ivy', 'totoro'],
      quest: 'kaesekuchen',
      offer: [
        ['ivy', 'Lorem ipsum dolor sit amet, willkommen an Bord, Ember!'],
        ['totoro', 'Consectetur adipiscing: Der Käsekuchen muss nach Gigas.'],
        ['ember', 'Lorem ipsum, ich fliege los.'],
      ],
      waiting: [['totoro', 'Lorem ipsum – nicht unterwegs naschen!']],
      thanks: [['ivy', 'Lorem ipsum, danke, Ember!']],
    },
    outer: {
      kicker: 'Raumstation',
      name: 'Station Ipsum',
      crew: ['west', 'ursula'],
      quest: 'ocarina',
      offer: [
        ['west', 'Lorem ipsum dolor sit amet, so weit draußen sieht man uns selten.'],
        ['ursula', 'Quis nostrud: Die Ocarina der Zeit stammt aus einer fernen Galaxis. Bring sie nach Ignis.'],
        ['ember', 'Lorem ipsum, wird erledigt.'],
      ],
      waiting: [['ursula', 'Lorem ipsum – Ignis ist der heiße Planet nah an der Sonne.']],
      thanks: [['west', 'Lorem ipsum, vielen Dank!']],
    },
  },

  /* Badges (oben rechts). Reihenfolge = Anzeige-Reihenfolge */
  badges: {
    meistererkunder: { name: 'Meistererkunder', icon: '🧭', text: 'Alle 30 Münzen gesammelt' },
    aufraeumer: { name: 'Aufräumer', icon: '📦', text: 'Alle 10 Frachtcontainer geborgen' },
    meisterbote: { name: 'Meisterbote', icon: '🎒', text: 'Alle Aufträge erledigt' },
    tourist: { name: 'Tourist', icon: '📸', text: 'Alle Planeten besucht' },
    amor: { name: 'Amor', icon: '💘', text: 'Den Liebesbrief überbracht' },
    weltenbummler: { name: 'Weltenbummler', icon: '🌌', text: 'Alle Badges gesammelt' },
  },

  /* Meldungen (kleine Einblendungen) */
  toast: {
    badge: 'Neues Badge',
    boost: 'Antrieb verbessert',
    quest: 'Neuer Auftrag',
    delivered: 'Abgeliefert',
    container: 'Frachtcontainer',
  },

  /* Belohnungsdialoge */
  rewards: {
    coins: {
      title: 'Meistererkunder!',
      body: 'Lorem ipsum: Du hast alle 30 Münzen gefunden. Dein Antrieb ist jetzt 20 Prozent schneller.',
    },
    containers: {
      title: 'Aufräumer!',
      body: 'Lorem ipsum: Du hast alle 10 Frachtcontainer geborgen. Dein Antrieb ist jetzt 10 Prozent schneller.',
    },
    quests: {
      title: 'Meisterbote!',
      body: 'Lorem ipsum: Du hast alle Aufträge erledigt. Dein Antrieb ist jetzt 20 Prozent schneller.',
    },
    final: {
      title: 'Glückwunsch!',
      body: 'Du hast die gesamte Galaxis bereist.',
      button: 'Neu beginnen',
    },
    continue: 'Weiterfliegen',
  },

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
    ignis: {
      kicker: 'Planet I',
      name: 'Ignis',
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
};
