// Big Five (OCEAN) — 44 Likert items, 5 traits (E/A/C/N/O).
// Ported verbatim from Myralix_Battery_A_Candidate_Card_v10.html.

export const TRAITS = {
  E: {
    name: 'Extraversion', nameID: 'Ekstraversion', color: '#0369A1', bg: '#EFF6FF',
    low: 'Introvert, cenderung pendiam, lebih menyukai kesendirian, dan kurang menonjolkan diri di lingkungan sosial.',
    mid: 'Menunjukkan keseimbangan antara ekstroversi dan introversi — nyaman di keramaian maupun kesendirian tergantung situasi.',
    high: 'Memiliki tingkat motivasi yang tinggi dalam bergaul, menjalin hubungan dengan sesama dan cenderung dominan dalam lingkungannya. Aktif, enerjik, dan antusias.',
    keywords: ['Aktif Berbicara', 'Penuh Tenaga', 'Bergaul', 'Antusias', 'Terbuka'],
    tips: 'Tingkat tinggi: manfaatkan energi sosial untuk memimpin dan menginspirasi tim. Tingkat rendah: kerjakan tugas yang membutuhkan fokus mendalam.',
  },
  A: {
    name: 'Agreeableness', nameID: 'Agreeableness', color: '#059669', bg: '#ECFDF5',
    low: 'Cenderung kompetitif, skeptis, dan lebih mengutamakan kepentingan sendiri. Mungkin sulit berkompromi dalam situasi kelompok.',
    mid: 'Menunjukkan keseimbangan antara kepercayaan dan skeptisisme — kooperatif namun tetap asertif dalam mempertahankan pendapat.',
    high: 'Ramah, memiliki kepribadian yang kooperatif, menghindari konflik dan memiliki kecenderungan untuk mengikuti orang lain. Mudah memaafkan dan penuh perhatian.',
    keywords: ['Kooperatif', 'Ramah', 'Memaafkan', 'Dipercaya', 'Empatik'],
    tips: 'Tingkat tinggi: jadikan kekuatan dalam membangun hubungan tim. Tingkat rendah: gunakan ketegasan untuk negosiasi dan pengambilan keputusan.',
  },
  C: {
    name: 'Conscientiousness', nameID: 'Conscientiousness', color: '#0891B2', bg: '#ECFEFF',
    low: 'Cenderung spontan, fleksibel, dan menyukai kebebasan dari prosedur ketat. Mungkin kurang teratur dalam pengelolaan waktu dan tugas.',
    mid: 'Menunjukkan tingkat kedisiplinan yang seimbang — terorganisir dalam hal penting namun fleksibel dalam hal lainnya.',
    high: 'Memiliki kontrol terhadap lingkungan sosial, berpikir sebelum bertindak, menunda kepuasan, mengikuti peraturan dan norma, terencana, terorganisir, dan memprioritaskan tugas.',
    keywords: ['Terorganisir', 'Disiplin', 'Dapat Diandalkan', 'Terencana', 'Efisien'],
    tips: 'Tingkat tinggi: ideal untuk peran yang membutuhkan presisi dan manajemen. Tingkat rendah: cocok untuk pekerjaan kreatif yang membutuhkan fleksibilitas.',
  },
  N: {
    name: 'Neuroticism', nameID: 'Neurotisisme', color: '#DC2626', bg: '#FEF2F2',
    low: 'Stabil secara emosional, tenang, dan tidak mudah dipengaruhi tekanan. Mampu mengatasi stres dengan efektif.',
    mid: 'Dapat mengendalikan diri meskipun pada saat cemas. Menunjukkan tingkat stabilitas emosional yang cukup baik dengan sesekali merasakan tekanan.',
    high: 'Mudah mengalami kecemasan, kekhawatiran berlebihan, dan perubahan suasana hati. Perlu dukungan lebih dalam menghadapi situasi penuh tekanan.',
    keywords: ['Emosi Stabil', 'Tenang', 'Kecemasan', 'Ketegangan', 'Suasana Hati'],
    tips: 'Tingkat rendah: manfaatkan stabilitas emosi untuk peran kepemimpinan di bawah tekanan. Tingkat tinggi: kembangkan strategi manajemen stres dan mindfulness.',
  },
  O: {
    name: 'Openness', nameID: 'Openness', color: '#7C3AED', bg: '#F5F3FF',
    low: 'Cenderung konvensional, praktis, dan menyukai hal-hal yang sudah familiar. Lebih menyukai rutinitas dan prosedur yang sudah terbukti.',
    mid: 'Mudah bertoleransi, memiliki kapasitas untuk menyerap informasi baru sambil tetap menghargai tradisi dan cara-cara yang sudah terbukti.',
    high: 'Mudah bertoleransi, memiliki kapasitas untuk menyerap informasi, menjadi sangat fokus dan mampu untuk waspada pada berbagai perasaan, pemikiran dan impulsivitas. Kreatif dan imajinatif.',
    keywords: ['Kreatif', 'Imajinatif', 'Ingin Tahu', 'Estetika', 'Inovatif'],
    tips: 'Tingkat tinggi: cocok untuk peran yang membutuhkan kreativitas dan inovasi. Tingkat rendah: unggul dalam pekerjaan yang membutuhkan ketelitian dan konsistensi.',
  },
};

