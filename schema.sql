-- MyCounsel D1 Schema

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'INTAKE',
  inputs_json TEXT NOT NULL DEFAULT '{}',
  legal_context_json TEXT NOT NULL DEFAULT '{}',
  draft_versions_json TEXT NOT NULL DEFAULT '[]',
  risk_report_json TEXT,
  lawyer_notes TEXT,
  review_request TEXT,
  review_sent_at TEXT,
  signature_request_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- Trigger to auto-update updated_at
CREATE TRIGGER IF NOT EXISTS contracts_updated_at
  AFTER UPDATE ON contracts
  BEGIN
    UPDATE contracts SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
