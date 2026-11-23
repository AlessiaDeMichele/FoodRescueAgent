// =========================================================
// Pagina "Organizza un evento" (evento.html)
//
// 1. Form dinamico: dati evento + lista di pietanze, ognuna con
//    ricetta facoltativa (ingredienti, dosi, dispensa).
// 2. costruisciJson(): trasforma il form nel JSON concordato
//    (vedi "Esempio di JSON inviato dal Backend").
// 3. Il JSON viene mostrato, copiato o scaricato.
//
// Per ora la pagina NON è collegata all'IA né al database e non
// richiede l'accesso. Più avanti: login (richiediLogin da auth.js)
// e invio alla Edge Function "organizza-evento".
// =========================================================

import { mostraMessaggio, nascondiMessaggio } from './ui.js';

const UNITA_SENZA_QUANTITA = 'q.b.';
const TESTO_INIZIALE = 'Compila il form e premi "Genera il JSON".';

const form = document.getElementById('form-evento');
const elencoPietanze = document.getElementById('elenco-pietanze');
const modelloPietanza = document.getElementById('modello-pietanza');
const modelloIngrediente = document.getElementById('modello-ingrediente');
const messaggio = document.getElementById('messaggio');
const anteprimaJson = document.getElementById('anteprima-json');
const bottoneCopia = document.getElementById('copia-json');
const bottoneScarica = document.getElementById('scarica-json');

const campoTipo = document.getElementById('tipo-evento');
const campoInvitati = document.getElementById('totale-invitati');
const campoBambini = document.getElementById('numero-bambini');

let contatore = 0; // per creare id unici (label for=…)
let ultimoJson = null; // ultimo JSON generato (testo)

// ---------------------------------------------------------
// Creazione delle righe dinamiche
// ---------------------------------------------------------

// Collega ogni <label data-per="x"> al suo campo data-campo="x" con un id unico
function collegaEtichette(radice) {
  radice.querySelectorAll('label[data-per]').forEach((label) => {
    const campo = radice.querySelector(`[data-campo="${label.dataset.per}"]`);
    const id = `c${++contatore}`;
    campo.id = id;
    label.htmlFor = id;
  });
}

function aggiungiPietanza(focus = true) {
  const pietanza = modelloPietanza.content.firstElementChild.cloneNode(true);
  collegaEtichette(pietanza);

  // I radio Sì/No di ogni pietanza devono avere un "name" diverso
  const nomeGruppo = `ricetta${++contatore}`;
  pietanza.querySelectorAll('[data-campo="ha-ricetta"]').forEach((r) => (r.name = nomeGruppo));

  elencoPietanze.append(pietanza);
  rinumera();
  if (focus) pietanza.querySelector('[data-campo="nome"]').focus();
}

function aggiungiIngrediente(pietanza) {
  const riga = modelloIngrediente.content.firstElementChild.cloneNode(true);
  collegaEtichette(riga);
  pietanza.querySelector('.elenco-ingredienti').append(riga);
  return riga;
}

function rinumera() {
  const pietanze = elencoPietanze.querySelectorAll('.pietanza');
  pietanze.forEach((p, i) => {
    p.querySelector('.pietanza-titolo').textContent = `Pietanza ${i + 1}`;
    // Deve restare almeno una pietanza
    p.querySelector('[data-azione="rimuovi-pietanza"]').hidden = pietanze.length === 1;
  });
}

document.getElementById('aggiungi-pietanza').addEventListener('click', () => aggiungiPietanza());

// Un solo gestore per tutti i bottoni e campi creati dinamicamente
elencoPietanze.addEventListener('click', (ev) => {
  const azione = ev.target.closest('[data-azione]')?.dataset.azione;
  if (!azione) return;
  const pietanza = ev.target.closest('.pietanza');

  if (azione === 'rimuovi-pietanza') {
    pietanza.remove();
    rinumera();
  } else if (azione === 'aggiungi-ingrediente') {
    aggiungiIngrediente(pietanza).querySelector('[data-campo="nome-ing"]').focus();
  } else if (azione === 'rimuovi-ingrediente') {
    const elenco = ev.target.closest('.elenco-ingredienti');
    ev.target.closest('.ingrediente').remove();
    if (!elenco.children.length) aggiungiIngrediente(pietanza); // almeno una riga
  }
});

elencoPietanze.addEventListener('change', (ev) => {
  const campo = ev.target.dataset.campo;

  if (campo === 'ha-ricetta') {
    const pietanza = ev.target.closest('.pietanza');
    const conRicetta = ev.target.value === 'si';
    pietanza.querySelector('.ricetta').hidden = !conRicetta;
    if (conRicetta && !pietanza.querySelector('.ingrediente')) aggiungiIngrediente(pietanza);
  }

  if (campo === 'disponibile') {
    const box = ev.target.closest('.dispensa').querySelector('.campo');
    box.hidden = !ev.target.checked;
    if (ev.target.checked) box.querySelector('input').focus();
  }

  if (campo === 'unita') {
    // "q.b." non ha una quantità
    const quantita = ev.target.closest('.ingrediente').querySelector('[data-campo="quantita"]');
    const qb = ev.target.value === UNITA_SENZA_QUANTITA;
    quantita.disabled = qb;
    if (qb) quantita.value = '';
  }
});

// ---------------------------------------------------------
// Lettura del form → JSON
// ---------------------------------------------------------

const leggiIntero = (input) => (input.value.trim() === '' ? NaN : Number(input.value));

// Segna un campo come errato e restituisce il messaggio (per fermarsi al primo errore)
function errore(input, testo) {
  input.setAttribute('aria-invalid', 'true');
  input.focus();
  return testo;
}

