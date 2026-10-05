// Pagina registrazione.html
// Requisiti legali: R1 (informativa + checkbox non pre-spuntata),
// R3 (consenso newsletter separato e facoltativo), R4 (solo email e password).

import { supabase } from './supabase.js';
import { VERSIONE_INFORMATIVA } from './config.js';
import { mostraMessaggio, nascondiMessaggio, traduciErrore } from './ui.js';
import { utenteCorrente } from './auth.js';

const modulo = document.getElementById('modulo-registrazione');
const messaggio = document.getElementById('messaggio');
const bottone = modulo.querySelector('button[type="submit"]');

// Chi è già collegato non ha bisogno di registrarsi
if (await utenteCorrente()) location.href = 'profilo.html';

modulo.addEventListener('submit', async (evento) => {
  evento.preventDefault(); // evita il ricaricamento della pagina
  nascondiMessaggio(messaggio);

  const email = modulo.email.value.trim().toLowerCase();
  const password = modulo.password.value;
  const password2 = modulo.password2.value;
  const privacy = modulo.privacy.checked;
  const newsletter = modulo.newsletter.checked;

  // Controlli prima dell'invio
  if (!modulo.email.checkValidity()) {
    return mostraMessaggio(messaggio, "Inserisci un indirizzo email valido.", 'errore');
  }
  if (password.length < 8) {
    return mostraMessaggio(messaggio, 'La password deve avere almeno 8 caratteri.', 'errore');
  }
  if (password !== password2) {
    return mostraMessaggio(messaggio, 'Le due password non coincidono.', 'errore');
  }
  if (!privacy) {
    return mostraMessaggio(messaggio, "Per creare l'account devi dichiarare di aver letto l'informativa privacy.", 'errore');
  }

  bottone.disabled = true;
  const adesso = new Date().toISOString();

  // La password viaggia su HTTPS e Supabase la salva solo come hash bcrypt (R5)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Prova di presa visione e consensi: quale informativa, quando
      data: {
        informativa_versione: VERSIONE_INFORMATIVA,
        informativa_accettata_il: adesso,
        newsletter,
        newsletter_consenso_il: newsletter ? adesso : null,
      },
      emailRedirectTo: new URL('login.html', location.href).href,
    },
  });

  bottone.disabled = false;

  if (error) return mostraMessaggio(messaggio, traduciErrore(error), 'errore');

  if (data.session) {
    // Conferma email disattivata: l'utente è già collegato
    location.href = 'profilo.html?benvenuto=1';
  } else {
    modulo.reset();
    mostraMessaggio(messaggio, "Quasi fatto: ti abbiamo inviato un'email. Apri il link per confermare l'account, poi accedi.", 'successo');
  }
});
