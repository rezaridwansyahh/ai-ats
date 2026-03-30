-- Landing Backend Database Setup
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS master_email_notify CASCADE;
DROP TABLE IF EXISTS master_landing CASCADE;
DROP TABLE IF EXISTS master_users CASCADE;

-- Drop ENUMs
DROP TYPE IF EXISTS booking_status_type CASCADE;
DROP TYPE IF EXISTS session_slot_type CASCADE;

-- Create ENUMs
CREATE TYPE booking_status_type AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE session_slot_type AS ENUM ('10-12', '1-3', '4-6');

-- Users (for authentication / booking approval)
CREATE TABLE master_users (
  id SERIAL PRIMARY KEY,
  password TEXT NOT NULL,
  email VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL
);

-- Landing / Demo Booking
CREATE TABLE master_landing (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company_size VARCHAR(100),
  average_annual_hiring VARCHAR(100),
  message TEXT,
  booking_date DATE,
  session_slot session_slot_type,
  status booking_status_type NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  conference_link TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email notification recipients
CREATE TABLE master_email_notify (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  label VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
