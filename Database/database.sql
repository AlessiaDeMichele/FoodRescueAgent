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


-- 3. EVENTI, PIETANZE E INGREDIENTI
CREATE TABLE evento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('Pranzo', 'Cena', 'Buffet', 'Aperitivo', 'Festa')),
    numero_invitati INTEGER NOT NULL CHECK (numero_invitati >= 1),
    numero_bambini INTEGER NOT NULL DEFAULT 0 CHECK (numero_bambini >= 0 AND numero_bambini <= numero_invitati),
    budget NUMERIC,
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE pietanza_evento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_evento UUID NOT NULL REFERENCES evento(id) ON DELETE CASCADE,
    nome_pietanza TEXT NOT NULL,
    ha_ricetta_utente BOOLEAN NOT NULL DEFAULT false,
    persone_riferimento INTEGER,

    CONSTRAINT check_persone_riferimento CHECK (
        (ha_ricetta_utente = true AND persone_riferimento >= 1) OR
        (ha_ricetta_utente = false AND persone_riferimento IS NULL)
    )
);

CREATE TABLE ingrediente_pietanza (
    id_pietanza UUID REFERENCES pietanza_evento(id) ON DELETE CASCADE,
    id_ingrediente UUID REFERENCES ingrediente(id) ON DELETE CASCADE,
    quantita_base NUMERIC NOT NULL,
    unita TEXT NOT NULL CHECK (unita IN ('g', 'ml', 'pz', 'cucchiai', 'q.b.')),
    gia_disponibile BOOLEAN NOT NULL DEFAULT false,
    quantita_disponibile NUMERIC NOT NULL DEFAULT 0,
    PRIMARY KEY (id_pietanza, id_ingrediente)
);


-- 4. CHAT TRA UTENTI
CREATE TABLE conversazione (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_centro UUID NOT NULL REFERENCES centri(id),
    id_utente UUID REFERENCES utente_fisico(id),
    id_impresa UUID REFERENCES utente_impresa(id),
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_donatore_chat_esclusivo CHECK (
        (id_utente IS NOT NULL AND id_impresa IS NULL) OR
        (id_utente IS NULL AND id_impresa IS NOT NULL)
    ),
    UNIQUE (id_centro, id_utente),
    UNIQUE (id_centro, id_impresa)
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
