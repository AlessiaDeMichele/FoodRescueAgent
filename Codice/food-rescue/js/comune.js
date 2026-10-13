// =========================================================
// Codice eseguito su OGNI pagina:
// 1. forza HTTPS (requisito R6)
// 2. mostra/nasconde le voci del menu in base all'utente
// 3. mostra l'avviso quando il sito è in modalità demo
// =========================================================

import { MODALITA_DEMO } from './supabase.js';
import { utenteCorrente, eAdmin, esci } from './auth.js';

// 1. R6 – Il sito deve viaggiare solo su HTTPS.
//    In locale (Live Server) si usa http, quindi lì non si reindirizza.
const inLocale = ['localhost', '127.0.0.1'].includes(location.hostname);
if (location.protocol === 'http:' && !inLocale) {
  location.replace(location.href.replace('http:', 'https:'));
}

// 2. Menu: gli elementi con data-solo="..." si vedono solo a:
//    "ospite" → chi non ha fatto l'accesso
//    "utente" → chi ha fatto l'accesso
//    "admin"  → gli amministratori
async function aggiornaMenu() {
  const utente = await utenteCorrente();
  const admin = await eAdmin(utente);

  document.querySelectorAll('[data-solo]').forEach((el) => {
    const per = el.dataset.solo;
    const visibile =
      (per === 'ospite' && !utente) ||
      (per === 'utente' && utente) ||
      (per === 'admin' && admin);
    el.hidden = !visibile;
  });

  // Evidenzia nel menu la pagina in cui ci troviamo
  const pagina = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu a').forEach((a) => {
    if (a.getAttribute('href') === pagina) a.setAttribute('aria-current', 'page');
  });

  document.getElementById('esci')?.addEventListener('click', esci);
}

// 3. Avviso modalità demo
function mostraAvvisoDemo() {
  if (!MODALITA_DEMO) return;
  const banner = document.createElement('div');
  banner.className = 'banner-demo';
  banner.innerHTML =
    '<div class="contenitore"><p><strong>Modalità demo:</strong> Supabase non è ancora collegato. ' +
    'Account e centri sono finti e restano solo in questo browser. ' +
    "Per provare il pannello di amministrazione registrati con un'email che inizia con <em>admin</em>.</p></div>";
  document.body.prepend(banner);
}

mostraAvvisoDemo();
aggiornaMenu();
