# Food Rescue Agent – Frontend

Sito statico in HTML, CSS e JavaScript, collegato a Supabase.

- **M1** – registrazione e login con gestione della privacy
- **M2** – pannello di amministrazione dei centri di raccolta e mappa interattiva

## Pagine

| Pagina | A cosa serve |
|---|---|
| `index.html` | Home del progetto |
| `registrazione.html` | Creazione account: informativa breve, email, password, consensi |
| `login.html` | Accesso |
| `privacy.html` | Informativa privacy completa (art. 13 GDPR) |
| `profilo.html` | Dati dell'account, consenso newsletter, download dei dati, eliminazione account |
| `mappa.html` | Mappa interattiva dei centri, filtro per alimenti, elenco, "più vicini a me" (aperta a tutti) |
| `admin.html` | Inserire, modificare ed eliminare i centri (solo amministratori) |
| `evento.html` | Form "Organizza un evento": crea il JSON con evento e pietanze (per ora solo da copiare o scaricare) |

## Organizza un evento (form → JSON → IA)

**Stato attuale:** la pagina genera solo il JSON (si può copiare o scaricare come `evento.json`).
Non chiede l'accesso e non è ancora collegata né all'IA né al database. Da fare più avanti:
- accesso: in `js/evento.js` importare `richiediLogin` da `auth.js` e chiamarlo all'inizio; nel menu delle pagine rimettere `data-solo="utente" hidden` sulla voce "Organizza un evento";
- IA: inviare il JSON con `supabase.functions.invoke('organizza-evento', { body: json })` e mostrare `data.risposta` (Markdown). La funzione è già pronta, vedi sotto.

1. L'utente compila `evento.html`: tipo di evento, invitati, bambini e le pietanze.
   Per ogni pietanza può inserire la propria ricetta (persone di riferimento, ingredienti, dispensa) oppure lasciarla all'IA.
2. `js/evento.js` controlla i dati e costruisce questo JSON (il bottone "Genera il JSON" lo mostra):

```json
{
  "evento": { "tipo_evento": "Cena", "totale_invitati": 10, "numero_bambini": 2 },
  "pietanze": [
    { "nome_pietanza": "Pasta al forno", "ha_ricetta_utente": true, "persone_riferimento": 4,
      "ingredienti": [
        { "nome_ingrediente": "Rigatoni", "quantita_base": 400, "unita_misura": "g", "gia_disponibile": false, "quantita_disponibile": 0 }
      ] },
    { "nome_pietanza": "Pollo al forno con patate", "ha_ricetta_utente": false, "persone_riferimento": null, "ingredienti": [] }
  ]
}
```

   Unità ammesse: `g`, `ml`, `pz`, `cucchiai`, `q.b.` (con `q.b.` la quantità vale 0).
3. Il JSON va alla Edge Function `organizza-evento` (`supabase/functions/organizza-evento/`), che lo ricontrolla,
   aggiunge il prompt di sistema (`AI/system_prompt.txt`) e chiede all'IA il calcolo. La risposta (Markdown) compare nella pagina.

L'IA è servita da **Groq** (chiave da https://console.groq.com/keys). La chiave **non** va nel sito: sta solo nei secret di Supabase. Chi gestisce il backend esegue:

```
supabase secrets set GROQ_API_KEY=la-chiave
supabase functions deploy organizza-evento
```

Modello predefinito: `openai/gpt-oss-120b`, che Groq indica come sostituto di `llama-3.3-70b-versatile`.
I modelli Llama sono stati dismessi per i piani gratuito e Developer (spenti il 16/08/2026).
Per usare un altro modello senza toccare il codice: `supabase secrets set GROQ_MODEL=nome-del-modello`.

`system_prompt.ts` nella cartella della funzione è una copia di `AI/system_prompt.txt`: se cambiate il prompt, aggiornate entrambi.
In modalità demo la pagina risponde con un calcolo simulato (P_eq, fattore K, dispensa) senza chiamare l'IA.

## Come avviarlo sul tuo computer

1. Apri la cartella `food-rescue` con **Visual Studio Code**.
2. Installa l'estensione **Live Server** (se non l'hai già).
3. Tasto destro su `index.html` → **Open with Live Server**.

Non aprire i file con doppio clic: le pagine usano moduli JavaScript (`type="module"`),
che il browser carica solo tramite un server, anche locale come Live Server.

