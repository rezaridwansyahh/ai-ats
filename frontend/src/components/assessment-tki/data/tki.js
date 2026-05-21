// Thomas-Kilmann Assessment (TKI) — data ported from the reference prototype
// (reference/TEST KEpi/Myralix_Thomas_Kilmann_Assessment_PreDay_Candidate_Card_v9.html
//  + ..._Laporan_Psikologis_v9.html).
//
// 5 conflict modes scored from 30 forced-choice statement pairs (each pairing two of the
// 5 modes; every mode-pair appears 3×). Max score per mode = 12. No "right" answer.

// ── 5 CONFLICT MODES ──
export const MODES = {
  CP: {
    name: 'Bersaing', eng: 'Competing', color: '#DC2626', bg: '#FEF2F2', tag: 'Asertif & Tidak Kooperatif',
    desc: 'Mengejar tujuan sendiri dengan tegas, tidak memprioritaskan hubungan. Berguna saat keputusan cepat diperlukan, isu penting membutuhkan pendirian tegas, atau saat melindungi diri dari eksploitasi.',
    when: 'Keputusan darurat · Isu prinsipil · Melindungi kepentingan vital',
    risk: 'Dapat merusak kepercayaan jika terlalu sering digunakan',
    dev: 'Latih empati aktif dalam diskusi. Coba kolaborasi untuk isu non-darurat. Perhatikan dampak terhadap kepercayaan tim jangka panjang.',
    axis: { assertive: 'TINGGI', cooperative: 'RENDAH', pos: 'Sudut kiri atas — Dominan, menegaskan diri' },
  },
  CL: {
    name: 'Berkolaborasi', eng: 'Collaborating', color: '#0A6E5C', bg: '#E0F0ED', tag: 'Asertif & Kooperatif',
    desc: 'Berusaha memuaskan semua pihak secara penuh melalui kerja sama mendalam. Berguna saat kepentingan kedua pihak terlalu penting untuk dikompromikan dan ada waktu untuk eksplorasi bersama.',
    when: 'Solusi integratif penting · Belajar dari perspektif lain · Membangun komitmen',
    risk: 'Membutuhkan waktu dan energi besar; tidak cocok untuk isu minor',
    dev: 'Pertahankan kemampuan kolaborasi. Belajar membaca kapan isu memerlukan kolaborasi penuh vs. kompromi cepat untuk menghemat energi.',
    axis: { assertive: 'TINGGI', cooperative: 'TINGGI', pos: 'Sudut kanan atas — Ideal, butuh waktu & energi' },
  },
  CM: {
    name: 'Berkompromi', eng: 'Compromising', color: '#D97706', bg: '#FFFBEB', tag: 'Tengah-tengah',
    desc: 'Mencari solusi yang memberikan kepuasan sebagian kepada semua pihak. Berguna ketika solusi sempurna tidak memungkinkan dan kedua belah pihak perlu maju.',
    when: 'Solusi sementara · Waktu terbatas · Tujuan keduanya cukup penting',
    risk: 'Bisa menghasilkan solusi yang tidak optimal untuk kedua pihak',
    dev: 'Jadikan kompromi sebagai alat strategis, bukan default. Pertimbangkan apakah beberapa situasi bisa diselesaikan lebih baik dengan kolaborasi penuh.',
    axis: { assertive: 'TENGAH', cooperative: 'TENGAH', pos: 'Pusat — Pragmatis, solusi sementara' },
  },
  AV: {
    name: 'Menghindar', eng: 'Avoiding', color: '#7C3AED', bg: '#F5F3FF', tag: 'Tidak Asertif & Tidak Kooperatif',
    desc: 'Tidak mengejar kepentingan sendiri maupun orang lain secara langsung. Berguna saat isu trivial, perlu waktu untuk menenangkan diri, atau informasi belum cukup.',
    when: 'Isu tidak penting · Perlu pendinginan · Orang lain lebih mampu menangani',
    risk: 'Masalah penting bisa terakumulasi jika selalu dihindari',
    dev: 'Identifikasi situasi mana yang benar-benar tidak penting vs. yang dihindari karena ketidaknyamanan. Latih keberanian untuk mengangkat isu yang bermakna.',
    axis: { assertive: 'RENDAH', cooperative: 'RENDAH', pos: 'Sudut kiri bawah — Menarik diri dari konflik' },
  },
  AC: {
    name: 'Mengakomodasi', eng: 'Accommodating', color: '#0891B2', bg: '#ECFEFF', tag: 'Tidak Asertif & Kooperatif',
    desc: 'Mengutamakan kebutuhan orang lain di atas kebutuhan sendiri. Berguna untuk menjaga hubungan baik, saat Anda salah, atau saat isu lebih penting bagi pihak lain.',
    when: 'Menjaga hubungan · Isu lebih penting bagi orang lain · Membangun goodwill',
    risk: 'Kepentingan sendiri bisa terabaikan jika terlalu sering digunakan',
    dev: 'Bedakan mengakomodasi dengan tulus vs. dari rasa tidak nyaman menghadapi konflik. Latih asertivitas untuk isu yang benar-benar penting bagi Anda.',
    axis: { assertive: 'RENDAH', cooperative: 'TINGGI', pos: 'Sudut kanan bawah — Mendahulukan pihak lain' },
  },
};

