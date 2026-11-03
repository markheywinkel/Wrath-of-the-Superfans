/*
 * Alle Texte des Spiels an einem Ort.
 * Hier einfach die Lorem-Ipsum-Platzhalter ersetzen – am Code muss nichts geändert werden.
 * Dialogzeilen sind Paare aus [Sprecher, Text]; Sprecher = Schlüssel aus »characters«.
 */
window.SPACE_TEXTS = {
  intro: 'Gute Reise!',
  /* Kapitel: erscheinen groß im Bild (Kapitel 2 und 3 mit kurzer Zwischensequenz) */
  chapters: [
    { num: 'Kapitel 1', title: 'Gute Reise!' },
    { num: 'Kapitel 2', title: 'Die Kometen kommen' },
    { num: 'Kapitel 3', title: 'Das Wurmloch' },
  ],
  /* Warnung am äußeren Rand des Nebels und des Urlaubssystems */
  warnEdge: 'Du fliegst zu weit hinaus, kehr um!',
  dialogNext: 'Weiter',
  dialogClose: 'Tschüss!',

  /*
   * Spielfigur und Figuren: Astronautinnen und Astronauten, im Dialog als grobe Pixel-Figuren.
   * look: suit = Anzugfarbe, helmet = mit Helm (true/false), visor = Farbe des Visiers,
   *       skin = Hautfarbe, hair = Haarfarbe, hairStyle = short | long | bun | mohawk | bald,
   *       ghost = true zeichnet eine körperlose, leuchtende Gestalt
   */
  player: 'du',
  characters: {
    du: { name: 'Du', tier: 'Astronautin', look: { suit: '#8fd8ff', helmet: true, visor: '#ffd84a' } },
    quentin: { name: 'Quentin', tier: 'Kapitän', look: { suit: '#ff2fa0', helmet: true, visor: '#ffd84a' } },
    norman: { name: 'Norman', tier: 'Navigator', look: { suit: '#ffe81a', helmet: false, skin: '#e8b890', hair: '#6a6a72', hairStyle: 'short' } },
    adele: { name: 'Adele', tier: 'Kommissarin', look: { suit: '#ff2a3a', helmet: false, skin: '#c88a5a', hair: '#ff3fa4', hairStyle: 'mohawk' } },
    ivy: { name: 'Ivy', tier: 'Wissenschaftlerin', look: { suit: '#2aff6a', helmet: false, skin: '#f4d0b0', hair: '#f0e070', hairStyle: 'long' } },
    balthasar: { name: 'Balthasar', tier: 'Kuriositätenhändler', look: { suit: '#ffb31a', helmet: false, skin: '#d8a070', hair: '#5a3aa8', hairStyle: 'long' } },
    entitaet: { name: 'Körperlose Entität', tier: '', look: { ghost: true } },
    gwynn: { name: 'Gwynn', tier: 'Forscherin', look: { suit: '#3affd0', helmet: false, skin: '#f0c8a8', hair: '#f4f4ff', hairStyle: 'bun' } },
    reisender: { name: 'Einsamer Reisender', tier: '', look: { suit: '#9a9aac', helmet: true, visor: '#ff7a3a' } },
    justus: { name: 'Justus', tier: 'Reisender', look: { suit: '#9a9aac', helmet: false, skin: '#c89070', hair: '#3a2a1a', hairStyle: 'short' } },
    marisol: { name: 'Marisol', tier: 'Kreuzfahrtdirektorin', look: { suit: '#ff5ad0', helmet: false, skin: '#c88a5a', hair: '#1a1014', hairStyle: 'long' } },
    pio: { name: 'Pio', tier: 'Bademeister', look: { suit: '#3ad0ff', helmet: false, skin: '#f0c8a0', hair: '#f0e070', hairStyle: 'short' } },
    ambrosius: { name: 'Ambrosius', tier: 'Passagier', look: { suit: '#ffd84a', helmet: false, skin: '#e8b890', hair: '#e8e8e8', hairStyle: 'bald' } },
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
    // --- zweite Runde (beginnt, sobald die ersten fünf Aufträge erledigt sind)
    kraeuter: {
      name: 'Sieben Kräuter', target: 'gigas',
      deliver: [['du', 'Unter den Kuppeln von Gigas übergebe ich die sieben Kräuter. Bald duftet es in allen Küchen.']],
    },
    perlenkette: {
      name: 'Perlenkette', target: 'aqua',
      deliver: [['du', 'Auf Ayathla gebe ich die Perlenkette zurück. Die Besitzerin legt sie sofort an.']],
    },
    koffer: {
      name: 'Geheimnisvoller Koffer', target: 'glacies',
      deliver: [['du', 'Im Archiv tief im Eis von Cies stelle ich den Koffer ab. Er tickt leise. Oder bilde ich mir das nur ein?']],
    },
    mineral: {
      name: 'Kostbares Mineral', target: 'thalassa',
      deliver: [['du', 'In einer Werkstatt hoch über den Meeren von Thalyssa übergebe ich das Mineral. Es glitzert im Licht der Stadt.']],
    },
    // --- Kapitel 3 (hinter dem Wurmloch)
    cocktail: {
      name: 'Cocktailrezept', target: 'qratos',
      deliver: [['du', 'In der Lagunenbar von Qratos übergebe ich das Rezept. Der erste Sternenstaub-Cocktail schimmert schon im Glas.']],
    },
    champagner: {
      name: 'Edle Champagnerflasche', target: 'monos',
      deliver: [['du', 'Im Bungalow auf Monos knallen die Korken. Das Brautpaar stößt auf die Galaxis an.']],
    },
    ring: {
      name: 'Verlobungsring', target: 'stypos',
      deliver: [['du', 'Am Strand von Stypos verstecke ich den Ring im Sand. Die beiden Sonnen gehen gerade unter.']],
    },
    koffer2: {
      name: 'Geheimnisvoller Koffer', target: 'glacies',
      deliver: [['du', 'Im Archiv auf Cies stelle ich den zweiten Koffer neben den ersten. Jetzt ticken beide im Takt.']],
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
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'quentin',
      quest: 'brief',
      offer: [
        ['quentin', 'Ahoi! Gut, dass ich dich treffe. Die Normandy hat noch drei Wochen Fracht vor sich.'],
        ['quentin', 'Auf Ayathla wartet jemand auf Nachricht von mir. Bringst du ihr diesen Brief?'],
        ['du', 'Gern. Ich halte ihn gut fest.'],
      ],
      waiting: [['quentin', 'Ayathla ist der Planet mit den weiten grünen Kontinenten. Du kannst ihn nicht verfehlen.']],
      thanks: [['quentin', 'Sie hat geantwortet! Danke dir. Ich zähle die Tage bis zum nächsten Landgang.']],
      // zweite Runde
      round2: {
        quest: 'kraeuter',
        offer: [
          ['quentin', 'Da bist du ja wieder! Der Brief hat Wunder gewirkt.'],
          ['quentin', 'Die Köche unter den Kuppeln von Gigas warten auf sieben Kräuter aus meinem Laderaum. Nimmst du sie mit?'],
          ['du', 'Mache ich. Es duftet herrlich.'],
        ],
        waiting: [['quentin', 'Sieben Kräuter, keins weniger. Die Köche zählen nach.']],
        thanks: [['quentin', 'Ich habe gehört, es gab ein Festessen. Danke dir!']],
      },
    },
    {
      name: 'Fährschiff Nostromo',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'norman',
      quest: 'aquarium',
      offer: [
        ['norman', 'Hallo! Ich habe einen ungewöhnlichen Passagier an Bord.'],
        ['norman', 'Einen seltenen Fisch aus den Meeren von Thalyssa. Er ist bei einem Händler gelandet und gehört zurück nach Hause.'],
        ['du', 'Ich bringe ihn heim.'],
      ],
      waiting: [['norman', 'Flieg ruhig und gleichmäßig. Er mag keine Wellen im Becken.']],
      thanks: [['norman', 'Wieder zu Hause. Danke, dass du das übernommen hast.']],
      round2: {
        quest: 'perlenkette',
        offer: [
          ['norman', 'Schön, dich zu sehen. Eine Passagierin hat bei mir etwas liegen lassen.'],
          ['norman', 'Eine Perlenkette aus den Meeren von Thalyssa. Die Besitzerin wohnt auf Ayathla. Bringst du sie ihr?'],
          ['du', 'Natürlich.'],
        ],
        waiting: [['norman', 'Die Kette ist ein Erbstück. Pass gut auf sie auf.']],
        thanks: [['norman', 'Sie hat mir eine Karte geschickt. Danke!']],
      },
    },
    {
      name: 'Polizeifregatte Condor',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'adele',
      quest: 'fotobuch',
      offer: [
        ['adele', 'Guten Tag. Keine Sorge, nur eine Fundsache.'],
        ['adele', 'Dieses Fotoalbum wurde bei uns abgegeben. Es gehört einer Bergarbeiterin auf Cies und zeigt Bilder aus ihrer Schulzeit.'],
        ['du', 'Ich bringe es ihr.'],
      ],
      waiting: [['adele', 'Cies liegt ganz außen. Zieh dich warm an.']],
      thanks: [['adele', 'Fall abgeschlossen. So mag ich das. Danke dir.']],
      round2: {
        quest: 'koffer',
        offer: [
          ['adele', 'Da bist du ja. Ich habe wieder etwas für dich.'],
          ['adele', 'Einen geheimnisvollen Koffer, fest verschlossen. Er soll ins Archiv auf Cies. Frag lieber nicht, was drin ist.'],
          ['du', 'Ich frage nicht.'],
        ],
        waiting: [['adele', 'Und bitte nicht schütteln.']],
        thanks: [['adele', 'Der Koffer ist sicher verwahrt. Gute Arbeit.']],
      },
    },
  ],

  /* Die beiden Raumstationen, ebenfalls mit je einer Figur (»with«) und einer Quest */
  stations: {
    inner: {
      name: 'Forschungsstation Genesis',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'ivy',
      quest: 'kaesekuchen',
      offer: [
        ['ivy', 'Willkommen auf Genesis! Du kommst genau richtig.'],
        ['ivy', 'Mein Bruder lebt auf Gigas unter den Kristallkuppeln und hat heute Geburtstag. Bringst du ihm diesen Kuchen?'],
        ['du', 'Gern. Ich fliege vorsichtig.'],
      ],
      waiting: [['ivy', 'Und nicht unterwegs naschen!']],
      thanks: [['ivy', 'Er hat mir geschrieben, der Kuchen war ein Traum. Danke!']],
      // zweite Runde: Kometen fangen (keine Lieferung)
      round2: {
        quest: 'kometen',
        offer: [
          ['ivy', 'Gut, dass du da bist! Unsere Instrumente zeigen fünf Kometen im System.'],
          ['ivy', 'Sie sind schnell, schneller als dein Schiff. Kannst du alle fünf für unsere Forschung einfangen?'],
          ['du', 'Ich versuche es.'],
        ],
        waiting: [['ivy', 'Mit jedem Erfolg wird dein Antrieb schneller. Dann holst du sie ein.']],
        thanks: [['ivy', 'Fünf Kometen! Die Proben werden uns jahrelang beschäftigen. Danke!']],
      },
    },
    outer: {
      name: 'Handelsposten Orion',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'west',
      quest: 'ocarina',
      offer: [
        ['west', 'Willkommen auf Orion. Ich habe eine Übergabe zu beurkunden.'],
        ['west', 'Die Ocarina der Zeit, ein seltenes Relikt aus einer fernen Galaxis. Sie wurde einer Forscherin auf Ignis vermacht.'],
        ['du', 'Ich bringe sie sicher hin.'],
      ],
      waiting: [['west', 'Ignis ist der heiße Planet nah an der Sonne. Bleib über den Wolken.']],
      thanks: [['west', 'Die Übergabe ist beurkundet. Vielen Dank für deine Hilfe.']],
      round2: {
        quest: 'mineral',
        offer: [
          ['west', 'Willkommen zurück. Ein Kaufvertrag ist unterzeichnet.'],
          ['west', 'Dieses kostbare Mineral aus den Minen von Cies gehört nun einem Juwelier auf Thalyssa. Lieferst du es aus?'],
          ['du', 'Gern.'],
        ],
        waiting: [['west', 'Laut Vertrag muss es unversehrt ankommen.']],
        thanks: [['west', 'Lieferung bestätigt. Alles hat seine Ordnung.']],
      },
    },
  },

  /*
   * Kuriositätenhändler: taucht in der zweiten Runde auf und nimmt die fünf Relikte entgegen.
   * {n} = Zahl der übergebenen Relikte, {rest} = Zahl der fehlenden.
   */
  dealer: {
    name: 'Händlerschiff Wunderkammer',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
    with: 'balthasar',
    intro: [
      ['balthasar', 'Willkommen in der Wunderkammer! Ich sammle Kuriositäten aus allen Ecken des Alls.'],
      ['balthasar', 'In diesem System sind fünf seltsame Relikte aufgetaucht. Bringst du sie mir? Ich möchte sie untersuchen.'],
      ['du', 'Ich halte die Augen offen.'],
    ],
    handIn: [['balthasar', 'Ah, wunderbar! Damit habe ich {n} von 5 Relikten.']],
    missing: [['balthasar', 'Es fehlen noch {rest} Relikte. Sie schimmern leise im Dunkeln.']],
    complete: [
      ['balthasar', 'Das ist das letzte! Lass mich kurz nachsehen …'],
      ['balthasar', 'Unglaublich. Die Relikte stammen von einer längst untergegangenen Zivilisation. Sie war lange vor uns in diesem System.'],
      ['du', 'Dann sind wir nicht die Ersten hier.'],
      ['balthasar', 'Nein. Danke, dass du ihre Spuren gefunden hast.'],
    ],
    thanks: [['balthasar', 'Ich studiere die Relikte noch immer. Jeden Tag entdecke ich etwas Neues.']],
  },

  /*
   * Neues Gebiet oben rechts außerhalb des Sonnensystems (grüner Nebel): Raumschiffwrack und Dunkler Planet.
   * {rest} = Zahl der noch fehlenden Schiffsteile.
   */
  zone: {
    entity: {
      with: 'entitaet',
      offer: [
        ['entitaet', '… hörst du mich? Ich bin hier, zwischen den Trümmern.'],
        ['entitaet', 'Ich habe keinen Körper mehr. Nur das blaue Elixier aus dem Eis von Cies kann mir helfen. Bringst du es mir?'],
        ['du', 'Ich fliege nach Cies.'],
      ],
      waiting: [['entitaet', 'Das Elixier … aus dem Eis von Cies … bitte beeil dich.']],
      complete: [
        ['entitaet', 'Du hast es gebracht … ich spüre es schon.'],
        ['du', 'Was passiert mit dir?'],
        ['gwynn', 'Ich … habe wieder Hände! Ich bin Gwynn, Forscherin.'],
        ['gwynn', 'Ich habe dieses Wrack untersucht. Eine fremde Technologie hat mich in Licht verwandelt. Du hast mich gerettet. Danke!'],
      ],
    },
    elixir: {
      name: 'Blaues Elixier',
      from: 'glacies',
      pickup: [['du', 'Tief im Eis von Cies leuchtet eine Phiole mit blauem Elixier. Ich nehme sie vorsichtig mit.']],
    },
    traveler: {
      with: 'reisender',
      offer: [
        ['reisender', 'Ein Besucher? Hier draußen kommt sonst niemand vorbei.'],
        ['reisender', 'Ein Sturm hat mein Raumschiff zerlegt. Fünf Teile treiben irgendwo in diesem Gebiet. Sammelst du sie für mich ein?'],
        ['du', 'Ich halte Ausschau.'],
      ],
      waiting: [['reisender', 'Es fehlen noch {rest} Teile. Sie müssen hier irgendwo treiben.']],
      complete: [
        ['reisender', 'Alle fünf Teile! Jetzt kann ich mein Schiff reparieren.'],
        ['justus', 'Ich habe mich noch gar nicht vorgestellt: Ich bin Justus.'],
        ['justus', 'Danke, dass du mir geholfen hast. Wir sehen uns da draußen!'],
      ],
    },
    partsName: 'Schiffsteile',
    // Gwynn und Justus fliegen danach selbst durch das Gebiet
    gwynn: {
      name: 'Forschungsschiff Lumen',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'gwynn',
      talk: [['gwynn', 'Ich fliege wieder selbst. Ohne dich wäre ich immer noch ein Schatten zwischen den Trümmern. Danke!']],
    },
    justus: {
      name: 'Reiseschiff Wanderer',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'justus',
      talk: [['justus', 'Mein Schiff fliegt wieder wie neu. Danke für deine Hilfe!']],
    },
  },

  /*
   * Kapitel 3: Was die Figuren im alten Gebiet über das Wurmloch sagen.
   * Schlüssel = Figur; »default« gilt für alle anderen.
   */
  wormholeTalk: {
    quentin: 'Hast du schon dieses neue Wurmloch gesehen? Ich frage mich, was wohl dahinter liegt.',
    norman: 'Das neue Wurmloch macht mir Angst. Ich halte mich lieber davon fern.',
    ivy: 'Wurmlöcher sind völlig ungefährliche Phänomene. Wenn ich die Zeit hätte, würde ich sofort hindurchfliegen.',
    default: 'Ein Wurmloch ist aufgetaucht! Bestimmt werden bald die mutigsten Abenteurer hindurchfliegen!',
  },

  /*
   * Kapitel 3: Urlaubssystem hinter dem Wurmloch.
   * Die Figuren begrüßen dich jedes Mal mit einem dieser Sätze.
   */
  resort: {
    greetings: [
      'Oh, ein Bote!',
      'Hallo, Bote! Schön, dass du da bist!',
      'Was wäre die Galaxis ohne euch Boten?',
    ],
    wormhole: 'Wurmloch',
    opened: 'Ein Wurmloch hat sich geöffnet',
    ships: [
      {
        name: 'Kreuzfahrtschiff Vida',
        desc: 'Siebzig Decks mit einem großen Unterhaltungsangebot.',
        with: 'marisol',
        quest: 'cocktail',
        offer: [
          ['marisol', 'Unser Barchef hat sein berühmtes Sternenstaub-Rezept hier an Bord liegen lassen.'],
          ['marisol', 'Die Lagunenbar auf Qratos wartet darauf. Bringst du es hin?'],
          ['du', 'Mache ich.'],
        ],
        waiting: [['marisol', 'Die Gäste auf Qratos werden schon durstig.']],
        thanks: [['marisol', 'Auf Qratos wird wieder gemixt. Danke dir!']],
        // danach ein zweiter Auftrag
        next: {
          quest: 'koffer2',
          offer: [
            ['marisol', 'Ein Gast hat diesen geheimnisvollen Koffer an Bord vergessen.'],
            ['marisol', 'Er gehört ins Archiv auf Cies, auf der anderen Seite des Wurmlochs.'],
            ['du', 'Schon wieder ein Koffer …'],
          ],
          waiting: [['marisol', 'Durch das Wurmloch und dann ganz nach außen, nach Cies.']],
          thanks: [['marisol', 'Der Koffer ist angekommen? Wunderbar, danke!']],
        },
      },
      {
        name: 'Kreuzfahrtschiff Zida',
        desc: 'Die Poollandschaft über fünf Decks ist einzigartig in der Galaxis.',
        with: 'pio',
        quest: 'champagner',
        offer: [
          ['pio', 'Auf Monos feiert ein Brautpaar in seinem Bungalow.'],
          ['pio', 'Ihr Champagner ist hier an Bord geblieben. Fliegst du ihn hin, bevor er warm wird?'],
          ['du', 'Ich beeile mich.'],
        ],
        waiting: [['pio', 'Monos ist der Planet mit den Bungalows. Schnell, die Feier läuft schon!']],
        thanks: [['pio', 'Das Brautpaar lässt dich grüßen. Danke!']],
      },
      {
        name: 'Kreuzfahrtschiff Yipa',
        desc: 'Besser entspannen kann man kaum, sofern man das nötige Kleingeld hat.',
        with: 'ambrosius',
        quest: 'ring',
        offer: [
          ['ambrosius', 'Ich möchte meiner Liebsten am Strand von Stypos einen Antrag machen.'],
          ['ambrosius', 'Fliegst du den Ring voraus und versteckst ihn dort im Sand?'],
          ['du', 'Ehrensache.'],
        ],
        waiting: [['ambrosius', 'Bitte vorsichtig, der Ring war nicht ganz billig.']],
        thanks: [['ambrosius', 'Sie hat Ja gesagt! Ich danke dir von Herzen.']],
      },
    ],
  },

  /* Badges (oben rechts). Reihenfolge = Anzeige-Reihenfolge */
  badges: {
    meistererkunder: { name: 'Meistererkunder', text: 'Alle 30 Kristalle gesammelt' },
    aufraeumer: { name: 'Aufräumer', text: 'Alle 10 Frachtcontainer geborgen' },
    meisterbote: { name: 'Meisterbote', text: 'Die ersten fünf Aufträge erledigt' },
    tourist: { name: 'Tourist', text: 'Alle Planeten besucht' },
    amor: { name: 'Amor', text: 'Den Liebesbrief überbracht' },
    kometenjaeger: { name: 'Kometenjäger', text: 'Alle fünf Kometen gefangen' },
    ahnenforscher: { name: 'Ahnenforscher', text: 'Alle fünf Relikte zum Kuriositätenhändler gebracht' },
    grenzgaenger: { name: 'Grenzgänger', text: 'Den grünen Nebel jenseits des Sonnensystems betreten' },
    ghostbuster: { name: 'Ghostbuster', text: 'Gwynn aus ihrer körperlosen Form befreit' },
    helfer: { name: 'Helfer in der Not', text: 'Justus’ Raumschiff wieder zusammengesetzt' },
    weltenbummler: { name: 'Weltenbummler', text: 'Alle Badges gesammelt' },
  },

  /* Meldungen (kleine Einblendungen) */
  toast: {
    badge: 'Neues Badge',
    boost: 'Antrieb verbessert',
    quest: 'Neuer Auftrag',
    delivered: 'Abgeliefert',
    round2: 'Neue Aufträge',
    round2Body: 'Fünf Kometen und fünf Relikte sind im System aufgetaucht.',
    relicsGiven: 'Relikte übergeben',
    received: 'Erhalten',
  },

  /* großer Text im Bild beim Einsammeln */
  pickup: {
    crystal: 'Kristall',
    container: 'Frachtcontainer',
    comet: 'Komet',
    relic: 'Relikt',
    part: 'Schiffsteil',
  },

  /* Einträge in der Auftragsliste oben links */
  questList: {
    comets: 'Kometen fangen',
    relics: 'Relikte',
  },

  /* Belohnungsdialoge */
  rewards: {
    coins: {
      title: 'Meistererkunder!',
      body: 'Alle 30 Kristalle funkeln in deinem Laderaum. Ihre Energie macht deinen Antrieb 20 Prozent schneller.',
    },
    containers: {
      title: 'Aufräumer!',
      body: 'Alle 10 verlorenen Frachtcontainer sind geborgen, die Flugrouten sind wieder frei. Zum Dank wurde dein Antrieb verbessert: 10 Prozent schneller.',
    },
    quests: {
      title: 'Meisterbote!',
      body: 'Brief, Fisch, Fotoalbum, Kuchen und Ocarina sind angekommen. Im ganzen System spricht man von dir, und dein Antrieb ist jetzt 20 Prozent schneller.',
    },
    comets: {
      title: 'Kometenjäger!',
      body: 'Alle fünf Kometen sind gefangen. Ivy ist begeistert, und dein Antrieb ist jetzt 30 Prozent schneller.',
    },
    relics: {
      title: 'Ahnenforscher!',
      body: 'Die Relikte erzählen von einer längst untergegangenen Zivilisation. Dein Antrieb ist jetzt 20 Prozent schneller.',
    },
    border: {
      title: 'Grenzgänger!',
      body: 'Du hast das Sonnensystem hinter dir gelassen und ein unbekanntes Gebiet betreten. Dein Antrieb ist jetzt 10 Prozent schneller.',
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
    dark: {
      kicker: '',
      name: 'Dunkler Planet',
      body: 'Düstere Gewitterwolken überziehen den Planeten und hüllen ihn in ewige Nacht.',
    },
    wreck: {
      kicker: '',
      name: 'Altes Raumschiffwrack',
      body: 'Ein riesiges, uraltes Raumschiff, verlassen und still. Niemand weiß, wer es gebaut hat.',
    },
    aurel: {
      kicker: '',
      name: 'Aurel',
      body: 'Die goldene der beiden Sonnen. Sie tanzt seit Ewigkeiten mit ihrer blauen Schwester.',
    },
    azur: {
      kicker: '',
      name: 'Azur',
      body: 'Die kleinere, blaue Sonne. Ihr Licht färbt die Strände des Systems silbern.',
    },
    monos: {
      kicker: '',
      name: 'Monos',
      body: 'Nirgendwo in der Galaxis gibt es schönere Bungalows und Poollandschaften.',
    },
    qratos: {
      kicker: '',
      name: 'Qratos',
      body: 'Die Lagunen von Qratos sind ein Urlaubsparadies für den gesamten Sektor.',
    },
    stypos: {
      kicker: '',
      name: 'Stypos',
      body: 'Die Strände von Stypos sind die schönsten im System.',
    },
  },
};
