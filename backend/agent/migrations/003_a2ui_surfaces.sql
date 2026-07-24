CREATE TABLE agent_surfaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surface_id TEXT NOT NULL UNIQUE,
    session_id TEXT NOT NULL,
    message_id TEXT NOT NULL DEFAULT '',
    catalog_version TEXT NOT NULL DEFAULT '',
    component_json TEXT NOT NULL DEFAULT '{}',
    data_model_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'ready',
    create_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES agent_sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_surfaces_session_id
    ON agent_surfaces(session_id);

CREATE TABLE agent_action_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    surface_id TEXT NOT NULL DEFAULT '',
    action_name TEXT NOT NULL,
    request_context TEXT NOT NULL DEFAULT '{}',
    execution_result TEXT NOT NULL DEFAULT '{}',
    idempotency_key TEXT NOT NULL DEFAULT '',
    operator_id TEXT NOT NULL DEFAULT '',
    create_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES agent_sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_action_logs_session_id
    ON agent_action_logs(session_id);

CREATE UNIQUE INDEX idx_agent_action_logs_idempotency
    ON agent_action_logs(idempotency_key)
    WHERE idempotency_key != '';
