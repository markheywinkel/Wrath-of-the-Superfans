// Generische, zufällig gezogene Kampf-Dialoge. Jeder NPC-Kampf folgt demselben
// Ablauf: Dialog 1 (Anrempeln) -> Kampf -> bei Sieg Dialog 2, bei Niederlage
// Dialog 3 (danach erneut ansprechen, um es wieder zu versuchen). Ist der
// Gegner bereits besiegt, gibt ein erneutes Ansprechen nur noch Dialog 4
// (Small-Talk, kein Kampf mehr).

/** Dialog 1: Der Gegner rempelt den Spieler vor dem Kampf an. */
export const DIALOG_1: string[] = [
  "Lebe lang und in Frieden! Aber zuerst mache ich dich fertig.",
  'Hat sich da ein "Star Wars"-Fan zu uns verirrt? Dir zeig ich\'s!',
  "Ich bin Trekkie der ersten Stunde! Gegen mich hast du keine Chance.",
  "Du bist frisch von der Akademie, was?! Komm her, Grünschnabel!",
  "Lass mich dir ein bisschen was über den Deltaquadranten beibringen!",
  "Qavanchu'!",
  "Widerstand ist zwecklos!",
  "Bis hierhin und nicht weiter!",
  "Heute ist ein guter Tag zum Sterben!",
];

/** Dialog 2: Der Gegner gibt sich nach einer Niederlage gegen den Spieler geschlagen. */
export const DIALOG_2: string[] = [
  "Schon gut, schon gut, du hast gewonnen!",
  "Lebe lang und in Frieden.",
  "Heute war ein guter Tag zum Verlieren.",
  "Es ist möglich, keine Fehler zu machen und trotzdem zu verlieren. Das ist keine Schwäche. Das ist das Leben.",
];

/** Dialog 3: Der Gegner spottet, nachdem der Spieler verloren hat. */
export const DIALOG_3: string[] = [
  "Faszinierend … wie schlecht du bist. Komm wieder, wenn du klüger bist!",
  "Und du willst ein Superfan sein?! Komm wieder, wenn du besser bist.",
  "Das soll schon alles gewesen sein? Komm wieder, wenn du mehr drauf hast.",
  "Gieße den kalten Blutwein in ein anderes Glas!",
];

/** Dialog 4: Small-Talk, wenn ein bereits besiegter Gegner erneut angesprochen wird. */
export const DIALOG_4: string[] = [
  "Bist du schon auf dem Holodeck gewesen? Ich will unbedingt Fair Haven sehen.",
  "Mit einem Hypospray kannst du deine Energie auffrischen.",
  "Mit einer Sammelfigur kannst du dein Level schneller erhöhen.",
  "Ich liiiebe Janeway, sie ist die Beste!",
  "Bedaure den Krieger, der all seine Feinde tötet.",
  "Qapla'!",
];

export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