// Number of items per trait in the 44-item form (matches BF_ITEMS counts).
export const TRAIT_MAX = { E: 40, A: 45, C: 45, N: 40, O: 50 };

// 5-point Likert labels (1..5 mapped to indices 0..4).
export const LIKERT = ['Sangat Tidak Sesuai', 'Tidak Sesuai', 'Netral', 'Sesuai', 'Sangat Sesuai'];

// [qnum, trait, reversed]
export const BF_ITEMS = [
  [1,'E',false],[2,'A',true],[3,'C',false],[4,'N',false],[5,'O',false],
  [6,'E',true],[7,'A',false],[8,'C',true],[9,'N',true],[10,'O',false],
  [11,'E',false],[12,'A',true],[13,'C',false],[14,'N',false],[15,'O',false],
  [16,'E',false],[17,'A',false],[18,'C',true],[19,'N',false],[20,'O',false],
  [21,'E',true],[22,'A',false],[23,'C',true],[24,'N',true],[25,'O',false],
  [26,'E',false],[27,'A',true],[28,'C',false],[29,'N',false],[30,'O',false],
  [31,'E',true],[32,'A',false],[33,'C',false],[34,'N',true],[35,'O',true],
  [36,'E',false],[37,'A',true],[38,'C',false],[39,'N',false],[40,'O',false],
  [41,'O',true],[42,'A',false],[43,'C',true],[44,'O',false],
];

export const BF_QS = [
  'Aktif Berbicara',
  'Mencari Kelemahan Orang Lain',
  'Mengerjakan Tugas dengan Serius',
  'Merasa Tertekan',
  'Orang Unik yang Penuh dengan Gagasan Baru',
  'Suka Menyendiri',
  'Suka Menolong dan Tidak Iri pada Orang Lain',
  'Bertindak Asal-asalan',
  'Orang yang Santai dan Mampu Mengatasi Stres',
  'Memiliki Rasa Ingin Tahu Terhadap Sesuatu yang Berbeda',
  'Penuh Tenaga',
  'Berselisih dengan Orang Lain',
  'Pekerja yang Dapat Diandalkan',
  'Mudah Merasa Tegang',
  'Orang Yang Berbakat dan Pemikir',
  'Dapat Membangkitkan Kegembiraan',
  'Mudah Memaafkan',
  'Cenderung Berkerja Tidak Teratur',
  'Terlalu Sering Khawatir',
  'Memiliki Imajinasi yang Aktif',
  'Cenderung Pendiam',
  'Secara Umum Dapat Dipercaya',
  'Cenderung Pemalas',
  'Memiliki Perasaan yang Stabil dan Tidak Mudah Sedih',
  'Kreatif',
  'Terbuka',
  'Dingin dan Kurang Bersahabat',
  'Dapat Memusatkan Diri Pada Pekerjaan',
  'Dipengaruhi Oleh Suasana Hati',
  'Menyukai Artistik dan Estetika',
  'Orang Yang Pemalu',
  'Ramah dan Penuh Perhatian',
  'Melakukan Sesuatu dengan Efisien',
  'Merasa Tenang Meski dalam Situasi Menegangkan',
  'Menyukai Pekerjaan Yang Rutin',
  'Suka Bergaul',
  'Kadang Berperilaku Kasar',
  'Merencanakan Dan Memusatkan Pada Rencana Tersebut',
  'Mudah Merasa Cemas',
  'Merefleksi dan Mengolah Gagasan Baru',
  'Kurang Tertarik dengan Seni',
  'Menyukai Bekerjasama dengan Orang Lain',
  'Memiliki Perhatian yang Mudah Terpecah',
  'Memiliki Keahlian dalam Kesenian dan Literatur',
];
