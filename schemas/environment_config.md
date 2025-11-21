TABLE environment_config
PK env_id
FIELD env_id STRING
FIELD name STRING
FIELD value STRING
FIELD scope ENUM(server,client)
FIELD created_at TIMESTAMP