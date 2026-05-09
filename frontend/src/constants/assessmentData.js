// Myralix Battery A - Assessment Data Constants

export const SUBS = {
  GI: {
    code: 'GI',
    name: 'Kemampuan Umum',
    icon: '🧠',
    color: '#0A6E5C',
    bg: '#F0F8F6',
    time: 12 * 60, // 12 minutes in seconds
    items: 50,
    weight: 0.30,
    instruction: 'Kerjakan 50 soal beragam (verbal, numerik, logika, spasial) semampu mungkin dalam 12 menit. Lewati soal sulit dan lanjutkan ke soal berikutnya.'
  },
  KA: {
    code: 'KA',
    name: 'Kecepatan & Akurasi',
    icon: '📋',
    color: '#DB2777',
    bg: '#FDF2F8',
    time: 8 * 60, // 8 minutes
    items: 40,
    weight: 0.175,
    instruction: 'Pilih jawaban yang IDENTIK dengan referensi, atau yang BERBEDA dari empat lainnya. Kerjakan secepat dan setepat mungkin.'
  }
};

export const IQ_TABLE = [59,59,61,64,67,69,71,73,75,78,80,81,83,86,88,90,93,95,97,98,100,102,104,106,108,111,113,114,116,118,120,121,123,125,126,128,130,132,134,136,138,140,142,143,146,146,146,146,146,146,146];

export const ORDER_A = ['GI', 'KA'];

// Kunci jawaban GI (50 soal)
export const GI_KEYS = {
  1:'3', 2:'1', 3:'4', 4:'ya', 5:'4', 6:'1', 7:'3', 8:'11', 9:'1', 10:'4',
  11:'3', 12:'6000', 13:'1', 14:'2', 15:'20', 16:'2', 17:'a', 18:'13', 19:'3', 20:'1',
  21:'20', 22:'s', 23:'2,5', 24:'2', 25:'3', 26:'1', 27:'1/30', 28:'3', 29:'6', 30:'10',
  31:'1/9', 32:'ya', 33:'3', 34:'20', 35:'0.25', 36:'24', 37:'0.0625', 38:'4,6', 39:'2', 40:'1',
  41:'1,4', 42:'5,13', 43:'0.33', 44:'2', 45:'24', 46:'2', 47:'3', 48:'175', 49:'1,2,4,5', 50:'12'
};

// Soal GI akan didefinisikan terpisah karena panjang
export const GI_QUESTIONS = [
  { n: 1, type: 'mc', text: 'Bulan terakhir di kuartal pertama tahun ini adalah', opts: ['1. Januari', '2. Februari', '3. Maret', '4. April', '5. Juni'] },
  { n: 2, type: 'mc', text: 'PANAS adalah lawan kata dari', opts: ['1. dingin', '2. hangat', '3. terik', '4. sejuk', '5. mendidih'] },
  { n: 3, type: 'mc', text: 'Sebagian besar hal di bawah ini serupa satu sama lain. Manakah salah satu di antaranya yang kurang serupa dengan yang lain?', opts: ['1. Ayam', '2. Bebek', '3. Elang', '4. Ikan', '5. Burung Hantu'] },
  { n: 4, type: 'mc', text: 'Jawablah dengan menuliskan YA atau TIDAK. Apakah "ATM" berarti "Anjungan Tunai Mandiri"?', opts: ['YA', 'TIDAK'] },
  { n: 5, type: 'mc', text: 'Dalam kelompok kata berikut, manakah kata yang berbeda dari kata yang lain?', opts: ['1. meja', '2. kursi', '3. lemari', '4. berlari', '5. tempat tidur'] },
  { n: 6, type: 'mc', text: 'TERANG adalah lawan kata dari', opts: ['1. gelap', '2. cahaya', '3. bersinar', '4. siang', '5. cerah'] },
  { n: 7, type: 'mc', text: 'Gambar manakah yang dibentuk dari dua gambar di dalam tanda kurung?', opts: ['1', '2', '3', '4', '5'] },
  { n: 8, type: 'input', text: 'Perhatikan urutan angka berikut. Angka berapa yang selanjutnya muncul? 1 — 3 — 5 — 7 — 9 — ?', hint: 'Masukkan angka jawaban' },
  { n: 9, type: 'mc', text: 'Guru dan Pengajar — Apakah kata-kata ini:', opts: ['1. memiliki arti yang sama', '2. memiliki arti berlawanan', '3. tidak memiliki arti sama atau berlawanan'] },
  { n: 10, type: 'mc', text: 'Manakah kata berikut ini yang berhubungan dengan PENDENGARAN?', opts: ['1. mata', '2. hidung', '3. lidah', '4. telinga', '5. jari'] },
  // Tambahkan soal lainnya...
  { n: 11, type: 'mc', text: 'MUSIM GUGUR adalah lawan dari:', opts: ['1. liburan', '2. musim panas', '3. musim semi', '4. musim dingin', '5. musim gugur'] },
  { n: 12, type: 'input', text: 'Sebuah pesawat terbang 300 kaki dalam ½ detik. Pada kecepatan yang sama berapa kaki ia terbang dalam 10 detik?', hint: 'Masukkan angka jawaban' },
  { n: 13, type: 'mc', text: 'Anggaplah dua pernyataan pertama adalah benar. Apakah yang terakhir: "Anak-anak lelaki ini adalah anak yang normal. Semua anak normal sifatnya aktif. Anak-anak lelaki ini aktif."', opts: ['1. benar', '2. salah', '3. tidak tahu'] },
  { n: 14, type: 'mc', text: 'JAUH adalah lawan kata dari', opts: ['1. terpencil', '2. dekat', '3. jauh', '4. terburu-buru', '5. pasti'] },
  { n: 15, type: 'input', text: '3 permen lemon seharga 10 rupiah. Berapa harga ½ lusin?', hint: 'Masukkan angka' }
];

