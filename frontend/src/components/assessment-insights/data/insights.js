// Insights Discovery Assessment — data ported from the reference prototype
// (reference/TEST KEpi/Myralix_Insights_Discovery_Assessment_PreDay_Candidate_Card_v9.html).
//
// 8 work profiles keyed by quadrant + S/N variant. Candidates never see the keys.
// 72 forced-choice statement pairs across 3 dimensions: E/I, T/F, S/N (24 each).

// ── 8 WORK PROFILES ──
export const PROFILES = {
  // MERAH variants (E+T dominant)
  RED_S: {
    id: 'RED_S', icon: '🎯',
    color: '#DC2626', colorLt: '#FEF2F2', colorDk: '#991B1B',
    name: 'Pengarah', tagline: 'Berorientasi Hasil — Tegas — Terstruktur',
    desc: 'Anda adalah pemimpin yang mengambil keputusan dengan cepat dan percaya diri berdasarkan fakta. Anda menetapkan target yang jelas, mengeksekusi dengan disiplin, dan tidak mentolerir inefisiensi. Orang-orang di sekitar Anda tahu persis apa yang Anda harapkan.',
    strengths: ['Tegas dan berani dalam pengambilan keputusan', 'Sangat fokus pada target dan eksekusi', 'Efisien — tidak membuang waktu untuk hal yang tidak perlu', 'Mampu mengelola prioritas dalam kondisi tekanan tinggi', 'Konsisten dalam menegakkan standar dan ekspektasi'],
    areas: ['Terkadang dipersepsi kurang empati dalam situasi emosional', 'Kecenderungan untuk mengambil alih ketika tim bekerja terlalu lambat', 'Kurang nyaman dengan ambiguitas dan ketidakpastian'],
    tendencies: ['Memimpin dari depan dengan contoh nyata', 'Mengutamakan kecepatan dan hasil atas proses yang panjang', 'Memberikan instruksi yang spesifik dan terukur', 'Menghargai orang yang langsung to-the-point'],
    positions: 'Operations Manager, Project Manager, Sales Manager, Head of Production, atau posisi eksekutif yang menekankan eksekusi dan pencapaian target.',
  },
  RED_N: {
    id: 'RED_N', icon: '🚀',
    color: '#DC2626', colorLt: '#FEF2F2', colorDk: '#991B1B',
    name: 'Penggerak', tagline: 'Visioner — Kompetitif — Transformatif',
    desc: 'Anda adalah katalis perubahan. Anda melihat peluang sebelum orang lain, bergerak cepat, dan memotivasi orang dengan energi dan visi yang kuat. Anda tidak nyaman dengan status quo dan selalu mendorong batas.',
    strengths: ['Kemampuan luar biasa dalam membaca peluang strategis', 'Energi dan antusiasme yang menular kepada tim', 'Berani mengambil risiko yang terkalkulasi', 'Mampu menginspirasi orang untuk bergerak melampaui zona nyaman', 'Cepat beradaptasi dan pivot ketika situasi berubah'],
    areas: ['Terkadang memulai banyak inisiatif tanpa menyelesaikan semuanya', 'Kurang sabar dengan detail operasional', 'Bisa terlalu dominan dalam diskusi strategis'],
    tendencies: ['Menantang cara lama dan mencari terobosan', 'Berbicara dengan gambaran besar dan metafora yang menggugah', 'Mengambil kepemilikan atas proyek secara penuh', 'Mendorong tim untuk berpikir ambisius'],
    positions: 'Entrepreneur, Business Development Director, Chief Strategy Officer, Innovation Lead, atau posisi yang membutuhkan visi transformasional dan kepemimpinan perubahan.',
  },
  // KUNING variants (E+F dominant)
  YEL_N: {
    id: 'YEL_N', icon: '✨',
    color: '#D97706', colorLt: '#FEF3C7', colorDk: '#92400E',
    name: 'Pemotivasi', tagline: 'Inspiratif — Kreatif — Antusias',
    desc: 'Anda adalah sumber energi positif bagi tim. Anda menginspirasi, memotivasi, dan menciptakan antusiasme di mana pun Anda berada. Ide-ide segar mengalir dengan mudah, dan Anda pandai menyampaikannya dengan cara yang membuat orang ingin terlibat.',
    strengths: ['Kemampuan komunikasi yang luar biasa dan persuasif', 'Sangat kreatif dalam menghasilkan ide-ide baru', 'Membangun semangat tim dan rasa kebersamaan', 'Pandai menjembatani berbagai pihak dengan berbeda kepentingan', 'Fleksibel dan adaptif terhadap perubahan'],
    areas: ['Terkadang terlalu optimis tanpa cukup analisis risiko', 'Kurang konsisten dalam follow-through detail', 'Bisa kehilangan fokus saat terlalu banyak proyek berjalan bersamaan'],
    tendencies: ['Mengawali percakapan dengan semangat dan cerita yang menarik', 'Merayakan kemajuan dan pencapaian tim secara terbuka', 'Mendorong brainstorming dan kreativitas kolektif', 'Mencari pendekatan baru yang lebih inovatif'],
    positions: 'Marketing Manager, Brand Strategist, Training & Development, Creative Director, PR & Communications, atau posisi yang menggabungkan kreativitas, komunikasi, dan kepemimpinan.',
  },
  YEL_S: {
    id: 'YEL_S', icon: '🌟',
    color: '#D97706', colorLt: '#FEF3C7', colorDk: '#92400E',
    name: 'Penghubung', tagline: 'Sosial — Persuasif — Berorientasi Manusia',
    desc: 'Anda adalah jembatan antar-manusia. Jaringan sosial Anda luas, kepercayaan mudah Anda bangun, dan Anda secara alami menghubungkan orang yang tepat dengan peluang yang tepat. Anda menjaga energi tim tetap positif dan kolaboratif.',
    strengths: ['Kemampuan networking yang luar biasa dan tulus', 'Pandai membaca kebutuhan orang dan merespons dengan tepat', 'Menciptakan lingkungan kerja yang inklusif dan menyenangkan', 'Persuasif tanpa manipulatif — orang ingin membantu Anda', 'Sangat efektif dalam peran yang butuh kolaborasi lintas fungsi'],
    areas: ['Terkadang memprioritaskan harmoni di atas keputusan yang sulit', 'Bisa terlalu bergantung pada hubungan personal dalam pekerjaan', 'Kurang nyaman dalam konfrontasi langsung'],
    tendencies: ['Selalu memperhatikan suasana dan dinamika interpersonal', 'Merayakan keberhasilan individu dan kolektif', 'Menengahi konflik dengan pendekatan yang hangat', 'Membangun loyalitas jangka panjang melalui kepercayaan'],
    positions: 'Account Manager, HR Business Partner, Customer Success, Sales Manager, atau posisi yang mengandalkan hubungan jangka panjang dan kepercayaan.',
  },
  // HIJAU variants (I+F dominant)
  GRN_S: {
    id: 'GRN_S', icon: '🌿',
    color: '#059669', colorLt: '#ECFDF5', colorDk: '#065F46',
    name: 'Pendukung', tagline: 'Stabil — Dapat Diandalkan — Berorientasi Tim',
    desc: 'Anda adalah fondasi tim. Anda konsisten, dapat diandalkan, dan selalu hadir ketika orang membutuhkan. Anda memastikan semua orang merasa aman, dihargai, dan memiliki ruang untuk berkontribusi.',
    strengths: ['Sangat konsisten dan dapat dipercaya', 'Mendengarkan dengan tulus dan penuh perhatian', 'Menciptakan stabilitas dan rasa aman dalam tim', 'Teliti dalam menjalankan tanggung jawab', 'Setia dan berkomitmen jangka panjang'],
    areas: ['Terkadang sulit berkata tidak atau mendelegasikan', 'Kurang nyaman dengan perubahan mendadak yang besar', 'Bisa mengorbankan kebutuhan sendiri untuk kebutuhan tim'],
    tendencies: ['Memastikan semua orang sudah dilibatkan sebelum memutuskan', 'Menyelesaikan tugas dengan tertib dan konsisten', 'Menghindari konflik kecuali benar-benar diperlukan', 'Membangun kepercayaan melalui konsistensi tindakan'],
    positions: 'HR Manager, Operations Coordinator, Customer Service Lead, Project Coordinator, atau posisi yang mengandalkan keandalan, kesabaran, dan orientasi pada orang.',
  },
  GRN_N: {
    id: 'GRN_N', icon: '💚',
    color: '#059669', colorLt: '#ECFDF5', colorDk: '#065F46',
    name: 'Pemikir Empatik', tagline: 'Idealis — Reflektif — Berorientasi Nilai',
    desc: 'Anda memiliki kompas moral yang kuat dan kemampuan luar biasa untuk memahami perspektif orang lain secara mendalam. Anda membawa keaslian dan makna ke dalam pekerjaan, dan orang datang kepada Anda ketika mereka butuh didengar dan dipahami.',
    strengths: ['Kecerdasan emosional yang sangat tinggi', 'Kemampuan membangun kepercayaan mendalam dan otentik', 'Visi yang jelas tentang apa yang bermakna dan bernilai', 'Memotivasi melalui tujuan dan makna, bukan hanya insentif', 'Pandai dalam peran mediasi dan fasilitasi'],
    areas: ['Terkadang terlalu idealis dalam lingkungan yang sangat pragmatis', 'Bisa terlalu menyerap beban emosional orang lain', 'Kurang nyaman dengan lingkungan yang sangat kompetitif'],
    tendencies: ['Mempertanyakan "mengapa" di balik setiap keputusan besar', 'Mencari keselarasan antara nilai pribadi dan pekerjaan', 'Merespons dengan empati sebelum solusi', 'Mendorong budaya yang autentik dan berorientasi pada makna'],
    positions: 'Counselor, Learning & Development, Organizational Culture, CSR Manager, atau posisi yang menggabungkan empati, nilai, dan pengembangan manusia.',
  },
  // BIRU variants (I+T dominant)
  BLU_S: {
    id: 'BLU_S', icon: '🔬',
    color: '#1D4ED8', colorLt: '#EFF6FF', colorDk: '#1E3A8A',
    name: 'Analis', tagline: 'Metodis — Presisi — Berbasis Bukti',
    desc: 'Anda adalah penjamin kualitas. Anda tidak puas dengan jawaban yang setengah-setengah — Anda menggali lebih dalam, memverifikasi setiap asumsi, dan memastikan setiap keputusan didukung oleh data yang solid. Ketelitian Anda adalah aset yang tidak ternilai.',
    strengths: ['Sangat teliti dan presisi dalam pekerjaan', 'Kemampuan analisis data yang kuat dan sistematis', 'Mengidentifikasi risiko dan potensi masalah sebelum terjadi', 'Konsisten dalam menjaga standar kualitas tinggi', 'Dapat diandalkan untuk pekerjaan yang butuh akurasi'],
    areas: ['Terkadang terlalu perfeksionis hingga memperlambat eksekusi', 'Kurang nyaman dalam presentasi publik atau spontanitas sosial', 'Bisa terlalu kritis terhadap pekerjaan orang lain'],
    tendencies: ['Memulai dengan data, bukan asumsi', 'Mendokumentasikan proses dan keputusan secara lengkap', 'Mengajukan pertanyaan kritis yang orang lain tidak berani tanyakan', 'Memastikan semua risiko sudah diperhitungkan'],
    positions: 'Data Analyst, Financial Controller, Quality Assurance, Risk Manager, Auditor, atau posisi yang mengandalkan ketelitian, analisis, dan akurasi.',
  },
  BLU_N: {
    id: 'BLU_N', icon: '♟️',
    color: '#1D4ED8', colorLt: '#EFF6FF', colorDk: '#1E3A8A',
    name: 'Ahli Strategi', tagline: 'Konseptual — Independen — Pemikir Jangka Panjang',
    desc: 'Anda adalah arsitek sistem dan strategi. Anda melihat pola yang orang lain lewatkan, berpikir beberapa langkah ke depan, dan menghasilkan kerangka konseptual yang mengubah cara organisasi memahami masalah kompleks.',
    strengths: ['Pemikiran strategis jangka panjang yang luar biasa', 'Kemampuan mensintesis informasi kompleks dari berbagai sumber', 'Mandiri dan dapat dipercaya untuk mengerjakan masalah sulit sendiri', 'Menghasilkan solusi orisinal untuk masalah yang belum pernah dipecahkan', 'Sangat efektif dalam perencanaan dan pengembangan kebijakan'],
    areas: ['Terkadang sulit menjelaskan ide kompleks kepada audiens yang beragam', 'Kurang nyaman dengan pekerjaan repetitif atau detail operasional', 'Bisa terlihat jarak secara sosial karena preferensi kerja mandiri'],
    tendencies: ['Membangun model mental sebelum berbicara atau bertindak', 'Menghindari pembicaraan basa-basi, lebih suka diskusi substansif', 'Terus mempertanyakan dan menyempurnakan cara berpikir', 'Mengerjakan masalah paling kompleks yang ada'],
    positions: 'Chief Strategy Officer, Policy Director, Research Lead, Management Consultant, atau posisi senior yang menggabungkan pemikiran konseptual dan perencanaan strategis.',
  },
};

