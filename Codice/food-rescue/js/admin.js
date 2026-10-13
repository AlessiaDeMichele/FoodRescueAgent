// Pagina admin.html – inserire, modificare ed eliminare i centri di raccolta.
// Visibile solo agli amministratori (is_admin = true nella tabella "profili").

import { supabase } from './supabase.js';
import { richiediAdmin } from './auth.js';
import { CATEGORIE, nomiCategorie } from './categorie.js';
import { mostraMessaggio, nascondiMessaggio, crea, traduciErrore } from './ui.js';

await richiediAdmin();

const messaggio = document.getElementById('messaggio');
const msgModulo = document.getElementById('msg-modulo');
const modulo = document.getElementById('modulo-centro');
const righe = document.getElementById('righe-centri');
const titoloModulo = document.getElementById('titolo-modulo');
const bottoneSalva = document.getElementById('salva');
const bottoneAnnulla = document.getElementById('annulla-modifica');
const campoLat = document.getElementById('latitudine');
const campoLng = document.getElementById('longitudine');

let centri = [];
let idInModifica = null; // null = stiamo aggiungendo un centro nuovo

// ---------- Caselle delle categorie, create dalla lista in categorie.js ----------
const contenitoreCategorie = document.getElementById('categorie');
for (const [chiave, testo] of Object.entries(CATEGORIE)) {
  const etichetta = crea('label', '', 'spunta');
  const casella = document.createElement('input');
  casella.type = 'checkbox';
  casella.name = 'categoria';
  casella.value = chiave;
  etichetta.append(casella, crea('span', testo));
  contenitoreCategorie.append(etichetta);
}

// ---------- Piccola mappa per scegliere la posizione ----------
let mappa = null;
let segnaposto = null;

if (typeof L === 'undefined') {
  document.getElementById('mappa-admin').hidden = true;
} else {
  mappa = L.map('mappa-admin').setView([42.5, 12.5], 5);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mappa);

  // Clic sulla mappa → la posizione finisce nei campi latitudine/longitudine
  mappa.on('click', (e) => impostaPosizione(e.latlng.lat, e.latlng.lng, false));
}

function impostaPosizione(lat, lng, centra = true) {
  campoLat.value = lat.toFixed(6);
  campoLng.value = lng.toFixed(6);
  mostraSegnaposto(centra);
}

function mostraSegnaposto(centra = true) {
  if (!mappa) return;
  const lat = parseFloat(campoLat.value);
  const lng = parseFloat(campoLng.value);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    segnaposto?.remove();
    segnaposto = null;
    return;
  }
  if (!segnaposto) {
    // Il segnaposto si può anche trascinare per correggere la posizione
    segnaposto = L.marker([lat, lng], { draggable: true }).addTo(mappa);
    segnaposto.on('dragend', () => {
      const p = segnaposto.getLatLng();
      campoLat.value = p.lat.toFixed(6);
      campoLng.value = p.lng.toFixed(6);
    });
  } else {
    segnaposto.setLatLng([lat, lng]);
  }
  if (centra) mappa.setView([lat, lng], 15);
}

campoLat.addEventListener('change', () => mostraSegnaposto());
campoLng.addEventListener('change', () => mostraSegnaposto());

// ---------- Trovare le coordinate dall'indirizzo ----------
// Usa Nominatim di OpenStreetMap: gratuito, ma al massimo 1 richiesta al secondo.
// Riceve solo l'indirizzo del centro, che non è un dato personale.
const bottoneTrova = document.getElementById('trova-coordinate');

