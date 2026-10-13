// Pagina mappa.html – mappa interattiva dei centri di raccolta.
// Usa Leaflet (la variabile globale "L", caricata nell'<head> della pagina)
// e le mappe di OpenStreetMap. Nessuna chiave API necessaria.

import { supabase } from './supabase.js';
import { CATEGORIE, nomiCategorie } from './categorie.js';
import { distanzaKm, formattaKm } from './distanza.js';
import { mostraMessaggio, nascondiMessaggio, crea, traduciErrore } from './ui.js';

const messaggio = document.getElementById('messaggio');
const elenco = document.getElementById('elenco-centri');
const filtro = document.getElementById('filtro-categoria');
const bottoneVicini = document.getElementById('vicino-a-me');

let centri = [];          // tutti i centri letti dal database
let posizioneUtente = null; // { lat, lng } se l'utente la condivide
const segnaposti = new Map(); // id del centro → segnaposto sulla mappa

// Il menu a tendina del filtro si riempie con le categorie
for (const [chiave, testo] of Object.entries(CATEGORIE)) {
  filtro.add(new Option(testo, chiave));
}

// ---------- Mappa ----------
let mappa = null;
let livelloSegnaposti = null;

if (typeof L === 'undefined') {
  // La libreria non si è caricata (es. niente connessione): resta l'elenco
  document.getElementById('mappa').hidden = true;
  mostraMessaggio(messaggio, "La mappa non si è caricata. Controlla la connessione: intanto trovi i centri nell'elenco.", 'info');
} else {
  mappa = L.map('mappa').setView([42.5, 12.5], 6); // centro Italia
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mappa);
  livelloSegnaposti = L.featureGroup().addTo(mappa);
}

// ---------- Caricamento dei centri ----------
const { data, error } = await supabase.from('centri').select('*').order('nome');

if (error) {
  mostraMessaggio(messaggio, `Non è stato possibile caricare i centri: ${traduciErrore(error)}`, 'errore');
} else {
  centri = data;
  aggiorna();
  if (mappa && centri.length) mappa.fitBounds(livelloSegnaposti.getBounds(), { padding: [30, 30], maxZoom: 13 });
}

filtro.addEventListener('change', aggiorna);

// ---------- Disegno di mappa ed elenco ----------

// Contenuto del fumetto (popup): costruito con elementi DOM, non con HTML
// scritto a mano, così un nome con caratteri strani non può inserire codice.
function contenutoPopup(centro) {
  const box = crea('div', '', 'popup-centro');
  box.append(crea('strong', centro.nome));
  box.append(crea('p', `${centro.indirizzo}, ${centro.citta}`));
  box.append(crea('p', `Accetta: ${nomiCategorie(centro.categorie_accettate)}`));
  const email = crea('a', centro.email);
  email.href = `mailto:${centro.email}`;
  box.append(email);
  return box;
}

function aggiorna() {
  const categoria = filtro.value;
  let visibili = centri.filter((c) => !categoria || c.categorie_accettate.includes(categoria));

  // Se conosciamo la posizione dell'utente, ordiniamo dal più vicino
  if (posizioneUtente) {
    visibili = visibili
      .map((c) => ({ ...c, distanza: distanzaKm(posizioneUtente.lat, posizioneUtente.lng, c.latitudine, c.longitudine) }))
      .sort((a, b) => a.distanza - b.distanza);
  }

  // Segnaposti
  if (mappa) {
    livelloSegnaposti.clearLayers();
    segnaposti.clear();
    for (const centro of visibili) {
      const segnaposto = L.marker([centro.latitudine, centro.longitudine], { title: centro.nome, alt: centro.nome })
        .bindPopup(contenutoPopup(centro));
      livelloSegnaposti.addLayer(segnaposto);
      segnaposti.set(centro.id, segnaposto);
    }
  }

  // Elenco (utile anche a chi usa uno screen reader o non vede bene la mappa)
  elenco.replaceChildren();
  document.getElementById('conteggio').textContent =
    visibili.length === 1 ? '1 centro' : `${visibili.length} centri`;

  if (!visibili.length) {
    elenco.append(crea('li', categoria
      ? 'Nessun centro accetta questa categoria di alimenti.'
      : 'Non ci sono ancora centri di raccolta nel sistema.', 'vuoto'));
    return;
  }

  for (const centro of visibili) {
    const voce = crea('li');
    voce.append(crea('h3', centro.nome));
    voce.append(crea('p', `${centro.indirizzo}, ${centro.citta}`));
    if (centro.distanza !== undefined) voce.append(crea('p', `A ${formattaKm(centro.distanza)} da te`, 'distanza'));
    voce.append(crea('p', `Accetta: ${nomiCategorie(centro.categorie_accettate)}`, 'nota'));
    if (mappa) {
      const mostra = crea('button', 'Mostra sulla mappa', 'link');
      mostra.type = 'button';
      mostra.addEventListener('click', () => {
        mappa.setView([centro.latitudine, centro.longitudine], 15);
        segnaposti.get(centro.id)?.openPopup();
        document.getElementById('mappa').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      voce.append(mostra);
    }
    elenco.append(voce);
  }
}

// ---------- "Mostra i più vicini a me" ----------
// La posizione resta nel browser: serve solo a calcolare le distanze
// e non viene inviata né salvata da nessuna parte.
bottoneVicini.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return mostraMessaggio(messaggio, 'Il tuo browser non permette di leggere la posizione.', 'errore');
  }
  nascondiMessaggio(messaggio);
  bottoneVicini.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      bottoneVicini.disabled = false;
      posizioneUtente = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      aggiorna();
      if (mappa) {
        L.circleMarker([posizioneUtente.lat, posizioneUtente.lng], { radius: 8, color: '#b3321f', fillOpacity: 0.9 })
          .addTo(mappa).bindTooltip('Sei qui');
        mappa.setView([posizioneUtente.lat, posizioneUtente.lng], 11);
      }
      // Dice subito a quanti km è il centro più vicino
      const distanze = centri.map((c) => distanzaKm(posizioneUtente.lat, posizioneUtente.lng, c.latitudine, c.longitudine));
      const minima = Math.min(...distanze);
      const testo = centri.length
        ? `Il centro più vicino è a ${formattaKm(minima)}. L'elenco è ordinato dal più vicino.`
        : 'Non ci sono ancora centri nel sistema.';
      mostraMessaggio(messaggio, `${testo} La tua posizione resta in questa pagina e non viene salvata.`, 'successo');
    },
    (errore) => {
      bottoneVicini.disabled = false;
      // Il browser indica il motivo con un codice: 1 = permesso negato,
      // 2 = posizione non disponibile, 3 = tempo scaduto
      const motivi = {
        1: 'Hai negato il permesso. Per riattivarlo clicca il lucchetto accanto all\'indirizzo del sito e consenti la posizione.',
        2: 'Il computer non riesce a trovare la posizione. Su Windows controlla che sia attiva in Impostazioni → Privacy e sicurezza → Posizione.',
        3: 'La ricerca della posizione ha impiegato troppo tempo. Riprova.',
      };
      mostraMessaggio(messaggio, `Posizione non disponibile. ${motivi[errore.code] ?? ''} Intanto puoi scorrere l'elenco.`, 'info');
    },
    { timeout: 15000 },
  );
});