// ── 4 COLOR / QUADRANT MAP (for the report) ──
export const COLOR_MAP = {
  RED: { name: 'Merah',  icon: '🎯', color: '#DC2626', bg: '#FEF2F2', label: 'Kuadran I — Ekstraversi + Berpikir',  howTo: 'Langsung, konkret, fokus pada hasil dan tenggat waktu' },
  YEL: { name: 'Kuning', icon: '✨', color: '#D97706', bg: '#FEF3C7', label: 'Kuadran II — Ekstraversi + Perasaan', howTo: 'Antusias, personal, berikan ruang berekspresi dan berkreasi' },
  GRN: { name: 'Hijau',  icon: '🌿', color: '#059669', bg: '#ECFDF5', label: 'Kuadran III — Introversi + Perasaan', howTo: 'Sabar, hangat, hormati proses dan jangan terburu-buru' },
  BLU: { name: 'Biru',   icon: '🔬', color: '#1D4ED8', bg: '#EFF6FF', label: 'Kuadran IV — Introversi + Berpikir',  howTo: 'Berikan data dan logika, beri waktu untuk berpikir mendalam' },
};

// ── 72 FORCED-CHOICE PAIRS ──
// sa/sb: dimension scored for choice A / choice B. Dimensions: E, I, T, F, S, N.
export const PAIRS = [
  // ═══ E/I SCALE (24 pairs) ═══
  { a: 'Saya lebih suka mendiskusikan ide dengan orang lain sebelum mengambil keputusan.', b: 'Saya lebih suka memikirkan ide sendiri secara mendalam sebelum mendiskusikannya.', sa: 'E', sb: 'I' },
  { a: 'Saya merasa bersemangat setelah bertemu banyak orang baru.', b: 'Saya merasa perlu waktu sendiri untuk memulihkan energi setelah acara sosial yang padat.', sa: 'E', sb: 'I' },
  { a: 'Saya cenderung berbicara lebih dulu dan berpikir sambil bicara.', b: 'Saya cenderung berpikir matang dan menyeluruh sebelum berbicara.', sa: 'E', sb: 'I' },
  { a: 'Saya lebih produktif di lingkungan kerja yang ramai dan penuh interaksi.', b: 'Saya lebih produktif di lingkungan kerja yang tenang dan minim gangguan.', sa: 'E', sb: 'I' },
  { a: 'Saya lebih suka berkolaborasi dalam kelompok untuk menyelesaikan masalah besar.', b: 'Saya lebih suka bekerja mandiri terlebih dahulu, lalu berbagi hasilnya dengan tim.', sa: 'E', sb: 'I' },
  { a: 'Saya mudah memulai percakapan dengan orang yang baru saya kenal.', b: 'Saya lebih nyaman berbicara mendalam dengan orang yang sudah saya kenal baik.', sa: 'E', sb: 'I' },
  { a: 'Ketika menghadapi masalah besar, saya langsung mencari orang untuk diajak berdiskusi.', b: 'Ketika menghadapi masalah besar, saya perlu memproses sendiri terlebih dahulu.', sa: 'E', sb: 'I' },
  { a: 'Saya merasa kurang bersemangat jika harus bekerja sendiri dalam waktu yang lama.', b: 'Saya merasa terkuras energinya jika harus banyak berinteraksi sosial sepanjang hari.', sa: 'E', sb: 'I' },
  { a: 'Dalam rapat, saya biasanya aktif menyampaikan pendapat dan menggerakkan diskusi.', b: 'Dalam rapat, saya lebih banyak mendengarkan dan berpikir mendalam sebelum berkomentar.', sa: 'E', sb: 'I' },
  { a: 'Saya lebih suka mendapat feedback langsung melalui diskusi tatap muka.', b: 'Saya lebih suka mendapat feedback tertulis sehingga bisa memprosesnya lebih dalam.', sa: 'E', sb: 'I' },
  { a: 'Jaringan sosial yang luas adalah aset kerja yang sangat penting bagi saya.', b: 'Hubungan kerja yang sedikit namun berkualitas dalam lebih berarti dari jaringan yang luas.', sa: 'E', sb: 'I' },
  { a: 'Saya merasa lebih kreatif dan energik setelah sesi brainstorming kelompok yang intens.', b: 'Saya lebih kreatif ketika bekerja dalam kesunyian tanpa interupsi.', sa: 'E', sb: 'I' },
  { a: 'Saya cenderung berbagi kemajuan pekerjaan secara terbuka dan antusias dengan tim.', b: 'Saya cenderung bekerja diam-diam dan menunjukkan hasilnya saat sudah matang.', sa: 'E', sb: 'I' },
  { a: 'Saya merasa nyaman menjadi pusat perhatian saat presentasi atau diskusi kelompok besar.', b: 'Saya lebih nyaman berkontribusi signifikan dari belakang layar daripada tampil di depan.', sa: 'E', sb: 'I' },
  { a: 'Ketika ada konflik, saya cenderung langsung membicarakannya untuk segera diselesaikan.', b: 'Ketika ada konflik, saya butuh waktu untuk menenangkan diri sebelum bisa membicarakannya.', sa: 'E', sb: 'I' },
  { a: 'Lingkungan kerja saya cenderung ramai dengan percakapan dan interaksi spontan.', b: 'Lingkungan kerja saya cenderung tenang dengan gangguan yang sangat minimal.', sa: 'E', sb: 'I' },
  { a: 'Saya mudah beradaptasi dan nyaman dengan pertemuan mendadak dan improvisasi.', b: 'Saya lebih nyaman dengan jadwal dan agenda yang sudah direncanakan sebelumnya.', sa: 'E', sb: 'I' },
  { a: 'Saya mendapat energi dari memimpin diskusi dan mengarahkan percakapan.', b: 'Saya mendapat energi dari observasi mendalam dan analisis yang terfokus.', sa: 'E', sb: 'I' },
  { a: 'Saya lebih suka mengekspresikan pikiran secara verbal dalam diskusi langsung.', b: 'Saya lebih suka mengekspresikan pikiran melalui tulisan yang terstruktur.', sa: 'E', sb: 'I' },
  { a: 'Saya senang mengenal banyak aspek dari berbagai topik secara luas.', b: 'Saya lebih senang mendalami satu topik secara sangat spesifik dan mendalam.', sa: 'E', sb: 'I' },
  { a: 'Ketika belajar hal baru, saya lebih suka kelas, diskusi, atau workshop kelompok.', b: 'Ketika belajar hal baru, saya lebih suka belajar mandiri atau membaca secara mendalam.', sa: 'E', sb: 'I' },
  { a: 'Saya biasanya yang aktif memperkenalkan diri dan memulai interaksi dalam pertemuan baru.', b: 'Saya biasanya menunggu dan mengobservasi sebelum memperkenalkan diri.', sa: 'E', sb: 'I' },
  { a: 'Saya merasa nyaman di ruang terbuka yang memungkinkan interaksi spontan.', b: 'Saya merasa nyaman di ruang privat yang memungkinkan konsentrasi penuh.', sa: 'E', sb: 'I' },
  { a: 'Saya mendapat inspirasi terbesar dari bertukar pikiran dengan banyak orang berbeda.', b: 'Saya mendapat inspirasi terbesar dari waktu merenung, membaca, dan refleksi diri.', sa: 'E', sb: 'I' },
  // ═══ T/F SCALE (24 pairs) ═══
  { a: 'Ketika mengambil keputusan, saya mengutamakan logika, data, dan konsekuensi objektif.', b: 'Ketika mengambil keputusan, saya mempertimbangkan dampaknya terhadap orang yang terlibat.', sa: 'T', sb: 'F' },
  { a: 'Saya lebih nyaman memberikan kritik yang jujur dan langsung daripada bersikap terlalu lembut.', b: 'Saya selalu mempertimbangkan perasaan orang sebelum menyampaikan kritik.', sa: 'T', sb: 'F' },
  { a: 'Keadilan bagi saya berarti menerapkan aturan yang sama pada semua orang tanpa pengecualian.', b: 'Keadilan bagi saya berarti mempertimbangkan situasi dan kebutuhan unik setiap individu.', sa: 'T', sb: 'F' },
  { a: 'Dalam argumen, saya lebih fokus pada siapa yang benar secara logis.', b: 'Dalam argumen, saya lebih fokus pada menjaga hubungan dan memastikan semua pihak merasa didengar.', sa: 'T', sb: 'F' },
  { a: 'Saya lebih menghargai rekan kerja yang kompeten dan efisien.', b: 'Saya lebih menghargai rekan kerja yang hangat dan mampu membangun atmosfer tim yang positif.', sa: 'T', sb: 'F' },
  { a: 'Saya biasanya bisa memisahkan emosi pribadi dari pertimbangan profesional dengan baik.', b: 'Saya percaya bahwa empati dan intuisi emosional adalah bagian penting dari keputusan yang baik.', sa: 'T', sb: 'F' },
  { a: 'Ketika memberi feedback, saya langsung pada poin utama masalah.', b: 'Ketika memberi feedback, saya pastikan orang merasa dihargai dan didukung sebelum ke poin masalah.', sa: 'T', sb: 'F' },
  { a: 'Saya lebih termotivasi oleh tantangan intelektual dan pencapaian yang terukur.', b: 'Saya lebih termotivasi oleh dampak positif yang saya berikan kepada orang-orang di sekitar saya.', sa: 'T', sb: 'F' },
  { a: 'Saya merasa nyaman membuat keputusan yang tidak populer jika memang paling logis.', b: 'Saya berusaha menemukan solusi yang bisa diterima semua pihak.', sa: 'T', sb: 'F' },
  { a: 'Tujuan dan hasil akhir adalah hal utama yang perlu dijaga.', b: 'Cara kita mencapai tujuan — termasuk menjaga hubungan — sama pentingnya dengan hasilnya.', sa: 'T', sb: 'F' },
  { a: 'Saya cenderung skeptis terhadap argumen yang terlalu emosional dan lebih percaya bukti konkret.', b: 'Saya percaya bahwa nilai-nilai dan keyakinan seseorang adalah dasar yang sama sahnya dengan data.', sa: 'T', sb: 'F' },
  { a: 'Dalam negosiasi, saya fokus pada fakta, angka, dan kekuatan argumen logis.', b: 'Dalam negosiasi, saya fokus pada memahami motivasi dan kepentingan di balik posisi masing-masing.', sa: 'T', sb: 'F' },
  { a: 'Saya lebih suka struktur organisasi yang jelas dengan hierarki dan tanggung jawab terdefinisi.', b: 'Saya lebih suka budaya kerja yang mengutamakan rasa memiliki, kepercayaan, dan nilai bersama.', sa: 'T', sb: 'F' },
  { a: 'Saya biasanya menganalisis pro dan kontra secara sistematis sebelum memutuskan.', b: 'Saya memperhatikan bagaimana suatu keputusan terasa secara intuitif dan apakah sesuai nilai saya.', sa: 'T', sb: 'F' },
  { a: 'Saya lebih memilih pemimpin yang tegas dan objektif.', b: 'Saya lebih memilih pemimpin yang peduli dan inspiratif.', sa: 'T', sb: 'F' },
  { a: 'Ketika tim mengalami masalah, saya langsung fokus pada identifikasi penyebab dan solusi.', b: 'Ketika tim mengalami masalah, saya pertama-tama memastikan setiap orang merasa aman dan didengar.', sa: 'T', sb: 'F' },
  { a: 'Saya lebih nyaman dengan evaluasi berbasis angka dan metrik yang terukur.', b: 'Saya lebih nyaman dengan evaluasi yang mempertimbangkan faktor kualitatif dan konteks personal.', sa: 'T', sb: 'F' },
  { a: 'Ketidaksepakatan bagi saya adalah kesempatan untuk menemukan kebenaran yang lebih akurat.', b: 'Ketidaksepakatan bagi saya adalah sinyal untuk memperkuat kepercayaan dan pemahaman bersama.', sa: 'T', sb: 'F' },
  { a: 'Saya lebih memilih penjelasan yang singkat, langsung, dan to-the-point.', b: 'Saya lebih memilih penjelasan yang kontekstual, personal, dan mempertimbangkan cerita di baliknya.', sa: 'T', sb: 'F' },
  { a: 'Saya percaya bahwa aturan yang konsisten menciptakan sistem yang adil dan dapat diprediksi.', b: 'Saya percaya bahwa fleksibilitas dan pertimbangan situasional menciptakan lingkungan yang lebih baik.', sa: 'T', sb: 'F' },
  { a: 'Saya merasa puas ketika masalah terpecahkan secara efisien dan optimal.', b: 'Saya merasa puas ketika semua pihak yang terlibat merasa dihargai sepanjang prosesnya.', sa: 'T', sb: 'F' },
  { a: 'Dalam presentasi, saya mengutamakan keakuratan data dan kekuatan argumen.', b: 'Dalam presentasi, saya mengutamakan keterhubungan emosional dan dampak pada audiens.', sa: 'T', sb: 'F' },
  { a: 'Saya lebih suka dikenal sebagai orang yang selalu jujur dan objektif.', b: 'Saya lebih suka dikenal sebagai orang yang selalu memperhatikan dan mendukung orang lain.', sa: 'T', sb: 'F' },
  { a: 'Saya merasa tidak nyaman ketika keputusan dibuat berdasarkan sentimen daripada analisis.', b: 'Saya merasa tidak nyaman ketika keputusan mengabaikan dimensi manusiawi demi efisiensi semata.', sa: 'T', sb: 'F' },
  // ═══ S/N SCALE (24 pairs) ═══
  { a: 'Saya lebih fokus pada detail konkret dan fakta yang bisa diverifikasi.', b: 'Saya lebih fokus pada pola besar dan makna di balik data.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih percaya pada pengalaman yang terbukti daripada teori yang belum teruji.', b: 'Saya lebih tertarik pada pendekatan inovatif dan kemungkinan baru yang belum pernah dicoba.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih nyaman dengan instruksi yang jelas, langkah demi langkah, dan terstruktur.', b: 'Saya lebih nyaman dengan kebebasan untuk menemukan cara terbaik sendiri menuju tujuan.', sa: 'S', sb: 'N' },
  { a: 'Ketika merencanakan, saya fokus pada apa yang perlu dilakukan sekarang dan waktu dekat.', b: 'Ketika merencanakan, saya lebih fokus pada visi jangka panjang dan gambaran besarnya.', sa: 'S', sb: 'N' },
  { a: 'Saya cenderung praktis dan realistis — percaya pada apa yang bisa dilihat dan dibuktikan.', b: 'Saya cenderung imajinatif dan visioner — tertarik pada kemungkinan yang belum terwujud.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih suka pekerjaan yang jelas, terdefinisi, dan memiliki hasil yang terukur.', b: 'Saya lebih suka pekerjaan yang membutuhkan kreativitas dan pemikiran di luar kebiasaan.', sa: 'S', sb: 'N' },
  { a: 'Dalam memecahkan masalah, saya lebih suka solusi yang sudah terbukti berhasil.', b: 'Dalam memecahkan masalah, saya senang mencari pendekatan baru yang lebih inovatif.', sa: 'S', sb: 'N' },
  { a: 'Saya sangat memperhatikan detail dan biasanya menyadari ketika ada yang tidak sesuai.', b: 'Saya lebih tertarik pada gambaran besar dan terkadang melewatkan detail karena fokus pada konsep.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih nyaman mendiskusikan hal-hal yang konkret dan nyata.', b: 'Saya lebih menikmati diskusi tentang ide-ide abstrak, teori, dan kemungkinan.', sa: 'S', sb: 'N' },
  { a: 'Pengalaman masa lalu adalah panduan terbaik untuk mengambil keputusan di masa kini.', b: 'Setiap situasi adalah unik dan membutuhkan perspektif segar, bukan hanya pola lama.', sa: 'S', sb: 'N' },
  { a: 'Saya percaya pada intuisi yang dibangun dari pengalaman dan bukti yang terkumpul.', b: 'Saya sering mendapat wawasan dari koneksi tak terduga antara ide-ide yang tampaknya tidak terkait.', sa: 'S', sb: 'N' },
  { a: 'Saya cenderung membaca petunjuk dan mengikuti prosedur dengan teliti.', b: 'Saya cenderung langsung mencoba dan belajar dari prosesnya.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih suka pekerjaan yang bisa diselesaikan dengan tuntas dan hasilnya terlihat jelas.', b: 'Saya lebih suka pekerjaan yang terus berkembang dan membuka peluang eksplorasi baru.', sa: 'S', sb: 'N' },
  { a: 'Ketika belajar, saya memulai dari dasar dan membangun pemahaman secara bertahap.', b: 'Ketika belajar, saya langsung ke gambaran besarnya dan kemudian mengisi detailnya.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih menyukai lingkungan kerja yang stabil dan dapat diprediksi.', b: 'Saya lebih menyukai lingkungan kerja yang dinamis dan terus berubah.', sa: 'S', sb: 'N' },
  { a: 'Dalam komunikasi, saya menghargai kepresisian dan akurasi lebih dari kreativitas bahasa.', b: 'Dalam komunikasi, saya menggunakan metafora dan analogi untuk menyampaikan konsep dengan hidup.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih baik dalam mengimplementasikan rencana yang sudah ada dengan konsisten.', b: 'Saya lebih baik dalam menghasilkan ide-ide baru dan memetakan kemungkinan yang belum ada.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih tertarik pada aplikasi praktis dari sebuah ide.', b: 'Saya lebih tertarik memahami teori dan prinsip di balik sesuatu.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih suka kerja keras yang konsisten daripada mengandalkan inspirasi mendadak.', b: 'Saya sering mendapat ide terbaik secara mendadak setelah periode inkubasi yang tidak terstruktur.', sa: 'S', sb: 'N' },
  { a: 'Keberhasilan saya dibangun di atas perhatian terhadap detail dan eksekusi yang presisi.', b: 'Keberhasilan saya sering datang dari kemampuan melihat peluang yang orang lain belum lihat.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih nyaman dengan definisi yang jelas dan batasan yang terdefinisi dengan baik.', b: 'Saya lebih nyaman dengan ambiguitas dan masalah yang tidak memiliki satu jawaban benar.', sa: 'S', sb: 'N' },
  { a: 'Saya lebih percaya pada metode yang sudah teruji dan terstandarisasi.', b: 'Saya sering mempertanyakan cara lama dan aktif mencari pendekatan yang lebih baik.', sa: 'S', sb: 'N' },
  { a: 'Presentasi saya cenderung penuh data konkret, contoh spesifik, dan bukti terverifikasi.', b: 'Presentasi saya cenderung berfokus pada visi, konsep besar, dan implikasi jangka panjang.', sa: 'S', sb: 'N' },
  { a: 'Saya mengutamakan kualitas eksekusi yang konsisten daripada inovasi yang sporadis.', b: 'Saya mengutamakan eksplorasi ide baru dan potensi terobosan daripada konsistensi rutinitas.', sa: 'S', sb: 'N' },
];

export const TOTAL_Q = PAIRS.length; // 72

// Section label for a question index (3 sections of 24).
export function sectionLabel(qIndex) {
  if (qIndex < 24) return 'Bagian 1 / 3';
  if (qIndex < 48) return 'Bagian 2 / 3';
  return 'Bagian 3 / 3';
}