// KA Questions (simplified - add all 40 in production)
export const KA_QUESTIONS = [
  { n: 1, type: 'cs', text: 'Pilih yang IDENTIK dengan referensi', ref: 'AB-1234-XY', opts: ['AB-1243-XY', 'AB-1234-XY', 'AB-1234-YX', 'AB-1324-XY', 'AB-1234-X'] },
  { n: 2, type: 'cs', text: 'Pilih yang BERBEDA dari yang lain', opts: ['Jakarta', 'Jakarta', 'Jakarta', 'Jakarta', 'Jakrta'] }
];

// BigFive Questions (60 items total in production)
export const BIGFIVE_QUESTIONS = [
  { n: 1, text: 'Saya orang yang banyak bicara', trait: 'E', reversed: false },
  { n: 2, text: 'Saya cenderung mencari kesalahan orang lain', trait: 'A', reversed: true },
  { n: 3, text: 'Saya melakukan pekerjaan dengan teliti', trait: 'C', reversed: false },
  { n: 4, text: 'Saya mudah tertekan', trait: 'N', reversed: false },
  { n: 5, text: 'Saya memiliki imajinasi yang aktif', trait: 'O', reversed: false }
];

// DISC Questions (24 groups total in production)
export const DISC_QUESTIONS = [
  {
    n: 1,
    options: [
      { text: 'Suka mengambil risiko', primary: 'D', secondary: 'I' },
      { text: 'Menyukai stabilitas', primary: 'S', secondary: 'C' },
      { text: 'Mudah bergaul', primary: 'I', secondary: 'D' },
      { text: 'Bekerja dengan detail', primary: 'C', secondary: 'S' }
    ]
  }
];

// Holland Questions (60 items total in production)
export const HOLLAND_QUESTIONS = [
  { n: 1, text: 'Memperbaiki mesin atau peralatan', category: 'R' },
  { n: 2, text: 'Melakukan penelitian ilmiah', category: 'I' },
  { n: 3, text: 'Mendesain karya seni', category: 'A' },
  { n: 4, text: 'Membantu orang lain', category: 'S' },
  { n: 5, text: 'Memimpin tim atau organisasi', category: 'E' },
  { n: 6, text: 'Bekerja dengan data dan angka', category: 'C' }
];

export const BIGFIVE_TRAITS = {
  E: { name: 'Extraversion', nameID: 'Ekstraversion', color: '#0369A1' },
  A: { name: 'Agreeableness', nameID: 'Agreeableness', color: '#059669' },
  C: { name: 'Conscientiousness', nameID: 'Conscientiousness', color: '#7C3AED' },
  N: { name: 'Neuroticism', nameID: 'Neuroticism', color: '#DC2626' },
  O: { name: 'Openness', nameID: 'Openness', color: '#D97706' }
};

export const DISC_DIMS = {
  D: { name: 'Dominance', color: '#DC2626' },
  I: { name: 'Influence', color: '#D97706' },
  S: { name: 'Steadiness', color: '#059669' },
  C: { name: 'Conscientiousness', color: '#0369A1' }
};

export const HOLLAND_TYPES = {
  R: { name: 'Realistik', nameID: 'Realistik', color: '#DC2626' },
  I: { name: 'Investigatif', nameID: 'Investigatif', color: '#1D4ED8' },
  A: { name: 'Artistik', nameID: 'Artistik', color: '#7C3AED' },
  S: { name: 'Sosial', nameID: 'Sosial', color: '#059669' },
  E: { name: 'Enterprising', nameID: 'Enterprising', color: '#D97706' },
  C: { name: 'Konvensional', nameID: 'Konvensional', color: '#0891B2' }
};
