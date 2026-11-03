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
  player: 'du',
  characters: {
    du: { name: 'Du', tier: 'Astronautin', look: { suit: '#8fd8ff', helmet: true, visor: '#ffd84a' } },
    quentin: { name: 'Quentin', tier: 'Kapitän', look: { suit: '#ff2fa0', helmet: true, visor: '#ffd84a' } },
    norman: { name: 'Norman', tier: 'Navigator', look: { suit: '#ffe81a', helmet: false, skin: '#e8b890', hair: '#6a6a72', hairStyle: 'short' } },
    sie: { name: 'Sie', tier: 'Kommissarin', look: { suit: '#ff2a3a', helmet: false, skin: '#c88a5a', hair: '#ff3fa4', hairStyle: 'mohawk' } },
    ivy: { name: 'Ivy', tier: 'Wissenschaftlerin', look: { suit: '#2aff6a', helmet: false, skin: '#f4d0b0', hair: '#f0e070', hairStyle: 'long' } },
    west: { name: 'West', tier: 'Notar', look: { suit: '#ff3af0', helmet: false, skin: '#6a4028', hair: '#e8e8e8', hairStyle: 'bald' } },
  },

  /*
   * Gegenstände für die Quests. »target« = Planet, zu dem der Gegenstand muss
   * (ignis, aqua, thalassa, gigas, glacies). »deliver« = Dialog bei der Übergabe.
   */
  items: {
    brief: {
      name: 'Liebesbrief', target: 'aqua',
      deliver: [['du', 'Über den grünen Kontinenten von Ayathla gebe ich den Brief ab. Hoffentlich schreibt sie zurück.']],
    },
    aquarium: {
      name: 'Seltener Fisch', target: 'thalassa',
      deliver: [['du', 'Zwischen den Städten von Thalyssa lasse ich den Fisch ins türkisfarbene Meer. Schon ist er verschwunden.']],
    },
    fotobuch: {
      name: 'Fotoalbum', target: 'glacies',
      deliver: [['du', 'In einer Mine auf Cies übergebe ich das Album. Sie blättert lange darin und lächelt.']],
    },
    kaesekuchen: {
      name: 'Leckerer Kuchen', target: 'gigas',
      deliver: [['du', 'Unter einer Kristallkuppel auf Gigas übergebe ich den Kuchen. Er ist noch ganz frisch.']],
    },
    ocarina: {
      name: 'Ocarina der Zeit', target: 'ignis',
      deliver: [['du', 'In einer Station über den Vulkanen von Ignis übergebe ich die Ocarina. Ein leiser Ton klingt durch die Gänge.']],
    },
  },

  /*
   * Die drei Raumschiffe. An Bord spricht jeweils eine Figur (»with«) mit dir. Jedes vergibt eine Quest:
   * offer = beim ersten Treffen (Auftrag), waiting = Auftrag läuft noch, thanks = erledigt.
   */
  ships: [
    {
      name: 'Handelskreuzer Normandy',
      with: 'quentin',
      quest: 'brief',
      offer: [
        ['quentin', 'Ahoi! Gut, dass ich dich treffe. Die Normandy hat noch drei Wochen Fracht vor sich.'],
        ['quentin', 'Auf Ayathla wartet jemand auf Nachricht von mir. Bringst du ihr diesen Brief?'],
        ['du', 'Gern. Ich halte ihn gut fest.'],
      ],
      waiting: [['quentin', 'Ayathla ist der Planet mit den weiten grünen Kontinenten. Du kannst ihn nicht verfehlen.']],
      thanks: [['quentin', 'Sie hat geantwortet! Danke dir. Ich zähle die Tage bis zum nächsten Landgang.']],
    },
    {
      name: 'Fährschiff Nostromo',
      with: 'norman',
      quest: 'aquarium',
      offer: [
        ['norman', 'Hallo! Ich habe einen ungewöhnlichen Passagier an Bord.'],
        ['norman', 'Einen seltenen Fisch aus den Meeren von Thalyssa. Er ist bei einem Händler gelandet und gehört zurück nach Hause.'],
        ['du', 'Ich bringe ihn heim.'],
      ],
      waiting: [['norman', 'Flieg ruhig und gleichmäßig. Er mag keine Wellen im Becken.']],
      thanks: [['norman', 'Wieder zu Hause. Danke, dass du das übernommen hast.']],
    },
    {
      name: 'Polizeifregatte Condor',
      with: 'sie',
      quest: 'fotobuch',
      offer: [
        ['sie', 'Guten Tag. Keine Sorge, nur eine Fundsache.'],
        ['sie', 'Dieses Fotoalbum wurde bei uns abgegeben. Es gehört einer Bergarbeiterin auf Cies und zeigt Bilder aus ihrer Schulzeit.'],
        ['du', 'Ich bringe es ihr.'],
      ],
      waiting: [['sie', 'Cies liegt ganz außen. Zieh dich warm an.']],
      thanks: [['sie', 'Fall abgeschlossen. So mag ich das. Danke dir.']],
    },
  ],

  /* Die beiden Raumstationen, ebenfalls mit je einer Figur (»with«) und einer Quest */
  stations: {
    inner: {
      name: 'Forschungsstation Genesis',
      with: 'ivy',
      quest: 'kaesekuchen',
      offer: [
        ['ivy', 'Willkommen auf Genesis! Du kommst genau richtig.'],
        ['ivy', 'Mein Bruder lebt auf Gigas unter den Kristallkuppeln und hat heute Geburtstag. Bringst du ihm diesen Kuchen?'],
        ['du', 'Gern. Ich fliege vorsichtig.'],
      ],
      waiting: [['ivy', 'Und nicht unterwegs naschen!']],
      thanks: [['ivy', 'Er hat mir geschrieben, der Kuchen war ein Traum. Danke!']],
    },
    outer: {
      name: 'Handelsposten Orion',
      with: 'west',
      quest: 'ocarina',
      offer: [
        ['west', 'Willkommen auf Orion. Ich habe eine Übergabe zu beurkunden.'],
        ['west', 'Die Ocarina der Zeit, ein seltenes Relikt aus einer fernen Galaxis. Sie wurde einer Forscherin auf Ignis vermacht.'],
        ['du', 'Ich bringe sie sicher hin.'],
      ],
      waiting: [['west', 'Ignis ist der heiße Planet nah an der Sonne. Bleib über den Wolken.']],
      thanks: [['west', 'Die Übergabe ist beurkundet. Vielen Dank für deine Hilfe.']],
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
      kicker: '',
      name: 'Sol',
      body: 'Die orangefarbene Sonne unseres Systems. Hell und warm, Quell des Lebens.',
    },
    ignis: {
      kicker: 'Planet I',
      name: 'Ignis',
      body: 'Unter den wirbelnden Wolkenbändern liegt eine ungastliche Vulkanlandschaft.',
    },
    aqua: {
      kicker: 'Planet II',
      name: 'Ayathla',
      body: 'Auf den weiten grünen Kontinenten liegt die Wiege unserer Zivilisation.',
    },
    thalassa: {
      kicker: 'Planet III',
      name: 'Thalyssa',
      body: 'Millionenstädte überziehen den Planeten bis zu den türkisfarbenen Meeren.',
    },
    gigas: {
      kicker: 'Planet IV',
      name: 'Gigas',
      body: 'Auf dem Gasriesen lebt unser Volk unter kristallenen Kuppeln. Seine Monde sind durchzogen von Minen.',
    },
    glacies: {
      kicker: 'Planet V',
      name: 'Cies',
      body: 'Auf dem Eisplanet werden kostbare Minerale abgebaut.',
    },
  },
};
