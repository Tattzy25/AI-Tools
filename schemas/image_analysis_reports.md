TABLE image_analysis_reports
PK report_id
FIELD report_id STRING
FIELD file_id STRING
FIELD image_description STRING
FIELD confidence FLOAT
FIELD objects_detected OBJECT[]
FIELD objects_detected.object STRING
FIELD objects_detected.confidence FLOAT
FIELD color_palette OBJECT[]
FIELD color_palette.color STRING
FIELD color_palette.hex STRING
FIELD color_palette.percentage FLOAT
FIELD text STRING[]
FIELD csv_report STRING
FIELD created_at TIMESTAMP
RELATION file_id REFERENCES uploaded_files.file_id