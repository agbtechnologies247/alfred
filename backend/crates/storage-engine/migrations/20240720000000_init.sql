CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    username VARCHAR NOT NULL UNIQUE,
    password_hash VARCHAR NOT NULL,
    role VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS human_feedback (
    id UUID PRIMARY KEY,
    decision_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    user_role VARCHAR NOT NULL,
    action_type VARCHAR NOT NULL,
    ai_recommendation TEXT NOT NULL,
    ai_confidence DOUBLE PRECISION NOT NULL,
    human_decision VARCHAR NOT NULL,
    rejection_reason TEXT,
    environment VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    title VARCHAR NOT NULL,
    priority VARCHAR NOT NULL,
    source VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sops (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    parent_id UUID,
    version INT NOT NULL,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    created_from_incident_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    key_hash VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    scopes TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unified_events (
    event_id UUID PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    object_type VARCHAR NOT NULL,
    object_id VARCHAR NOT NULL,
    actor VARCHAR NOT NULL,
    team VARCHAR,
    environment VARCHAR NOT NULL,
    severity VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    before_state JSONB DEFAULT '{}'::jsonb,
    after_state JSONB DEFAULT '{}'::jsonb,
    linked_records JSONB DEFAULT '{}'::jsonb,
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    audit_metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    url VARCHAR NOT NULL,
    events TEXT[] NOT NULL,
    status VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- People Engineering tables
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    manager_id UUID
);

CREATE TABLE IF NOT EXISTS persons (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    team_id UUID,
    role VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    skills TEXT[] DEFAULT '{}',
    status VARCHAR NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_checkins (
    id UUID PRIMARY KEY,
    person_id UUID NOT NULL,
    date DATE NOT NULL,
    check_in_type VARCHAR NOT NULL,
    plan TEXT,
    completed TEXT,
    blockers TEXT,
    mood VARCHAR NOT NULL,
    priority VARCHAR NOT NULL,
    risk TEXT,
    needs_help BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY,
    person_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR NOT NULL,
    description TEXT NOT NULL,
    linked_entity_id VARCHAR,
    metadata JSONB DEFAULT '{}'::jsonb
);
