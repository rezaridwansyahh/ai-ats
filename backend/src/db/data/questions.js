// Battery A question bank, grouped by subtest.
// Sourced from .claude/assets/assessment/Myralix_Battery_A_Candidate_Card_v10.html.
// Embedded into master_assessment.options.questions via assessments.js.

export default {
  // ── GI: Kemampuan Umum (cognitive, text-only MC) ──
  // `correct` is the index into `choices`. Source: WPT_RAW_QS + KEYS map.
  GI: [
    { text: 'Bulan terakhir di kuartal pertama tahun ini adalah',
      choices: ['Januari', 'Februari', 'Maret', 'April', 'Juni'], correct: 2, points: 10 },
    { text: 'PANAS adalah lawan kata dari',
      choices: ['dingin', 'hangat', 'terik', 'sejuk', 'mendidih'], correct: 0, points: 10 },
    { text: 'Sebagian besar hal di bawah ini serupa satu sama lain. Manakah yang kurang serupa dengan yang lain?',
      choices: ['Ayam', 'Bebek', 'Elang', 'Ikan', 'Burung Hantu'], correct: 3, points: 10 },
    { text: 'Apakah "ATM" berarti "Anjungan Tunai Mandiri"?',
      choices: ['YA', 'TIDAK'], correct: 0, points: 10 },
    { text: 'Dalam kelompok kata berikut, manakah kata yang berbeda dari kata yang lain?',
      choices: ['meja', 'kursi', 'lemari', 'berlari', 'tempat tidur'], correct: 3, points: 10 },
    { text: 'TERANG adalah lawan kata dari',
      choices: ['gelap', 'cahaya', 'bersinar', 'siang', 'cerah'], correct: 0, points: 10 },
    { text: 'Guru dan Pengajar — apakah kata-kata ini:',
      choices: ['memiliki arti yang sama', 'memiliki arti berlawanan', 'tidak memiliki arti sama atau berlawanan'], correct: 0, points: 10 },
    { text: 'Manakah kata berikut yang berhubungan dengan PENDENGARAN?',
      choices: ['mata', 'hidung', 'lidah', 'telinga', 'jari'], correct: 3, points: 10 },
    { text: 'MUSIM GUGUR adalah lawan dari:',
      choices: ['liburan', 'musim panas', 'musim semi', 'musim dingin', 'musim gugur'], correct: 2, points: 10 },
    { text: 'Anggaplah dua pernyataan pertama benar. Apakah pernyataan terakhir: "Anak-anak lelaki ini adalah anak yang normal. Semua anak normal sifatnya aktif. Anak-anak lelaki ini aktif."',
      choices: ['benar', 'salah', 'tidak tahu'], correct: 0, points: 10 },
    { text: 'JAUH adalah lawan kata dari',
      choices: ['terpencil', 'dekat', 'jauh', 'terburu-buru', 'pasti'], correct: 1, points: 10 },
    { text: "IT'S — ITS — apakah kata ini:",
      choices: ['memiliki arti yang sama', 'memiliki arti yang berlawanan', 'tidak memiliki arti yang sama atau berlawanan'], correct: 2, points: 10 },
  ],

  // ── KA: Kecepatan & Akurasi Klerikal (identical-vs-different) ──
  KA: [
    { text: 'Apakah pasangan berikut identik? AB-1234-XY  /  AB-1234-XY',
      choices: ['Identik', 'Berbeda'], correct: 0, points: 5 },
    { text: 'Apakah pasangan berikut identik? 9210651  /  9210561',
      choices: ['Identik', 'Berbeda'], correct: 1, points: 5 },
    { text: 'Apakah pasangan berikut identik? Richards, W.E.  /  Richad, W.E.',
      choices: ['Identik', 'Berbeda'], correct: 1, points: 5 },
    { text: 'Apakah pasangan berikut identik? 88884444  /  88884444',
      choices: ['Identik', 'Berbeda'], correct: 0, points: 5 },
    { text: 'Apakah pasangan berikut identik? Wood, A.O.  /  Wood, A.O.',
      choices: ['Identik', 'Berbeda'], correct: 0, points: 5 },
  ],

  // ── BigFive: Likert 1-5 keyed by trait, with `reversed` flag ──
  // No `correct` — scored as trait sum. Source: BF_QS + BF_ITEMS.
  BigFive: [
    { text: 'Aktif Berbicara', trait: 'E', reversed: false },
    { text: 'Mencari Kelemahan Orang Lain', trait: 'A', reversed: true },
    { text: 'Mengerjakan Tugas dengan Serius', trait: 'C', reversed: false },
    { text: 'Merasa Tertekan', trait: 'N', reversed: false },
    { text: 'Orang Unik yang Penuh dengan Gagasan Baru', trait: 'O', reversed: false },
    { text: 'Suka Menyendiri', trait: 'E', reversed: true },
    { text: 'Suka Menolong dan Tidak Iri pada Orang Lain', trait: 'A', reversed: false },
    { text: 'Bertindak Asal-asalan', trait: 'C', reversed: true },
    { text: 'Orang yang Santai dan Mampu Mengatasi Stres', trait: 'N', reversed: true },
    { text: 'Memiliki Rasa Ingin Tahu Terhadap Sesuatu yang Berbeda', trait: 'O', reversed: false },
  ],

  // ── DISC: Most/Least groups. `primary` (Most) and `secondary` (Least) keys per option ──
  // No `correct` — scored as DISC dimension counts. Source: GROUPS.
  DISC: [
    { no: 1, options: [
      { text: 'Petualang, suka mengambil resiko', primary: '*', secondary: 'D' },
      { text: 'Mudah bergaul, ramah, mudah setuju', primary: 'S', secondary: 'S' },
      { text: 'Mempercayai, percaya pada orang lain', primary: 'I', secondary: 'I' },
      { text: 'Penuh toleransi, menghormati orang lain', primary: 'C', secondary: 'C' },
    ]},
    { no: 2, options: [
      { text: 'Kerjakan bersama-sama', primary: 'S', secondary: 'S' },
      { text: 'Kerjakan dengan benar, ketepatan sangat penting', primary: 'D', secondary: 'D' },
      { text: 'Yang penting adalah hasil', primary: 'C', secondary: '*' },
      { text: 'Buat agar menyenangkan', primary: '*', secondary: 'I' },
    ]},
    { no: 3, options: [
      { text: 'Sosial, pertemuan kelompok', primary: 'D', secondary: '*' },
      { text: 'Keselamatan, keamanan', primary: '*', secondary: 'S' },
      { text: 'Pendidikan, kebudayaan', primary: 'I', secondary: 'I' },
      { text: 'Prestasi, penghargaan', primary: '*', secondary: 'C' },
    ]},
    { no: 4, options: [
      { text: 'Pusat perhatian, suka bersosialisasi', primary: '*', secondary: 'I' },
      { text: 'Pendamai, membawa ketenangan', primary: 'D', secondary: 'D' },
      { text: 'Visioner, pandangan ke masa depan', primary: 'S', secondary: 'S' },
      { text: 'Lembut, tertutup', primary: 'C', secondary: 'C' },
    ]},
    { no: 5, options: [
      { text: 'Menahan diri, bisa hidup tanpa memiliki', primary: 'I', secondary: '*' },
      { text: 'Membeli karena dorongan hati/impuls', primary: 'D', secondary: 'D' },
      { text: 'Akan menunggu, tanpa tekanan', primary: 'S', secondary: 'S' },
      { text: 'Akan membeli apa yang diinginkan', primary: '*', secondary: 'C' },
    ]},
    { no: 6, options: [
      { text: 'Suka bergaul, antusias', primary: 'D', secondary: 'D' },
      { text: 'Waspada, berhati-hati', primary: 'S', secondary: 'S' },
      { text: 'Mudah diterka, konsisten', primary: 'I', secondary: 'I' },
      { text: 'Mengambil kendali, bersikap langsung/direct', primary: 'C', secondary: '*' },
    ]},
    { no: 7, options: [
      { text: 'Ingin menetapkan goal/tujuan', primary: '*', secondary: 'D' },
      { text: 'Berusaha mencapai kesempurnaan', primary: 'I', secondary: 'I' },
      { text: 'Menjadi bagian dari tim/kelompok', primary: '*', secondary: 'C' },
      { text: 'Menyemangati orang lain', primary: 'S', secondary: '*' },
    ]},
    { no: 8, options: [
      { text: 'Bersahabat, mudah bergaul', primary: 'I', secondary: 'I' },
      { text: 'Unik, bosan dari rutinitas', primary: 'S', secondary: 'S' },
      { text: 'Aktif melakukan perubahan', primary: 'C', secondary: 'C' },
      { text: 'Ingin segala sesuatu akurat dan pasti', primary: 'D', secondary: 'D' },
    ]},
  ],

  // ── Holland: yes/no items keyed by RIASEC category ──
  // No `correct` — scored as RIASEC counts. Source: HOL_QS.
  Holland: [
    { text: 'Senang menonton drama', category: 'A' },
    { text: 'Senang Melatih Orang', category: 'S' },
    { text: 'Mampu bermain dalam drama / berakting', category: 'A' },
    { text: 'Suka membaca mengenai topik-topik khusus atas keinginan sendiri', category: 'I' },
    { text: 'Mampu melakukan percobaan atau penelitian ilmiah', category: 'I' },
    { text: 'Tertarik menjadi pengawas konstruksi bangunan', category: 'R' },
    { text: 'Mampu melakukan dan menyukai tugas administratif', category: 'C' },
    { text: 'Bisa mempengaruhi dan membujuk orang lain', category: 'E' },
    { text: 'Suka memperbaiki motor', category: 'R' },
    { text: 'Suka melakukan pekerjaan sosial', category: 'S' },
  ],
};
