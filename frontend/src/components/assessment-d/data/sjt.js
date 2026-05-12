// SJT (Situational Judgment Test) — Battery C only.
// 22 scenarios × 4 options, scored against 6 leadership competencies.
// Ported verbatim from Myralix_Battery_C_Candidate_Card_v10.html (lines 1183–1511).

export const COMPS = {
  KK: {
    name: 'Kepemimpinan & Pengambilan Keputusan', short: 'KK',
    color: '#6366F1', colorLt: '#EEF2FF',
    desc: 'Kemampuan mengambil keputusan yang tepat, memimpin tim dengan efektif, dan bertindak dengan otoritas yang jelas dalam berbagai situasi manajerial.',
    count: 5, maxScore: 15,
  },
  KOM: {
    name: 'Komunikasi & Kolaborasi', short: 'KOM',
    color: '#0A6E5C', colorLt: '#E0F0ED',
    desc: 'Kemampuan berkomunikasi secara efektif, membangun hubungan kerja yang produktif, dan berkolaborasi lintas tim maupun departemen.',
    count: 4, maxScore: 12,
  },
  MK: {
    name: 'Manajemen Konflik', short: 'MK',
    color: '#E11D48', colorLt: '#FFF1F2',
    desc: 'Kemampuan mengidentifikasi, mengelola, dan menyelesaikan konflik interpersonal maupun antar-kelompok secara konstruktif dan adil.',
    count: 4, maxScore: 12,
  },
  OH: {
    name: 'Orientasi Hasil', short: 'OH',
    color: '#D97706', colorLt: '#FFFBEB',
    desc: 'Kemampuan menetapkan prioritas yang tepat, mendorong pencapaian target, dan mengelola kinerja tim secara akuntabel.',
    count: 3, maxScore: 9,
  },
  AD: {
    name: 'Adaptabilitas & Problem Solving', short: 'AD',
    color: '#2563EB', colorLt: '#EFF6FF',
    desc: 'Kemampuan beradaptasi dalam situasi yang berubah dengan cepat, memecahkan masalah secara sistematis, dan belajar dari pengalaman.',
    count: 3, maxScore: 9,
  },
  IE: {
    name: 'Integritas & Etika Kerja', short: 'IE',
    color: '#059669', colorLt: '#ECFDF5',
    desc: 'Komitmen terhadap nilai-nilai kejujuran, transparansi, dan etika dalam setiap keputusan dan tindakan di tempat kerja.',
    count: 3, maxScore: 9,
  },
};

export const COMP_ORDER = ['KK', 'KOM', 'MK', 'OH', 'AD', 'IE'];

export const COMP_TOTAL_MAX = 66;

