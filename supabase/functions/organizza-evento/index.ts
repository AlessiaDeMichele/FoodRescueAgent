// =========================================================
// Edge Function "organizza-evento"
//
// Riceve dal form (evento.html) il JSON con evento e pietanze,
// lo controlla e lo invia all'IA insieme al prompt di sistema.
// Restituisce { ok: true, risposta: "<testo Markdown>" }.
//
// L'IA è servita da Groq (API compatibile con OpenAI).
// La chiave sta SOLO qui, come secret di Supabase:
//   supabase secrets set GROQ_API_KEY=...
// Facoltativo, per cambiare modello senza toccare il codice:
//   supabase secrets set GROQ_MODEL=...
// Pubblicazione:
//   supabase functions deploy organizza-evento
// =========================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { SYSTEM_PROMPT } from "./system_prompt.ts";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Modello predefinito: quello che Groq indica come sostituto di llama-3.3-70b-versatile,
// dismesso per i piani gratuito e Developer. Con un contratto Enterprise si può
// impostare GROQ_MODEL=llama-3.3-70b-versatile.
const MODELLO = Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-120b";

const TIPI_EVENTO = ["Pranzo", "Cena", "Buffet", "Aperitivo", "Festa"];
const UNITA = ["g", "ml", "pz", "cucchiai", "q.b."];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function risposta(corpo: unknown, stato = 200) {
  return new Response(JSON.stringify(corpo), {
    status: stato,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const intero = (v: unknown, min: number) => Number.isInteger(v) && (v as number) >= min;
const numero = (v: unknown, min: number) => typeof v === "number" && Number.isFinite(v) && v >= min;
const testo = (v: unknown, max: number) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

// Controllo lato server: il form controlla già tutto, ma qui non ci si fida del browser.
// Restituisce un messaggio di errore oppure null se i dati vanno bene.
function controllaDati(d: any): string | null {
  const e = d?.evento;
  if (!e || !TIPI_EVENTO.includes(e.tipo_evento)) return "Tipo di evento non valido.";
  if (!intero(e.totale_invitati, 1) || e.totale_invitati > 10000) return "Numero di invitati non valido.";
  if (!intero(e.numero_bambini, 0) || e.numero_bambini > e.totale_invitati) return "Numero di bambini non valido.";

  if (!Array.isArray(d.pietanze) || d.pietanze.length < 1 || d.pietanze.length > 30) {
    return "Inserisci da 1 a 30 pietanze.";
  }
  for (const p of d.pietanze) {
    if (!testo(p?.nome_pietanza, 150)) return "Ogni pietanza deve avere un nome (max 150 caratteri).";
    if (typeof p.ha_ricetta_utente !== "boolean") return "Campo ha_ricetta_utente non valido.";
    if (!Array.isArray(p.ingredienti)) return "Campo ingredienti non valido.";

    if (!p.ha_ricetta_utente) {
      if (p.persone_riferimento !== null || p.ingredienti.length > 0) {
        return `"${p.nome_pietanza}": senza ricetta non servono dosi né ingredienti.`;
      }
      continue;
    }
    if (!intero(p.persone_riferimento, 1)) return `"${p.nome_pietanza}": persone di riferimento non valide.`;
    if (p.ingredienti.length < 1 || p.ingredienti.length > 50) {
      return `"${p.nome_pietanza}": inserisci da 1 a 50 ingredienti.`;
    }
    for (const i of p.ingredienti) {
      if (!testo(i?.nome_ingrediente, 150)) return `"${p.nome_pietanza}": ingrediente senza nome.`;
      if (!UNITA.includes(i.unita_misura)) return `"${i.nome_ingrediente}": unità di misura non valida.`;
      if (!numero(i.quantita_base, 0)) return `"${i.nome_ingrediente}": quantità non valida.`;
      if (typeof i.gia_disponibile !== "boolean" || !numero(i.quantita_disponibile, 0)) {
        return `"${i.nome_ingrediente}": dati della dispensa non validi.`;
      }
    }
  }
  return null;
}

// Tiene solo i campi previsti, così all'IA non arriva altro.
function pulisci(d: any) {
  return {
    evento: {
      tipo_evento: d.evento.tipo_evento,
      totale_invitati: d.evento.totale_invitati,
      numero_bambini: d.evento.numero_bambini,
    },
    pietanze: d.pietanze.map((p: any) => ({
      nome_pietanza: p.nome_pietanza.trim(),
      ha_ricetta_utente: p.ha_ricetta_utente,
      persone_riferimento: p.persone_riferimento,
      ingredienti: p.ingredienti.map((i: any) => ({
        nome_ingrediente: i.nome_ingrediente.trim(),
        quantita_base: i.quantita_base,
        unita_misura: i.unita_misura,
        gia_disponibile: i.gia_disponibile,
        quantita_disponibile: i.quantita_disponibile,
      })),
    })),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return risposta({ error: "Metodo non consentito" }, 405);

  const chiave = Deno.env.get("GROQ_API_KEY");
  if (!chiave) {
    console.error("Manca il secret GROQ_API_KEY");
    return risposta({ error: "Il servizio di IA non è configurato." }, 500);
  }

  // Solo utenti che hanno fatto l'accesso: ogni richiesta all'IA consuma il limite della chiave.
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: utente } = await supabase.auth.getUser();
  if (!utente?.user) return risposta({ error: "Accesso richiesto" }, 401);

  let dati: unknown;
  try {
    dati = await req.json();
  } catch {
    return risposta({ error: "Il corpo della richiesta non è un JSON valido." }, 400);
  }
  const errore = controllaDati(dati);
  if (errore) return risposta({ error: errore }, 400);

  const json = pulisci(dati);

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${chiave}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        model: MODELLO,
        temperature: 0.2, // risposte stabili: qui servono calcoli, non creatività
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: "Dati dell'evento inseriti nel form:\n\n```json\n" + JSON.stringify(json, null, 2) + "\n```",
          },
        ],
      }),
    });

    if (res.status === 429) {
      return risposta({ error: "Troppe richieste in poco tempo. Riprova tra qualche minuto." }, 429);
    }
    if (!res.ok) {
      console.error("Errore Groq", res.status, await res.text());
      return risposta({ error: "Il servizio di IA non risponde. Riprova più tardi." }, 502);
    }

    const corpo = await res.json();
    const scelta = corpo.choices?.[0];
    const testoRisposta = (scelta?.message?.content ?? "").trim();
    if (!testoRisposta) {
      console.error("Risposta Groq vuota", JSON.stringify(corpo).slice(0, 500));
      return risposta({ error: "L'IA non ha restituito una risposta. Riprova." }, 502);
    }

    return risposta({
      ok: true,
      risposta: testoRisposta,
      troncata: scelta.finish_reason === "length",
    });
  } catch (err) {
    console.error(err);
    const scaduto = err instanceof DOMException && err.name === "TimeoutError";
    return risposta({ error: scaduto ? "L'IA ha impiegato troppo tempo. Riprova." : "Errore interno." }, scaduto ? 504 : 500);
  }
});