## Modalità demo

Finché `js/config.js` non contiene i dati di Supabase, il sito funziona in **modalità demo**:
in alto compare una striscia gialla; account e centri sono finti e salvati solo nel tuo browser.
Le password in demo non vengono salvate.

**Per provare il pannello admin in demo:** registrati con un'email che inizia con `admin`
(es. `admin@prova.it`). Nel menu compare "Gestione centri". Gli altri utenti non lo vedono.

Per ripartire da zero con i 5 centri di esempio: nel browser F12 → Application (o Archiviazione) →
Local Storage → elimina le voci che iniziano con `foodrescue_demo`.
Serve per provare tutte le pagine prima che il database sia pronto.

La modalità demo è tutta nel file `js/demo.js`. Non è un database: imita soltanto le risposte di Supabase.

## Collegare Supabase (quando il database è pronto)

1. Chiedi a chi gestisce il database l'**URL del progetto** e la **chiave pubblica** (anon / publishable).
2. Incollali in `js/config.js`. La striscia "Modalità demo" sparisce.
3. Non mettere mai in `config.js` la chiave `service_role` / secret.

Impostazioni da verificare nel pannello Supabase (le fa chi gestisce il backend):

- **Authentication → Providers → Email**: attivo. Con "Confirm email" attivo, dopo la registrazione l'utente riceve un'email di conferma; il sito lo gestisce già.
- **Authentication → URL Configuration**: inserire l'indirizzo del sito pubblicato come Site URL e tra i Redirect URLs (anche `http://localhost:5500` per Live Server).
- **Regione del progetto**: meglio una regione UE (es. Francoforte), da indicare poi nell'informativa.

## Cosa serve dal backend

Il compagno del database deve usare **esattamente** questi nomi, altrimenti il frontend non trova i dati.

**Tabella `profili`** – una riga per utente, creata in automatico alla registrazione

| Colonna | Tipo | Note |
|---|---|---|
| `id` | uuid | uguale all'id dell'utente in `auth.users` |
| `is_admin` | boolean | `false` di default; si mette a `true` a mano per gli amministratori |

**Tabella `centri`**

| Colonna | Tipo | Note |
|---|---|---|
| `id` | uuid | generato dal database |
| `nome` | text | |
| `indirizzo` | text | |
| `citta` | text | |
| `email` | text | riceve gli avvisi delle donazioni |
| `latitudine` | double precision | |
| `longitudine` | double precision | |
| `categorie_accettate` | text[] (array) | valori possibili: `fresco`, `pane`, `secco`, `surgelato`, `pronto` (vedi `js/categorie.js`) |
| `ente_terzo_settore` | boolean | conferma che è un ente del Terzo Settore (R10) |

**Regole di sicurezza (Row Level Security), indispensabili:**

