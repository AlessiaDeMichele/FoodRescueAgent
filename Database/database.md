Tabella Utente_Fisico: nome, cognome, id_utente (PK)

Tabella Utente_Impresa: nome_impresa, id_impresa (PK), posizione

Tabella Centro_Raccolta: nome_centro, id_centro (PK), posizione

Tabella Donazione: id_donatore_fisico (FK: id_utente, può essere NULL), id_donatore_impresa (FK: id_impresa, può essere NULL), nome, categoria, data_scadenza, quantità, id_donazione, data_donazione, centro_raccolta (FK: id_centro)

(una FK non può puntare a due diverse colonne di due diverse tabelle, quindi si creano due FK per ogni colonna a cui si vuole puntare con la regola speciale che solo una di queste FK per tupla può essre valorizzata)

Tabella Evento: numero_invitati, id_ingredienti (FK: id_spesa), id_evento (PK), id_utente (FK: id_utente, può essere NULL), id_impresa (FK: id_impresa, può essere NULL), id_centro (FK: id_centro, può essere NULL), budget

Tabella Ingrediente_Evento: id_evento (FK: id_evento), id_ingrediente (FK: id_ingrediente), quantita, (PK: id_evento e id_ingrediente)

Tabella Ingrediente: id_ingrediente (PK), nome

Tabella Messaggio: id_messaggio (PK), id_conversazione (FK: id_conversazione), testo, timestamp_invio, inviato_da_centro (BOOLEAN, se TRUE il messaggio è stato inviato dal centro di raccolta, altrimenti dall'altro attore della conversazione, utente fisico o impresa)

Tabella Conversazione: id_utente (FK: id_utente), id_impresa (FK: id_impresa), id_centro (FK: id_centro), id_conversazione (PK)

Tabella Chat_IA: ???



Supabase (PostgreSQL), piano gratuito:
Unlimited API requests

50,000 monthly active users

500 MB database size
Shared CPU • 500 MB RAM

5 GB egress

5 GB cached egress

1 GB file storage

Community support

Cose da chiedere:
1. Attributo "budget" nella tabella Evento, ha senso nel nostro progetto?
2. L'evento può essere organizzato da quali tipi di utenti?
3. Servono specifiche aggiuntive per quanto riguarda l' "evento".
4. La chat con l'agente IA deve essere stateless oppure deve essere salvata?