export const MODE_KEYS = ['CP', 'CL', 'CM', 'AV', 'AC'];
export const MAX_PER_MODE = 12;

// ── 30 FORCED-CHOICE ITEMS ── {a:{t,m}, b:{t,m}}
export const ITEMS = [
  // CP vs CL (3)
  { a: { t: 'Saya mempertahankan posisi saya dengan tegas ketika ada ketidaksepakatan.', m: 'CP' }, b: { t: 'Saya berusaha menemukan solusi yang benar-benar memenuhi kebutuhan semua pihak.', m: 'CL' } },
  { a: { t: 'Saya berjuang keras untuk pandangan saya dalam konflik.', m: 'CP' }, b: { t: 'Saya senang mendiskusikan masalah secara mendalam hingga solusi terbaik ditemukan.', m: 'CL' } },
  { a: { t: 'Saya tidak mau mengalah dalam hal-hal yang saya anggap penting.', m: 'CP' }, b: { t: 'Saya mengajak semua pihak berkolaborasi mencari solusi yang memuaskan semua.', m: 'CL' } },
  // CP vs CM (3)
  { a: { t: 'Saya menekan posisi saya dengan tegas untuk memastikan kepentingan saya terpenuhi.', m: 'CP' }, b: { t: 'Saya mencari jalan tengah yang dapat diterima semua pihak dalam perselisihan.', m: 'CM' } },
  { a: { t: 'Saya berjuang untuk memastikan keinginan saya terwujud.', m: 'CP' }, b: { t: 'Saya rela berkorban sebagian untuk mendapatkan solusi yang bisa disepakati bersama.', m: 'CM' } },
  { a: { t: 'Saya mempertahankan argumen saya dengan kuat dalam diskusi yang alot.', m: 'CP' }, b: { t: 'Saya menawarkan dan menerima kompromi yang adil dari kedua belah pihak.', m: 'CM' } },
  // CP vs AV (3)
  { a: { t: 'Saya langsung menghadapi konflik dan berjuang untuk kepentingan saya.', m: 'CP' }, b: { t: 'Saya menghindari situasi yang berpotensi memunculkan konflik tidak perlu.', m: 'AV' } },
  { a: { t: 'Saya tetap berdiri teguh pada posisi saya meski mendapat tekanan.', m: 'CP' }, b: { t: 'Saya menunda membahas isu sensitif hingga waktu yang lebih kondusif.', m: 'AV' } },
  { a: { t: 'Saya mendorong agar masalah diselesaikan sesuai pandangan saya.', m: 'CP' }, b: { t: 'Saya memilih tidak terlibat dalam perselisihan yang tidak benar-benar mendesak.', m: 'AV' } },
  // CP vs AC (3)
  { a: { t: 'Saya mempertahankan apa yang saya yakini meski orang lain tidak setuju.', m: 'CP' }, b: { t: 'Saya mengikuti keinginan orang lain meski berbeda dari pendapat saya.', m: 'AC' } },
  { a: { t: 'Saya tidak mudah menyerah pada tekanan dari pihak lain.', m: 'CP' }, b: { t: 'Saya rela mendahulukan kepentingan orang lain daripada kepentingan saya sendiri.', m: 'AC' } },
  { a: { t: 'Saya bersikeras pada sudut pandang saya dalam perselisihan.', m: 'CP' }, b: { t: 'Saya lebih suka memenuhi harapan orang lain daripada berkeras pada pendapat saya.', m: 'AC' } },
  // CL vs CM (3)
  { a: { t: 'Saya berusaha menemukan solusi kreatif yang memuaskan semua pihak sepenuhnya.', m: 'CL' }, b: { t: 'Saya mencari titik tengah yang dapat segera disepakati oleh semua pihak.', m: 'CM' } },
  { a: { t: 'Saya mendorong diskusi mendalam untuk mencapai solusi terbaik bagi semua.', m: 'CL' }, b: { t: 'Saya menawarkan kesepakatan sebagian untuk mengakhiri perselisihan dengan cepat.', m: 'CM' } },
  { a: { t: 'Saya berkolaborasi mencari solusi yang benar-benar memenuhi semua kepentingan.', m: 'CL' }, b: { t: 'Saya lebih suka mencapai kesepakatan cepat meski tidak sempurna.', m: 'CM' } },
  // CL vs AV (3)
  { a: { t: 'Saya mengajak semua pihak duduk bersama dan membahas perbedaan secara terbuka.', m: 'CL' }, b: { t: 'Saya menghindari membahas isu yang bisa memperkeruh suasana tim.', m: 'AV' } },
  { a: { t: 'Saya ingin menyelesaikan konflik secara tuntas dan menyeluruh.', m: 'CL' }, b: { t: 'Saya memilih tidak menyinggung topik yang bisa menimbulkan ketegangan.', m: 'AV' } },
  { a: { t: 'Saya mendorong percakapan jujur meskipun terasa tidak nyaman.', m: 'CL' }, b: { t: 'Saya menghindari topik sensitif untuk menjaga suasana tetap kondusif.', m: 'AV' } },
  // CL vs AC (3)
  { a: { t: 'Saya mencari solusi yang memenuhi kebutuhan semua pihak secara penuh dan nyata.', m: 'CL' }, b: { t: 'Saya mengalah pada keinginan orang lain demi menjaga hubungan yang baik.', m: 'AC' } },
  { a: { t: 'Saya berkolaborasi bersama semua pihak untuk menemukan jalan keluar yang memuaskan.', m: 'CL' }, b: { t: 'Saya memprioritaskan kebutuhan orang lain di atas kebutuhan saya sendiri.', m: 'AC' } },
  { a: { t: 'Saya berusaha menemukan solusi win-win yang benar-benar menguntungkan semua pihak.', m: 'CL' }, b: { t: 'Saya rela mengorbankan keinginan saya demi kepentingan orang yang saya pedulikan.', m: 'AC' } },
  // CM vs AV (3)
  { a: { t: 'Saya menawarkan solusi tengah agar masalah bisa cepat terselesaikan.', m: 'CM' }, b: { t: 'Saya memilih mundur dari permasalahan yang tidak benar-benar krusial.', m: 'AV' } },
  { a: { t: 'Saya mengajukan kompromi yang adil untuk mengakhiri perselisihan.', m: 'CM' }, b: { t: 'Saya menunda penyelesaian konflik hingga situasinya lebih mendukung.', m: 'AV' } },
  { a: { t: 'Saya rela melepas sebagian keinginan saya agar semua pihak bisa menyepakatinya.', m: 'CM' }, b: { t: 'Saya memilih tidak terlibat dalam konflik yang terasa menguras energi percuma.', m: 'AV' } },
  // CM vs AC (3)
  { a: { t: 'Saya mencari jalan tengah yang memberikan kepuasan bagi semua pihak.', m: 'CM' }, b: { t: 'Saya mengalah sepenuhnya untuk memenuhi keinginan orang lain.', m: 'AC' } },
  { a: { t: 'Saya menawarkan kompromi yang saling menguntungkan kedua belah pihak.', m: 'CM' }, b: { t: 'Saya lebih suka memenuhi apa yang diinginkan orang lain daripada bernegosiasi.', m: 'AC' } },
  { a: { t: 'Saya mencari titik temu yang dapat diterima semua pihak yang terlibat.', m: 'CM' }, b: { t: 'Saya menyesuaikan posisi saya sepenuhnya dengan keinginan pihak lain.', m: 'AC' } },
  // AV vs AC (3)
  { a: { t: 'Saya memilih menghindari konflik ketika hasilnya tidak sepadan dengan energi yang dikeluarkan.', m: 'AV' }, b: { t: 'Saya memilih mengikuti keinginan orang lain daripada berdebat panjang.', m: 'AC' } },
  { a: { t: 'Saya menangguhkan diskusi tentang isu yang berpotensi menimbulkan konflik.', m: 'AV' }, b: { t: 'Saya tidak keberatan mengorbankan keinginan saya untuk kepentingan orang lain.', m: 'AC' } },
  { a: { t: 'Saya menghindari situasi yang berpotensi menimbulkan pertentangan antar pihak.', m: 'AV' }, b: { t: 'Saya dengan senang hati menyesuaikan diri dengan preferensi orang lain.', m: 'AC' } },
];