export const PROFILES = {
  BJ: {
    id: 'BJ', name: 'Pemimpin Bijaksana',
    color: '#0A6E5C', colorLt: '#E0F0ED',
    tagline: 'Unggul di Seluruh Dimensi Kompetensi',
    desc: 'Anda menunjukkan penilaian situasional yang sangat matang dan konsisten di seluruh area kompetensi. Anda mampu membaca konteks dengan tepat, mengambil keputusan yang seimbang antara kepentingan manusia dan hasil bisnis, serta mempertahankan integritas di bawah tekanan. Profil ini mencerminkan kesiapan untuk peran kepemimpinan senior yang kompleks dan multidimensi.',
    strengths: [
      'Penilaian situasional yang matang dan konsisten',
      'Mampu mengelola kompleksitas dan ambiguitas dengan baik',
      'Keseimbangan kuat antara orientasi manusia dan orientasi hasil',
      'Integritas dan etika sebagai fondasi setiap keputusan',
      'Kemampuan komunikasi dan kolaborasi yang efektif di berbagai konteks',
    ],
    areas: [
      'Jaga konsistensi penilaian di bawah tekanan ekstrem yang jarang dihadapi',
      'Terus kembangkan kemampuan mendelegasikan kepercayaan kepada generasi pemimpin berikutnya',
    ],
    positions: 'Senior Manager, Director, VP, Head of Business Unit — siap untuk peran kepemimpinan senior di berbagai industri dan konteks organisasi yang kompleks.',
  },
  EK: {
    id: 'EK', name: 'Pemimpin Eksekutor',
    color: '#6366F1', colorLt: '#EEF2FF',
    tagline: 'Kuat dalam Pengambilan Keputusan dan Pencapaian Target',
    desc: 'Anda menunjukkan kekuatan yang menonjol dalam kepemimpinan direktif dan orientasi pada hasil. Anda tegas dalam mengambil keputusan, mendorong tim untuk mencapai target, dan memiliki standar kinerja yang tinggi. Area pengembangan utama ada pada dimensi interpersonal — manajemen konflik dan kolaborasi yang lebih empatik akan memperlengkapi profil Anda secara signifikan.',
    strengths: [
      'Tegas dan berani dalam pengambilan keputusan',
      'Orientasi kuat terhadap target dan akuntabilitas kinerja',
      'Kemampuan memprioritaskan dan fokus pada hal-hal yang berdampak tinggi',
      'Standar kerja yang tinggi dan konsisten',
      'Efektif dalam lingkungan yang kompetitif dan berorientasi hasil',
    ],
    areas: [
      'Kembangkan pendekatan yang lebih empatik dalam manajemen konflik interpersonal',
      'Tingkatkan kemampuan kolaborasi dan membangun konsensus lintas-fungsi',
      'Perhatikan dampak gaya kepemimpinan direktif terhadap motivasi jangka panjang tim',
    ],
    positions: 'Operations Manager, Project Manager, Sales Manager, Team Lead — cocok untuk peran yang menekankan eksekusi, akuntabilitas, dan pencapaian target yang terukur.',
  },
  KL: {
    id: 'KL', name: 'Pemimpin Kolaboratif',
    color: '#DB2777', colorLt: '#FDF2F8',
    tagline: 'Kuat dalam Hubungan Manusia dan Pengelolaan Tim',
    desc: 'Anda memiliki kecerdasan interpersonal yang tinggi dan kemampuan luar biasa dalam membangun hubungan kerja yang sehat. Anda unggul dalam mengelola konflik, berkomunikasi secara empatik, dan menciptakan lingkungan tim yang positif. Untuk melengkapi profil Anda, kembangkan ketegasan dalam pengambilan keputusan dan orientasi yang lebih kuat pada pencapaian target bisnis.',
    strengths: [
      'Kecerdasan interpersonal dan empati yang tinggi',
      'Sangat efektif dalam manajemen konflik dan mediasi',
      'Kemampuan membangun kepercayaan dan lingkungan psikologis yang aman',
      'Komunikator yang luar biasa dalam situasi sulit dan emosional',
      'Kolaboratif dan inklusif dalam pendekatan kepemimpinan',
    ],
    areas: [
      'Kembangkan ketegasan dan kecepatan dalam pengambilan keputusan yang sulit',
      'Perkuat orientasi pada target dan akuntabilitas kinerja anggota tim',
      'Belajar untuk lebih nyaman dalam situasi konfrontasi yang konstruktif dan perlu',
    ],
    positions: 'HR Manager, Team Lead, Project Coordinator, Customer Success Manager — unggul dalam peran yang menekankan pengelolaan tim, hubungan stakeholder, dan resolusi konflik.',
  },
  AE: {
    id: 'AE', name: 'Pemimpin Adaptif',
    color: '#2563EB', colorLt: '#EFF6FF',
    tagline: 'Fleksibel, Solutif, dan Berpegang pada Nilai',
    desc: 'Anda menunjukkan kemampuan problem solving yang solid dan komitmen yang kuat terhadap integritas dan etika. Anda efektif dalam menghadapi perubahan dan ketidakpastian, serta mampu menavigasi situasi yang ambigu dengan tetap berpegang pada prinsip. Area pengembangan ada pada kepemimpinan yang lebih direktif dan kemampuan mendorong pencapaian target secara aktif.',
    strengths: [
      'Problem solving yang sistematis dan solutif',
      'Komitmen kuat terhadap integritas dan etika dalam situasi sulit',
      'Fleksibel dan mudah beradaptasi dengan perubahan',
      'Kemampuan belajar dari kesalahan dan memperbaiki pendekatan',
      'Nilai-nilai yang kuat sebagai kompas dalam situasi yang ambigu',
    ],
    areas: [
      'Kembangkan gaya kepemimpinan yang lebih direktif dan tegas saat diperlukan',
      'Tingkatkan kemampuan mendorong tim untuk mencapai target dan standar kinerja',
      'Perkuat kemampuan komunikasi persuasif kepada stakeholder yang beragam',
    ],
    positions: 'Compliance Manager, Risk Manager, Consultant, Project Manager — cocok untuk peran yang memerlukan problem solving kompleks, navigasi perubahan, dan komitmen integritas tinggi.',
  },
  BK: {
    id: 'BK', name: 'Pemimpin Berkembang',
    color: '#D97706', colorLt: '#FFFBEB',
    tagline: 'Fondasi yang Baik dengan Ruang Pengembangan yang Signifikan',
    desc: 'Anda memiliki dasar penilaian situasional yang cukup baik namun masih perlu penajaman yang konsisten di beberapa area kompetensi utama. Hasilnya mencerminkan potensi kepemimpinan yang ada, namun dengan kesadaran bahwa pengembangan yang terstruktur akan sangat mempercepat kesiapan Anda untuk tanggung jawab kepemimpinan yang lebih besar. Jadikan ini sebagai peta jalan pengembangan yang konkret.',
    strengths: [
      'Menunjukkan kesadaran dasar yang baik tentang situasi kepemimpinan yang kompleks',
      'Terdapat area kompetensi tertentu yang sudah menunjukkan kekuatan yang dapat dikembangkan lebih lanjut',
      'Kemauan untuk terus belajar adalah fondasi pengembangan yang paling penting',
    ],
    areas: [
      'Ikuti program kepemimpinan yang terstruktur untuk memperdalam penilaian situasional',
      'Cari mentor atau coach kepemimpinan yang berpengalaman untuk pendampingan reguler',
      'Perbanyak pengalaman langsung dalam situasi kepemimpinan yang menantang dan refleksikan setiap hasilnya',
    ],
    positions: 'Team Lead, Supervisor, atau posisi manajemen entry-level dengan program mentoring yang terstruktur — tahap pertumbuhan yang sangat baik dengan dukungan yang tepat.',
  },
};

