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

// true se l'utente ha is_admin = true nella tabella "profili".
export async function eAdmin(utente) {
  if (!utente) return false;
  const { data } = await supabase.from('profili').select('is_admin').eq('id', utente.id).single();
  return data?.is_admin === true;
}

// Da chiamare all'inizio di admin.html.
// Attenzione: questo controllo serve solo all'interfaccia (nasconde la pagina).
// La vera protezione è sul database: le regole di Row Level Security devono
// permettere di modificare i centri solo agli amministratori (vedi README).
export async function richiediAdmin() {
  const utente = await richiediLogin();
  if (!(await eAdmin(utente))) {
    location.href = 'index.html';
    return new Promise(() => {});
  }
  return utente;
}

export async function esci() {
  await supabase.auth.signOut();
  location.href = 'index.html';
}
