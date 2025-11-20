TABLE combined_reports
PK batch_id
FIELD batch_id STRING
FIELD file_ids STRING[]
FIELD combined_json OBJECT
FIELD created_at TIMESTAMP
RELATION file_ids REFERENCES uploaded_files.file_id