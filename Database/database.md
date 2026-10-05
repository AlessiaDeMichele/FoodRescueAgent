Tabella Utente_Registrato (Classe Astratta): email, password
{
Tabella Utente_Fisico (Classe figlia di Utente_Registrato): nome, cognome, id_utente (PK)

Tabella Utente_Impresa (Classe figlia di Utente_Registrato): nome_impresa, id_impresa (PK), posizione

Tabella Centro_Raccolta (Classe figlia di Utente_Registrato): nome_centro, id_centro (PK), posizione
}

Tabella Donazione: id_donatore_fisico (FK: id_utente, può essere NULL), id_donatore_impresa (FK: id_impresa, può essere NULL), nome, categoria, data_scadenza, quantità, id_donazione, data_donazione
(una FK non può puntare a due diverse colonne di due diverse tabelle, quindi si creano due FK per ogni colonna a cui si vuole puntare con la regola speciale che solo una di queste FK per tupla può essre valorizzata)

Tabella Evento: numero_invitati, id_ingredienti (FK: id_spesa), id_evento (PK), id_utente (FK: id_utente, id_impresa, id_centro), id_menu (FK)

Tabella Ingrediente: id_ingrediente (PK), nome, quantità

Tabella Menu: id_menu (PK), descrizione

Tabella Messaggio: ???

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