// Restituisce { json } oppure { errore } con il primo problema trovato
function costruisciJson() {
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));

  const totale = leggiIntero(campoInvitati);
  const bambini = campoBambini.value.trim() === '' ? 0 : leggiIntero(campoBambini);

  if (!campoTipo.value) return { errore: errore(campoTipo, 'Scegli il tipo di evento.') };
  if (!Number.isInteger(totale) || totale < 1) {
    return { errore: errore(campoInvitati, 'Il numero di invitati deve essere almeno 1.') };
  }
  if (!Number.isInteger(bambini) || bambini < 0) {
    return { errore: errore(campoBambini, 'Il numero di bambini non può essere negativo.') };
  }
  if (bambini > totale) {
    return { errore: errore(campoBambini, 'I bambini non possono essere più degli invitati totali.') };
  }

  const pietanze = [];
  for (const [n, el] of [...elencoPietanze.querySelectorAll('.pietanza')].entries()) {
    const etichetta = `Pietanza ${n + 1}`;
    const inputNome = el.querySelector('[data-campo="nome"]');
    const nome = inputNome.value.trim();
    if (!nome) return { errore: errore(inputNome, `${etichetta}: inserisci il nome del piatto.`) };

    const haRicetta = el.querySelector('[data-campo="ha-ricetta"]:checked').value === 'si';
    if (!haRicetta) {
      pietanze.push({ nome_pietanza: nome, ha_ricetta_utente: false, persone_riferimento: null, ingredienti: [] });
      continue;
    }

    const inputPersone = el.querySelector('[data-campo="persone"]');
    const persone = leggiIntero(inputPersone);
    if (!Number.isInteger(persone) || persone < 1) {
      return { errore: errore(inputPersone, `"${nome}": indica per quante persone è la ricetta (almeno 1).`) };
    }

    const ingredienti = [];
    for (const riga of el.querySelectorAll('.ingrediente')) {
      const inputIng = riga.querySelector('[data-campo="nome-ing"]');
      const inputQta = riga.querySelector('[data-campo="quantita"]');
      const unita = riga.querySelector('[data-campo="unita"]').value;
      const disponibile = riga.querySelector('[data-campo="disponibile"]').checked;
      const inputDisp = riga.querySelector('[data-campo="qta-disp"]');
      const nomeIng = inputIng.value.trim();

      // Riga lasciata completamente vuota: la ignoriamo
      if (!nomeIng && inputQta.value.trim() === '' && !disponibile) continue;
      if (!nomeIng) return { errore: errore(inputIng, `"${nome}": manca il nome di un ingrediente.`) };

      let quantita = 0;
      if (unita !== UNITA_SENZA_QUANTITA) {
        quantita = Number(inputQta.value);
        if (inputQta.value.trim() === '' || !(quantita > 0)) {
          return { errore: errore(inputQta, `"${nomeIng}": inserisci una quantità maggiore di 0 (oppure scegli q.b.).`) };
        }
      }

      let quantitaDisponibile = 0;
      if (disponibile) {
        quantitaDisponibile = Number(inputDisp.value);
        if (inputDisp.value.trim() === '' || !(quantitaDisponibile >= 0)) {
          return { errore: errore(inputDisp, `"${nomeIng}": indica quanto ne hai già in dispensa.`) };
        }
      }

      ingredienti.push({
        nome_ingrediente: nomeIng,
        quantita_base: quantita,
        unita_misura: unita,
        gia_disponibile: disponibile,
        quantita_disponibile: quantitaDisponibile,
      });
    }

    if (!ingredienti.length) {
      const primo = el.querySelector('[data-campo="nome-ing"]');
      return { errore: errore(primo, `"${nome}": inserisci almeno un ingrediente oppure scegli "No".`) };
    }

    pietanze.push({ nome_pietanza: nome, ha_ricetta_utente: true, persone_riferimento: persone, ingredienti });
  }

  return {
    json: {
      evento: { tipo_evento: campoTipo.value, totale_invitati: totale, numero_bambini: bambini },
      pietanze,
    },
  };
}

// ---------------------------------------------------------
// Generazione, copia e download del JSON
// ---------------------------------------------------------

function abilitaAzioni(attive) {
  bottoneCopia.disabled = !attive;
  bottoneScarica.disabled = !attive;
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  nascondiMessaggio(messaggio);

  const { json, errore: err } = costruisciJson();
  if (err) return mostraMessaggio(messaggio, err, 'errore');

  ultimoJson = JSON.stringify(json, null, 2);
  anteprimaJson.textContent = ultimoJson;
  abilitaAzioni(true);
  mostraMessaggio(messaggio, 'JSON generato correttamente.', 'successo');
  if (window.matchMedia('(max-width: 860px)').matches) {
    anteprimaJson.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

form.addEventListener('reset', () => {
  // Dopo il reset del browser ripartiamo da una sola pietanza vuota
  setTimeout(() => {
    elencoPietanze.replaceChildren();
    aggiungiPietanza(false);
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    nascondiMessaggio(messaggio);
    ultimoJson = null;
    anteprimaJson.textContent = TESTO_INIZIALE;
    abilitaAzioni(false);
  });
});

bottoneCopia.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(ultimoJson);
    bottoneCopia.textContent = 'Copiato';
  } catch {
    bottoneCopia.textContent = 'Copia non riuscita';
  }
  setTimeout(() => (bottoneCopia.textContent = 'Copia'), 1500);
});

bottoneScarica.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([ultimoJson], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'evento.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

anteprimaJson.textContent = TESTO_INIZIALE;
aggiungiPietanza(false);
