DROP TABLE IF EXISTS attendance_day CASCADE;
DROP TABLE IF EXISTS attendance_setting CASCADE;
DROP TABLE IF EXISTS mapping_modules_menus CASCADE;
DROP TABLE IF EXISTS master_menus CASCADE;
DROP TABLE IF EXISTS master_modules CASCADE;
DROP TABLE IF EXISTS employee_change CASCADE;
DROP TABLE IF EXISTS employee_import CASCADE;
DROP TABLE IF EXISTS employee_ai_summary CASCADE;
DROP TABLE IF EXISTS master_employee CASCADE;

CREATE TABLE employee_import (
  id         SERIAL PRIMARY KEY,
  file_name  VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE master_employee (
  id SERIAL PRIMARY KEY,
  nik VARCHAR(30) UNIQUE,
  nama VARCHAR(255) NOT NULL,
  jk VARCHAR(20),
  tgl_lahir DATE,
  pendidikan VARCHAR(50),
  divisi VARCHAR(100),
  jabatan VARCHAR(255),
  level VARCHAR(50),
  atasan VARCHAR(30),
  lokasi VARCHAR(100),
  status VARCHAR(10) NOT NULL DEFAULT 'PKWTT' CHECK (status IN ('PKWTT', 'PKWT', 'Magang')),
  tgl_masuk DATE,
  akhir_kontrak DATE,
  aktif VARCHAR(10) NOT NULL DEFAULT 'Aktif' CHECK (aktif IN ('Aktif', 'Keluar')),
  tgl_keluar DATE,
  alasan VARCHAR(50),
  email VARCHAR(255),
  import_id INTEGER REFERENCES employee_import(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE employee_ai_summary (
  employee_id  INTEGER PRIMARY KEY REFERENCES master_employee(id) ON DELETE CASCADE,
  summary      TEXT NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE employee_change (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES master_employee(id) ON DELETE CASCADE,
  import_id   INTEGER REFERENCES employee_import(id) ON DELETE SET NULL,
  old_value   JSONB NOT NULL,
  new_value   JSONB NOT NULL,
  changed_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE master_modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE master_menus (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE mapping_modules_menus (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES master_modules(id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL REFERENCES master_menus(id) ON DELETE CASCADE,
  UNIQUE (module_id, menu_id)
);

CREATE TABLE attendance_day (
  id SERIAL PRIMARY KEY,
  nik VARCHAR(30) NOT NULL REFERENCES master_employee(nik) ON UPDATE CASCADE ON DELETE CASCADE,
  tgl DATE NOT NULL,
  status  VARCHAR(20) NOT NULL CHECK (status IN ('Hadir', 'Dinas Luar', 'WFH', 'Cuti', 'Sakit', 'Izin', 'Alpa')),
  jam_masuk  TIME,
  jam_pulang TIME,
  ket VARCHAR(255),
  source VARCHAR(20) NOT NULL DEFAULT 'mesin' CHECK (source IN ('mesin', 'pwa', 'pengajuan', 'hr')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (nik, tgl)
);

CREATE INDEX idx_attendance_day_tgl ON attendance_day (tgl);

CREATE TABLE attendance_setting (
  key        VARCHAR(50) PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);