// Funzioni di accesso usate dalle pagine.

import { supabase } from './supabase.js';

// Restituisce l'utente collegato, oppure null.
export async function utenteCorrente() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

// Da chiamare all'inizio delle pagine riservate agli utenti registrati.
// Se nessuno è collegato, manda al login e poi riporta qui.
export async function richiediLogin() {
  const utente = await utenteCorrente();
  if (!utente) {
    const pagina = location.pathname.split('/').pop() || 'index.html';
    location.href = `login.html?torna=${encodeURIComponent(pagina)}`;
    // Una promessa che non si risolve mai: il resto della pagina non viene eseguito
    return new Promise(() => {});
  }
  return utente;
}

export async function esci() {
  await supabase.auth.signOut();
  location.href = 'index.html';
}
