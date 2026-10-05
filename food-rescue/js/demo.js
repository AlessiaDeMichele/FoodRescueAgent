// =========================================================
// CLIENT DEMO (non è il database!)
// Imita le poche funzioni di Supabase usate da queste pagine,
// salvando dati finti nel localStorage del browser.
// Serve solo per provare registrazione, login e profilo
// prima che il database vero sia pronto.
//
// Le password NON vengono salvate: in demo qualsiasi password
// è accettata per un'email già registrata.
// Quando config.js è compilato, questo file non viene più usato.
// =========================================================

const CHIAVE_UTENTI = 'foodrescue_demo_utenti';
const CHIAVE_SESSIONE = 'foodrescue_demo_sessione';

// ---------- Archivio nel browser ----------

function leggiUtenti() {
  try { return JSON.parse(localStorage.getItem(CHIAVE_UTENTI)) ?? []; } catch { return []; }
}

function salvaUtenti(utenti) {
  try { localStorage.setItem(CHIAVE_UTENTI, JSON.stringify(utenti)); } catch { /* browser senza storage */ }
}

function idSessione() {
  try { return localStorage.getItem(CHIAVE_SESSIONE); } catch { return null; }
}

function impostaSessione(id) {
  try {
    if (id) localStorage.setItem(CHIAVE_SESSIONE, id);
    else localStorage.removeItem(CHIAVE_SESSIONE);
  } catch { /* ignora */ }
}

function utenteDiSessione(utenti = leggiUtenti()) {
  return utenti.find((u) => u.id === idSessione()) ?? null;
}

function nuovoId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

const attesa = (ms) => new Promise((r) => setTimeout(r, ms)); // imita i tempi di rete
const errore = (message) => ({ data: null, error: { message } });

// ---------- Il client finto ----------

export function creaClientDemo() {
  return {
    auth: {
      async signUp({ email, password, options }) {
        await attesa(300);
        if (!password || password.length < 8) return errore('Password should be at least 8 characters');
        const utenti = leggiUtenti();
        if (utenti.some((u) => u.email === email)) return errore('User already registered');
        const adesso = new Date().toISOString();
        const user = { id: nuovoId(), email, created_at: adesso, last_sign_in_at: adesso, user_metadata: options?.data ?? {} };
        utenti.push(user);
        salvaUtenti(utenti);
        impostaSessione(user.id);
        return { data: { user, session: { user } }, error: null };
      },

      async signInWithPassword({ email, password }) {
        await attesa(300);
        const utenti = leggiUtenti();
        const user = utenti.find((u) => u.email === email);
        if (!user || !password) return errore('Invalid login credentials');
        user.last_sign_in_at = new Date().toISOString();
        salvaUtenti(utenti);
        impostaSessione(user.id);
        return { data: { user, session: { user } }, error: null };
      },

      async signOut() {
        impostaSessione(null);
        return { error: null };
      },

      async getSession() {
        const user = utenteDiSessione();
        return { data: { session: user ? { user } : null }, error: null };
      },

      async updateUser({ data }) {
        await attesa(200);
        const utenti = leggiUtenti();
        const user = utenteDiSessione(utenti);
        if (!user) return errore('Accesso richiesto');
        user.user_metadata = { ...user.user_metadata, ...data };
        salvaUtenti(utenti);
        return { data: { user }, error: null };
      },
    },

    functions: {
      // Simula la Edge Function "elimina-account" che scriverà il backend
      async invoke(nome) {
        await attesa(500);
        const utenti = leggiUtenti();
        const user = utenteDiSessione(utenti);
        if (!user) return errore('Accesso richiesto');
        if (nome === 'elimina-account') {
          salvaUtenti(utenti.filter((u) => u.id !== user.id));
          impostaSessione(null);
          return { data: { ok: true }, error: null };
        }
        return errore(`Funzione ${nome} non disponibile in demo`);
      },
    },
  };
}
