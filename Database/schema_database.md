Tabella Utente_Fisico: nome, cognome, id_utente (PK), email, password

Tabella Utente_Impresa: nome_impresa, id_impresa (PK), posizione, email, password

Tabella Centro_Raccolta: nome_centro, id_centro (PK), posizione, email, password

Tabella Donazione: id_donatore_fisico (FK: id_utente, può essere NULL), id_donatore_impresa (FK: id_impresa, può essere NULL), nome, categoria, data_scadenza, quantità, id_donazione (PK), data_donazione, centro_raccolta (FK: id_centro)

(una FK non può puntare a due diverse colonne di due diverse tabelle, quindi si creano due FK per ogni colonna a cui si vuole puntare con la regola speciale che solo una di queste FK per tupla può essre valorizzata)

Tabella Evento: numero_invitati, id_evento (PK), id_utente (FK: id_utente, può essere NULL), id_impresa (FK: id_impresa, può essere NULL), id_centro (FK: id_centro, può essere NULL), budget

Tabella Ingrediente_Evento: id_evento (FK: id_evento), id_ingrediente (FK: id_ingrediente), quantita, (PK: id_evento e id_ingrediente), unita

Tabella Ingrediente: id_ingrediente (PK), nome

Tabella Messaggio: id_messaggio (PK), id_conversazione (FK: id_conversazione), testo, timestamp_invio, inviato_da_centro (BOOLEAN, se TRUE il messaggio è stato inviato dal centro di raccolta, altrimenti dall'altro attore della conversazione, utente fisico o impresa)

Tabella Conversazione: id_utente (FK: id_utente, può essere NULL), id_impresa (FK: id_impresa, può essere NULL), id_centro (FK: id_centro), id_conversazione (PK)

Tabella Chat_IA: id_chat (PK), id_evento (FK: id_evento), data_creazione

Tabella Messaggio_IA: id_messaggio_ia (PK), id_chat (FK: id_chat), testo, timestamp_invio, inviato_da_ia (BOOLEAN, se TRUE il messaggio è stato inviato dall’IA, altrimenti dall’organizzatore dell’evento)

(ogni evento ha una sola chat: id_evento in Chat_IA non può essere NULL e non può ripetersi; la chat viene creata automaticamente alla creazione dell’evento)
