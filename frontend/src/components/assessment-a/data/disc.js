// DISC — 24 forced-choice groups; each option carries:
//   t: statement text
//   p: dimension scored when this option is chosen as Most ('*' = no Most score)
//   k: dimension scored when this option is chosen as Least ('*' = no Least score)
// Ported verbatim from Myralix_Battery_A_Candidate_Card_v10.html.

export const GROUPS = [
  { no: 1, options: [
    { t: 'Petualang, suka mengambil resiko', p: '*', k: 'D' },
    { t: 'Mudah bergaul, ramah, mudah setuju', p: 'S', k: 'S' },
    { t: 'Mempercayai, percaya pada orang lain', p: 'I', k: 'I' },
    { t: 'Penuh toleransi, menghormati orang lain', p: 'C', k: 'C' },
  ]},
  { no: 2, options: [
    { t: 'Kerjakan bersama-sama', p: 'S', k: 'S' },
    { t: 'Kerjakan dengan benar, ketepatan sangat penting', p: 'D', k: 'D' },
    { t: 'Yang penting adalah hasil', p: 'C', k: '*' },
    { t: 'Buat agar menyenangkan', p: '*', k: 'I' },
  ]},
  { no: 3, options: [
    { t: 'Sosial, pertemuan kelompok', p: 'D', k: '*' },
    { t: 'Keselamatan, keamanan', p: '*', k: 'S' },
    { t: 'Pendidikan, kebudayaan', p: 'I', k: 'I' },
    { t: 'Prestasi, penghargaan', p: '*', k: 'C' },
  ]},
  { no: 4, options: [
    { t: 'Pusat perhatian, suka bersosialisasi', p: '*', k: 'I' },
    { t: 'Pendamai, membawa ketenangan', p: 'D', k: 'D' },
    { t: 'Visioner, pandangan ke masa depan', p: 'S', k: 'S' },
    { t: 'Lembut, tertutup', p: 'C', k: 'C' },
  ]},
  { no: 5, options: [
    { t: 'Menahan diri, bisa hidup tanpa memiliki', p: 'I', k: '*' },
    { t: 'Membeli karena dorongan hati/impuls', p: 'D', k: 'D' },
    { t: 'Akan menunggu, tanpa tekanan', p: 'S', k: 'S' },
    { t: 'Akan membeli apa yang diinginkan', p: '*', k: 'C' },
  ]},
  { no: 6, options: [
    { t: 'Suka bergaul, antusias', p: 'D', k: 'D' },
    { t: 'Waspada, berhati-hati', p: 'S', k: 'S' },
    { t: 'Mudah diterka, konsisten', p: 'I', k: 'I' },
    { t: 'Mengambil kendali, bersikap langsung/direct', p: 'C', k: '*' },
  ]},
  { no: 7, options: [
    { t: 'Ingin menetapkan goal/tujuan', p: '*', k: 'D' },
    { t: 'Berusaha mencapai kesempurnaan', p: 'I', k: 'I' },
    { t: 'Menjadi bagian dari tim/kelompok', p: '*', k: 'C' },
    { t: 'Menyemangati orang lain', p: 'S', k: '*' },
  ]},
  { no: 8, options: [
    { t: 'Bersahabat, mudah bergaul', p: 'I', k: 'I' },
    { t: 'Unik, bosan dari rutinitas', p: 'S', k: 'S' },
    { t: 'Aktif melakukan perubahan', p: 'C', k: 'C' },
    { t: 'Ingin segala sesuatu akurat dan pasti', p: 'D', k: 'D' },
  ]},
  { no: 9, options: [
    { t: 'Melaksanakan sesuai perintah', p: 'C', k: 'C' },
    { t: 'Bersemangat, riang', p: '*', k: 'I' },
    { t: 'Sulit dikalahkan/ditundukkan', p: 'D', k: 'D' },
    { t: 'Ingin keteraturan, rapi', p: '*', k: 'S' },
  ]},
  { no: 10, options: [
    { t: 'Memendam perasaan dalam hati', p: 'D', k: '*' },
    { t: 'Berani menghadapi oposisi', p: 'I', k: 'C' },
    { t: 'Menyampaikan sudut pandang pribadi', p: 'S', k: '*' },
    { t: 'Menjadi frustrasi', p: '*', k: 'D' },
  ]},
  { no: 11, options: [
    { t: 'Berubah pada menit-menit terakhir', p: 'D', k: 'D' },
    { t: 'Mendesak/memaksa, agak kasar', p: 'C', k: 'C' },
    { t: 'Penuh dengan hal-hal kecil/detail', p: '*', k: 'I' },
    { t: 'Mengalah, tidak suka pertentangan', p: 'S', k: '*' },
  ]},
  { no: 12, options: [
    { t: 'Saya akan pengaruhi/bujuk mereka', p: 'I', k: 'I' },
    { t: 'Saya akan pimpin mereka', p: '*', k: 'S' },
    { t: 'Saya akan ikut/mengikuti', p: 'C', k: '*' },
    { t: 'Saya akan mendapatkan fakta-faktanya', p: 'D', k: 'D' },
  ]},
  { no: 13, options: [
    { t: 'Berusaha patuh pada peraturan', p: '*', k: 'C' },
    { t: 'Cepat, penuh keyakinan', p: 'S', k: '*' },
    { t: 'Hidup/lincah, banyak bicara', p: 'D', k: 'D' },
    { t: 'Berusaha menjaga keseimbangan', p: 'I', k: '*' },
  ]},
  { no: 14, options: [
    { t: 'Ingin kemajuan/peningkatan', p: 'C', k: 'C' },
    { t: 'Puas dengan keadaan, tenang/mudah puas', p: 'I', k: 'I' },
    { t: 'Menunjukkan perasaan dengan terbuka', p: 'S', k: '*' },
    { t: 'Rendah hati, sederhana', p: 'D', k: 'D' },
  ]},
  { no: 15, options: [
    { t: 'Memikirkan orang dahulu', p: 'S', k: 'S' },
    { t: 'Suka bersaing/kompetitif, suka tantangan', p: 'C', k: '*' },
    { t: 'Optimis, berpikir positif', p: 'I', k: 'I' },
    { t: 'Sistematis, berpikir logis', p: 'D', k: 'D' },
  ]},
  { no: 16, options: [
    { t: 'Mengelola waktu dengan efisien', p: '*', k: 'D' },
    { t: 'Sering terburu-buru, merasa ditekan', p: 'C', k: '*' },
    { t: 'Suka menyelesaikan hal yang sudah dimulai', p: 'S', k: 'S' },
    { t: 'Hal-hal sosial adalah penting', p: 'I', k: 'I' },
  ]},
  { no: 17, options: [
    { t: 'Tenang, pendiam, tertutup', p: '*', k: 'C' },
    { t: 'Menyolok, berani', p: 'I', k: '*' },
    { t: 'Gembira, bebas, riang', p: 'D', k: 'D' },
    { t: 'Menyenangkan, baik hati', p: 'S', k: 'S' },
  ]},
  { no: 18, options: [
    { t: 'Pendiam, tertutup, tenang', p: 'C', k: '*' },
    { t: 'Menyenangkan orang lain, ramah, penurut', p: 'D', k: 'D' },
    { t: 'Pemberani, tegas', p: '*', k: 'S' },
    { t: 'Tertawa lepas, hidup', p: '*', k: 'I' },
  ]},
  { no: 19, options: [
    { t: 'Cenderung terlalu banyak berjanji', p: 'S', k: '*' },
    { t: 'Tidak takut untuk berkelahi', p: '*', k: 'C' },
    { t: 'Menolak perubahan yang mendadak', p: 'D', k: 'D' },
    { t: 'Mundur apabila berada di bawah tekanan', p: 'I', k: 'I' },
  ]},
  { no: 20, options: [
    { t: 'Menerima penghargaan atas pencapaian target', p: 'C', k: '*' },
    { t: 'Menuju petualangan baru', p: 'I', k: 'I' },
    { t: 'Menyediakan waktu untuk orang lain', p: 'D', k: '*' },
    { t: 'Merencanakan masa depan, bersiap-siap', p: 'S', k: 'S' },
  ]},
  { no: 21, options: [
    { t: 'Ingin wewenang/kekuasaan lebih', p: 'S', k: 'S' },
    { t: 'Ingin kesempatan baru', p: 'D', k: 'D' },
    { t: 'Ingin arahan yang jelas', p: '*', k: 'C' },
    { t: 'Menghindari perselisihan/konflik', p: 'I', k: 'I' },
  ]},
  { no: 22, options: [
    { t: 'Penganalisa yang baik', p: 'D', k: 'D' },
    { t: 'Pendengar yang baik', p: '*', k: 'I' },
    { t: 'Pendelegasi yang baik/pandai membagi tugas', p: 'C', k: 'C' },
    { t: 'Penyemangat/pendukung yang baik', p: 'S', k: 'S' },
  ]},
  { no: 23, options: [
    { t: 'Peraturan membuat menjadi menyenangkan', p: 'S', k: 'S' },
    { t: 'Peraturan membuat menjadi aman', p: '*', k: 'C' },
    { t: 'Peraturan perlu diuji', p: '*', k: 'D' },
    { t: 'Peraturan membuat menjadi adil', p: 'I', k: '*' },
  ]},
  { no: 24, options: [
    { t: 'Kreatif, unik', p: 'I', k: 'I' },
    { t: 'Memegang teguh standar yang tinggi, akurat', p: 'C', k: '*' },
    { t: 'Dapat dipercaya dan diandalkan', p: '*', k: 'S' },
    { t: 'Berorientasi pada hasil/profil/untung', p: 'D', k: '*' },
  ]},
];

