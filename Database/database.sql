-- ==============================================================================
-- SCHEMA DATABASE SUPABASE - FOOD RESCUE AGENT
-- ==============================================================================

-- 1. UTENTI E PROFILI
CREATE TABLE profili (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT false,
    creato_il TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE utente_fisico (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL
);

CREATE TABLE utente_impresa (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_impresa TEXT NOT NULL,
    posizione TEXT NOT NULL
);


-- 2. CENTRI E DONAZIONI
CREATE TABLE centri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    indirizzo TEXT NOT NULL,
    citta TEXT NOT NULL,
    email TEXT NOT NULL,
    latitudine DOUBLE PRECISION NOT NULL,
    longitudine DOUBLE PRECISION NOT NULL,
    categorie_accettate TEXT[] NOT NULL,
    ente_terzo_settore BOOLEAN NOT NULL,
    creato_il TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_gestore UUID REFERENCES auth.users(id)
);

CREATE TABLE donazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    data_scadenza DATE NOT NULL,
    quantita NUMERIC NOT NULL,
    data_donazione TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_donatore_fisico UUID REFERENCES utente_fisico(id),
    id_donatore_impresa UUID REFERENCES utente_impresa(id),
    id_centro UUID REFERENCES centri(id),
    
    CONSTRAINT check_donatore_esclusivo CHECK (
        (id_donatore_fisico IS NOT NULL AND id_donatore_impresa IS NULL) OR
        (id_donatore_fisico IS NULL AND id_donatore_impresa IS NOT NULL)
    )
);


-- 3. EVENTI E INGREDIENTI
CREATE TABLE evento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_invitati INTEGER NOT NULL,
    budget NUMERIC,
    id_utente UUID REFERENCES utente_fisico(id),
    id_impresa UUID REFERENCES utente_impresa(id),
    id_centro UUID REFERENCES centri(id),
    
    CONSTRAINT check_organizzatore_esclusivo CHECK (
        (id_utente IS NOT NULL AND id_impresa IS NULL AND id_centro IS NULL) OR
        (id_utente IS NULL AND id_impresa IS NOT NULL AND id_centro IS NULL) OR
        (id_utente IS NULL AND id_impresa IS NULL AND id_centro IS NOT NULL)
    )
);

CREATE TABLE ingrediente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL
);

CREATE TABLE ingrediente_evento (
    id_evento UUID REFERENCES evento(id) ON DELETE CASCADE,
    id_ingrediente UUID REFERENCES ingrediente(id) ON DELETE CASCADE,
    quantita NUMERIC NOT NULL,
    unita TEXT NOT NULL,
    PRIMARY KEY (id_evento, id_ingrediente)
);


-- 4. CHAT TRA UTENTI
CREATE TABLE conversazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_centro UUID NOT NULL REFERENCES centri(id),
    id_utente UUID REFERENCES utente_fisico(id),
    id_impresa UUID REFERENCES utente_impresa(id),
    
    CONSTRAINT check_donatore_chat_esclusivo CHECK (
        (id_utente IS NOT NULL AND id_impresa IS NULL) OR
        (id_utente IS NULL AND id_impresa IS NOT NULL)
    )
);

CREATE TABLE messaggio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conversazione UUID REFERENCES conversazione(id) ON DELETE CASCADE,
    testo TEXT NOT NULL,
    timestamp_invio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    inviato_da_centro BOOLEAN NOT NULL
);


-- 5. CHAT IA (Organizzazione Eventi)
CREATE TABLE chat_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_evento UUID NOT NULL UNIQUE REFERENCES evento(id) ON DELETE CASCADE,
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messaggio_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_chat UUID REFERENCES chat_ia(id) ON DELETE CASCADE,
    testo TEXT NOT NULL,
    timestamp_invio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    inviato_da_ia BOOLEAN NOT NULL
);