export const SJT_QS = [
  // ── KEPEMIMPINAN & PENGAMBILAN KEPUTUSAN (KK) ── 5 skenario
  {
    comp: 'KK', id: 1,
    situation: 'Anda manajer tim proyek dengan deadline penting 3 hari lagi. Tiba-tiba dua anggota tim kunci jatuh sakit bersamaan dan tidak bisa hadir. Tim yang tersisa tidak akan sanggup menyelesaikan semua lingkup kerja yang sudah dijanjikan kepada klien utama perusahaan.',
    q: 'Langkah apa yang paling tepat Anda ambil?',
    opts: [
      { l: 'A', t: 'Hubungi klien segera, sampaikan situasi secara jujur, dan negosiasikan prioritas atau penyesuaian timeline.', s: 3 },
      { l: 'B', t: 'Distribusikan ulang beban kerja ke anggota yang tersisa dan lembur bersama tim agar semua deliverable tetap selesai tanpa mengubah komitmen ke klien.', s: 1 },
      { l: 'C', t: 'Tunda komunikasi ke klien hingga Anda tahu persis bagian mana yang bisa dan tidak bisa selesai, baru informasikan.', s: 2 },
      { l: 'D', t: 'Minta atasan untuk mengkomunikasikan situasi kepada klien agar pesan lebih berbobot dan tidak mengurangi kepercayaan terhadap tim.', s: 1 },
    ],
  },
  {
    comp: 'KK', id: 2,
    situation: 'Atasan Anda memberikan instruksi dalam rapat besar yang menurut Anda tidak efektif dan berpotensi berdampak negatif pada hasil proyek tim. Instruksi tersebut sudah dicatat sebagai keputusan resmi.',
    q: 'Apa yang paling tepat Anda lakukan?',
    opts: [
      { l: 'A', t: 'Sampaikan kekhawatiran Anda secara privat kepada atasan sebelum implementasi dimulai, dilengkapi data dan alternatif yang konkret.', s: 3 },
      { l: 'B', t: 'Jalankan instruksi sesuai perintah dan dokumentasikan kekhawatiran Anda secara tertulis kepada atasan sebagai catatan risiko.', s: 2 },
      { l: 'C', t: 'Konsultasikan dulu dengan rekan manajer lain untuk memvalidasi apakah kekhawatiran Anda cukup beralasan sebelum mengangkatnya ke atasan.', s: 1 },
      { l: 'D', t: 'Terapkan instruksi dengan beberapa modifikasi yang Anda anggap perlu berdasarkan penilaian lapangan, karena Anda yang paling memahami konteksnya.', s: 1 },
    ],
  },
  {
    comp: 'KK', id: 3,
    situation: 'Anda harus memilih satu dari dua karyawan untuk dipromosikan ke posisi supervisor. Karyawan A unggul secara teknis namun lemah dalam interpersonal. Karyawan B kurang secara teknis namun sangat baik dalam memimpin dan mengkoordinasikan tim.',
    q: 'Pendekatan mana yang paling tepat?',
    opts: [
      { l: 'A', t: 'Analisis kebutuhan spesifik posisi tersebut, pilih yang paling sesuai, dan buat rencana pengembangan untuk keduanya.', s: 3 },
      { l: 'B', t: 'Pilih Karyawan B karena soft skill kepemimpinan jauh lebih sulit dikembangkan dibanding kompetensi teknis.', s: 2 },
      { l: 'C', t: 'Berikan keduanya kesempatan memimpin proyek kecil selama sebulan sebagai mini-assessment sebelum memutuskan.', s: 2 },
      { l: 'D', t: 'Libatkan atasan Anda dalam keputusan ini mengingat dampaknya yang signifikan bagi dinamika tim.', s: 1 },
    ],
  },
  {
    comp: 'KK', id: 4,
    situation: 'Anda manajer baru yang baru bergabung 2 minggu lalu. Tim Anda memiliki cara kerja yang sudah berjalan bertahun-tahun, namun Anda melihat beberapa proses yang tidak efisien dan membuang waktu.',
    q: 'Apa pendekatan yang paling tepat?',
    opts: [
      { l: 'A', t: 'Jadwalkan sesi 1-on-1 dengan setiap anggota tim di minggu-minggu awal untuk memahami perspektif mereka sebelum membuat rencana apapun.', s: 3 },
      { l: 'B', t: 'Identifikasi 2-3 inefisiensi yang paling berdampak dan usulkan perbaikannya dalam rapat tim pertama sebagai langkah konkret awal.', s: 1 },
      { l: 'C', t: 'Dokumentasikan semua temuan selama 2 minggu pertama dan presentasikan analisis komprehensif kepada atasan sebelum bertindak.', s: 2 },
      { l: 'D', t: 'Ikuti cara kerja tim sepenuhnya selama 3-6 bulan pertama agar diterima sebagai bagian dari tim sebelum memperkenalkan perubahan.', s: 1 },
    ],
  },
  {
    comp: 'KK', id: 5,
    situation: 'Tim Anda baru menyelesaikan proyek besar dengan sangat baik. Namun dalam presentasi ke manajemen senior, atasan Anda mengambil kredit penuh atas keberhasilan ini tanpa menyebut kontribusi tim sama sekali.',
    q: 'Bagaimana Anda menangani situasi ini?',
    opts: [
      { l: 'A', t: 'Bicara 4 mata dengan atasan, sampaikan bahwa pengakuan kontribusi tim penting untuk motivasi mereka, dan minta hal ini diperbaiki ke depannya.', s: 3 },
      { l: 'B', t: 'Pastikan tim Anda tahu Anda sepenuhnya mengakui kerja keras mereka meski pengakuan publik tidak datang dari atasan.', s: 2 },
      { l: 'C', t: 'Bangun visibilitas tim langsung kepada stakeholder senior melalui laporan atau presentasi berkala tanpa harus melalui atasan.', s: 1 },
      { l: 'D', t: 'Dokumentasikan kontribusi tim secara internal agar ada rekam jejak yang bisa dijadikan referensi di masa mendatang.', s: 1 },
    ],
  },

  // ── KOMUNIKASI & KOLABORASI (KOM) ── 4 skenario
  {
    comp: 'KOM', id: 6,
    situation: 'Rekan kerja dari departemen lain secara konsisten tidak merespons email penting Anda dalam waktu yang wajar, sehingga pekerjaan lintas-departemen yang bergantung padanya terhambat berulang kali.',
    q: 'Apa langkah yang paling tepat?',
    opts: [
      { l: 'A', t: 'Ganti saluran komunikasi — telepon atau tatap muka langsung — untuk hal mendesak, dan sepakati ekspektasi waktu respons ke depannya.', s: 3 },
      { l: 'B', t: 'Kirimkan email follow-up dengan batas waktu yang tegas agar ada urgensi yang terdokumentasi secara tertulis.', s: 2 },
      { l: 'C', t: 'Redesain alur kerja Anda sendiri agar tidak terlalu bergantung pada respons orang tersebut di jalur kritis.', s: 1 },
      { l: 'D', t: 'Sampaikan hambatan ini dalam rapat koordinasi lintas departemen berikutnya agar ada akuntabilitas yang lebih luas.', s: 1 },
    ],
  },
  {
    comp: 'KOM', id: 7,
    situation: 'Salah satu anggota tim yang biasanya sangat aktif tiba-tiba menjadi pendiam dan tidak terlibat dalam rapat. Perubahan ini sudah berlangsung hampir seminggu dan mulai diperhatikan rekan-rekannya.',
    q: 'Apa yang paling tepat Anda lakukan?',
    opts: [
      { l: 'A', t: 'Ciptakan kesempatan bicara yang terasa natural — misalnya saat makan siang — untuk mengecek kabarnya tanpa kesan menginvestigasi.', s: 3 },
      { l: 'B', t: 'Hubungi via pesan pribadi di luar jam kerja untuk menunjukkan kepedulian Anda sebagai individu, bukan hanya sebagai manajer.', s: 2 },
      { l: 'C', t: 'Minta anggota tim lain yang dekat dengannya untuk mengajaknya bicara agar terasa lebih nyaman dan tidak formal.', s: 2 },
      { l: 'D', t: 'Beri lebih banyak waktu dan ruang; setiap orang punya ritmenya dan mungkin tidak nyaman jika terlalu diperhatikan.', s: 1 },
    ],
  },
  {
    comp: 'KOM', id: 8,
    situation: 'Anda perlu menyampaikan kabar buruk kepada tim — target triwulan tidak tercapai dan beberapa program pengembangan yang mereka nantikan harus ditunda karena perubahan anggaran mendadak.',
    q: 'Cara penyampaian mana yang paling tepat?',
    opts: [
      { l: 'A', t: 'Sampaikan secara langsung dalam rapat tim, jujur tentang situasinya, akui kekecewaan mereka, dan buka diskusi tentang langkah ke depan bersama.', s: 3 },
      { l: 'B', t: 'Kirimkan ringkasan situasi via email terlebih dahulu agar tim punya waktu memproses sebelum sesi diskusi tatap muka.', s: 2 },
      { l: 'C', t: 'Sampaikan kepada masing-masing anggota secara individual terlebih dahulu agar setiap orang bisa memprosesnya sebelum dibahas bersama.', s: 1 },
      { l: 'D', t: 'Fokuskan komunikasi pada rencana ke depan daripada apa yang tidak tercapai, agar tim tetap termotivasi dan tidak terpuruk.', s: 1 },
    ],
  },
  {
    comp: 'KOM', id: 9,
    situation: 'Tim Anda dan tim dari departemen lain berkolaborasi dalam proyek lintas-fungsi. Keduanya memiliki cara kerja dan prioritas yang berbeda, sehingga sering terjadi gesekan dan miskomunikasi dalam koordinasi sehari-hari.',
    q: 'Apa pendekatan yang paling efektif?',
    opts: [
      { l: 'A', t: 'Inisiasi rapat bersama kedua tim untuk memetakan perbedaan secara terbuka dan susun cara kerja bersama yang bisa diterima kedua pihak.', s: 3 },
      { l: 'B', t: 'Susun RACI yang lebih ketat antara kedua tim agar overlapping tanggung jawab yang menjadi sumber gesekan bisa dihilangkan.', s: 2 },
      { l: 'C', t: 'Usulkan kepada manajemen untuk menunjuk satu project manager netral yang bisa menjembatani dan mengkoordinasikan kedua tim.', s: 2 },
      { l: 'D', t: 'Jadwalkan aktivitas team-building bersama untuk membangun hubungan personal sebelum membahas perbedaan cara kerja secara formal.', s: 1 },
    ],
  },

  // ── MANAJEMEN KONFLIK (MK) ── 4 skenario
  {
    comp: 'MK', id: 10,
    situation: 'Dua anggota tim Anda terlibat konflik personal yang sudah hampir dua minggu berjalan dan mulai berdampak nyata pada produktivitas dan suasana kerja seluruh tim.',
    q: 'Apa tindakan yang paling tepat?',
    opts: [
      { l: 'A', t: 'Dengarkan masing-masing secara terpisah terlebih dahulu, lalu fasilitasi dialog langsung antara keduanya dengan fokus pada dampak terhadap pekerjaan.', s: 3 },
      { l: 'B', t: 'Sampaikan kepada keduanya secara terpisah bahwa perilaku ini tidak bisa diteruskan dan Anda mengharapkan profesionalisme penuh.', s: 2 },
      { l: 'C', t: 'Libatkan HR agar proses penyelesaian lebih terstruktur dan terlindungi secara prosedural sejak awal.', s: 2 },
      { l: 'D', t: 'Pisahkan beban kerja keduanya agar tidak ada alasan untuk berinteraksi, sambil mengamati apakah situasi membaik dalam 2 minggu ke depan.', s: 1 },
    ],
  },
  {
    comp: 'MK', id: 11,
    situation: 'Seorang klien menelepon dengan nada sangat kasar dan emosional, mengklaim tim Anda membuat kesalahan fatal. Setelah Anda cek internal, ternyata kesalahan tersebut sepenuhnya berasal dari pihak klien sendiri.',
    q: 'Bagaimana Anda menangani percakapan ini?',
    opts: [
      { l: 'A', t: 'Dengarkan sampai selesai tanpa interupsi, biarkan emosi mereda, lalu arahkan percakapan ke solusi berdasarkan fakta yang Anda miliki.', s: 3 },
      { l: 'B', t: 'Minta klien menjelaskan kronologi masalahnya secara detail agar Anda punya gambaran lengkap sebelum merespons apapun.', s: 2 },
      { l: 'C', t: 'Minta maaf atas ketidaknyamanan yang terjadi dan sampaikan bahwa Anda akan menginvestigasi lebih lanjut sebelum memberikan respons resmi.', s: 2 },
      { l: 'D', t: 'Sampaikan langsung bahwa berdasarkan data Anda, kesalahan ada di pihak mereka, namun Anda siap membantu menemukan solusi terbaik.', s: 1 },
    ],
  },
  {
    comp: 'MK', id: 12,
    situation: 'Anda mendapat informasi kredibel bahwa dua anggota senior tim sedang bersaing tidak sehat — diam-diam saling menahan informasi penting dan menyabotase output satu sama lain.',
    q: 'Apa langkah yang paling tepat?',
    opts: [
      { l: 'A', t: 'Panggil keduanya secara terpisah, sampaikan apa yang Anda ketahui, dan tetapkan ekspektasi perilaku yang jelas dengan konsekuensi yang spesifik.', s: 3 },
      { l: 'B', t: 'Libatkan HR untuk memvalidasi temuan dan mendampingi proses penyelesaian agar lebih terstruktur secara prosedural.', s: 2 },
      { l: 'C', t: 'Sampaikan temuan ini kepada atasan Anda untuk mendapat dukungan dan panduan sebelum mengambil tindakan langsung.', s: 2 },
      { l: 'D', t: 'Restrukturisasi tanggung jawab keduanya agar area kerja tidak bersinggungan dan peluang sabotase berkurang secara struktural.', s: 1 },
    ],
  },
  {
    comp: 'MK', id: 13,
    situation: 'Atasan Anda memberi tekanan kuat untuk mencapai target penjualan dengan pendekatan yang menurut Anda terlalu agresif dan berisiko merusak hubungan jangka panjang dengan pelanggan yang sudah terbina.',
    q: 'Apa yang paling tepat Anda lakukan?',
    opts: [
      { l: 'A', t: 'Jadwalkan diskusi privat dengan atasan, sampaikan kekhawatiran spesifik dengan data risiko, dan tawarkan pendekatan alternatif yang tetap ambisius.', s: 3 },
      { l: 'B', t: 'Jalankan arahan atasan namun pantau dampaknya ketat dan siapkan data evaluasi untuk dibahas bersama di akhir periode.', s: 2 },
      { l: 'C', t: 'Sampaikan kekhawatiran Anda kepada atasan, namun ikuti keputusan finalnya karena pada akhirnya itu adalah tanggung jawab mereka.', s: 2 },
      { l: 'D', t: 'Terapkan pendekatan yang lebih moderat secara mandiri sambil tetap melaporkan kemajuan seperti biasa.', s: 1 },
    ],
  },

  // ── ORIENTASI HASIL (OH) ── 3 skenario
  {
    comp: 'OH', id: 14,
    situation: 'Dengan 3 minggu tersisa, tim Anda masih jauh dari target triwulan. Analisis Anda menunjukkan target masih bisa dicapai jika energi difokuskan ulang ke 3 aktivitas berdampak tertinggi.',
    q: 'Apa langkah yang paling tepat?',
    opts: [
      { l: 'A', t: 'Adakan rapat fokus, presentasikan analisis Anda, fokuslah pada aktivitas berdampak tertinggi, dan distribusikan ulang tanggung jawab berdasarkan kekuatan tiap anggota.', s: 3 },
      { l: 'B', t: 'Identifikasi 2-3 quick wins yang bisa dicapai dalam 2 minggu untuk membangun momentum dan kepercayaan diri tim terlebih dahulu.', s: 2 },
      { l: 'C', t: 'Tingkatkan intensitas semua aktivitas secara merata agar seluruh tim merasakan urgensi yang sama dan momentum bisa terbentuk.', s: 1 },
      { l: 'D', t: 'Sampaikan proyeksi realistis kepada manajemen sekarang daripada membuat janji yang berisiko tidak terpenuhi di akhir kuartal.', s: 1 },
    ],
  },
  {
    comp: 'OH', id: 15,
    situation: 'Anda diminta mengerjakan proyek strategis penting, namun sumber daya yang disediakan — waktu, anggaran, dan SDM — tidak realistis untuk menghasilkan output yang diharapkan manajemen.',
    q: 'Apa pendekatan terbaik Anda?',
    opts: [
      { l: 'A', t: 'Terima proyek, buat analisis gap yang konkret, dan presentasikan kepada stakeholder tiga opsi: tambah resource, perpanjang waktu, atau revisi cakupan.', s: 3 },
      { l: 'B', t: 'Minta klarifikasi tentang fleksibilitas scope dan timeline dari stakeholder sebelum menyatakan komitmen apapun.', s: 2 },
      { l: 'C', t: 'Terima dan mulai kerjakan sambil mengidentifikasi bagian mana yang bisa dipangkas tanpa mengorbankan esensi output.', s: 2 },
      { l: 'D', t: 'Sampaikan estimasi realistis Anda kepada stakeholder sejak awal agar ekspektasi terkelola dengan baik dari awal.', s: 1 },
    ],
  },
  {
    comp: 'OH', id: 16,
    situation: 'Seorang anggota tim Anda secara konsisten tidak mencapai target selama 3 bulan meski sudah menerima feedback berkali-kali. Anggota lain mulai mengeluhkan beban kerja yang tidak merata.',
    q: 'Apa tindakan yang paling tepat?',
    opts: [
      { l: 'A', t: 'Terapkan Performance Improvement Plan yang terstruktur: target spesifik, dukungan konkret, timeline, dan konsekuensi yang jelas.', s: 3 },
      { l: 'B', t: 'Lakukan sesi coaching intensif selama sebulan terlebih dahulu sebelum memutuskan langkah formal apapun.', s: 2 },
      { l: 'C', t: 'Diskusikan situasi ini dengan HR untuk mendapat panduan tentang langkah yang tepat sebelum Anda bertindak sendiri.', s: 2 },
      { l: 'D', t: 'Alokasikan ulang pekerjaan anggota tersebut ke yang lebih mampu sambil mengevaluasi apakah ada jabatan lain yang lebih sesuai untuknya.', s: 1 },
    ],
  },

  // ── ADAPTABILITAS & PROBLEM SOLVING (AD) ── 3 skenario
  {
    comp: 'AD', id: 17,
    situation: 'Perusahaan baru mengumumkan restrukturisasi besar yang mengubah lingkup tanggung jawab tim Anda secara signifikan. Beberapa anggota terlihat cemas, resisten, dan mempertanyakan kepastian karier mereka.',
    q: 'Apa peran Anda yang paling tepat?',
    opts: [
      { l: 'A', t: 'Akui keresahan tim secara terbuka, berikan informasi yang Anda miliki, libatkan mereka dalam merencanakan transisi, dan jadilah penghubung aktif antara tim dan manajemen.', s: 3 },
      { l: 'B', t: 'Jadwalkan sesi 1-on-1 dengan setiap anggota untuk memahami kekhawatiran individual sebelum mengambil langkah kolektif apapun.', s: 2 },
      { l: 'C', t: 'Sampaikan kepada tim bahwa kekhawatiran mereka akan Anda bawa ke manajemen senior untuk mendapat jawaban yang lebih pasti.', s: 2 },
      { l: 'D', t: 'Fokus pada hal-hal yang pasti dan tidak berubah agar tim punya pegangan yang stabil di tengah ketidakpastian.', s: 1 },
    ],
  },
  {
    comp: 'AD', id: 18,
    situation: 'Di tengah proyek kritis, Anda mendapat informasi baru yang mengubah asumsi dasar proyek secara fundamental. Sebagian pekerjaan yang sudah selesai kemungkinan perlu direvisi atau diulang.',
    q: 'Apa respons yang paling tepat?',
    opts: [
      { l: 'A', t: 'Evaluasi cepat mana yang perlu direvisi dan mana yang tetap relevan, update rencana, lalu komunikasikan perubahan kepada stakeholder beserta implikasinya.', s: 3 },
      { l: 'B', t: 'Kumpulkan tim untuk menganalisis bersama dampak informasi baru ini sebelum membuat keputusan apapun tentang arah proyek.', s: 2 },
      { l: 'C', t: 'Laporkan temuan ini kepada atasan dan minta arahan apakah proyek perlu diteruskan, direvisi, atau dihentikan.', s: 1 },
      { l: 'D', t: 'Selesaikan fase yang sedang berjalan agar tidak ada pekerjaan yang terbuang, baru terapkan penyesuaian di fase berikutnya.', s: 1 },
    ],
  },
  {
    comp: 'AD', id: 19,
    situation: 'Anda mendelegasikan tugas penting kepada anggota tim yang Anda percaya tanpa brief yang terlalu detail. Hasilnya jauh dari ekspektasi dan kini harus diperbaiki dengan waktu yang sangat terbatas.',
    q: 'Apa cara terbaik menangani situasi ini?',
    opts: [
      { l: 'A', t: 'Perbaiki bersama anggota tersebut sebagai coaching langsung, sekaligus refleksikan apa yang perlu Anda perbaiki dalam cara mendelegasikan ke depannya.', s: 3 },
      { l: 'B', t: 'Ambil alih perbaikannya sendiri mengingat keterbatasan waktu, namun berikan feedback yang sangat spesifik setelahnya agar tidak terulang.', s: 2 },
      { l: 'C', t: 'Kembalikan pekerjaan tersebut kepada anggota tim dengan feedback detail dan deadline yang lebih ketat agar mereka belajar dari konsekuensinya.', s: 2 },
      { l: 'D', t: 'Eskalasikan ke anggota lain yang lebih senior untuk memperbaikinya agar kualitas terjaga dan deadline terpenuhi.', s: 1 },
    ],
  },

  // ── INTEGRITAS & ETIKA KERJA (IE) ── 3 skenario
  {
    comp: 'IE', id: 20,
    situation: 'Anda menemukan bahwa seorang rekan setingkat secara sengaja memanipulasi data laporan kinerja agar performa timnya terlihat lebih baik dari kenyataan di hadapan manajemen.',
    q: 'Apa yang paling tepat Anda lakukan?',
    opts: [
      { l: 'A', t: 'Bicara langsung dengan rekan tersebut secara privat, sampaikan apa yang Anda ketahui, dan beri kesempatan untuk memperbaiki sebelum Anda mengambil langkah selanjutnya.', s: 3 },
      { l: 'B', t: 'Laporkan melalui jalur resmi — HR atau atasan — dengan dokumentasi yang Anda miliki, tanpa mengonfrontasi langsung terlebih dahulu.', s: 2 },
      { l: 'C', t: 'Pastikan Anda memiliki bukti yang solid terlebih dahulu sebelum mengambil langkah apapun agar tidak ada risiko salah tuduh.', s: 2 },
      { l: 'D', t: 'Bicarakan situasi ini secara informal dengan rekan terpercaya untuk mendapat perspektif kedua sebelum memutuskan langkah.', s: 1 },
    ],
  },
  {
    comp: 'IE', id: 21,
    situation: 'Atasan Anda meminta Anda merahasiakan informasi penting dari tim yang sangat relevan dengan pekerjaan mereka sehari-hari dan berdampak pada keputusan yang mereka buat. Tidak ada alasan yang diberikan.',
    q: 'Apa yang paling tepat Anda lakukan?',
    opts: [
      { l: 'A', t: 'Tanyakan kepada atasan alasan di balik permintaan ini dan cari cara agar tim tetap bisa bekerja efektif meski tanpa informasi yang sensitif tersebut.', s: 3 },
      { l: 'B', t: 'Ikuti permintaan atasan, namun informasikan kepada tim bahwa ada informasi yang tidak bisa Anda bagikan saat ini dan komit untuk transparan sesegera bisa.', s: 2 },
      { l: 'C', t: 'Minta HR atau compliance memberi panduan tentang sejauh mana informasi ini secara prosedural boleh ditahan dari karyawan.', s: 2 },
      { l: 'D', t: 'Ikuti permintaan atasan sepenuhnya; kepercayaan terhadap rantai komando adalah fondasi organisasi yang tidak bisa dikompromikan secara sepihak.', s: 1 },
    ],
  },
  {
    comp: 'IE', id: 22,
    situation: 'Anda mengetahui bahwa vendor utama perusahaan memberikan imbalan tidak resmi dalam bentuk uang tunai kepada rekan senior di divisi pengadaan sebagai imbalan atas kontrak yang mereka terima.',
    q: 'Apa tindakan yang paling tepat?',
    opts: [
      { l: 'A', t: 'Laporkan melalui jalur resmi yang tersedia — compliance, internal audit, atau whistleblower channel — dengan dokumentasi yang Anda miliki.', s: 3 },
      { l: 'B', t: 'Sampaikan temuan ini kepada atasan langsung Anda untuk mendapat panduan tentang cara menanganinya sesuai prosedur perusahaan.', s: 2 },
      { l: 'C', t: 'Pastikan Anda memiliki bukti yang cukup kuat sebelum melaporkan apapun agar tidak ada risiko balas dendam atau salah tuduh.', s: 2 },
      { l: 'D', t: 'Konfrontasi langsung rekan tersebut secara privat dan minta mereka menghentikan praktik ini sebelum Anda perlu melibatkan pihak lain.', s: 1 },
    ],
  },
];
