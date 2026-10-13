// Tipi di alimenti accettati dai centri.
// La chiave (a sinistra) è quella salvata nel database nella colonna
// centri.categorie_accettate: non cambiatela senza avvisare chi gestisce
// il database. Il testo (a destra) si può cambiare liberamente.

export const CATEGORIE = {
  fresco: 'Freschi (frutta, verdura, latticini)',
  pane: 'Pane e prodotti da forno',
  secco: 'Secchi e in scatola',
  surgelato: 'Surgelati',
  pronto: 'Piatti pronti e cotti',
};

// Trasforma ['fresco', 'pane'] in "Freschi (...), Pane e prodotti da forno"
export function nomiCategorie(chiavi = []) {
  return chiavi.map((c) => CATEGORIE[c] ?? c).join(', ');
}
