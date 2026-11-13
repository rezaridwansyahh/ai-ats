DROP TABLE IF EXISTS employee_ai_summary CASCADE;
DROP TABLE IF EXISTS master_employee CASCADE;

CREATE TABLE master_employee (
  id SERIAL PRIMARY KEY,
  nik VARCHAR(30)  NOT NULL,   -- not UNIQUE: the demo data has a deliberate duplicate NIK
  nama VARCHAR(255) NOT NULL,
  jk VARCHAR(20),
  tgl_lahir DATE,
  pendidikan VARCHAR(50),
  divisi VARCHAR(100),
  jabatan VARCHAR(255),
  level VARCHAR(50),
  atasan VARCHAR(30),             -- NIK of the direct manager
  lokasi VARCHAR(100),
  status VARCHAR(10) NOT NULL DEFAULT 'PKWTT' CHECK (status IN ('PKWTT', 'PKWT', 'Magang')),
  tgl_masuk DATE,
  akhir_kontrak DATE,
  aktif VARCHAR(10) NOT NULL DEFAULT 'Aktif' CHECK (aktif IN ('Aktif', 'Keluar')),
  tgl_keluar DATE,
  alasan VARCHAR(50), 
  email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_master_employee_nik ON master_employee (nik);

CREATE TABLE employee_ai_summary (
  employee_id  INTEGER PRIMARY KEY REFERENCES master_employee(id) ON DELETE CASCADE,
  summary      TEXT NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);