export const DISC_PROFILES = {
  D: {
    letter: 'D', name: 'Dominance', color: '#DC2626', colorLt: '#FEF2F2',
    tagline: 'Pemimpin yang Tegas dan Berorientasi Hasil',
    short: 'Individualis, kompetitif, berorientasi pada tugas, menyukai tantangan dan kebebasan',
    desc: 'Anda memiliki tingkat ketegasan yang tinggi dan tingkat pengendalian yang tinggi. Ketegasan yang tinggi membuat Anda menjadi kurang sabar melihat hasil — dengan kata lain, ingin cepat memperoleh hasil, dan hal ini menimbulkan perasaan akan kepentingan (sense of urgency) terhadap tugas. Pengendalian diri Anda yang kuat membuat Anda bersikap individual dan kurang terbuka kepada orang lain, namun menimbulkan motivasi diri yang kuat dan lebih suka bekerja secara mandiri. Orang lain akan cenderung memandang Anda sebagai seseorang yang tertutup, menuntut, suka bersaing dan ambisius.',
    strengths: ['Langsung dan to the point', 'Cepat membuat keputusan', 'Menyukai perubahan dan inovasi', 'Menetapkan banyak sasaran', 'Berani mengambil resiko', 'Inovatif, kompetitif, efisien', 'Menghargai waktu', 'Memiliki inisiatif yang kuat'],
    weaknesses: ['Suka melawan/mendebat', 'Selalu tergesa-gesa', 'Cenderung melanggar peraturan', 'Tidak sabar dengan orang lain', 'Kurang suka mendengar pendapat orang lain', 'Kurang taktis dan diplomasi', 'Terlalu berfokus pada tugas'],
    tendencies: ['Keinginan memperoleh hasil secara langsung', 'Cepat mengambil tindakan', 'Menyukai tantangan dan hal-hal baru', 'Cepat membuat keputusan', 'Tidak menyukai status quo', 'Memiliki tanggung jawab dan mengambil wewenang', 'Memecahkan masalah dengan efisien'],
    environment: ['Kekuasaan dan kewenangan', 'Kewibawaan dan tantangan', 'Kesempatan pencapaian dan pengembangan individual', 'Lingkup operasional yang luas', 'Jawaban langsung (direct answers)', 'Kebebasan dari pengendalian dan supervisi', 'Aktivitas-aktivitas baru dan bervariasi'],
    improvements: ['Mempertimbangkan setuju dan tidak setuju', 'Memperhitungkan resiko dengan cermat', 'Menggunakan prinsip kehati-hatian', 'Menciptakan lingkungan yang dapat diprediksi', 'Mempelajari fakta-fakta terlebih dahulu', 'Berhati-hati sebelum memutuskan', 'Mengakui dan menghargai kebutuhan orang lain', 'Memahami bahwa Anda membutuhkan bantuan orang lain'],
    positions: 'Attorney, Peneliti, Sales Representative, Planning Consultant, Produksi (Direktur, Manajer, Supervisor), Teknolog, Strategic Planning, Trouble Shooting, Marketing Services, Konsultan, Engineering (Direktur, Manajer, Supervisor), Wirausaha.',
  },
  I: {
    letter: 'I', name: 'Influence', color: '#D97706', colorLt: '#FFFBEB',
    tagline: 'Komunikator yang Antusias dan Penuh Semangat',
    short: 'Sosial, antusias, optimis, berorientasi pada hubungan manusia dan kerja tim',
    desc: 'Anda memiliki tingkat ketegasan yang tinggi dan tingkat keterbukaan yang tinggi. Tingkat keterbukaan yang tinggi membuat Anda lebih sosial, bersahabat, dapat menerima pendapat orang lain dan suka berkelompok. Sedangkan ketegasan yang tinggi membuat Anda antusias dalam melaksanakan tugas. Namun dalam kenyataan Anda lebih mementingkan hubungan positif dengan orang lain dibandingkan penyelesaian tugas. Anda dikenal sebagai individu yang inspirasional dan pandai memotivasi orang lain.',
    strengths: ['Cepat membuat keputusan', 'Optimistik dan penuh semangat', 'Kreatif dalam mencari solusi masalah', 'Memotivasi orang lain menuju sasaran', 'Memiliki rasa humor yang positif', 'Senang bekerja sama dalam tim', 'Mampu mengatasi konflik', 'Pandai berbicara dan menjual ide'],
    weaknesses: ['Impulsif (mengandalkan perasaan)', 'Tidak sistematis', 'Kurang mampu menentukan sasaran secara baik', 'Terlalu mempercayai orang lain', 'Kurang memperhatikan detail', 'Cenderung memberikan delegasi berlebihan', 'Pendengar situasional (bergantung apakah tertarik)'],
    tendencies: ['Menghubungi dan berinteraksi dengan orang lain', 'Membuat kesan yang menarik dan meyakinkan', 'Pandai berbicara dan mengemukakan pendapat', 'Menciptakan lingkungan yang bergairah', 'Membangkitkan antusiasme dan semangat', 'Menghibur dan menjamu orang lain', 'Memandang orang dan situasi dengan optimisme'],
    environment: ['Popularitas dan pengakuan sosial', 'Pengakuan publik terhadap kemampuan', 'Kebebasan berekspresi', 'Aktivitas kelompok di luar pekerjaan', 'Hubungan demokratik', 'Kebebasan dari pengendalian yang terlalu spesifik', 'Pembimbingan dan pelatihan', 'Suasana kerja yang menyenangkan'],
    improvements: ['Berkonsentrasi pada penyelesaian tugas', 'Memperhitungkan resiko', 'Menggunakan prinsip kehati-hatian', 'Menciptakan lingkungan yang dapat diprediksi', 'Mempelajari fakta-fakta', 'Berhati-hati sebelum memutuskan', 'Menjaga komitmen terhadap janji', 'Lebih sistematis dalam penyelesaian pekerjaan'],
    positions: 'Sales dan Marketing (Direktur, Manajer, Sales Person), Public Relations, Recruitment Consultant, Politikus, Direktur, Wirausaha, Hotelier, Travel Agent, Trainer, Hospitality, Pengacara, Motivator, Team Leader, Dosen, Theatrical Agent, General Management.',
  },
  S: {
    letter: 'S', name: 'Steadiness', color: '#16A34A', colorLt: '#F0FDF4',
    tagline: 'Pendukung Setia yang Stabil dan Dapat Diandalkan',
    short: 'Sabar, loyal, konsisten, berorientasi pada hubungan jangka panjang dan stabilitas',
    desc: 'Anda memiliki tingkat penerimaan yang tinggi dan tingkat keterbukaan yang tinggi. Orang-orang yang memiliki tingkat penerimaan tinggi tidak menunjukan tingkat energi yang cukup untuk bersikap tegas, sehingga Anda tampak lebih sabar, mendatar, tidak menuntut dan tenang. Orang tipe S tidak menyukai perubahan atau ketidakpastian, sehingga mereka merencanakan tindakan secara berhati-hati dan cenderung bekerja secara gigih dan terus menerus pada tugas-tugas yang telah ditetapkan. Anda memiliki tingkat keterbukaan yang tinggi untuk menerima orang lain yang ditunjukan dalam keramah-tamahan dan kemurahan hati.',
    strengths: ['Dapat dipercaya dan diandalkan', 'Bekerja keras untuk suatu alasan', 'Pendengar yang ulung', 'Sabar dan empati', 'Mampu mendamaikan orang yang berkonflik', 'Senang bekerja sama dalam tim', 'Logika dan seksama', 'Mampu membangun hubungan jangka panjang'],
    weaknesses: ['Tidak suka dikritik', 'Cenderung tidak menyukai perubahan', 'Kurang memiliki inisiatif untuk aktivitas baru', 'Terlalu mempercayai orang lain', 'Cenderung tidak mampu menetapkan prioritas', 'Kurang sensitif terhadap hal-hal yang kurang penting', 'Kurang teliti dan hati-hati'],
    tendencies: ['Melaksanakan tugas secara konsisten', 'Menunjukan kesabaran', 'Mengembangkan keterampilan khusus', 'Senang membantu orang lain', 'Menunjukan loyalitas', 'Menjadi pendengar yang baik', 'Menciptakan lingkungan kerja yang stabil dan harmonis'],
    environment: ['Penghargaan atas kesetiaan', 'Pengakuan atas kontribusi', 'Kestabilan lingkungan kerja', 'Aktivitas kelompok yang menyenangkan', 'Hubungan yang demokratik', 'Kebebasan dari perubahan mendadak', 'Pembimbingan yang personal'],
    improvements: ['Berkonsentrasi pada tugas', 'Memperhitungkan resiko', 'Berani mengambil inisiatif', 'Menciptakan target yang terukur', 'Mempelajari fakta-fakta', 'Lebih berani berpendapat dan menyuarakan ide', 'Bersedia menghadapi perubahan', 'Lebih tegas dalam menetapkan prioritas'],
    positions: 'Administrative Work, Engineering and Production (Sales, Services, Project), Chef, Accounting, Telemarketing/Tele-Sales, Research and Development, Administrator, Retail-General, Sales-General, Accounting-General, Service-General, Landscape Gardener.',
  },
  C: {
    letter: 'C', name: 'Compliance', color: '#2563EB', colorLt: '#EFF6FF',
    tagline: 'Pemikir Analitis yang Presisi dan Terstruktur',
    short: 'Teliti, sistematis, analitis, menjaga standar tinggi, berorientasi pada kualitas dan akurasi',
    desc: 'Anda memiliki tingkat penerimaan yang tinggi dan tingkat pengendalian yang tinggi. Orang-orang yang memiliki tingkat penerimaan tinggi tidak menunjukan tingkat energi yang cukup untuk bersikap tegas, sehingga Anda tampak kurang tegas dan bersikap reaktif. Namun tingkat pengendalian yang tinggi membuat Anda bersikap individual dan lebih suka bekerja secara mandiri. Orang-orang tipe C cenderung melihat kehidupan dalam bentuk struktur dan peraturan-peraturan dan berusaha untuk mencapai keakuratan dan ketelitian setinggi mungkin.',
    strengths: ['Berfikir objektif dan analitis', 'Hati-hati dan teliti', 'Mempertahankan standar tinggi', 'Menanyakan hal-hal yang benar', 'Keterampilan diplomatik', 'Memberikan perhatian sampai terperinci', 'Logika dan seksama', 'Menyelesaikan masalah secara ilmiah'],
    weaknesses: ['Ragu-ragu dalam bertindak', 'Cenderung rewel terhadap hal-hal detail', 'Cenderung bersikap defensif bila dikritik', 'Memilih-milih orang yang seperti dirinya', 'Cenderung hanya memberikan instruksi tanpa menjelaskan', 'Terlalu perfeksionis'],
    tendencies: ['Mengikuti standar-standar dan petunjuk-petunjuk', 'Berkonsentrasi pada hal-hal terperinci', 'Berpikir analitikal', 'Memeriksa keakuratan dan menganalisis kinerja', 'Menggunakan pendekatan sistematik', 'Menjadi kaku atau formal ketika berhubungan dengan orang lain'],
    environment: ['Ekspresi kinerja yang terdefinisi secara jelas', 'Nilai-nilai kualitas dan akurasi', 'Kesempatan untuk menunjukan keahlian', 'Pengendalian terhadap faktor-faktor yang mempengaruhi kinerja', 'Kesempatan untuk bertanya mengapa?', 'Pengakuan terhadap keterampilan khusus beserta pencapaiannya'],
    improvements: ['Mendelegasikan tugas-tugas penting', 'Cepat membuat keputusan', 'Menggunakan kebijakan hanya sebagai petunjuk', 'Berkompromi dengan orang lain', 'Memulai dan memfasilitasi diskusi', 'Mendukung kerjasama', 'Membuat perencanaan secara hati-hati', 'Mengembangkan toleransi untuk menghadapi konflik'],
    positions: 'Planner, Engineer (Installation, Technical), Technical/Research (Chemist Technician), Academic, Statistician, Government Worker, IT Management, Quality Controller, Prison Officer, Architect, Medical Specialist, Psychologist, Accountant.',
  },
};

// Lightweight name+color lookup for report bar visuals.
export const DISC_DIMS = {
  D: { name: 'Dominance', color: '#DC2626', bg: '#FEF2F2' },
  I: { name: 'Influence', color: '#D97706', bg: '#FFFBEB' },
  S: { name: 'Steadiness', color: '#16A34A', bg: '#F0FDF4' },
  C: { name: 'Compliance', color: '#2563EB', bg: '#EFF6FF' },
};
