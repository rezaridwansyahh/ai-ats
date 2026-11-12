const e = (id, nik, nama, jk, tgl_lahir, pendidikan, divisi, jabatan, level, atasan, lokasi, status, tgl_masuk, akhir_kontrak = null, aktif = 'Aktif', tgl_keluar = null, alasan = null) => ({
  id, nik, nama, jk, tgl_lahir, pendidikan, divisi, jabatan, level, atasan, lokasi, status, tgl_masuk, akhir_kontrak, aktif, tgl_keluar, alasan,
  email: `${nama.toLowerCase().replace(/ /g, '.')}@contohsejahtera.example`,
});

const JKT = 'Jakarta (Kantor Pusat)', BKS = 'Bekasi (Pabrik)', SBY = 'Surabaya (Cabang)';

export default [
  // --- management
  e(1,  'CS12001', 'Slamet Halim',        'Laki-laki', '1976-03-04', 'S2', 'Direksi', 'Direktur Utama', 'Direktur', null, JKT, 'PKWTT', '2012-04-04'),
  e(2,  'CS14001', 'Teguh Sitompul',      'Laki-laki', '1975-07-21', 'S1', 'Pemasaran', 'Manajer Pemasaran', 'Manajer', 'CS12001', JKT, 'PKWTT', '2014-01-14'),
  e(3,  'CS18005', 'Dewi Nasution',       'Perempuan', '1980-05-27', 'S2', 'Keuangan & Akuntansi', 'Manajer Keuangan', 'Manajer', 'CS12001', JKT, 'PKWTT', '2018-08-25'),
  e(4,  'CS19003', 'Ratna Kusuma',        'Perempuan', '1988-02-14', 'S1', 'SDM & GA', 'Manajer SDM', 'Manajer', 'CS12001', JKT, 'PKWTT', '2019-03-11'),
  e(5,  'CS22002', 'Joko Simanjuntak',    'Laki-laki', '1984-09-02', 'S1', 'Produksi', 'Manajer Produksi', 'Manajer', 'CS12001', BKS, 'PKWTT', '2022-02-15'),
  // --- production + warehouse (Joko's team)
  e(6,  'CS16005', 'Oki Sitompul',        'Laki-laki', '1983-11-19', 'D3', 'Gudang & Logistik', 'Supervisor Gudang', 'Supervisor', 'CS22002', BKS, 'PKWTT', '2016-06-06'),
  e(7,  'CS16001', 'Yuni Saputra',        'Perempuan', '1984-10-21', 'S1', 'Produksi', 'Supervisor Produksi', 'Supervisor', 'CS22002', BKS, 'PKWTT', '2016-01-13'),
  e(8,  'CS18004', 'Andi Wijaya',         'Laki-laki', '1985-07-02', 'SMA/SMK', 'Gudang & Logistik', 'Staf Gudang', 'Staf', 'CS16005', BKS, 'PKWTT', '2018-08-23'),
  e(9,  'CS20004', 'Hendra Utami',        'Laki-laki', '1990-01-30', 'SMA/SMK', 'Produksi', 'Operator Produksi', 'Operator', 'CS16001', BKS, 'PKWTT', '2020-09-07'),
  e(10, 'CS21003', 'Sari Wulandari',      'Perempuan', '1993-06-12', 'SMA/SMK', 'Produksi', 'Operator Produksi', 'Operator', 'CS16001', BKS, 'PKWTT', '2021-04-19'),
  // contracts around the reference date: Lewat / Segera / Segera / Perhatian / none
  e(11, 'CS24006', 'Fajar Nugroho',       'Laki-laki', '1999-08-08', 'SMA/SMK', 'Produksi', 'Operator Produksi', 'Operator', 'CS16001', BKS, 'PKWT', '2025-12-01', '2026-11-20'),
  e(12, 'CS25002', 'Putri Wibowo',        'Perempuan', '2001-04-25', 'SMA/SMK', 'Produksi', 'Operator Packing', 'Operator', 'CS16001', BKS, 'PKWT', '2025-12-15', '2026-12-14'),
  e(13, 'CS25005', 'Arif Maulana',        'Laki-laki', '2000-10-03', 'D3', 'Gudang & Logistik', 'Staf Gudang', 'Staf', 'CS16005', BKS, 'PKWT', '2026-01-05', '2027-01-04'),
  e(14, 'CS25007', 'Anisa Rahma',         'Perempuan', '2002-12-17', 'SMA/SMK', 'Produksi', 'Operator Packing', 'Operator', 'CS16001', BKS, 'PKWT', '2026-02-02', '2027-02-01'),
  // --- new PKWTT hires still in probation (3 months)
  e(15, 'CS26001', 'Dedi Kusuma',         'Laki-laki', '1997-05-09', 'S1', 'IT', 'Staf IT', 'Staf', 'CS12001', JKT, 'PKWTT', '2026-09-01'),
  e(16, 'CS26002', 'Nanda Saputra',       'Perempuan', '1998-03-22', 'S1', 'Keuangan & Akuntansi', 'Staf Akuntansi', 'Staf', 'CS18005', JKT, 'PKWTT', '2026-10-05'),
  // --- sales, marketing, procurement, HR
  e(17, 'CS21001', 'Rudi Gunawan',        'Laki-laki', '1980-11-08', 'S1', 'Penjualan', 'Supervisor Penjualan Area', 'Supervisor', 'CS14001', SBY, 'PKWTT', '2021-03-03'),
  e(18, 'CS23002', 'Bayu Firmansyah',     'Laki-laki', '1995-07-28', 'S1', 'Penjualan', 'Sales Executive', 'Staf', 'CS21001', SBY, 'PKWT', '2024-12-02', '2026-12-01'),
  e(19, 'CS22005', 'Maya Anggraini',      'Perempuan', '1992-09-09', 'S1', 'Pemasaran', 'Staf Pemasaran', 'Staf', 'CS14001', JKT, 'PKWTT', '2022-07-18'),
  e(20, 'CS20002', 'Eko Prasetyo',        'Laki-laki', '1991-12-01', 'S1', 'Pengadaan', 'Staf Pengadaan', 'Staf', 'CS18005', JKT, 'PKWTT', '2020-02-10'),
  e(21, 'CS25009', 'Lestari Dewi',        'Perempuan', '2003-01-20', 'SMA/SMK', 'SDM & GA', 'Magang SDM', 'Staf', 'CS19003', JKT, 'Magang', '2026-09-01', '2026-12-31'),
  // --- leavers
  e(22, 'CS09001', 'Teguh Santoso',       'Laki-laki', '1967-05-09', 'SD/SMP', 'Produksi', 'Operator Packing', 'Operator', 'CS16001', BKS, 'PKWTT', '2009-02-02', null, 'Keluar', '2025-11-28', 'Pensiun'),
  e(23, 'CS24003', 'Rizky Hidayat',       'Laki-laki', '1996-02-16', 'D3', 'Gudang & Logistik', 'Staf Gudang', 'Staf', 'CS16005', BKS, 'PKWT', '2024-03-01', '2026-02-28', 'Keluar', '2026-02-28', 'Kontrak berakhir'),
  e(24, 'CS23004', 'Citra Lestari',       'Perempuan', '1994-08-30', 'S1', 'Keuangan & Akuntansi', 'Staf Akuntansi', 'Staf', 'CS18005', JKT, 'PKWTT', '2023-05-15', null, 'Keluar', '2026-08-14', 'Resign sukarela'),
  // --- deliberate data-quality case: duplicate NIK (CS18004 = Andi Wijaya) + empty education
  e(25, 'CS18004', 'Wahyu Pratama',       'Laki-laki', '1992-04-04', null, 'Gudang & Logistik', 'Staf Gudang', 'Staf', 'CS16005', BKS, 'PKWTT', '2023-06-12'),
];