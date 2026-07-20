CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_role VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    resource VARCHAR NOT NULL,
    outcome VARCHAR NOT NULL,
    ip_address VARCHAR NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    risk_level VARCHAR NOT NULL
);
