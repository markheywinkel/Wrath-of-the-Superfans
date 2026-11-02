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

  /*
   * Spielfigur und Figuren: Astronautinnen und Astronauten, im Dialog als grobe Pixel-Figuren.
   * look: suit = Anzugfarbe, helmet = mit Helm (true/false), visor = Farbe des Visiers,
   *       skin = Hautfarbe, hair = Haarfarbe, hairStyle = short | long | bun | mohawk | bald
   */
  player: 'gwen',
  characters: {
    gwen: { name: 'Gwen', tier: 'Astronautin', look: { suit: '#ff6a1a', helmet: false, skin: '#f1c7a0', hair: '#c8461a', hairStyle: 'bun' } },
    quentin: { name: 'Quentin', tier: 'Kapitän', look: { suit: '#ff2fa0', helmet: true, visor: '#ffd84a' } },
    mia: { name: 'Mia', tier: 'Navigatorin', look: { suit: '#b6ff2a', helmet: false, skin: '#8a5a3a', hair: '#1a1014', hairStyle: 'long' } },
    norman: { name: 'Norman', tier: 'Mechaniker', look: { suit: '#ffe81a', helmet: false, skin: '#e8b890', hair: '#6a6a72', hairStyle: 'short' } },
    lizzy: { name: 'Lizzy', tier: 'Funkerin', look: { suit: '#1ae8ff', helmet: true, visor: '#ff5ad0' } },
    sid: { name: 'Sid', tier: 'Pilot', look: { suit: '#ff2a3a', helmet: false, skin: '#c88a5a', hair: '#ff3fa4', hairStyle: 'mohawk' } },
    bruno: { name: 'Bruno', tier: 'Ingenieur', look: { suit: '#7a3aff', helmet: true, visor: '#3affb0' } },
    ivy: { name: 'Ivy', tier: 'Kommandantin', look: { suit: '#2aff6a', helmet: false, skin: '#f4d0b0', hair: '#f0e070', hairStyle: 'long' } },
    totoro: { name: 'Totoro', tier: 'Koch', look: { suit: '#ff9a1a', helmet: true, visor: '#5ab8ff' } },
    west: { name: 'West', tier: 'Forscher', look: { suit: '#ff3af0', helmet: false, skin: '#6a4028', hair: '#e8e8e8', hairStyle: 'bald' } },
    ursula: { name: 'Ursula', tier: 'Wissenschaftlerin', look: { suit: '#3a8aff', helmet: true, visor: '#ff9a2a' } },
  },

  /*
   * Gegenstände für die Quests. »target« = Planet, zu dem der Gegenstand muss
   * (ignis, aqua, thalassa, gigas, glacies). »deliver« = Dialog bei der Übergabe.
   */
  items: {
    brief: {
      name: 'Liebesbrief', target: 'aqua',
      deliver: [['gwen', 'Lorem ipsum: Der Liebesbrief ist angekommen!']],
    },
    aquarium: {
      name: 'Aquarium mit einem seltenen Fisch', target: 'thalassa',
      deliver: [['gwen', 'Lorem ipsum: Der seltene Fisch hat ein neues Zuhause.']],
    },
    fotobuch: {
      name: 'Altes Fotobuch mit Erinnerungen an die Schulzeit', target: 'glacies',
      deliver: [['gwen', 'Lorem ipsum: Das Fotobuch ist übergeben.']],
    },
    kaesekuchen: {
      name: 'Leckerer Käsekuchen', target: 'gigas',
      deliver: [['gwen', 'Lorem ipsum: Der Käsekuchen ist noch ganz frisch!']],
    },
    ocarina: {
      name: 'Ocarina der Zeit', target: 'ignis',
      deliver: [['gwen', 'Lorem ipsum: Die Ocarina der Zeit ist sicher angekommen.']],
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
        ['quentin', 'Lorem ipsum dolor sit amet, Gwen! Hast du kurz Zeit?'],
        ['mia', 'Consectetur adipiscing elit: Bringst du diesen Liebesbrief nach Aqua?'],
        ['gwen', 'Lorem ipsum, mache ich!'],
      ],
      waiting: [['mia', 'Lorem ipsum – ist der Brief schon auf Aqua?']],
      thanks: [['quentin', 'Lorem ipsum dolor, vielen Dank, Gwen!']],
    },
    {
      name: 'Ipsum-Fähre',
      crew: ['norman', 'lizzy'],
      quest: 'aquarium',
      offer: [
        ['norman', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'],
        ['lizzy', 'Sed do eiusmod: Dieses Aquarium muss nach Thalassa.'],
        ['gwen', 'Lorem ipsum, ich passe gut auf den Fisch auf.'],
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
        ['gwen', 'Lorem ipsum, klar!'],
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
        ['ivy', 'Lorem ipsum dolor sit amet, willkommen an Bord, Gwen!'],
        ['totoro', 'Consectetur adipiscing: Der Käsekuchen muss nach Gigas.'],
        ['gwen', 'Lorem ipsum, ich fliege los.'],
      ],
      waiting: [['totoro', 'Lorem ipsum – nicht unterwegs naschen!']],
      thanks: [['ivy', 'Lorem ipsum, danke, Gwen!']],
    },
    outer: {
      kicker: 'Raumstation',
      name: 'Station Ipsum',
      crew: ['west', 'ursula'],
      quest: 'ocarina',
      offer: [
        ['west', 'Lorem ipsum dolor sit amet, so weit draußen sieht man uns selten.'],
        ['ursula', 'Quis nostrud: Die Ocarina der Zeit stammt aus einer fernen Galaxis. Bring sie nach Ignis.'],
        ['gwen', 'Lorem ipsum, wird erledigt.'],
      ],
      waiting: [['ursula', 'Lorem ipsum – Ignis ist der heiße Planet nah an der Sonne.']],
      thanks: [['west', 'Lorem ipsum, vielen Dank!']],
    },
  },

  /* Badges (oben rechts). Reihenfolge = Anzeige-Reihenfolge */
  badges: {
    meistererkunder: { name: 'Meistererkunder', text: 'Alle 30 Kristalle gesammelt' },
    aufraeumer: { name: 'Aufräumer', text: 'Alle 10 Frachtcontainer geborgen' },
    meisterbote: { name: 'Meisterbote', text: 'Alle Aufträge erledigt' },
    tourist: { name: 'Tourist', text: 'Alle Planeten besucht' },
    amor: { name: 'Amor', text: 'Den Liebesbrief überbracht' },
    weltenbummler: { name: 'Weltenbummler', text: 'Alle Badges gesammelt' },
  },

  /* Meldungen (kleine Einblendungen) */
  toast: {
    badge: 'Neues Badge',
    boost: 'Antrieb verbessert',
    quest: 'Neuer Auftrag',
    delivered: 'Abgeliefert',
  },

  /* großer Text im Bild beim Einsammeln */
  pickup: {
    crystal: 'Kristall',
    container: 'Frachtcontainer',
  },

  /* Belohnungsdialoge */
  rewards: {
    coins: {
      title: 'Meistererkunder!',
      body: 'Lorem ipsum: Du hast alle 30 Kristalle gefunden. Dein Antrieb ist jetzt 20 Prozent schneller.',
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
      button: 'Weiterfliegen',
      restart: 'Neu beginnen',
    },
    continue: 'Weiterfliegen',
  },

  bodies: {
    sun: {
      kicker: 'Stern',
      name: 'Sol',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    ignis: {
      kicker: 'Planet I',
      name: 'Ignis',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    aqua: {
      kicker: 'Planet II',
      name: 'Aqua',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    },
    thalassa: {
      kicker: 'Planet III',
      name: 'Thalassa',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
    gigas: {
      kicker: 'Planet IV · 3 Monde',
      name: 'Gigas',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
    },
    glacies: {
      kicker: 'Planet V',
      name: 'Glacies',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
    },
  },
};