bottoneTrova.addEventListener('click', async () => {
  nascondiMessaggio(msgModulo);
  const indirizzo = modulo.indirizzo.value.trim();
  const citta = modulo.citta.value.trim();
  if (!indirizzo || !citta) {
    return mostraMessaggio(msgModulo, 'Scrivi prima indirizzo e città.', 'errore');
  }

  bottoneTrova.disabled = true;
  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=' +
      encodeURIComponent(`${indirizzo}, ${citta}`);
    const risposta = await fetch(url, { headers: { 'Accept-Language': 'it' } });
    const risultati = await risposta.json();
    if (!risultati.length) {
      mostraMessaggio(msgModulo, 'Indirizzo non trovato. Controlla come è scritto oppure clicca il punto sulla mappa.', 'errore');
    } else {
      impostaPosizione(parseFloat(risultati[0].lat), parseFloat(risultati[0].lon));
      mostraMessaggio(msgModulo, 'Posizione trovata: controlla sulla mappa che sia giusta, puoi trascinare il segnaposto.', 'successo');
    }
  } catch {
    mostraMessaggio(msgModulo, 'Ricerca non riuscita. Riprova tra poco oppure clicca il punto sulla mappa.', 'errore');
  }
  // Rispetta il limite di 1 richiesta al secondo
  setTimeout(() => { bottoneTrova.disabled = false; }, 1000);
});

// ---------- Elenco dei centri ----------
async function caricaCentri() {
  const { data, error } = await supabase.from('centri').select('*').order('nome');
  if (error) return mostraMessaggio(messaggio, `Non è stato possibile caricare i centri: ${traduciErrore(error)}`, 'errore');
  centri = data;
  disegnaTabella();
}

function disegnaTabella() {
  righe.replaceChildren();
  document.getElementById('conteggio').textContent = centri.length === 1 ? '1 centro' : `${centri.length} centri`;
  document.getElementById('nessun-centro').hidden = centri.length > 0;

  for (const centro of centri) {
    const riga = document.createElement('tr');

    const cellaCentro = document.createElement('td');
    cellaCentro.append(crea('strong', centro.nome));
    cellaCentro.append(crea('div', `${centro.indirizzo}, ${centro.citta}`, 'nota'));
    cellaCentro.append(crea('div', centro.email, 'nota'));

    const cellaCategorie = crea('td', nomiCategorie(centro.categorie_accettate));

    const cellaAzioni = crea('td', '', 'azioni-riga');
    const modifica = crea('button', 'Modifica', 'link');
    modifica.type = 'button';
    modifica.setAttribute('aria-label', `Modifica ${centro.nome}`);
    modifica.addEventListener('click', () => avviaModifica(centro));
    const elimina = crea('button', 'Elimina', 'link pericolo');
    elimina.type = 'button';
    elimina.setAttribute('aria-label', `Elimina ${centro.nome}`);
    elimina.addEventListener('click', () => chiediEliminazione(centro));
    cellaAzioni.append(modifica, elimina);

    riga.append(cellaCentro, cellaCategorie, cellaAzioni);
    righe.append(riga);
  }
}

// ---------- Aggiungere e modificare ----------
function avviaModifica(centro) {
  idInModifica = centro.id;
  nascondiMessaggio(msgModulo);
  modulo.nome.value = centro.nome;
  modulo.email.value = centro.email;
  modulo.indirizzo.value = centro.indirizzo;
  modulo.citta.value = centro.citta;
  campoLat.value = centro.latitudine;
  campoLng.value = centro.longitudine;
  modulo.querySelectorAll('input[name="categoria"]').forEach((c) => {
    c.checked = centro.categorie_accettate.includes(c.value);
  });
  modulo.ets.checked = centro.ente_terzo_settore === true;

  titoloModulo.textContent = `Modifica: ${centro.nome}`;
  bottoneSalva.textContent = 'Salva le modifiche';
  bottoneAnnulla.hidden = false;
  mostraSegnaposto();
  modulo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  modulo.nome.focus({ preventScroll: true });
}

function tornaAdAggiungere() {
  idInModifica = null;
  modulo.reset();
  mostraSegnaposto(false);
  titoloModulo.textContent = 'Aggiungi un centro';
  bottoneSalva.textContent = 'Aggiungi il centro';
  bottoneAnnulla.hidden = true;
}

bottoneAnnulla.addEventListener('click', () => {
  tornaAdAggiungere();
  nascondiMessaggio(msgModulo);
});

