// Pagina login.html

import { supabase } from './supabase.js';
import { mostraMessaggio, nascondiMessaggio, traduciErrore } from './ui.js';
import { utenteCorrente } from './auth.js';

const modulo = document.getElementById('modulo-login');
const messaggio = document.getElementById('messaggio');
const bottone = modulo.querySelector('button[type="submit"]');
const parametri = new URLSearchParams(location.search);

// Dove andare dopo il login. Accettiamo solo nomi di pagine del sito
// (es. "profilo.html"), per evitare che un link malevolo porti altrove.
const torna = parametri.get('torna');
const destinazione = /^[a-z-]+\.html$/.test(torna ?? '') ? torna : 'profilo.html';

if (parametri.has('eliminato')) {
  mostraMessaggio(messaggio, 'Il tuo account e i tuoi dati sono stati eliminati.', 'successo');
} else if (torna) {
  mostraMessaggio(messaggio, 'Accedi per continuare.', 'info');
}

// Chi è già collegato va direttamente avanti
if (await utenteCorrente()) location.href = destinazione;

modulo.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  nascondiMessaggio(messaggio);

  const email = modulo.email.value.trim().toLowerCase();
  const password = modulo.password.value;

  if (!email || !password) {
    return mostraMessaggio(messaggio, 'Inserisci email e password.', 'errore');
  }

  bottone.disabled = true;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  bottone.disabled = false;

  if (error) {
    modulo.password.value = '';
    return mostraMessaggio(messaggio, traduciErrore(error), 'errore');
  }

  location.href = destinazione;
});