- `centri`: lettura per tutti (anche chi non ha fatto l'accesso); inserimento, modifica ed eliminazione solo se il profilo dell'utente ha `is_admin = true`.
- `profili`: ogni utente legge solo il proprio profilo e nessuno può modificare `is_admin` dal sito.

Il controllo in `admin.html` nasconde soltanto la pagina: senza queste regole chiunque potrebbe modificare i centri.
Se una modifica viene rifiutata, il pannello mostra "controlla di avere i permessi".

**Autenticazione e funzioni:**

| Cosa | Dettagli |
|---|---|
| Supabase Auth | `signUp`, `signInWithPassword`, `signOut`, `getSession`, `updateUser`. Le password sono salvate da Supabase con hash bcrypt. |
| Dati salvati in `user_metadata` | `informativa_versione`, `informativa_accettata_il`, `newsletter` (true/false), `newsletter_consenso_il`, `newsletter_revocato_il` |
| Edge Function `elimina-account` | Chiamata dal profilo senza parametri. Deve eliminare l'utente collegato (con la chiave service_role, solo lato server) e tutti i suoi dati. Risposta attesa: `{ "ok": true }`. |

## Requisiti legali: dove sono rispettati

Riferimenti alla *Documentazione legale di progetto* (sezione 4).

| Rif. | Requisito | Dove |
|---|---|---|
| R1 | Informativa prima della registrazione, checkbox non pre-spuntata con link | `registrazione.html`: riquadro "Come usiamo i tuoi dati" e casella obbligatoria senza `checked` |
| R2 | Titolare, dati, finalità, conservazione, diritti | `privacy.html`, sezioni 1–7 |
| R3 | Base giuridica contratto; consenso newsletter separato e facoltativo | Casella newsletter distinta in registrazione, revocabile dal profilo; basi giuridiche in `privacy.html` sez. 3 |
| R4 | Solo dati necessari | Il modulo chiede solo email e password |
| R5 | Password con hash e salt | Gestito da Supabase Auth (bcrypt); il sito non salva mai password |
| R6 | Solo HTTPS | `js/comune.js` reindirizza da http a https; `_headers` attiva HSTS su Netlify |
| R7 | Registri e controlli sugli accessi | Ultimo accesso visibile nel profilo; registri di accesso di Supabase Auth (backend) |
| R8 | Cancellazione dell'account | `profilo.html`: "Elimina l'account" con conferma; in più "Scarica i miei dati" (art. 15 e 20 GDPR) |
| R9 | Tracciabilità delle donazioni | Milestone M3 (registrazione dei prodotti) |
| R10 | Donazioni solo a enti del Terzo Settore con corrette prassi | `admin.html`: un centro si può salvare solo confermando che è un ente del Terzo Settore che applica il Manuale di corrette prassi |

Il consenso è registrato con versione dell'informativa e data e ora: se l'informativa cambia,
aumentate `VERSIONE_INFORMATIVA` in `js/config.js` e il profilo segnala l'aggiornamento agli utenti.

## Mappa e privacy

- Le immagini della mappa arrivano da OpenStreetMap e la libreria Leaflet da jsDelivr: entrambi ricevono l'indirizzo IP del visitatore (scritto nell'informativa, sez. 5).
- "Mostra i più vicini a me" usa la posizione solo dentro la pagina per calcolare le distanze: non viene inviata né salvata (informativa, sez. 8).
- Nel pannello admin, "Trova dall'indirizzo" usa Nominatim di OpenStreetMap (gratis, massimo 1 richiesta al secondo): riceve solo l'indirizzo del centro.
- Se la mappa non si carica (es. senza connessione), la pagina mostra comunque l'elenco dei centri.

L'informativa è passata alla versione 1.1 (`VERSIONE_INFORMATIVA` in `js/config.js`): chi si era registrato con la 1.0 vede un avviso nel profilo.

## Da completare prima della pubblicazione

In `privacy.html` le parti evidenziate in giallo vanno compilate con il gruppo legale:
data di pubblicazione, nome della scuola o università, email di contatto,
giorni di conservazione dei registri di accesso, regione di Supabase, servizio di hosting.

## Struttura dei file

```
food-rescue/
├── index.html, registrazione.html, login.html, privacy.html, profilo.html
├── mappa.html, admin.html
├── css/style.css        colori e stili di tutto il sito
├── js/
│   ├── config.js        dati di Supabase e versione dell'informativa
│   ├── supabase.js      collegamento: Supabase vero oppure demo
│   ├── demo.js          finto backend per la modalità demo
│   ├── comune.js        su ogni pagina: HTTPS, menu, avviso demo
│   ├── auth.js          utente collegato, protezione pagine, logout
│   ├── ui.js            messaggi, date, traduzione degli errori
│   ├── categorie.js     tipi di alimenti accettati dai centri
│   ├── distanza.js      calcolo della distanza tra due punti
│   ├── registrazione.js, login.js, profilo.js, mappa.js, admin.js   codice delle singole pagine
├── _headers             intestazioni di sicurezza per Netlify
└── README.md
```

## Pubblicazione

Su **Netlify**: accedi, scegli "Add new site → Deploy manually" e trascina la cartella `food-rescue`.
Netlify pubblica il sito su HTTPS e applica il file `_headers`.
In alternativa si collega il repository GitHub, così ogni modifica viene pubblicata in automatico.

## Librerie esterne

- `@supabase/supabase-js` caricata da jsDelivr solo quando Supabase è configurato.
- Leaflet 1.9.4 (mappe) caricata da jsDelivr nelle pagine `mappa.html` e `admin.html`.
- Nessun font esterno: il sito usa i caratteri di sistema, così l'indirizzo IP dei visitatori non viene inviato a Google Fonts.
