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
    gnyyyk: { name: 'Gnyyyk', tier: 'Alien', look: { alien: true, skin: '#8aff6a', suit: '#3affd0', eyes: 2, antenna: '#ff5ad0' } },
    shzzzn: { name: 'Shzzzn', tier: 'Alien', look: { alien: true, skin: '#ff9ad8', suit: '#ffd84a', eyes: 3, antenna: '#7fe0ff' } },
    napppaap: { name: 'Napppaap', tier: 'Alien', look: { alien: true, skin: '#9ab8ff', suit: '#ff7a3a', eyes: 2, antenna: '#ffd84a' } },
    kikkyyyk: { name: 'Kikkyyyk', tier: 'Alien', look: { alien: true, skin: '#ffd84a', suit: '#8a6cff', eyes: 1, antenna: '#3affd0' } },
    szyyypp: { name: 'Szyyypp', tier: 'Alien', look: { alien: true, skin: '#6affc8', suit: '#ff3a7a', eyes: 2, antenna: '#ffffff' } },
    ikkk: { name: 'Ikkk', tier: 'Alien', look: { alien: true, skin: '#c8a2ff', suit: '#2a8aff', eyes: 1, antenna: '#ff7a3a' } },
    bbbipp: { name: 'Bbbipp', tier: 'Alien', look: { alien: true, skin: '#ffb36a', suit: '#3aff6a', eyes: 3, antenna: '#c8a2ff' } },
    west: { name: 'West', tier: 'Notar', look: { suit: '#ff3af0', helmet: false, skin: '#6a4028', hair: '#e8e8e8', hairStyle: 'bald' } },
  },

  /*
   * Gegenstände für die Quests. »target« = Planet, zu dem der Gegenstand muss
   * (ignis, aqua, thalassa, gigas, glacies). »deliver« = Dialog bei der Übergabe.
   */
  items: {
    brief: {
      name: 'Liebesbrief', target: 'aqua',
      deliver: [['du', 'Auf Ayathla liefere ich den Liebesbrief ab. Die Empfängerin ist überglücklich.']],
    },
    aquarium: {
      name: 'Seltener Fisch', target: 'thalassa',
      deliver: [['du', 'Auf Thalyssa lasse ich den Fisch im türkisfarbenen Meer frei. Schon ist er verschwunden.']],
    },
    fotobuch: {
      name: 'Fotoalbum', target: 'glacies',
      deliver: [['du', 'In einer Mine auf Cies übergebe ich das Fotoalbum. Die Besitzerin blättert lange darin und lächelt.']],
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
      deliver: [['du', 'Im Archiv tief im Eis von Cies stelle ich den Koffer ab. Er brummt leise. Oder bilde ich mir das nur ein?']],
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
      deliver: [['du', 'Im Archiv auf Cies stelle ich den zweiten Koffer neben den ersten. Jetzt brummen beide im Takt …']],
    },
    ocarina: {
      name: 'Ocarina der Zeit', target: 'ignis',
      deliver: [['du', 'Auf Ignis übergebe ich die Ocarina der Zeit. Die Empfängerin spielt eine fröhliche Melodie.']],
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
        ['quentin', 'Ahoi, Bote! Gut, dass ich dich treffe. Die Normandy hat noch drei Wochen Flug vor sich.'],
        ['quentin', 'Aber auf Ayathla wartet jemand auf Nachricht von mir. Und unser Funk ist mal wieder kaputt.'],
        ['quentin', 'Bringst du meiner Liebsten diesen Brief?'],
        ['du', 'Gern. Du kannst dich auf mich verlassen. Gute Reise!'],
      ],
      waiting: [
        ['quentin', 'Hast du meinen Brief schon abgegeben?'],
        ['du', 'Noch nicht. Es gibt viel zu tun.'],
        ['quentin', 'Ayathla ist der Planet mit den weiten grünen Kontinenten. Du kannst ihn nicht verfehlen.'],
      ],
      thanks: [
        ['quentin', 'Danke, dass du meiner Liebsten den Brief überbracht hast!'],
        ['quentin', 'Ich zähle die Tage bis zum nächsten Landgang …'],
        ['du', 'Ich hoffe, du bist bald wieder mit deiner Liebsten vereint.'],
      ],
      round2: {
        quest: 'kraeuter',
        offer: [
          ['quentin', 'Da bist du ja wieder, Bote!'],
          ['quentin', 'Die Köche unter den Kuppeln von Gigas warten auf sieben Kräuter aus meinem Laderaum. Nimmst du sie mit?'],
          ['du', 'Mache ich. Sie duften herrlich.'],
          ['quentin', 'Lass schön die Finger von ihnen! Du sollst sie nur abliefern …'],
        ],
        waiting: [
          ['quentin', 'Sieben Kräuter, keins weniger. Die Köche zählen nach …'],
        ],
        thanks: [
          ['quentin', 'Ich habe gehört, es gab ein Festessen auf Gigas.'],
          ['quentin', 'Danke, dass du die Kräuter geliefert hast!'],
        ],
      },
    },
    {
      name: 'Fährschiff Nostromo',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'norman',
      quest: 'aquarium',
      offer: [
        ['norman', 'Hallo, Bote! Ich habe einen ungewöhnlichen Passagier an Bord …'],
        ['norman', 'Einen seltenen Fisch aus den Meeren von Thalyssa. Er ist bei einem Händler gelandet und gehört zurück nach Hause.'],
        ['du', 'Der arme Kerl! Ich bringe ihn heim.'],
      ],
      waiting: [
        ['norman', 'Flieg ruhig und gleichmäßig. Der Fisch mag keine Wellen, da wird ihm übel.'],
      ],
      thanks: [
        ['norman', 'Ich habe gehört, dass der Fisch gut zu Hause angekommen ist!'],
        ['norman', 'Danke, dass du den Auftrag übernommen hast.'],
      ],
      round2: {
        quest: 'perlenkette',
        offer: [
          ['norman', 'Schön, dich zu sehen, Bote!'],
          ['norman', 'Eine Passagierin hat bei mir etwas liegen lassen …'],
          ['norman', 'Eine Perlenkette aus den Meeren von Thalyssa. Die Besitzerin wohnt auf Ayathla. Bringst du sie ihr?'],
          ['du', 'Na klar!'],
        ],
        waiting: [
          ['norman', 'Die Perlenkette ist ein Erbstück. Pass gut auf sie auf.'],
        ],
        thanks: [
          ['norman', 'Die Passagierin mit der Perlenkette hat mir eine Karte geschickt.'],
          ['norman', 'Danke, dass du die Kette überbracht hast!'],
        ],
      },
    },
    {
      name: 'Polizeifregatte Condor',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'adele',
      quest: 'fotobuch',
      offer: [
        ['adele', 'Guten Tag, Bote! Keine Sorge, das ist keine Kontrolle …'],
        ['adele', 'Dieses Fotoalbum wurde bei uns abgegeben. Es gehört einer Bergarbeiterin auf Cies.'],
        ['adele', 'Die Fotos zeigen Partys, die sie wohl während des Studiums gefeiert hat. Ein wertvolles Andenken.'],
        ['du', 'Ich bringe ihr das Album.'],
      ],
      waiting: [
        ['adele', 'Cies liegt ganz außen im System. Zieh dich warm an.'],
      ],
      thanks: [
        ['adele', 'Fall abgeschlossen, Fotoalbum überbracht. Danke dir, Bote!'],
      ],
      round2: {
        quest: 'koffer',
        offer: [
          ['adele', 'Da bist du ja, Bote. Ich habe wieder einen Auftrag für dich.'],
          ['du', 'Worum geht’s diesmal?'],
          ['adele', 'Um einen geheimnisvollen Koffer, fest verschlossen.'],
          ['du', 'Oh …'],
          ['adele', 'Wage es nicht, ihn zu öffnen. Er soll ins Archiv auf Cies. Frag lieber nicht, was drin ist.'],
          ['du', 'Na gut, ich frage nicht.'],
        ],
        waiting: [
          ['adele', 'Hast du den geheimnisvollen Koffer schon abgegeben?'],
          ['du', 'Nein …'],
          ['adele', 'Du wirst ihn doch wohl nicht geöffnet haben?'],
          ['du', 'Natürlich nicht …'],
          ['adele', 'Das will ich auch hoffen!'],
        ],
        thanks: [
          ['adele', 'Der Koffer ist sicher verwahrt. Gute Arbeit, Bote!'],
        ],
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
        ['ivy', 'Willkommen auf Genesis, Bote! Du kommst genau richtig.'],
        ['du', 'Was gibt’s zu tun?'],
        ['ivy', 'Mein Bruder lebt auf Gigas unter den Kristallkuppeln und hat heute Geburtstag. Bringst du ihm diesen Kuchen?'],
        ['du', 'Natürlich! Ich fliege vorsichtig.'],
      ],
      waiting: [
        ['ivy', 'Denk dran, der Kuchen soll nach Gigas. Und nicht unterwegs naschen!'],
      ],
      thanks: [
        ['ivy', 'Mein Bruder hat mir geschrieben, der Kuchen war ein Traum. Danke, Bote!'],
      ],
      round2: {
        quest: 'kometen',
        offer: [
          ['ivy', 'Gut, dass du da bist, Bote! Unsere Instrumente zeigen fünf Kometen im System.'],
          ['ivy', 'Kannst du alle fünf für unsere Forschung einfangen?'],
          ['du', 'Ich versuche es.'],
        ],
        waiting: [
          ['ivy', 'Mit jedem Erfolg wird dein Antrieb schneller. Dann holst du die Kometen locker ein.'],
        ],
        thanks: [
          ['ivy', 'Fünf Kometen! Die Proben werden uns jahrelang beschäftigen. Danke, Bote!'],
        ],
      },
    },
    outer: {
      name: 'Handelsposten Orion',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', // kurze Beschreibung, erscheint am Objekt
      with: 'west',
      quest: 'ocarina',
      offer: [
        ['west', 'Willkommen auf Orion, Bote! Kannst du etwas für mich überbringen?'],
        ['du', 'Das ist mein Job! Worum geht’s?'],
        ['west', 'Um diese Ocarina der Zeit …'],
        ['du', 'Was ist das für ein Ding?'],
        ['west', 'Ein seltenes Relikt aus einer fernen Galaxis. Eine Forscherin auf Ignis will sie untersuchen.'],
        ['du', 'Ich bringe sie sicher hin.'],
      ],
      waiting: [
        ['west', 'Die Ocarina muss nach Ignis.'],
        ['west', 'Das ist der heiße Planet nah an der Sonne. Bleib über den Wolken.'],
      ],
      thanks: [
        ['west', 'Die Ocarina der Zeit ist gut angekommen. Vielen Dank für deine Hilfe, Bote!'],
      ],
      round2: {
        quest: 'mineral',
        offer: [
          ['west', 'Willkommen zurück, Bote. Es gäbe mal wieder was zu erledigen …'],
          ['du', 'Ich bin bereit!'],
          ['west', 'Dieses kostbare Mineral aus den Minen von Cies gehört nun einem Juwelier auf Thalyssa. Lieferst du es aus?'],
          ['du', 'Sicher doch.'],
        ],
        waiting: [
          ['west', 'Laut Vertrag muss das Mineral unversehrt ankommen.'],
        ],
        thanks: [
          ['west', 'Lieferung bestätigt. Alles hat seine Ordnung. Danke, Bote!'],
        ],
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
      ['balthasar', 'Willkommen in der Wunderkammer, Bote!'],
      ['du', 'Wunderkammer?'],
      ['balthasar', 'Ich sammle Kuriositäten aus allen Ecken des Alls.'],
      ['du', 'Oh …!'],
      ['balthasar', 'Ja, da staunst du!'],
      ['balthasar', 'In diesem System sind fünf seltsame Relikte aufgetaucht. Bringst du sie mir?'],
      ['du', 'Ich halte die Augen offen.'],
    ],
    handIn: [
      ['balthasar', 'Ah, wunderbar! Damit habe ich {n} von 5 Relikten.'],
    ],
    missing: [
      ['balthasar', 'Es fehlen noch {rest} Relikte. Sie schimmern im Dunkeln.'],
    ],
    complete: [
      ['balthasar', 'Das ist das letzte Relikt!'],
      ['du', 'Und nun?'],
      ['balthasar', 'Jetzt untersuche ich sie. Warte einen Moment …'],
      ['balthasar', 'Unglaublich! Die Relikte stammen von einer längst untergegangenen Zivilisation. Sie war lange vor uns in diesem System.'],
      ['du', 'Dann sind wir nicht die Ersten hier …?'],
      ['balthasar', 'Ganz und gar nicht. Danke, dass du diese Spuren gefunden hast.'],
      ['balthasar', 'Womöglich findest du noch mehr Hinweise auf diese fremde Zivilisation …'],
      ['du', 'Ich halte die Augen offen!'],
    ],
    thanks: [
      ['balthasar', 'Ich studiere die Relikte noch immer. Jeden Tag entdecke ich etwas Neues.'],
      ['balthasar', 'Vielleicht findest du ja noch mehr Hinweise …'],
      ['du', 'Ich halte die Augen offen!'],
    ],
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
        ['du', 'Ja, ich höre dich! Was ist dir passiert?'],
        ['entitaet', 'Ich habe keinen Körper mehr. Nur das blaue Elixier aus dem Eis von Cies kann mir helfen. Bringst du es mir?'],
        ['du', 'Ich fliege nach Cies!'],
      ],
      waiting: [
        ['entitaet', 'Das Elixier … aus dem Eis von Cies … bitte beeil dich!'],
      ],
      complete: [
        ['entitaet', 'Du hast das Elixier gebracht … ich spüre es schon!'],
        ['du', 'Was passiert mit dir?'],
        ['gwynn', 'Ich … habe wieder Hände! Ich bin Gwynn, Forscherin.'],
        ['gwynn', 'Ich habe dieses Wrack untersucht. Eine fremde Technologie hat mich in Licht verwandelt. Du hast mich gerettet. Danke!'],
        ['du', 'Was ist das für ein Wrack?'],
        ['gwynn', 'Es scheint von einer uralten Zivilisation zu stammen.'],
        ['du', 'Aufregend!'],
        ['gwynn', 'Du kommst doch viel umher! Vielleicht findest du weitere Hinweise auf diese Zivilisation …'],
        ['du', 'Ich halte die Augen offen!'],
      ],
    },
    elixir: {
      name: 'Blaues Elixier',
      from: 'glacies',
      pickup: [
        ['du', 'Tief im Eis von Cies leuchtet eine Phiole mit blauem Elixier. Ich nehme sie vorsichtig mit.'],
      ],
    },
    traveler: {
      with: 'reisender',
      offer: [
        ['reisender', 'Ein Bote! Gedankt sei’s den Sternen! Endlich findet mich jemand!'],
        ['du', 'Was ist dir passiert?'],
        ['reisender', 'Im Nebel habe ich die Kontrolle über mein Schiff verloren. Fünf Teile treiben irgendwo in diesem Gebiet. Sammelst du sie für mich ein?'],
        ['du', 'Ich halte Ausschau.'],
      ],
      waiting: [
        ['reisender', 'Es fehlen noch {rest} Teile. Sie müssen hier irgendwo treiben.'],
      ],
      complete: [
        ['reisender', 'Alle fünf Teile! Jetzt kann ich mein Schiff reparieren.'],
        ['justus', 'Ich habe mich noch gar nicht vorgestellt: Ich bin Justus.'],
        ['du', 'Freut mich!'],
        ['justus', 'Danke, dass du mir geholfen hast, Bote. Wir sehen uns da draußen!'],
      ],
    },
    partsName: 'Schiffsteile',
    // Gwynn und Justus fliegen nach ihrer Rettung selbst durchs Gebiet
    gwynn: {
      name: 'Forschungsschiff Lumen',
      desc: 'Ein wendiges kleines Schiff.', // kurze Beschreibung, erscheint am Objekt
      with: 'gwynn',
      talk: [
        ['gwynn', 'Der Nebelsektor ist voller Wunder!'],
        ['gwynn', 'Womöglich finde ich hier weitere Hinweise auf die uralte Zivilisation …'],
        ['du', 'Aber verlier nicht wieder deinen Körper!'],
        ['gwynn', 'Ich werde aufpassen …'],
      ],
      // Kapitel 3: drei Alien-Relikte (im Nebel, im Sonnensystem, hinter dem Wurmloch)
      alien: {
        offer: [
          ['gwynn', 'Seit das Wurmloch offen ist, spüre ich ein Echo. Dieselbe fremde Technik, die mich damals in einen Schatten verwandelt hat.'],
          ['gwynn', 'Drei Relikte der Fremden senden es aus: eines hier im Nebelsektor, eines im zentralen Sonnensystem …'],
          ['gwynn', '… und eines hinter diesem Wurmloch.'],
          ['du', 'Und wenn ich sie einsammle?'],
          ['gwynn', 'Dann legt sich ihr Glanz auf dein Schiff. Bring sie zusammen – ich bin gespannt, was passiert.'],
        ],
        waiting: [
          ['gwynn', 'Noch {rest} Alien-Relikte. Eines im Nebel, eines im Sonnensystem, eines hinter dem Wurmloch.'],
        ],
        thanks: [
          ['gwynn', 'Dein Schiff glänzt wie die Relikte selbst.'],
          ['gwynn', 'Ich frage mich …'],
          ['du', 'Was?'],
          ['gwynn', 'Dein Schiff scheint nun für die Überlichtgeschwindigkeit gewappnet zu sein.'],
          ['du', 'Was bedeutet das?'],
          ['gwynn', 'Womöglich kannst du der Alien-Zivilisation dahin folgen, wohin sie verschwunden ist.'],
          ['du', 'Und wo soll ich nach ihr suchen?'],
          ['gwynn', 'Vielleicht in einem Wurmloch hinter dem Wurmloch …'],
          ['du', 'Ich verstehe nicht …'],
          ['gwynn', 'Das wirst du schon noch!'],
        ],
        // nachdem man den Sektor der Aliens entdeckt hat (solange man noch keinen Übersetzer hat)
        found: [
          ['gwynn', 'Du hast die alte Zivilisation also entdeckt!'],
          ['du', 'Aber ich verstehe sie nicht!'],
          ['gwynn', 'Hmmm, ich frage mich, ob Balthasar dir helfen kann.'],
        ],
        // danach
        later: [
          ['gwynn', 'Die alte Zivilisation lebt! Ich kann es noch immer kaum glauben.'],
        ],
      },
    },
    justus: {
      name: 'Reiseschiff Wanderer',
      desc: 'Justus hat sein Schiff wieder flott gemacht.', // kurze Beschreibung, erscheint am Objekt
      with: 'justus',
      talk: [
        ['justus', 'Mein Schiff fliegt wieder wie neu. Danke für deine Hilfe, Bote!'],
      ],
    },
  },

  /*
   * Kapitel 3: Sektor der Aliens hinter dem goldenen Wurmloch (im Norden des Urlaubssystems).
   * Ohne Übersetzer sprechen die sieben Aliens nur Kauderwelsch (»gibberish«), mit Übersetzer »talk«.
   */
  aliens: {
    sector: 'Sektor der Alten',
    city: 'Stadtschiff', cityDesc: 'Ein Schiff der alten Zivilisation. Überall blinken Lichter.',
    locked: 'Dein Schiff ist für das goldene Wurmloch noch nicht gewappnet.',
    translator: 'Übersetzer',
    list: {
      gnyyyk: {
        home: 'Kuppelschiff Gnyyyk',
        desc: 'Ein Wohnschiff der alten Zivilisation.', // kurze Beschreibung, erscheint am Objekt
        gibberish: [
          ['gnyyyk', 'Gnyk-gnyk! Brrlaap zoo? Shkiii tamp-tamp!'],
          ['du', 'Ich verstehe kein Wort …'],
        ],
        talk: [
          ['gnyyyk', 'Oh, was bist du denn für einer? Du siehst ja lustig aus. Sieh dich ruhig um.'],
        ],
      },
      shzzzn: {
        home: 'Turmschiff Shzzzn',
        desc: 'Ein Wohnschiff der alten Zivilisation.', // kurze Beschreibung, erscheint am Objekt
        gibberish: [
          ['shzzzn', 'Shzzz … wroonk? Trrryyypb! Trrryyypb blaaarp!'],
          ['du', 'Ich verstehe kein Wort …'],
        ],
        talk: [
          ['shzzzn', 'Du bist nicht von hier, was? Willkommen! Du musst unbedingt Trrryyypb probieren, es ist köstlich!'],
        ],
      },
      napppaap: {
        home: 'Ringschiff Napppaap',
        desc: 'Ein Wohnschiff der alten Zivilisation.', // kurze Beschreibung, erscheint am Objekt
        gibberish: [
          ['napppaap', 'Napp-napp-paap. Trrryyypb gluu mmmh, ooh-wiip!'],
          ['du', 'Ich verstehe kein Wort …'],
        ],
        talk: [
          ['napppaap', 'Hast du schon Trrryyypb probiert? Wenn du’s einmal hattest, willst du nichts anderes mehr essen.'],
        ],
      },
      kikkyyyk: {
        home: 'Kuppelschiff Kikkyyyk',
        desc: 'Ein Wohnschiff der alten Zivilisation.', // kurze Beschreibung, erscheint am Objekt
        gibberish: [
          ['kikkyyyk', 'Kik! Kik! Yyyrk zammo plinnk, flubbo-dee!'],
          ['du', 'Ich verstehe kein Wort …'],
        ],
        talk: [
          ['kikkyyyk', 'Willkommen, Fremder! Unser Sektor ist dein Sektor, fühl dich wie zuhause.'],
        ],
      },
      szyyypp: {
        home: 'Garküchenschiff Szyyypp',
        desc: 'Ein Wohnschiff der alten Zivilisation.', // kurze Beschreibung, erscheint am Objekt
        gibberish: [
          ['szyyypp', 'Szyp szyp? Trrryyypb skoolp! Hmmm-blorp?'],
          ['du', 'Ich verstehe kein Wort …'],
        ],
        talk: [
          ['szyyypp', 'Ich mache gerade leckeren Trrryyypb. Willst du welchen?'],
          ['du', 'Alle reden davon. Ich sollte es probieren …'],
          ['szyyypp', 'Hier, nimm eine Schüssel.'],
          ['du', '…'],
          ['szyyypp', 'Und?'],
          ['du', '…'],
          ['szyyypp', 'Sag schon?'],
          ['du', 'Sehr … lecker …'],
          ['szyyypp', 'Na, sag ich doch!'],
        ],
      },
      ikkk: {
        home: 'Turmschiff Ikkk',
        desc: 'Ein Wohnschiff der alten Zivilisation.', // kurze Beschreibung, erscheint am Objekt
        gibberish: [
          ['ikkk', 'Ikk. Ikk-ikk … tsss, trrryyypb nnnöööp. Pssst!'],
          ['du', 'Ich verstehe kein Wort …'],
        ],
        talk: [
          ['ikkk', 'Ich mag keinen Trrryyypb. Aber bitte verrat’s niemandem.'],
        ],
      },
      bbbipp: {
        home: 'Archivschiff Bbbipp',
        desc: 'Ein Wohnschiff der alten Zivilisation.', // kurze Beschreibung, erscheint am Objekt
        gibberish: [
          ['bbbipp', 'Bbbip-bbbop. Vrooomli zaa, ooomba Sonnnsystmmm?'],
          ['du', 'Ich verstehe kein Wort …'],
        ],
        talk: [
          ['bbbipp', 'Vor langer, langer Zeit lebten wir in eurem Sonnensystem.'],
          ['du', 'Warum seid ihr dort verschwunden?'],
          ['bbbipp', 'Wir haben uns auf die Suche nach dem leckersten Trrryyypb begeben. Und hier haben wir es gefunden.'],
          ['du', '…'],
        ],
      },
    },
    // Balthasar baut den Übersetzer (nachdem man den Sektor entdeckt hat)
    balthasar: {
      give: [
        ['balthasar', 'Du hast die Aliens gefunden?! Das ist ein Wunder!'],
        ['du', 'Aber ich kann nicht mit ihnen sprechen …'],
        ['balthasar', 'Ich habe die Relikte analysiert, die du gefunden hast. Ich glaube, ich kann dir einen Übersetzer bauen.'],
        ['balthasar', '… ja, es hat funktioniert. Hier ist das Gerät, probier es aus!'],
      ],
      waiting: [
        ['balthasar', 'Hast du den Übersetzer schon ausprobiert? Gib Bescheid, wenn du mit den Aliens gesprochen hast.'],
      ],
      done: [
        ['balthasar', 'Du hast mit den Aliens gesprochen?'],
        ['du', 'Ja, dein Übersetzer hat funktioniert.'],
        ['balthasar', 'Das ist wirklich fantastisch! Ich werde selbst zu ihnen aufbrechen.'],
      ],
      // danach fliegt Balthasar im Sektor der Aliens umher
      there: [
        ['balthasar', 'Faszinierend! Diese Zivilisation ist so viel weiter entwickelt als wir.'],
        ['balthasar', 'Es gibt noch so viel zu lernen!'],
      ],
    },
  },

  /*
   * Kapitel 3: Was die Figuren im alten Gebiet über das Wurmloch sagen.
   * Schlüssel = Figur; »default« gilt für alle anderen.
   */
  wormholeTalk: {
    quentin: 'Hast du schon dieses neue Wurmloch gesehen, Bote? Ich frage mich, was wohl dahinter liegt …',
    norman: 'Das neue Wurmloch macht mir Angst. Ich halte mich lieber davon fern!',
    ivy: 'Wurmlöcher sind völlig ungefährliche Phänomene. Wenn ich die Zeit hätte, würde ich sofort hindurchfliegen.',
    justus: 'Ein Wurmloch ist aufgetaucht! Sollen andere hindurchfliegen. Ich hatte genug Aufregung in letzter Zeit.',
    default: 'Ein Wurmloch ist aufgetaucht! Bestimmt werden bald die mutigsten Abenteurer hindurchfliegen …',
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
    muellabfuhr: { name: 'Müllabfuhr', text: 'Alle 10 Frachtcontainer im Urlaubssystem geborgen' },
    alienforscher: { name: 'Alienforscher', text: 'Den Sektor der alten Zivilisation entdeckt' },
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
    // Zusatzzeile unter Badge und Belohnung, {n} = Prozent
    speed: '+{n} % Geschwindigkeit',
    golden: 'Goldenes Schiff',
  },

  /* großer Text im Bild beim Einsammeln */
  pickup: {
    crystal: 'Kristall',
    crystalBoost: '+1 % Geschwindigkeit',
    fastComet: 'Schneller Komet',
    alien: 'Alien-Relikt',
    container: 'Frachtcontainer',
    comet: 'Komet',
    relic: 'Relikt',
    part: 'Schiffsteil',
  },

  /* Einträge in der Auftragsliste oben links */
  questList: {
    comets: 'Kometen fangen',
    relics: 'Relikte',
    alien: 'Alien-Relikte',
    understand: 'Die Aliens verstehen',
    tryTranslator: 'Übersetzer ausprobieren',
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
      body: 'Ein riesiges, uraltes Raumschiff. Niemand weiß, wer es gebaut hat.',
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
