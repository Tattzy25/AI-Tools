TABLE file_content_analysis
PK analysis_id
FIELD analysis_id STRING
FIELD file_id STRING
FIELD content_type ENUM(image,text,json,csv,xml)
FIELD summary_title STRING
FIELD summary_keywords STRING[]
FIELD row_count INTEGER NULLABLE
FIELD column_count INTEGER NULLABLE
FIELD schema_detected STRING NULLABLE
FIELD raw_text_excerpt STRING NULLABLE
FIELD csv_report STRING NULLABLE
FIELD created_at TIMESTAMP
RELATION file_id REFERENCES uploaded_files.file_id