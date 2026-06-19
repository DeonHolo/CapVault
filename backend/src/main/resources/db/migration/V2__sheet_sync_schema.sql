CREATE TABLE sheet_import_runs (
    id UUID PRIMARY KEY,
    source_type VARCHAR(40) NOT NULL,
    source_id UUID,
    status VARCHAR(40) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    rows_found INTEGER NOT NULL,
    columns_found INTEGER NOT NULL,
    warnings TEXT,
    summary_json TEXT,
    CONSTRAINT fk_sheet_import_runs_source
        FOREIGN KEY (source_id)
        REFERENCES workspace_sources (id)
);

CREATE TABLE student_records (
    id UUID PRIMARY KEY,
    student_number VARCHAR(80) UNIQUE,
    student_name VARCHAR(240) NOT NULL,
    team_code VARCHAR(160) NOT NULL,
    member_number VARCHAR(40),
    section_name VARCHAR(120),
    adviser_name VARCHAR(200),
    institutional_email VARCHAR(240),
    source_row_number INTEGER,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_student_records_team_code ON student_records (team_code);
CREATE INDEX idx_student_records_name ON student_records (student_name);

CREATE TABLE project_metadata (
    id UUID PRIMARY KEY,
    group_code VARCHAR(160) NOT NULL UNIQUE,
    project_title VARCHAR(1000),
    software_name VARCHAR(500),
    description TEXT,
    proposal_remarks TEXT,
    demo_comments TEXT,
    adviser_name VARCHAR(240),
    project_status VARCHAR(240),
    category VARCHAR(240),
    source_row_number INTEGER,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE tracker_columns (
    id UUID PRIMARY KEY,
    column_key VARCHAR(180) NOT NULL UNIQUE,
    label VARCHAR(180) NOT NULL,
    source_column VARCHAR(180) NOT NULL,
    source_column_index INTEGER NOT NULL,
    display_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL,
    pdf_required BOOLEAN NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE tracker_rows (
    id UUID PRIMARY KEY,
    student_number VARCHAR(80),
    student_name VARCHAR(240) NOT NULL,
    team_code VARCHAR(160) NOT NULL,
    member_number VARCHAR(40),
    section_name VARCHAR(120),
    adviser_name VARCHAR(200),
    source_row_number INTEGER NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_tracker_rows_student_number ON tracker_rows (student_number);
CREATE INDEX idx_tracker_rows_team_member ON tracker_rows (team_code, member_number);

CREATE TABLE tracker_cells (
    id UUID PRIMARY KEY,
    tracker_row_id UUID NOT NULL,
    tracker_column_id UUID NOT NULL,
    raw_value VARCHAR(1000),
    normalized_status VARCHAR(80) NOT NULL,
    source_row_number INTEGER NOT NULL,
    source_column_index INTEGER NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_tracker_cells_row
        FOREIGN KEY (tracker_row_id)
        REFERENCES tracker_rows (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tracker_cells_column
        FOREIGN KEY (tracker_column_id)
        REFERENCES tracker_columns (id)
        ON DELETE CASCADE,
    CONSTRAINT uk_tracker_cells_row_column
        UNIQUE (tracker_row_id, tracker_column_id)
);

CREATE TABLE tracker_writebacks (
    id UUID PRIMARY KEY,
    student_number VARCHAR(80),
    team_code VARCHAR(160) NOT NULL,
    member_number VARCHAR(40),
    deliverable_id UUID,
    tracker_column_key VARCHAR(180) NOT NULL,
    days_late INTEGER NOT NULL,
    target_row_number INTEGER,
    target_column_index INTEGER,
    target_a1_range VARCHAR(240),
    status VARCHAR(80) NOT NULL,
    message VARCHAR(1000),
    requested_at TIMESTAMP NOT NULL,
    written_at TIMESTAMP,
    CONSTRAINT fk_tracker_writebacks_deliverable
        FOREIGN KEY (deliverable_id)
        REFERENCES deliverables (id)
);

CREATE INDEX idx_tracker_writebacks_student ON tracker_writebacks (student_number);
CREATE INDEX idx_tracker_writebacks_team ON tracker_writebacks (team_code);
