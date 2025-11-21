TABLE data_generator_jobs
PK job_id
FIELD job_id STRING
FIELD headers STRING[]
FIELD types STRING[]
FIELD rows_generated INTEGER
FIELD seed STRING NULLABLE
FIELD status ENUM(pending,running,completed,failed)
FIELD output_csv STRING
FIELD created_at TIMESTAMP