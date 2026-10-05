// =========================================================
// Connessione al backend.
// Tutte le pagine importano `supabase` da qui.
// - Se config.js contiene URL e chiave → client Supabase vero.
// - Altrimenti → client DEMO (js/demo.js) con la stessa interfaccia,
//   così il codice delle pagine non cambia.
// =========================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { creaClientDemo } from './demo.js';

export const MODALITA_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

let client;

if (MODALITA_DEMO) {
  client = creaClientDemo();
} else {
  // La libreria viene scaricata solo se serve davvero
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = client;
