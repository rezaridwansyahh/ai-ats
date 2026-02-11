-- Drop tables in reverse dependency order (most dependent first)
DROP TABLE IF EXISTS master_users CASCADE;
DROP TABLE IF EXISTS master_roles CASCADE;
DROP TABLE IF EXISTS mapping_users_roles CASCADE;

CREATE TABLE master_users (
  id SERIAL PRIMARY KEY,
  password TEXT NOT NULL,
  email VARCHAR(100) NOT NULL
);

CREATE TABLE master_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  additional JSONB
);

CREATE TABLE mapping_users_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES master_users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES master_roles(id) ON DELETE CASCADE,
  UNIQUE (user_id, role_id)
);