// Fixed shuffled display order for the 30 items.
export const ORDER = [2, 7, 14, 0, 22, 11, 18, 5, 27, 13, 20, 3, 25, 9, 16, 1, 28, 10, 23, 6, 15, 24, 12, 17, 4, 19, 26, 8, 21, 29];

// Approximate normative averages from published TKI norms (±2 = average band).
export const NORMS = { CP: 6, CL: 6, CM: 7, AV: 6, AC: 7 };

export function normBand(k, v) {
  const a = NORMS[k] ?? 6;
  if (v >= a + 2) return { label: 'Tinggi', color: '#15803D', bg: '#ECFDF5' };
  if (v >= a - 2) return { label: 'Rata-rata', color: '#D97706', bg: '#FFFBEB' };
  return { label: 'Rendah', color: '#6B7280', bg: '#F3F4F6' };
}

// SVG matrix circle centers (viewBox 0 0 320 210).
export const MATRIX_POS = {
  CP: { cx: 80, cy: 38 }, CL: { cx: 240, cy: 38 }, CM: { cx: 160, cy: 100 },
  AV: { cx: 80, cy: 162 }, AC: { cx: 240, cy: 162 },
};

// Situational guide (Section IV).
export const SITUATIONS = [
  { situation: 'Keputusan harus cepat; Anda memiliki otoritas dan data yang jelas', mode: 'CP', icon: '🎯' },
  { situation: 'Isu sangat penting bagi semua pihak; hubungan jangka panjang harus dijaga', mode: 'CL', icon: '🤝' },
  { situation: 'Waktu terbatas; kedua pihak perlu maju walau tanpa solusi sempurna', mode: 'CM', icon: '⚖️' },
  { situation: 'Isu tidak cukup penting untuk diperdebatkan sekarang; perlu jeda emosional', mode: 'AV', icon: '🌿' },
  { situation: 'Anda menyadari kesalahan Anda; hubungan lebih penting dari isu ini', mode: 'AC', icon: '💙' },
];
