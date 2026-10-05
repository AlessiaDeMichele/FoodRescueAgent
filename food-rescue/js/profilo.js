// Pagina profilo.html – gestione dei dati personali
// Requisiti legali: R3 (consenso newsletter revocabile), R7 (ultimo accesso
// visibile all'utente), R8 (cancellazione dell'account) e diritto di accesso
// ai propri dati (art. 15 GDPR) con il download in JSON.

import { supabase } from './supabase.js';
import { richiediLogin } from './auth.js';
import { VERSIONE_INFORMATIVA } from './config.js';
import { mostraMessaggio, nascondiMessaggio, formattaData, formattaDataOra, traduciErrore } from './ui.js';

const utente = await richiediLogin();
const meta = utente.user_metadata ?? {};
const messaggio = document.getElementById('messaggio');

if (new URLSearchParams(location.search).has('benvenuto')) {
  mostraMessaggio(messaggio, 'Account creato. Benvenuto in Food Rescue!', 'successo');
} else if (meta.informativa_versione && meta.informativa_versione !== VERSIONE_INFORMATIVA) {
  // L'informativa è cambiata dopo la registrazione: lo segnaliamo (art. 13 GDPR)
  mostraMessaggio(messaggio, `L'informativa privacy è stata aggiornata alla versione ${VERSIONE_INFORMATIVA}. La trovi in fondo a ogni pagina.`, 'info');
}

// ---------- Dati dell'account ----------
document.getElementById('p-email').textContent = utente.email;
document.getElementById('p-registrato').textContent = formattaData(utente.created_at);
document.getElementById('p-accesso').textContent = formattaDataOra(utente.last_sign_in_at);
document.getElementById('p-informativa').textContent = meta.informativa_accettata_il
  ? `versione ${meta.informativa_versione ?? '—'}, il ${formattaData(meta.informativa_accettata_il)}`
  : '—';

// ---------- Consenso newsletter (facoltativo e revocabile) ----------
const casellaNewsletter = document.getElementById('p-newsletter');
const msgConsensi = document.getElementById('msg-consensi');
casellaNewsletter.checked = meta.newsletter === true;

casellaNewsletter.addEventListener('change', async () => {
  nascondiMessaggio(msgConsensi);
  const attivo = casellaNewsletter.checked;
  const adesso = new Date().toISOString();
  casellaNewsletter.disabled = true;

  const { error } = await supabase.auth.updateUser({
    data: attivo
      ? { newsletter: true, newsletter_consenso_il: adesso, newsletter_revocato_il: null }
      : { newsletter: false, newsletter_revocato_il: adesso },
  });

  casellaNewsletter.disabled = false;
  if (error) {
    casellaNewsletter.checked = !attivo; // torna allo stato precedente
    return mostraMessaggio(msgConsensi, traduciErrore(error), 'errore');
  }
  mostraMessaggio(msgConsensi, attivo ? 'Consenso alla newsletter registrato.' : 'Consenso alla newsletter revocato.', 'successo');
});

// ---------- Scarica i miei dati ----------
document.getElementById('scarica').addEventListener('click', async () => {
  // Rilegge l'utente per avere i consensi aggiornati
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user ?? utente;

  const copia = {
    esportato_il: new Date().toISOString(),
    account: {
      email: u.email,
      registrato_il: u.created_at,
      ultimo_accesso: u.last_sign_in_at,
    },
    consensi: u.user_metadata ?? {},
    // Quando ci saranno le donazioni, andranno aggiunte qui
  };

  // Crea un file e lo fa scaricare al browser
  const file = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = 'food-rescue-i-miei-dati.json';
  link.click();
  URL.revokeObjectURL(link.href);
});

// ---------- Elimina l'account ----------
const dialogo = document.getElementById('dialogo-elimina');
const campoConferma = document.getElementById('conferma-elimina');
const bottoneConferma = document.getElementById('conferma');
const msgElimina = document.getElementById('msg-elimina');

document.getElementById('apri-elimina').addEventListener('click', () => {
  campoConferma.value = '';
  bottoneConferma.disabled = true;
  nascondiMessaggio(msgElimina);
  dialogo.showModal();
});

document.getElementById('annulla').addEventListener('click', () => dialogo.close());

// Il bottone si attiva solo dopo aver scritto ELIMINA, per evitare clic accidentali
campoConferma.addEventListener('input', () => {
  bottoneConferma.disabled = campoConferma.value.trim().toUpperCase() !== 'ELIMINA';
});

bottoneConferma.addEventListener('click', async () => {
  bottoneConferma.disabled = true;

  // La cancellazione vera la fa il server (Edge Function "elimina-account"),
  // perché dal browser non si può eliminare un utente in modo sicuro.
  const { error } = await supabase.functions.invoke('elimina-account');

  if (error) {
    bottoneConferma.disabled = false;
    return mostraMessaggio(msgElimina, `Eliminazione non riuscita: ${traduciErrore(error)}`, 'errore');
  }

  await supabase.auth.signOut();
  location.href = 'login.html?eliminato=1';
});
