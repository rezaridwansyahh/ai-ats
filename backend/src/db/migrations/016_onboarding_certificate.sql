BEGIN;

CREATE TABLE IF NOT EXISTS onboarding_certificate (
  id SERIAL PRIMARY KEY,
  onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES core_company(id) ON DELETE CASCADE,
  phase_id INTEGER NULL,
  title VARCHAR(255) NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (onboarding_id, phase_id)
);

CREATE TABLE onboarding_chat_conversation (
  id SERIAL PRIMARY KEY,
  candidate_onboarding_id INTEGER NOT NULL REFERENCES candidate_onboarding(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'Onboarding chat',
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE onboarding_chat_message (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES onboarding_chat_conversation(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  retrieved_context JSONB, 
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE onboarding_source (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES core_company(id) ON DELETE CASCADE,
  file VARCHAR(255),               
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  
  chunk_count INTEGER DEFAULT 0,
  weaviate_source_key VARCHAR(255),                
  error_message TEXT,
  uploaded_by INTEGER REFERENCES master_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;