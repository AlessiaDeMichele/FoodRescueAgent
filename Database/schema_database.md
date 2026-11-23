Tabella Utente_Fisico: nome, cognome, id_utente (PK), email, password

Tabella Utente_Impresa: nome_impresa, id_impresa (PK), posizione, email, password

Tabella Centro_Raccolta: nome_centro, id_centro (PK), posizione, email, password

Tabella Donazione: id_donatore_fisico (FK: id_utente, può essere NULL), id_donatore_impresa (FK: id_impresa, può essere NULL), nome, categoria, data_scadenza, quantità, id_donazione (PK), data_donazione, centro_raccolta (FK: id_centro)

(una FK non può puntare a due diverse colonne di due diverse tabelle, quindi si creano due FK per ogni colonna a cui si vuole puntare con la regola speciale che solo una di queste FK per tupla può essere valorizzata)

Tabella Evento: tipo_evento, numero_invitati, numero_bambini, id_evento (PK), id_utente (FK: id_utente, può essere NULL), id_impresa (FK: id_impresa, può essere NULL), id_centro (FK: id_centro, può essere NULL), budget, data_creazione

(solo una tra id_utente, id_impresa e id_centro può essere valorizzata per tupla; tipo_evento può essere Pranzo, Cena, Buffet, Aperitivo o Festa; numero_bambini è compreso in numero_invitati ed è 0 se non specificato)

Tabella Pietanza_Evento: id_pietanza (PK), id_evento (FK: id_evento), nome_pietanza, ha_ricetta_utente (BOOLEAN, se TRUE l'utente ha fornito la ricetta con le dosi, altrimenti la ricetta viene proposta dall'IA), persone_riferimento (può essere NULL)

(persone_riferimento indica per quante persone è tarata la ricetta dell'utente; è NULL se ha_ricetta_utente è FALSE)

Tabella Ingrediente_Pietanza: id_pietanza (FK: id_pietanza), id_ingrediente (FK: id_ingrediente), quantita_base, unita, gia_disponibile (BOOLEAN, se TRUE l'utente ha già l'ingrediente in dispensa), quantita_disponibile, (PK: id_pietanza e id_ingrediente)

(contiene righe solo per le pietanze con ha_ricetta_utente TRUE; unita può essere g, ml, pz, cucchiai o q.b.; quantita_disponibile è 0 se gia_disponibile è FALSE)

Tabella Ingrediente: id_ingrediente (PK), nome

Tabella Messaggio: id_messaggio (PK), id_conversazione (FK: id_conversazione), testo, timestamp_invio, inviato_da_centro (BOOLEAN, se TRUE il messaggio è stato inviato dal centro di raccolta, altrimenti dall'altro attore della conversazione, utente fisico o impresa)

Tabella Conversazione: id_utente (FK: id_utente, può essere NULL), id_impresa (FK: id_impresa, può essere NULL), id_centro (FK: id_centro), id_conversazione (PK), data_creazione

(solo una tra id_utente e id_impresa può essere valorizzata per tupla; tra lo stesso centro e lo stesso utente o impresa può esistere una sola conversazione)

Tabella Chat_IA: id_chat (PK), id_evento (FK: id_evento), data_creazione

Tabella Messaggio_IA: id_messaggio_ia (PK), id_chat (FK: id_chat), testo, timestamp_invio, inviato_da_ia (BOOLEAN, se TRUE il messaggio è stato inviato dall’IA, altrimenti dall’organizzatore dell’evento)

(ogni evento ha una sola chat: id_evento in Chat_IA non può essere NULL e non può ripetersi; la chat viene creata automaticamente alla creazione dell’evento)
