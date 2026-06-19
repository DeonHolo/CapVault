CREATE TABLE workspace_sources (
    id UUID PRIMARY KEY,
    source_type VARCHAR(40) NOT NULL UNIQUE,
    sheet_url VARCHAR(2048) NOT NULL,
    sheet_id VARCHAR(200) NOT NULL,
    display_name VARCHAR(200),
    status VARCHAR(40) NOT NULL,
    connected_at TIMESTAMP NOT NULL,
    last_imported_at TIMESTAMP
);

CREATE TABLE deliverables (
    id UUID PRIMARY KEY,
    tracker_column_key VARCHAR(160) NOT NULL,
    title VARCHAR(240) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    instructions VARCHAR(4000),
    due_at TIMESTAMP NOT NULL,
    pdf_required BOOLEAN NOT NULL,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_deliverables_tracker_column_key ON deliverables (tracker_column_key);
CREATE INDEX idx_deliverables_due_at ON deliverables (due_at);
