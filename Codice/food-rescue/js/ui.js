// Piccole funzioni di interfaccia usate da più pagine.

// Mostra un messaggio in un elemento <p class="messaggio">.
// tipo: 'successo' | 'errore' | 'info'
export function mostraMessaggio(elemento, testo, tipo = 'info') {
  elemento.textContent = testo; // textContent (e non innerHTML) evita l'inserimento di codice
  elemento.className = `messaggio ${tipo}`;
  elemento.hidden = false;
  if (tipo === 'errore') elemento.setAttribute('role', 'alert');
}

export function nascondiMessaggio(elemento) {
  elemento.hidden = true;
  elemento.textContent = '';
}

// Crea un elemento HTML con testo sicuro: es. crea('td', 'Pane')
export function crea(tag, testo = '', classe = '') {
  const el = document.createElement(tag);
  if (testo) el.textContent = testo;
  if (classe) el.className = classe;
  return el;
}

export function formattaData(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formattaDataOra(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('it-IT', { dateStyle: 'long', timeStyle: 'short' });
}

// Traduce in italiano gli errori più comuni restituiti da Supabase
export function traduciErrore(errore) {
  const msg = errore?.message || '';
  if (/invalid login credentials/i.test(msg)) return 'Email o password non corretti.';
  if (/already registered|already been registered/i.test(msg)) return 'Esiste già un account con questa email. Prova ad accedere.';
  if (/email not confirmed/i.test(msg)) return "Devi prima confermare l'email: apri il link che ti abbiamo inviato.";
  if (/password should be at least/i.test(msg)) return 'La password deve avere almeno 8 caratteri.';
  if (/rate limit|too many/i.test(msg)) return 'Troppi tentativi in poco tempo. Aspetta qualche minuto e riprova.';
  if (/failed to fetch|network/i.test(msg)) return 'Connessione non riuscita. Controlla la rete e riprova.';
  if (/row-level security|permission|permesso/i.test(msg)) return 'Non hai i permessi per questa operazione.';
  return msg || 'Qualcosa non ha funzionato. Riprova.';
}
