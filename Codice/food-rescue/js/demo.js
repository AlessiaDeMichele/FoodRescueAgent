// =========================================================
// CLIENT DEMO (non è il database!)
// Imita le funzioni di Supabase usate dal sito, salvando dati finti
// nel localStorage del browser. Serve solo per provare le pagine
// prima che il database vero sia pronto.
//
// - Le password NON vengono salvate: in demo qualsiasi password
//   è accettata per un'email già registrata.
// - È amministratore chi si registra con un'email che inizia con "admin".
// - Imita le regole di sicurezza che il database vero dovrà avere:
//   tutti leggono i centri, solo gli amministratori li modificano.
//
// Quando config.js è compilato, questo file non viene più usato.
// =========================================================

const CHIAVE_UTENTI = 'foodrescue_demo_utenti';
const CHIAVE_SESSIONE = 'foodrescue_demo_sessione';
const CHIAVE_CENTRI = 'foodrescue_demo_centri';

// Centri di esempio, chiaramente fittizi
const CENTRI_ESEMPIO = [
  { id: 'esempio-1', nome: 'Centro di esempio Milano Nord', indirizzo: 'Via di prova 1', citta: 'Milano', email: 'milano.nord@esempio.it', latitudine: 45.4955, longitudine: 9.205, categorie_accettate: ['fresco', 'pane', 'secco'], ente_terzo_settore: true },
  { id: 'esempio-2', nome: 'Centro di esempio Milano Sud', indirizzo: 'Via di prova 2', citta: 'Milano', email: 'milano.sud@esempio.it', latitudine: 45.441, longitudine: 9.185, categorie_accettate: ['secco', 'surgelato'], ente_terzo_settore: true },
  { id: 'esempio-3', nome: 'Centro di esempio Bologna', indirizzo: 'Via di prova 3', citta: 'Bologna', email: 'bologna@esempio.it', latitudine: 44.495, longitudine: 11.343, categorie_accettate: ['pronto', 'surgelato', 'pane'], ente_terzo_settore: true },
  { id: 'esempio-4', nome: 'Centro di esempio Roma', indirizzo: 'Via di prova 4', citta: 'Roma', email: 'roma@esempio.it', latitudine: 41.9, longitudine: 12.49, categorie_accettate: ['fresco', 'pronto', 'pane'], ente_terzo_settore: true },
  { id: 'esempio-5', nome: 'Centro di esempio Napoli', indirizzo: 'Via di prova 5', citta: 'Napoli', email: 'napoli@esempio.it', latitudine: 40.85, longitudine: 14.265, categorie_accettate: ['secco', 'fresco'], ente_terzo_settore: true },
];

// ---------- Archivio nel browser ----------

function leggi(chiave, predefinito) {
  try { return JSON.parse(localStorage.getItem(chiave)) ?? predefinito; } catch { return predefinito; }
}

function scrivi(chiave, valore) {
  try { localStorage.setItem(chiave, JSON.stringify(valore)); } catch { /* browser senza storage */ }
}

const leggiUtenti = () => leggi(CHIAVE_UTENTI, []);
const salvaUtenti = (utenti) => scrivi(CHIAVE_UTENTI, utenti);
const leggiCentri = () => leggi(CHIAVE_CENTRI, structuredClone(CENTRI_ESEMPIO));
const salvaCentri = (centri) => scrivi(CHIAVE_CENTRI, centri);

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

// ---------- Query sulle tabelle: supabase.from('centri').select()... ----------

class Query {
  constructor(tabella) {
    this.tabella = tabella;
    this.azione = 'select';
    this.filtri = [];
    this.ordine = null;
    this.singolo = false;
    this.restituisci = false;
    this.valori = null;
  }

  select() {
    if (this.azione !== 'select') this.restituisci = true; // es. insert(...).select()
    return this;
  }
  insert(valori) { this.azione = 'insert'; this.valori = Array.isArray(valori) ? valori : [valori]; return this; }
  update(valori) { this.azione = 'update'; this.valori = valori; return this; }
  delete() { this.azione = 'delete'; return this; }
  eq(colonna, valore) { this.filtri.push([colonna, valore]); return this; }
  order(colonna, { ascending = true } = {}) { this.ordine = { colonna, ascending }; return this; }
  single() { this.singolo = true; return this; }

  // Permette di scrivere `await supabase.from(...)...`, come con Supabase
  then(ok, ko) {
    return attesa(150).then(() => this.esegui()).then(ok, ko);
  }

  esegui() {
    const utente = utenteDiSessione();
    const admin = Boolean(utente?.email.startsWith('admin'));
    let righe;

    if (this.tabella === 'profili') {
      // Ognuno legge solo il proprio profilo
      if (this.azione !== 'select') return errore('new row violates row-level security policy');
      righe = utente ? [{ id: utente.id, is_admin: admin }] : [];
    } else if (this.tabella === 'centri') {
      // Tutti leggono i centri, solo gli amministratori li modificano
      if (this.azione !== 'select' && !admin) return errore('new row violates row-level security policy');
      righe = leggiCentri();
    } else {
      return errore(`Tabella ${this.tabella} non disponibile in demo`);
    }

    const corrisponde = (riga) => this.filtri.every(([c, v]) => riga[c] === v);
    let risultato;

    if (this.azione === 'select') {
      risultato = righe.filter(corrisponde);
    } else if (this.azione === 'insert') {
      risultato = this.valori.map((v) => ({ id: nuovoId(), creato_il: new Date().toISOString(), ...v }));
      salvaCentri([...righe, ...risultato]);
    } else if (this.azione === 'update') {
      risultato = righe.filter(corrisponde);
      risultato.forEach((r) => Object.assign(r, this.valori));
      salvaCentri(righe);
    } else if (this.azione === 'delete') {
      risultato = righe.filter(corrisponde);
      salvaCentri(righe.filter((r) => !corrisponde(r)));
    }

    if (this.ordine) {
      const { colonna, ascending } = this.ordine;
      risultato.sort((a, b) => String(a[colonna]).localeCompare(String(b[colonna]), 'it') * (ascending ? 1 : -1));
    }

    const copia = structuredClone(risultato);
    if (this.singolo) {
      return copia.length === 1 ? { data: copia[0], error: null } : errore('Nessun risultato');
    }
    if (this.azione !== 'select' && !this.restituisci) return { data: null, error: null };
    return { data: copia, error: null };
  }
}

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

    from(tabella) {
      return new Query(tabella);
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