modulo.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  nascondiMessaggio(msgModulo);

  const dati = {
    nome: modulo.nome.value.trim(),
    email: modulo.email.value.trim().toLowerCase(),
    indirizzo: modulo.indirizzo.value.trim(),
    citta: modulo.citta.value.trim(),
    latitudine: parseFloat(campoLat.value),
    longitudine: parseFloat(campoLng.value),
    categorie_accettate: [...modulo.querySelectorAll('input[name="categoria"]:checked')].map((c) => c.value),
    ente_terzo_settore: modulo.ets.checked,
  };

  // Controlli
  if (!dati.nome || !dati.indirizzo || !dati.citta) {
    return mostraMessaggio(msgModulo, 'Compila nome, indirizzo e città.', 'errore');
  }
  if (!modulo.email.checkValidity() || !dati.email) {
    return mostraMessaggio(msgModulo, "Inserisci un'email valida: è quella a cui arriveranno gli avvisi delle donazioni.", 'errore');
  }
  if (Number.isNaN(dati.latitudine) || Number.isNaN(dati.longitudine) ||
      Math.abs(dati.latitudine) > 90 || Math.abs(dati.longitudine) > 180) {
    return mostraMessaggio(msgModulo, "Manca la posizione: usa \"Trova dall'indirizzo\" oppure clicca il punto sulla mappa.", 'errore');
  }
  if (!dati.categorie_accettate.length) {
    return mostraMessaggio(msgModulo, 'Scegli almeno un tipo di alimento accettato.', 'errore');
  }
  if (!dati.ente_terzo_settore) {
    return mostraMessaggio(msgModulo, "Si possono inserire solo enti del Terzo Settore che applicano le corrette prassi operative (requisito R10).", 'errore');
  }

  bottoneSalva.disabled = true;
  // .select() fa restituire le righe toccate: se è vuoto, il database ha
  // rifiutato l'operazione (es. permessi mancanti) anche senza dare errore.
  const richiesta = idInModifica
    ? supabase.from('centri').update(dati).eq('id', idInModifica).select()
    : supabase.from('centri').insert(dati).select();
  const { data, error } = await richiesta;
  bottoneSalva.disabled = false;

  if (error) return mostraMessaggio(msgModulo, traduciErrore(error), 'errore');
  if (!data?.length) return mostraMessaggio(msgModulo, 'Nessun centro salvato: controlla di avere i permessi di amministratore.', 'errore');

  const testo = idInModifica ? `Modifiche a «${dati.nome}» salvate.` : `«${dati.nome}» aggiunto: ora compare sulla mappa.`;
  tornaAdAggiungere();
  await caricaCentri();
  mostraMessaggio(messaggio, testo, 'successo');
  messaggio.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// ---------- Eliminare ----------
const dialogo = document.getElementById('dialogo-elimina');
const msgElimina = document.getElementById('msg-elimina');
let centroDaEliminare = null;

function chiediEliminazione(centro) {
  centroDaEliminare = centro;
  document.getElementById('nome-da-eliminare').textContent = centro.nome;
  nascondiMessaggio(msgElimina);
  dialogo.showModal();
}

document.getElementById('annulla-elimina').addEventListener('click', () => dialogo.close());

document.getElementById('conferma-elimina').addEventListener('click', async (evento) => {
  const bottone = evento.currentTarget;
  bottone.disabled = true;
  const { data, error } = await supabase.from('centri').delete().eq('id', centroDaEliminare.id).select();
  bottone.disabled = false;

  if (error || !data?.length) {
    return mostraMessaggio(msgElimina, error ? traduciErrore(error) : 'Eliminazione non riuscita: controlla i permessi.', 'errore');
  }

  dialogo.close();
  if (idInModifica === centroDaEliminare.id) tornaAdAggiungere();
  await caricaCentri();
  mostraMessaggio(messaggio, `«${centroDaEliminare.nome}» eliminato.`, 'successo');
});

caricaCentri();
