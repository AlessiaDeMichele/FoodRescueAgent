-- 1. Tabelle Anagrafiche
CREATE TABLE utente_fisico (
    id_utente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE utente_impresa (
    id_impresa SERIAL PRIMARY KEY,
    nome_impresa VARCHAR(150) NOT NULL,
    posizione VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE centro_raccolta (
    id_centro SERIAL PRIMARY KEY,
    nome_centro VARCHAR(150) NOT NULL,
    posizione VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 2. Entità Principali
CREATE TABLE donazione (
    id_donazione SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100),
    data_scadenza DATE NOT NULL,
    quantita DECIMAL(10, 2) NOT NULL,
    data_donazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    id_donatore_fisico INT REFERENCES utente_fisico(id_utente),
    id_donatore_impresa INT REFERENCES utente_impresa(id_impresa),
    centro_raccolta INT REFERENCES centro_raccolta(id_centro),
    
    CONSTRAINT check_donatore_esclusivo CHECK (
        (id_donatore_fisico IS NOT NULL AND id_donatore_impresa IS NULL) OR
        (id_donatore_fisico IS NULL AND id_donatore_impresa IS NOT NULL)
    )
);

CREATE TABLE evento (
    id_evento SERIAL PRIMARY KEY,
    numero_invitati INT NOT NULL,
    budget DECIMAL(10, 2),
    
    id_utente INT REFERENCES utente_fisico(id_utente),
    id_impresa INT REFERENCES utente_impresa(id_impresa),
    id_centro INT REFERENCES centro_raccolta(id_centro),
    
    CONSTRAINT check_organizzatore_esclusivo CHECK (
        (id_utente IS NOT NULL AND id_impresa IS NULL AND id_centro IS NULL) OR
        (id_utente IS NULL AND id_impresa IS NOT NULL AND id_centro IS NULL) OR
        (id_utente IS NULL AND id_impresa IS NULL AND id_centro IS NOT NULL)
    )
);

-- 3. Ingredienti e Tabella Ponte
CREATE TABLE ingrediente (
    id_ingrediente SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL
);

CREATE TABLE ingrediente_evento (
    id_evento INT REFERENCES evento(id_evento),
    id_ingrediente INT REFERENCES ingrediente(id_ingrediente),
    quantita DECIMAL(10, 2) NOT NULL,
    unita VARCHAR(50) NOT NULL,
    
    PRIMARY KEY (id_evento, id_ingrediente)
);

-- 4. Chat tra Utenti
CREATE TABLE conversazione (
    id_conversazione SERIAL PRIMARY KEY,
    id_centro INT NOT NULL REFERENCES centro_raccolta(id_centro),
    id_utente INT REFERENCES utente_fisico(id_utente),
    id_impresa INT REFERENCES utente_impresa(id_impresa),
    
    CONSTRAINT check_donatore_chat_esclusivo CHECK (
        (id_utente IS NOT NULL AND id_impresa IS NULL) OR
        (id_utente IS NULL AND id_impresa IS NOT NULL)
    )
);

CREATE TABLE messaggio (
    id_messaggio SERIAL PRIMARY KEY,
    id_conversazione INT REFERENCES conversazione(id_conversazione),
    testo TEXT NOT NULL,
    timestamp_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inviato_da_centro BOOLEAN NOT NULL
);

-- 5. Chat con l'IA
CREATE TABLE chat_ia (
    id_chat SERIAL PRIMARY KEY,
    id_evento INT NOT NULL UNIQUE REFERENCES evento(id_evento),
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messaggio_ia (
    id_messaggio_ia SERIAL PRIMARY KEY,
    id_chat INT REFERENCES chat_ia(id_chat),
    testo TEXT NOT NULL,
    timestamp_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inviato_da_ia BOOLEAN NOT NULL
);
