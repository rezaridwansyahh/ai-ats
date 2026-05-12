// TK (Kemampuan Kognitif) — Battery D variant: 4 subtests only (GI, PV, KN, PA — no KA).
// Question banks identical to Battery C (parallel Myralix WPT-50 + DAT series); KA data retained
// in SUBS/DATQS for shape compatibility but excluded from TK_ORDER so TKTest skips it.
export const SUBS = {
  GI:{code:'GI',name:'Kemampuan Umum',nameID:'Kemampuan Umum',icon:'🧠',color:'#0A6E5C',bg:'#F0F8F6',
    time:12*60,items:50,weight:0.30,
    function:'Mengukur kecepatan belajar, kapasitas pemecahan masalah, dan kemampuan berpikir lintas domain — verbal, numerik, logis, dan spasial secara terpadu.',
    instruction:'Kerjakan 50 soal beragam (verbal, numerik, logika, spasial) semampu mungkin dalam 12 menit. Lewati soal sulit dan lanjutkan ke soal berikutnya.',
    sample:{q:'PANAS adalah lawan kata dari: (1) dingin (2) hangat (3) terik',a:'1 (Dingin)',explain:'Lawan kata panas adalah dingin.'},
    career:'Semua jabatan — GI adalah prediktor umum performa kerja.'},
  PV:{code:'PV',name:'Penalaran Verbal',nameID:'Penalaran Verbal',icon:'📖',color:'#0369A1',bg:'#EFF6FF',
    time:15*60,items:25,weight:0.175,
    function:'Kemampuan memahami konsep verbal, menemukan hubungan antar kata, dan berpikir abstrak melalui bahasa.',
    instruction:'Setiap soal terdiri dari kalimat analogi yang belum lengkap. Pilih pasangan kata (A–E) yang paling tepat.',
    sample:{q:'"Buku" adalah untuk "Membaca" sebagaimana "Garpu" adalah untuk _____',a:'Makan (A)',explain:'Buku digunakan untuk membaca; garpu untuk makan.'},
    career:'Hukum, Manajemen Senior, Jurnalistik, Penelitian, Konsultan, HR.'},
  KN:{code:'KN',name:'Kemampuan Numerik',nameID:'Kemampuan Numerik',icon:'🔢',color:'#7C3AED',bg:'#F5F3FF',
    time:25*60,items:40,weight:0.175,
    function:'Kemampuan menalar dengan angka, memahami hubungan numerik, dan memecahkan masalah matematika dengan efisien.',
    instruction:'Selesaikan masalah numerik atau matematika. Pilih satu jawaban. Tidak diperbolehkan menggunakan kalkulator.',
    sample:{q:'Jika 2x + 6 = 18, maka x = ?',a:'6 (C)',explain:'2x = 12, x = 6.'},
    career:'Akuntansi, Keuangan, Teknik, Pemrograman, Statistik, Perbankan.'},
  PA:{code:'PA',name:'Penalaran Abstrak',nameID:'Penalaran Abstrak',icon:'🔷',color:'#059669',bg:'#ECFDF5',
    time:20*60,items:40,weight:0.175,
    function:'Kemampuan menemukan pola dalam materi non-verbal. Mengukur kecerdasan umum (fluid intelligence).',
    instruction:'Temukan aturan deret angka, huruf, atau pola logis dan pilih elemen yang paling tepat.',
    sample:{q:'2, 4, 8, 16, ____ ?',a:'32 (C)',explain:'Setiap angka dikali 2: 16×2 = 32.'},
    career:'Teknik, Ilmu Komputer, Matematika, Sains, Desain, R&D.'},
  KA:{code:'KA',name:'Kecepatan & Akurasi',nameID:'Kecepatan & Akurasi',icon:'📋',color:'#DB2777',bg:'#FDF2F8',
    time:8*60,items:40,weight:0.175,
    function:'Kemampuan memindai dan membandingkan informasi (kode, nama, angka) dengan cepat dan akurat.',
    instruction:'Pilih jawaban yang IDENTIK dengan referensi, atau yang BERBEDA dari empat lainnya. Kerjakan secepat dan setepat mungkin.',
    sample:{q:'Ref: AB-1234-XY. Identik: (A) AB-1243-XY (B) AB-1234-XY (C) AB-1234-YX',a:'B',explain:'Hanya B yang persis sama.'},
    career:'Administrasi, Audit, Perbankan, Data Entry, Akuntansi, Logistik.'},
};

export const TK_ORDER = ["GI","PV","KN","PA"];

export const KEYS = {1:'3',2:'1',3:'4',4:'ya',5:'4',6:'1',7:'3',8:'11',9:'1',10:'4',11:'3',12:'6000',13:'1',14:'2',15:'20',16:'2',17:'a',18:'13',19:'3',20:'1',21:'20',22:'s',23:'2,5',24:'2',25:'3',26:'1',27:'1/30',28:'3',29:'6',30:'10',31:'1/9',32:'ya',33:'3',34:'20',35:'0.25',36:'24',37:'0.0625',38:'4,6',39:'2',40:'1',41:'1,4',42:'5,13',43:'0.33',44:'2',45:'24',46:'2',47:'3',48:'175',49:'1,2,4,5',50:'12'};

export const WPT_RAW_QS = [
  {n:1,type:'mc',text:'Bulan terakhir di kuartal pertama tahun ini adalah',opts:['1. Januari','2. Februari','3. Maret','4. April','5. Juni']},
  {n:2,type:'mc',text:'PANAS adalah lawan kata dari',opts:['1. dingin','2. hangat','3. terik','4. sejuk','5. mendidih']},
  {n:3,type:'mc',text:'Sebagian besar hal di bawah ini serupa satu sama lain. Manakah salah satu di antaranya yang kurang serupa dengan yang lain?',opts:['1. Ayam','2. Bebek','3. Elang','4. Ikan','5. Burung Hantu']},
  {n:4,type:'mc',text:'Jawablah dengan menuliskan YA atau TIDAK. Apakah "ATM" berarti "Anjungan Tunai Mandiri"?',opts:['YA','TIDAK']},
  {n:5,type:'mc',text:'Dalam kelompok kata berikut, manakah kata yang berbeda dari kata yang lain?',opts:['1. meja','2. kursi','3. lemari','4. berlari','5. tempat tidur']},
  {n:6,type:'mc',text:'TERANG adalah lawan kata dari',opts:['1. gelap','2. cahaya','3. bersinar','4. siang','5. cerah']},
  {n:7,type:'mc',text:'Gambar manakah yang dibentuk dari dua gambar di dalam tanda kurung?',opts:['1','2','3','4','5'],svgHtml:`<svg viewBox="0 0 760 150" xmlns="http://www.w3.org/2000/svg"
  style="width:100%;max-width:760px;display:block;margin:8px 0;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa">
<style>
.sh{fill:none;stroke:#1a1a1a;stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
.lb{font:bold 14px Arial,sans-serif;fill:#1a1a1a;text-anchor:middle;dominant-baseline:middle}
.br{font:bold 50px Georgia,serif;fill:#555;dominant-baseline:middle}
</style>

<!-- SOURCE LABEL -->
<text x="18" y="16" font-size="11" fill="#888" font-family="Arial,sans-serif">Sumber:</text>

<!-- Left brace -->
<text x="18" y="82" class="br">{</text>
<!-- Source A: upright rectangle (small) -->
<rect x="40" y="42" width="34" height="50" class="sh"/>
<!-- Source B: right triangle, right-angle at bottom-right -->
<polygon points="103,40 75,90 131,90" class="sh"/>
<!-- Right brace -->
<text x="122" y="82" class="br">}</text>

<!-- Divider -->
<line x1="164" y1="10" x2="164" y2="142" stroke="#ddd" stroke-width="1.5"/>

<!-- OPTION 1: only a rectangle (larger) — wrong -->
<text x="210" y="16" class="lb">1</text>
<rect x="182" y="30" width="56" height="90" class="sh"/>

<!-- OPTION 2: only a triangle (larger) — wrong -->
<text x="310" y="16" class="lb">2</text>
<polygon points="280,120 340,120 340,30" class="sh"/>

<!-- OPTION 3: HOUSE SHAPE = rectangle + triangle on top ← CORRECT -->
<text x="420" y="16" class="lb">3</text>
<rect x="385" y="72" width="70" height="58" class="sh"/>
<polygon points="385,72 420,28 455,72" class="sh"/>

<!-- OPTION 4: two shapes side by side (separate, not merged) — wrong -->
<text x="530" y="16" class="lb">4</text>
<rect x="498" y="55" width="32" height="65" class="sh"/>
<polygon points="536,55 536,120 563,120" class="sh"/>

<!-- OPTION 5: rhombus — wrong (different shape entirely) -->
<text x="650" y="16" class="lb">5</text>
<polygon points="616,75 650,28 684,75 650,122" class="sh"/>
</svg>`},
  {n:8,type:'input',text:'Perhatikan urutan angka berikut. Angka berapa yang selanjutnya muncul? 1 — 3 — 5 — 7 — 9 — ?',hint:'Masukkan angka jawaban'},
  {n:9,type:'mc',text:'Guru dan Pengajar — Apakah kata-kata ini:',opts:['1. memiliki arti yang sama','2. memiliki arti berlawanan','3. tidak memiliki arti sama atau berlawanan']},
  {n:10,type:'mc',text:'Manakah kata berikut ini yang berhubungan dengan PENDENGARAN?',opts:['1. mata','2. hidung','3. lidah','4. telinga','5. jari']},
  {n:11,type:'mc',text:'MUSIM GUGUR adalah lawan dari:',opts:['1. liburan','2. musim panas','3. musim semi','4. musim dingin','5. musim gugur']},
  {n:12,type:'input',text:'Sebuah pesawat terbang 300 kaki dalam ½ detik. Pada kecepatan yang sama berapa kaki ia terbang dalam 10 detik?',hint:'Masukkan angka jawaban'},
  {n:13,type:'mc',text:'Anggaplah dua pernyataan pertama adalah benar. Apakah yang terakhir: "Anak-anak lelaki ini adalah anak yang normal. Semua anak normal sifatnya aktif. Anak-anak lelaki ini aktif."',opts:['1. benar','2. salah','3. tidak tahu']},
  {n:14,type:'mc',text:'JAUH adalah lawan kata dari',opts:['1. terpencil','2. dekat','3. jauh','4. terburu-buru','5. pasti']},
  {n:15,type:'input',text:'3 permen lemon seharga 10 rupiah. Berapa harga ½ lusin?',hint:'Masukkan angka'},
  {n:16,type:'input',text:'Berapa banyak duplikasi yang sama dari lima pasangan angka ini?\n84721 — 84721\n9210651 — 9210561\n14201201 — 14210210\n96101101 — 96101161\n88884444 — 88884444',hint:'Hitung berapa pasang yang identik'},
  {n:17,type:'input',text:'Susun kata-kata berikut menjadi pernyataan yang benar, lalu tulis huruf TERAKHIR dari kata TERAKHIR sebagai jawaban:\n"Selalu sebuah kata kerja kalimat suatu memiliki"',hint:'Tulis satu huruf saja'},
  {n:18,type:'input',text:'Anak lelaki berumur 5 tahun dan saudara perempuannya dua kali lebih tua. Ketika anak lelaki itu berumur 8 tahun, berapa umur saudara perempuannya?',hint:'Masukkan angka'},
  {n:19,type:'mc',text:"IT'S — ITS — Apakah kata ini:",opts:['1. memiliki arti yang sama','2. memiliki arti yang berlawanan','3. tidak memiliki arti yang sama atau berlawanan']},
  {n:20,type:'mc',text:'Anggaplah dua pernyataan pertama adalah benar. Apakah pernyataan terakhir: "John seusia dengan Sally. Sally lebih muda dari Bill. John lebih muda dari Bill."',opts:['1. benar','2. salah','3. tidak tahu']},
  {n:21,type:'input',text:'Seorang dealer membeli beberapa barrel seharga 4.000 rupiah. Ia menjual dengan harga 5.000 rupiah, mendapat untung 50 rupiah setiap barrel. Berapa banyak barrel yang dijual?',hint:'Masukkan angka'},
  {n:22,type:'mc',text:'Susun kata-kata berikut menjadi kalimat lengkap: "telur menghasilkan semua ayam". Jika kalimat itu BENAR tulis B, jika SALAH tulis S.',opts:['B (Benar)','S (Salah)']},
  {n:23,type:'mc',text:'Dua dari peribahasa berikut ini memiliki arti sama. Manakah itu?\n1. Semakin banyak memiliki sapi, akan memiliki satu anak sapi yang buruk.\n2. Anak seperti Ayahnya.\n3. Bila tertinggal sama jauhnya dengan satu mil\n4. Seorang dikenal dari persahabatan yang dijalin\n5. Mereka adalah benih dari mangkuk yang sama.',opts:['1 dan 2','2 dan 5','1 dan 4','3 dan 4','4 dan 5'],hint:'Pilih dua peribahasa dengan arti sama'},
  {n:24,type:'input',text:'Sebuah jam terlambat 1 menit 18 detik dalam 39 hari. Berapa detik ia terlambat dalam sehari?',hint:'Masukkan angka (dalam detik)'},
  {n:25,type:'mc',text:'CANVASS — CANVAS — Apakah kata-kata ini:',opts:['1. memiliki arti yang sama','2. memiliki arti yang berlawanan','3. tidak memiliki arti sama atau berlawanan']},
  {n:26,type:'mc',text:'Anggaplah dua pernyataan pertama adalah benar. Pernyataan terakhir: "Semua siswa mengikuti ujian. Beberapa orang diruangan ini adalah siswa. Beberapa orang diruangan ini mengikuti ujian."',opts:['1. benar','2. salah','3. tidak tahu']},
  {n:27,type:'input',text:'Dalam 30 hari seorang menabung 1 dolar. Berapa rata-rata tabungannya setiap hari?',hint:'Masukkan angka atau pecahan, contoh: 2/5'},
  {n:28,type:'mc',text:'INGENIOUS — INGENUOUS — Apakah kata-kata ini:',opts:['1. memiliki arti sama','2. memiliki arti berlawanan','3. tidak memiliki arti sama atau berlawanan']},
  {n:29,type:'input',text:'Dua orang menangkap 36 ikan. X menangkap 5 kali lebih banyak dari Y. Berapa ikan yang ditangkap Y?',hint:'Masukkan angka'},
  {n:30,type:'input',text:'Sebuah kotak segi empat, yang terisi penuh, memuat 800 kubik kaki gandum. Jika satu kotak lebarnya 8 kaki dan panjangnya 10 kaki, berapa kedalaman kotak itu?',hint:'Masukkan angka (dalam kaki)'},
  {n:31,type:'input',text:'Satu angka dari rangkaian berikut tidak cocok dengan pola angka yang lainnya. Angka berapakah itu?\n½  ¼  1/6  1/8  1/9  1/12',hint:'Masukkan angka yang tidak cocok (dalam bentuk pecahan, misal: 1/6)'},
  {n:32,type:'mc',text:'Apakah P.M. berarti "post merediem"?',opts:['YA','TIDAK'],hint:'Ketik YA atau TIDAK'},
  {n:33,type:'mc',text:'DAPAT DIPERCAYA — GAMPANG PERCAYA — Apakah kata-kata ini:',opts:['1. memiliki arti sama','2. memiliki arti berlawanan','3. tidak memiliki arti sama atau berlawanan']},
  {n:34,type:'input',text:'Sebuah rok membutuhkan 2¼ meter kain. Berapa banyak potong yang dihasilkan dari 45 meter kain?',hint:'Masukkan angka'},
  {n:35,type:'input',text:'Sebuah jam menunjuk tepat pukul 12 siang hari Senin. Pada pukul 2 siang hari Rabu, jam itu terlambat 26 detik. Pada rata-rata yang sama, berapa banyak jam itu terlambat dalam ½ jam?',hint:'Masukkan angka (dalam detik)'},
  {n:36,type:'input',text:'Tim bisbol kami kalah 9 permainan dalam musim ini. Ini merupakan 3/8 bagian dari semua pertandingan mereka. Berapa banyak pertandingan yang mereka mainkan dalam musim kompetisi saat ini?',hint:'Masukkan angka'},
  {n:37,type:'input',text:'Apakah angka selanjutnya dari seri ini? 1 — .5 — .25 — .125 — ?',hint:'Masukkan angka desimal'},
  {n:38,type:'input',text:'Bentuk geometris berikut dapat dibagi oleh satu garis lurus menjadi dua bagian yang disatukan membentuk persegi sempurna. Tuliskan dua angka yang dihubungkan oleh garis tersebut.',hint:'Format: angka,angka — contoh: 4,6',svgHtml:`<svg viewBox="0 0 380 305" xmlns="http://www.w3.org/2000/svg"
  style="width:100%;max-width:380px;display:block;margin:8px 0;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa">
<polygon points="40,265 115,265 190,265 265,265 340,40 265,40 190,40 115,40" fill="#edf7f5" stroke="#1a1a1a" stroke-width="2.2" stroke-linejoin="round"/>
<circle cx="40" cy="265" r="17" fill="white" stroke="#0d7c63" stroke-width="2.5"/><text x="40" y="265" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">1</text><circle cx="115" cy="265" r="17" fill="white" stroke="#0d7c63" stroke-width="2.5"/><text x="115" y="265" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">2</text><circle cx="190" cy="265" r="17" fill="white" stroke="#0d7c63" stroke-width="2.5"/><text x="190" y="265" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">3</text><circle cx="265" cy="265" r="17" fill="white" stroke="#0d7c63" stroke-width="2.5"/><text x="265" y="265" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">4</text><circle cx="340" cy="40" r="17" fill="white" stroke="#0d7c63" stroke-width="2.5"/><text x="340" y="40" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">5</text><circle cx="265" cy="40" r="17" fill="white" stroke="#0d7c63" stroke-width="2.5"/><text x="265" y="40" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">6</text><circle cx="190" cy="40" r="17" fill="white" stroke="#0d7c63" stroke-width="2.5"/><text x="190" y="40" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">7</text><circle cx="115" cy="40" r="17" fill="white" stroke="#0d7c63" stroke-width="2.5"/><text x="115" y="40" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">8</text>
</svg>`},
  {n:39,type:'mc',text:'Apakah arti dari kalimat berikut:\n"Sebuah sapu yang baru menyapu dengan bersih. Sepatu yang sudah lama sifatnya makin lunak."',opts:['1. sama','2. berlawanan','3. tidak sama atau berlawanan']},
  {n:40,type:'input',text:'Berapa duplikasi dari pasangan kata berikut ini?\nRexford, J.D. — Rockford, J.D\nSingleton, M.O. — Simbleten, M.O.\nRichards, W.E. — Richad, W.E.\nSiegel, A.B. — Seigel, A.B.\nWood, A.O. — Wood, A.O.',hint:'Hitung berapa pasang yang identik'},
  {n:41,type:'mc',text:'Dua dari peribahasa ini memiliki makna yang serupa. Manakah itu?\n1. Anda tidak dapat membuat dompet sutra dari kuping babi betina.\n2. Orang yang mencuri telur akan mencuri sapi.\n3. Batu yang berguling tidak akan mengumpulkan lumut.\n4. Anda tidak mungkin menghancurkan kapal yang sudah rusak.\n5. Ini ketidakmungkinan yang terjadi.',opts:['1 dan 4','2 dan 5','1 dan 3','3 dan 4','2 dan 4']},
  {n:42,type:'input',text:'Bentuk geometris berikut dapat dibagi oleh satu garis lurus menjadi dua bagian yang disatukan membentuk persegi sempurna. Tuliskan dua angka yang dihubungkan oleh garis tersebut.',hint:'Format: angka,angka — contoh: 5,13',svgHtml:`<svg viewBox="0 0 524 304" xmlns="http://www.w3.org/2000/svg"
  style="width:100%;max-width:524px;display:block;margin:8px 0;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa">
<polygon points="42,262 97,262 152,262 207,262 262,262 317,207 372,152 427,97 482,42 427,42 372,42 317,42 262,42 207,97 152,152 97,207" fill="#edf7f5" stroke="#1a1a1a" stroke-width="2.2" stroke-linejoin="round"/>

<circle cx="42" cy="262" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="42" y="262" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">1</text><circle cx="97" cy="262" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="97" y="262" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">2</text><circle cx="152" cy="262" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="152" y="262" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">3</text><circle cx="207" cy="262" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="207" y="262" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">4</text><circle cx="262" cy="262" r="15" fill="white" stroke="#0d7c63" stroke-width="2.8"/><text x="262" y="262" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">5</text><circle cx="317" cy="207" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="317" y="207" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">6</text><circle cx="372" cy="152" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="372" y="152" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">7</text><circle cx="427" cy="97" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="427" y="97" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">8</text><circle cx="482" cy="42" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="482" y="42" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">9</text><circle cx="427" cy="42" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="427" y="42" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">10</text><circle cx="372" cy="42" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="372" y="42" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">11</text><circle cx="317" cy="42" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="317" y="42" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">12</text><circle cx="262" cy="42" r="15" fill="white" stroke="#0d7c63" stroke-width="2.8"/><text x="262" y="42" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">13</text><circle cx="207" cy="97" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="207" y="97" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">14</text><circle cx="152" cy="152" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="152" y="152" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">15</text><circle cx="97" cy="207" r="15" fill="white" stroke="#0d7c63" stroke-width="2.2"/><text x="97" y="207" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#0d7c63" text-anchor="middle" dominant-baseline="middle">16</text>
</svg>`},
  {n:43,type:'mc',text:'Dalam kelompok angka berikut ini, manakah angka yang terkecil?',opts:['10','1','.999','.33','11']},
  {n:44,type:'mc',text:'Apakah makna dari kalimat berikut:\n"Tidak ada orang jujur meminta maaf atas kejujurannya. Kejujuran dihormati dan lapar pujian."',opts:['1. sama','2. berlawanan','3. tidak sama atau berlawanan']},
  {n:45,type:'input',text:'Dengan harga 1.80 dolar, seorang grosir membeli satu kardus buah yang berisi 12 lusin. Ia tahu dua lusin akan busuk sebelum dijual. Dengan harga berapa per lusin dia harus menjual untuk mendapat 1/3 dari harga seluruhnya?',hint:'Masukkan angka (dalam sen)'},
  {n:46,type:'mc',text:'Dalam rangkaian kata berikut ini, manakah kata yang berbeda dari yang lainnya?',opts:['1. koloni','2. perkawanan','3. kawanan','4. kru','5. konstelasi']},
  {n:47,type:'mc',text:'Anggaplah dua pernyataan pertama ini benar. Apakah pertanyaan terakhir:\n"Orang besar dibodohi. Saya dibodohi. Saya adalah orang besar."',opts:['1. benar','2. salah','3. tidak tahu']},
  {n:48,type:'input',text:'Tiga orang membentuk kemitraan dan setuju membagi keuntungan secara rata. X menginvestasi 4.500 dolar, Y sebesar 3.500 dolar, dan Z sebesar 2.000 dolar. Jika keuntungan mencapai 1.500 dolar, lebih kurang berapa yang akan diperoleh X dibanding jika keuntungan dibagi berdasarkan besarnya investasi?',hint:'Masukkan angka (dalam dolar)'},
  {n:49,type:'mc',text:'Empat dari 5 bagian ini dapat digabungkan menjadi sebuah segitiga siku-siku besar. Manakah keempat bagian tersebut?',opts:['1,2,3,4','1,2,4,5','1,3,4,5','2,3,4,5','1,2,3,5'],svgHtml:`<svg viewBox="0 0 860 155" xmlns="http://www.w3.org/2000/svg"
  style="width:100%;max-width:860px;display:block;margin:8px 0;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa">
<style>
.sp{fill:#fff;stroke:#1a1a1a;stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round}
.nm{font-family:Arial,sans-serif;font-size:14px;font-weight:bold;fill:#1a1a1a;text-anchor:middle;dominant-baseline:middle}
</style>

<!-- 1: Large right triangle — right angle bottom-right, tall -->
<polygon points="18,142 102,14 102,142" class="sp"/>
<text x="68" y="110" class="nm">1</text>

<!-- 2: L-shaped piece (rectangle with small notch) — fits into triangle -->
<polygon points="148,142 148,36 218,36 218,76 196,76 196,142" class="sp"/>
<text x="173" y="112" class="nm">2</text>

<!-- 3: SQUARE — does NOT fit to make triangle (this is the "wrong" piece) -->
<rect x="258" y="22" width="108" height="108" class="sp"/>
<text x="312" y="76" class="nm">3</text>

<!-- 4: Medium right triangle — right angle bottom-left, wider shape -->
<polygon points="408,142 560,142 408,44" class="sp"/>
<text x="444" y="118" class="nm">4</text>

<!-- 5: Small square — fits together with others -->
<rect x="596" y="50" width="100" height="60" class="sp"/>
<text x="646" y="80" class="nm">5</text>
</svg>`},
  {n:50,type:'input',text:'Untuk mencetak artikel berisi 30.000 kata, percetakan memakai dua ukuran jenis. Tipe besar: 1.200 kata/halaman. Tipe kecil: 1.500 kata/halaman. Artikel masuk dalam 22 halaman. Berapa banyak halaman untuk tipe yang lebih kecil?',hint:'Masukkan angka'},
];

export const DATQS = {

// ── PV: 25 PENALARAN VERBAL ────────────────────────────────
PV:[
  {s:'_____ adalah untuk Menyanyi sebagaimana Pena adalah untuk _____',o:{A:'Suara — Menulis',B:'Penyanyi — Kertas',C:'Mikrofon — Tinta',D:'Musik — Buku',E:'Nada — Menulis'},a:'A'},
  {s:'Lapar adalah untuk Makan sebagaimana Haus adalah untuk _____',o:{A:'Air',B:'Minum',C:'Tenggorokan',D:'Dahaga',E:'Minuman'},a:'B'},
  {s:'Dokter adalah untuk Pasien sebagaimana Guru adalah untuk _____',o:{A:'Kelas',B:'Buku',C:'Murid',D:'Pelajaran',E:'Sekolah'},a:'C'},
  {s:'Panas adalah untuk Api sebagaimana Dingin adalah untuk _____',o:{A:'Beku',B:'Suhu',C:'Angin',D:'Es',E:'Salju'},a:'D'},
  {s:'Kucing adalah untuk Meong sebagaimana Sapi adalah untuk _____',o:{A:'Susu',B:'Kandang',C:'Moo',D:'Hewan',E:'Ternak'},a:'C'},
  {s:'Biru adalah untuk Langit sebagaimana Hijau adalah untuk _____',o:{A:'Daun',B:'Warna',C:'Cat',D:'Alami',E:'Tumbuhan'},a:'A'},
  {s:'Novel adalah untuk Pengarang sebagaimana Lukisan adalah untuk _____',o:{A:'Kanvas',B:'Cat',C:'Pelukis',D:'Seni',E:'Galeri'},a:'C'},
  {s:'Kunci adalah untuk Pintu sebagaimana Sandi adalah untuk _____',o:{A:'Rahasia',B:'Komputer',C:'Keamanan',D:'Kode',E:'Akun'},a:'E'},
  {s:'Kaki adalah untuk Berjalan sebagaimana Tangan adalah untuk _____',o:{A:'Jari',B:'Menggenggam',C:'Tubuh',D:'Cincin',E:'Kuku'},a:'B'},
  {s:'Peta adalah untuk Geografi sebagaimana Diagram adalah untuk _____',o:{A:'Gambar',B:'Garis',C:'Ilmu',D:'Informasi',E:'Data'},a:'D'},
  {s:'Bunga adalah untuk Taman sebagaimana Ikan adalah untuk _____',o:{A:'Air',B:'Laut',C:'Sirip',D:'Aquarium',E:'Kolam'},a:'B'},
  {s:'Baca adalah untuk Teliti sebagaimana Dengar adalah untuk _____',o:{A:'Telinga',B:'Suara',C:'Seksama',D:'Musik',E:'Keras'},a:'C'},
  {s:'Siang adalah untuk Matahari sebagaimana Malam adalah untuk _____',o:{A:'Gelap',B:'Bulan',C:'Bintang',D:'Tidur',E:'Mimpi'},a:'B'},
  {s:'Laut adalah untuk Ikan sebagaimana Hutan adalah untuk _____',o:{A:'Pohon',B:'Binatang',C:'Hijau',D:'Udara',E:'Satwa Liar'},a:'E'},
  {s:'Jam adalah untuk Waktu sebagaimana Timbangan adalah untuk _____',o:{A:'Berat',B:'Mengukur',C:'Neraca',D:'Gram',E:'Kilogram'},a:'A'},
  {s:'Kata adalah untuk Kalimat sebagaimana Bata adalah untuk _____',o:{A:'Semen',B:'Rumah',C:'Bangunan',D:'Tembok',E:'Konstruksi'},a:'D'},
  {s:'Komposer adalah untuk Simfoni sebagaimana Arsitek adalah untuk _____',o:{A:'Bangunan',B:'Desain',C:'Gambar',D:'Konstruksi',E:'Cetak Biru'},a:'E'},
  {s:'Cerita adalah untuk Tokoh sebagaimana Drama adalah untuk _____',o:{A:'Panggung',B:'Sutradara',C:'Pemain',D:'Naskah',E:'Penonton'},a:'C'},
  {s:'Lampu adalah untuk Cahaya sebagaimana Speaker adalah untuk _____',o:{A:'Musik',B:'Suara',C:'Kabel',D:'Elektronik',E:'Listrik'},a:'B'},
  {s:'Garam adalah untuk Asin sebagaimana Gula adalah untuk _____',o:{A:'Manis',B:'Putih',C:'Karbohidrat',D:'Makanan',E:'Bumbu'},a:'A'},
  {s:'Mata adalah untuk Melihat sebagaimana Hidung adalah untuk _____',o:{A:'Napas',B:'Wajah',C:'Mencium',D:'Indera',E:'Lubang'},a:'C'},
  {s:'Pelaut adalah untuk Laut sebagaimana Petani adalah untuk _____',o:{A:'Panen',B:'Sawah',C:'Cangkul',D:'Tanah',E:'Beras'},a:'B'},
  {s:'Cepat adalah untuk Kura-kura sebagaimana Kuat adalah untuk _____',o:{A:'Lemah',B:'Semut',C:'Otot',D:'Besi',E:'Beban'},a:'B'},
  {s:'Layang-layang adalah untuk Angin sebagaimana Perahu adalah untuk _____',o:{A:'Dayung',B:'Laut',C:'Air',D:'Pelabuhan',E:'Berlayar'},a:'C'},
  {s:'Demam adalah untuk Obat sebagaimana Kelaparan adalah untuk _____',o:{A:'Uang',B:'Makanan',C:'Lapar',D:'Perut',E:'Restoran'},a:'B'},
],

// ── NA: 40 NUMERIK ────────────────────────────────────────
KN:[
  {s:'Berapa nilai x jika 3x + 9 = 24?',o:{A:'3',B:'4',C:'5',D:'6',E:'7'},a:'C'},
  {s:'Sebuah produk dijual Rp 80.000 dengan diskon 20%. Berapa harga setelah diskon?',o:{A:'Rp 60.000',B:'Rp 64.000',C:'Rp 68.000',D:'Rp 72.000',E:'Rp 76.000'},a:'B'},
  {s:'Deret: 3, 6, 12, 24, 48. Angka selanjutnya?',o:{A:'72',B:'84',C:'96',D:'84',E:'72'},a:'C'},
  {s:'Jika 35% dari suatu bilangan adalah 70, berapa bilangan tersebut?',o:{A:'180',B:'200',C:'220',D:'240',E:'250'},a:'B'},
  {s:'Sebuah mobil menempuh 240 km dalam 3 jam. Berapa kecepatan rata-ratanya?',o:{A:'60 km/j',B:'70 km/j',C:'80 km/j',D:'90 km/j',E:'100 km/j'},a:'C'},
  {s:'Rata-rata 4 nilai adalah 75. Nilai ke-5 berapa agar rata-rata menjadi 77?',o:{A:'81',B:'83',C:'85',D:'87',E:'89'},a:'C'},
  {s:'Luas persegi panjang 10×6 cm adalah?',o:{A:'32 cm²',B:'48 cm²',C:'56 cm²',D:'60 cm²',E:'72 cm²'},a:'D'},
  {s:'Jika 4 printer mencetak 120 halaman dalam 30 menit, berapa halaman yang dicetak 1 printer dalam 1 jam?',o:{A:'30',B:'45',C:'60',D:'90',E:'120'},a:'C'},
  {s:'Berapa persen 36 dari 120?',o:{A:'25%',B:'28%',C:'30%',D:'33%',E:'36%'},a:'C'},
  {s:'Modal Rp 8.000.000 dengan bunga sederhana 6% per tahun selama 2 tahun. Total?',o:{A:'Rp 8.480.000',B:'Rp 8.960.000',C:'Rp 9.000.000',D:'Rp 9.200.000',E:'Rp 9.440.000'},a:'B'},
  {s:'5x - 3 = 2x + 12. Berapa x?',o:{A:'3',B:'4',C:'5',D:'6',E:'7'},a:'C'},
  {s:'Lingkaran jari-jari 7 cm. Luas lingkaran? (π = 22/7)',o:{A:'132 cm²',B:'144 cm²',C:'154 cm²',D:'162 cm²',E:'176 cm²'},a:'C'},
  {s:'Keran A mengisi bak dalam 10 menit. Keran B dalam 15 menit. Jika keduanya dibuka bersamaan, berapa menit bak penuh?',o:{A:'4',B:'5',C:'6',D:'7',E:'8'},a:'C'},
  {s:'Harga naik 25% lalu turun 20%. Perubahan dari harga asal?',o:{A:'Naik 5%',B:'Naik 2,5%',C:'Turun 0%',D:'Tetap',E:'Turun 2,5%'},a:'C'},
  {s:'a:b = 3:4 dan b:c = 5:6. Berapa a:c?',o:{A:'12:20',B:'15:24',C:'5:8',D:'3:8',E:'9:16'},a:'B'},
  {s:'Sisi miring segitiga siku-siku = 17 cm, satu sisi = 8 cm. Sisi ketiga?',o:{A:'12 cm',B:'13 cm',C:'14 cm',D:'15 cm',E:'16 cm'},a:'D'},
  {s:'Tiga bilangan berurutan jumlahnya 90. Bilangan terbesar?',o:{A:'28',B:'29',C:'30',D:'31',E:'32'},a:'D'},
  {s:'Toko membeli 50 unit seharga Rp 2.000.000. Dijual habis Rp 2.600.000. % keuntungan?',o:{A:'25%',B:'28%',C:'30%',D:'32%',E:'35%'},a:'C'},
  {s:'log₂ 32 = ?',o:{A:'4',B:'5',C:'6',D:'7',E:'8'},a:'B'},
  {s:'Populasi naik 10% per tahun. Dari 50.000, setelah 2 tahun?',o:{A:'60.000',B:'60.500',C:'60.550',D:'61.000',E:'61.050'},a:'C'},
  {s:'2/3 + 3/4 = ?',o:{A:'5/7',B:'17/12',C:'6/7',D:'11/12',E:'5/12'},a:'B'},
  {s:'Sebuah persegi sisi 9 cm. Luas total?',o:{A:'36 cm²',B:'54 cm²',C:'72 cm²',D:'81 cm²',E:'90 cm²'},a:'D'},
  {s:'Jika 15% dari x sama dengan 45, berapa x?',o:{A:'200',B:'250',C:'300',D:'350',E:'400'},a:'C'},
  {s:'Deret: 1, 4, 9, 16, 25, 36. Selanjutnya?',o:{A:'42',B:'44',C:'46',D:'48',E:'49'},a:'E'},
  {s:'Sebuah ruangan 8×6×3 meter. Volume (m³)?',o:{A:'96',B:'112',C:'124',D:'136',E:'144'},a:'E'},
  {s:'3³ + 4² = ?',o:{A:'37',B:'39',C:'41',D:'43',E:'45'},a:'C'},
  {s:'x² - 5x + 6 = 0. Nilai x?',o:{A:'x=1 atau x=6',B:'x=2 atau x=3',C:'x=-2 atau x=-3',D:'x=1 atau x=5',E:'x=2 atau x=4'},a:'B'},
  {s:'Seseorang berjalan 3 km ke utara lalu 4 km ke timur. Jarak terdekat dari titik awal?',o:{A:'4 km',B:'5 km',C:'6 km',D:'7 km',E:'8 km'},a:'B'},
  {s:'Jika P = 2(l+w) = 40 dan l = 12, berapa w?',o:{A:'6',B:'7',C:'8',D:'9',E:'10'},a:'C'},
  {s:'Saham dibeli Rp 5.000/lembar, dividen Rp 400/lembar/tahun. Yield per tahun?',o:{A:'6%',B:'7%',C:'8%',D:'9%',E:'10%'},a:'C'},
  {s:'Kecepatan cahaya ≈ 3×10⁸ m/s. Waktu cahaya dari matahari ke bumi (1,5×10¹¹ m)?',o:{A:'250 detik',B:'400 detik',C:'500 detik',D:'600 detik',E:'750 detik'},a:'C'},
  {s:'Distribusi normal: mean=70, SD=10. Berapa % antara 60–80?',o:{A:'50%',B:'55%',C:'60%',D:'68%',E:'75%'},a:'D'},
  {s:'Dalam sebuah perlombaan, tersedia 8 peserta untuk mengisi posisi Juara 1 dan Juara 2. Berapa banyak kemungkinan pasangan Juara 1 & 2 yang berbeda (urutan penting)?',o:{A:'28',B:'42',C:'56',D:'64',E:'72'},a:'C'},
  {s:'Pinjaman Rp 10.000.000, bunga majemuk 5% per tahun, 3 tahun. Total?',o:{A:'Rp 11.500.000',B:'Rp 11.550.000',C:'Rp 11.576.250',D:'Rp 11.600.000',E:'Rp 12.000.000'},a:'C'},
  {s:'Jika sin 30° = 0.5, berapa nilai sin² 30° + cos² 30°?',o:{A:'0.5',B:'0.75',C:'1',D:'1.25',E:'1.5'},a:'C'},
  {s:'Dalam grafik fungsi f(x) = 2x + 3, nilai f(7) = ?',o:{A:'14',B:'15',C:'16',D:'17',E:'18'},a:'D'},
  {s:'Median dari: 4, 7, 2, 9, 5, 1, 8, 3, 6 adalah?',o:{A:'4',B:'5',C:'6',D:'7',E:'8'},a:'B'},
  {s:'Jika matriks A = [[2,1],[3,4]], determinan A?',o:{A:'3',B:'5',C:'7',D:'8',E:'11'},a:'B'},
  {s:'Sebuah kubus volume 125 cm³. Panjang sisi?',o:{A:'4 cm',B:'5 cm',C:'6 cm',D:'7 cm',E:'8 cm'},a:'B'},
  {s:'Persamaan garis melalui (2,3) dan (4,7). Gradiennya?',o:{A:'1',B:'1.5',C:'2',D:'2.5',E:'3'},a:'C'},
],

// ── AR: 40 PENALARAN ABSTRAK ──────────────────────────────
PA:[
  {s:'Deret: 1, 2, 4, 7, 11, 16. Angka selanjutnya?',o:{A:'20',B:'21',C:'22',D:'23',E:'24'},a:'C'},
  {s:'Deret huruf: A, C, F, J, O. Huruf selanjutnya?',o:{A:'U',B:'V',C:'W',D:'X',E:'Y'},a:'A'},
  {s:'Pola: 2, 3, 5, 8, 13, 21. Angka selanjutnya?',o:{A:'28',B:'30',C:'32',D:'34',E:'36'},a:'D'},
  {s:'Deret: Z, W, T, Q, N. Huruf selanjutnya?',o:{A:'J',B:'K',C:'L',D:'M',E:'N'},a:'B'},
  {s:'100, 91, 82, 73, 64. Pola? Selanjutnya?',o:{A:'53',B:'54',C:'55',D:'56',E:'57'},a:'C'},
  {s:'Kode: A=1, B=2, ... Z=26. Nilai SUM?',o:{A:'55',B:'54',C:'53',D:'52',E:'51'},a:'B'},
  {s:'Deret: 1, 1, 2, 4, 3, 9, 4, 16. Angka ke-9?',o:{A:'4',B:'5',C:'6',D:'7',E:'8'},a:'B'},
  {s:'Warna berulang: Merah, Biru, Hijau, Kuning, Merah, Biru, Hijau... Warna ke-18?',o:{A:'Merah',B:'Biru',C:'Hijau',D:'Kuning',E:'Ungu'},a:'B'},
  {s:'Deret: 2, 3, 5, 7, 11, 13, 17. Angka ke-8?',o:{A:'18',B:'19',C:'20',D:'21',E:'22'},a:'B'},
  {s:'Matriks: baris 1 = (1,2,3), baris 2 = (4,5,6), baris 3 = (7,8,?). Nilai?',o:{A:'7',B:'8',C:'9',D:'10',E:'11'},a:'C'},
  {s:'4, 12, 36, 108. Angka selanjutnya?',o:{A:'216',B:'324',C:'432',D:'540',E:'648'},a:'B'},
  {s:'Kode jam: setiap huruf = posisi jam (A=1, B=2 … L=12). M,N,O = ?',o:{A:'1,2,3',B:'2,3,4',C:'3,4,5',D:'4,5,6',E:'5,6,7'},a:'A'},
  {s:'Deret: 1, 3, 7, 15, 31. Angka selanjutnya?',o:{A:'55',B:'60',C:'63',D:'65',E:'70'},a:'C'},
  {s:'Segitiga bertingkat: baris 1=1 titik, baris 2=3, baris 3=6, baris 4=10. Baris 5?',o:{A:'13',B:'14',C:'15',D:'16',E:'17'},a:'C'},
  {s:'Jika △=3, ○=5, □=7. Nilai △+○+□?',o:{A:'13',B:'14',C:'15',D:'16',E:'17'},a:'C'},
  {s:'Deret: 2, 6, 12, 20, 30, 42. Angka selanjutnya?',o:{A:'52',B:'54',C:'56',D:'58',E:'60'},a:'C'},
  {s:'Kode: ■■○ = 221, ■○■ = 212. Nilai ○■■?',o:{A:'112',B:'122',C:'211',D:'221',E:'212'},a:'B'},
  {s:'Deret: 1000, 500, 250, 125. Selanjutnya?',o:{A:'60',B:'62.5',C:'65',D:'70',E:'75'},a:'B'},
  {s:'Jika A>B, B>C, C>D. Perbandingan A dan D?',o:{A:'A<D',B:'A=D',C:'A>D',D:'Tidak dapat ditentukan',E:'A≤D'},a:'C'},
  {s:'Deret: 0, 1, 3, 6, 10, 15, 21. Angka selanjutnya?',o:{A:'26',B:'27',C:'28',D:'29',E:'30'},a:'C'},
  {s:'Pola titik: Langkah 1 = 4 titik, Langkah 2 = 6 titik, Langkah 3 = 8 titik, Langkah 4 = 10 titik. Langkah ke-5 memiliki berapa titik?',o:{A:'12',B:'13',C:'14',D:'15',E:'16'},a:'A'},
  {s:'Deret abjad terbalik: Z, Y, X, W. Huruf ke-8 dari deret ini?',o:{A:'T',B:'S',C:'R',D:'Q',E:'P'},a:'B'},
  {s:'Bila hari ini Selasa, 100 hari lagi hari apa?',o:{A:'Senin',B:'Selasa',C:'Rabu',D:'Kamis',E:'Jumat'},a:'D'},
  {s:'Kode biner: 1=●, 0=○. Representasi biner dari bilangan 5 adalah?',o:{A:'●○●',B:'○●○',C:'●●○',D:'○○●',E:'●○○'},a:'A'},
  {s:'Jika fungsi f(n) = n² - n + 1, nilai f(5)?',o:{A:'19',B:'20',C:'21',D:'22',E:'23'},a:'C'},
  {s:'Deret: 1/2, 1/4, 1/8, 1/16. Selanjutnya?',o:{A:'1/20',B:'1/24',C:'1/28',D:'1/32',E:'1/36'},a:'D'},
  {s:'Kata kode: MAJU = PDMX. Dengan pola yang sama, kode RAPI = ?',o:{A:'UBSL',B:'UDSL',C:'UDTL',D:'VDSL',E:'UCSL'},a:'B'},
  {s:'Deret: 7, 14, 28, 56, 112. Selanjutnya?',o:{A:'168',B:'196',C:'224',D:'252',E:'280'},a:'C'},
  {s:'Jika semua P adalah Q, dan semua Q adalah R, maka...',o:{A:'Semua R adalah P',B:'Semua P adalah R',C:'Semua Q adalah P',D:'Beberapa P bukan R',E:'Tidak dapat disimpulkan'},a:'B'},
  {s:'Deret: 4, 8, 7, 14, 13, 26, 25. Angka selanjutnya?',o:{A:'48',B:'50',C:'52',D:'54',E:'56'},a:'B'},
  {s:'Sebuah persegi dibagi oleh kedua diagonalnya. Berapa TOTAL segitiga (kecil maupun gabungan) yang terbentuk?',o:{A:'4',B:'6',C:'8',D:'10',E:'12'},a:'C'},
  {s:'Rotasi: gambar panah arah ↑ diputar 90° searah jarum jam 3 kali. Arah akhir?',o:{A:'↑',B:'→',C:'↓',D:'←',E:'↗'},a:'D'},
  {s:'Deret huruf: AZ, BY, CX, DW. Pasangan selanjutnya?',o:{A:'EV',B:'EU',C:'FV',D:'FU',E:'EW'},a:'A'},
  {s:'Kode: 1A, 2B, 3C, 4D. Pola ke-15?',o:{A:'15O',B:'15N',C:'14O',D:'15P',E:'16O'},a:'A'},
  {s:'Deret: 1, 8, 27, 64, 125. Angka selanjutnya?',o:{A:'196',B:'210',C:'216',D:'225',E:'243'},a:'C'},
  {s:'Jika hari ini tanggal 10 Maret, 45 hari lagi tanggal berapa?',o:{A:'23 April',B:'24 April',C:'25 April',D:'26 April',E:'27 April'},a:'C'},
  {s:'Pola: setiap kelompok menambah 1 elemen: ●, ●●, ●●●... Berapa jumlah total elemen dari 6 kelompok pertama?',o:{A:'18',B:'19',C:'20',D:'21',E:'22'},a:'D'},
  {s:'Kode angka: setiap huruf = (posisi)². A=1, B=4, C=9. Nilai D+E?',o:{A:'40',B:'41',C:'42',D:'43',E:'44'},a:'B'},
  {s:'Deret: 3, 5, 9, 17, 33, 65. Angka selanjutnya?',o:{A:'119',B:'120',C:'121',D:'129',E:'131'},a:'D'},
  {s:'Jika kunci = "MYRALIX" dan shift+3, kode pertama Y+3 = ?',o:{A:'B',B:'L',C:'M',D:'N',E:'P'},a:'A'},
],

// ── CS: 40 KECEPATAN & AKURASI KLERIKAL ──────────────────
KA:[
  // Format A: Pilih yang IDENTIK dengan referensi (25 soal)
  {s:'Referensi: P-7734-BX. Pilih yang IDENTIK:',o:{A:'P-7743-BX',B:'P-7734-BX',C:'P-7734-Bx',D:'P-7734-XB',E:'Q-7734-BX'},a:'B'},
  {s:'Referensi: SANTOSO, Budi — 082024. Pilih yang IDENTIK:',o:{A:'SANTOSA, Budi — 082024',B:'SANTOSO, Bodi — 082024',C:'SANTOSO, Budi — 082024',D:'SANTOSO, Budi — 082042',E:'SANTOSO, Budi — 08202'},a:'C'},
  {s:'Referensi: INV/2024/03/1189. Pilih yang IDENTIK:',o:{A:'INV/2024/03/1198',B:'INV/2024/03/1189',C:'INV/2024/30/1189',D:'INV/2024/03/1889',E:'INV/2023/03/1189'},a:'B'},
  {s:'Referensi: KTP-3273-0809-1991. Pilih yang IDENTIK:',o:{A:'KTP-3237-0809-1991',B:'KTP-3273-0809-1991',C:'KTP-3273-0890-1991',D:'KTP-3273-0809-1919',E:'KTP-3273-0908-1991'},a:'B'},
  {s:'Referensi: XY-4429-MK. Pilih yang IDENTIK:',o:{A:'XY-4492-MK',B:'XY-4429-MK',C:'XY-4429-Mk',D:'XY-4429-KM',E:'YX-4429-MK'},a:'B'},
  {s:'Referensi: WIJAYANTI, Sari L. Pilih yang IDENTIK:',o:{A:'WIJAYANTI, Sari I.',B:'WIJAYANTI, Sari L.',C:'WIAYANTI, Sari L.',D:'WIJAYANTI, Sar L.',E:'WIJAYANTI, Sari L '},a:'B'},
  {s:'Referensi: REF/HR/2024/0751. Pilih yang IDENTIK:',o:{A:'REF/HR/2024/0715',B:'REF/HR/2024/0751',C:'REF/HH/2024/0751',D:'REF/HR/20240751',E:'REF/HR/2024/0571'},a:'B'},
  {s:'Referensi: TRK-9981-22C. Pilih yang IDENTIK:',o:{A:'TRK-9981-22C',B:'TRK-9918-22C',C:'TRK-9981-22G',D:'TRK-9981-2C',E:'TRK-9981-22 C'},a:'A'},
  {s:'Referensi: PRASETYO, Andi W. — S1. Pilih yang IDENTIK:',o:{A:'PRASETYO, Andi W — S1',B:'PRASETYO, Andi W. — S1',C:'PRASETIO, Andi W. — S1',D:'PRASETYO, Andi M. — S1',E:'PRASETYO, Andi W. — SI'},a:'B'},
  {s:'Referensi: 15-Mar-2024 / BDG-0042. Pilih yang IDENTIK:',o:{A:'15-Mar-2024 / BDG-0042',B:'15-Mar-2024 / BGD-0042',C:'15-Mar-2024 / BDG-0024',D:'15-Mar-2042 / BDG-0042',E:'15-Mar-2024 / BDG-00042'},a:'A'},
  {s:'Referensi: LMP-6634-KV. Pilih yang IDENTIK:',o:{A:'LMP-6634-KV',B:'LMP-6634-VK',C:'LMP-6634-Kv',D:'LMP-6643-KV',E:'LMP-6634-KW'},a:'A'},
  {s:'Referensi: KUSUMA, Indah — 19980712. Pilih yang IDENTIK:',o:{A:'KUSUMA, Indah — 19980721',B:'KUSUMA, Indah — 19980712',C:'KUSUMA, Indah — 19890712',D:'KUSUMA, Indra — 19980712',E:'KUSUMA, Indah — 19981712'},a:'B'},
  {s:'Referensi: SKU-A2293-TL. Pilih yang IDENTIK:',o:{A:'SKU-A2293-LT',B:'SKU-A2293-TL',C:'SKU-A2239-TL',D:'SKU-A2293-TI',E:'SKU-B2293-TL'},a:'B'},
  {s:'Referensi: DOC/LGL/2024/4422. Pilih yang IDENTIK:',o:{A:'DOC/LGL/2024/4242',B:'DOC/LGL/2024/4422',C:'DOC/LGl/2024/4422',D:'DOC/LGL/2014/4422',E:'DOC/LGL/2024/4224'},a:'B'},
  {s:'Referensi: ZX-8801-FGH. Pilih yang IDENTIK:',o:{A:'ZX-8801-FGH',B:'ZX-8801-FHG',C:'ZX-8810-FGH',D:'XZ-8801-FGH',E:'ZX-8801-FGN'},a:'A'},
  {s:'Referensi: MAHENDRA, Bagas P. Pilih yang IDENTIK:',o:{A:'MAHENDRA, Bagas P',B:'MAHENDRA, Bagas P.',C:'MAHENDRA, Bagus P.',D:'MAHENDRA, Bagas Q.',E:'MAHINDRA, Bagas P.'},a:'B'},
  {s:'Referensi: EMP/2024/MKT/0089. Pilih yang IDENTIK:',o:{A:'EMP/2024/MKT/0098',B:'EMP/2024/MKT/0089',C:'EMP/2024/MTK/0089',D:'EMP/2024/MKT/089',E:'EMP/2023/MKT/0089'},a:'B'},
  {s:'Referensi: NIP-197605142003011002. Pilih yang IDENTIK:',o:{A:'NIP-197605142003011002',B:'NIP-197605142003011020',C:'NIP-197605142030011002',D:'NIP-197605142003001002',E:'NIP-197650142003011002'},a:'A'},
  {s:'Referensi: Q7-RR-2291-KL. Pilih yang IDENTIK:',o:{A:'Q7-RR-2219-KL',B:'Q7-RR-2291-KL',C:'Q7-RR-2291-LK',D:'Q7-RR-2291-KI',E:'07-RR-2291-KL'},a:'B'},
  {s:'Referensi: RAHAYU, Dwi A. — 14-Jul-1990. Pilih yang IDENTIK:',o:{A:'RAHAYU, Dwi A. — 14-Jun-1990',B:'RAHAYU, Dwi A. — 14-Jul-1990',C:'RAHAYU, Dwi A. — 14-Jul-1909',D:'RAHAYU, Dwi A — 14-Jul-1990',E:'RAHAYU, Dwie A. — 14-Jul-1990'},a:'B'},
  {s:'Referensi: INV-B/2024/XII/0067. Pilih yang IDENTIK:',o:{A:'INV-B/2024/XII/0076',B:'INV-B/2024/XII/0067',C:'INV-B/2024/XII/067',D:'INV-B/2024/IXX/0067',E:'INV-B/2024/XlI/0067'},a:'B'},
  {s:'Referensi: VND-4423-XY-09. Pilih yang IDENTIK:',o:{A:'VND-4423-XY-09',B:'VND-4432-XY-09',C:'VND-4423-YX-09',D:'VND-4423-XY-90',E:'VNK-4423-XY-09'},a:'A'},
  {s:'Referensi: HARSONO, Bambang T. Pilih yang IDENTIK:',o:{A:'HARSONO, Bambang T',B:'HARSONO, Bambang T.',C:'HARSONO, Bambanq T.',D:'HASSONO, Bambang T.',E:'HARSONO, Bambamg T.'},a:'B'},
  {s:'Referensi: PO/2024/VI/3341-A. Pilih yang IDENTIK:',o:{A:'PO/2024/VI/3314-A',B:'PO/2024/VI/3341-A',C:'PO/2024/VI/3341-B',D:'PO/2024/IV/3341-A',E:'PO/2024/VI/33411-A'},a:'B'},
  {s:'Referensi: MBL-7711-ZZ-3. Pilih yang IDENTIK:',o:{A:'MBL-7711-ZZ-3',B:'MBL-7711-ZZ-3.',C:'MBL-7711-ZZ-8',D:'MBL-7711-ZZ3',E:'MBL-7117-ZZ-3'},a:'A'},
  // Format B: Pilih yang BERBEDA dari keempat lainnya (15 soal)
  {s:'Pilih kode yang BERBEDA dari empat lainnya:',o:{A:'BG-2291-MK',B:'BG-2291-MK',C:'BG-2291-MK',D:'BG-2921-MK',E:'BG-2291-MK'},a:'D'},
  {s:'Pilih data yang BERBEDA dari empat lainnya:',o:{A:'PUTRA, Riko L. — 2024',B:'PUTRA, Riko L. — 2024',C:'PUTRA, Riko L. — 2024',D:'PUTRA, Riko L. — 2024',E:'PUTRA, Rico L. — 2024'},a:'E'},
  {s:'Pilih kode yang BERBEDA dari empat lainnya:',o:{A:'REF-4412-AX',B:'REF-4412-AX',C:'REF-4412-AX',D:'REF-4412-AX',E:'REF-4412-XA'},a:'E'},
  {s:'Pilih nomor faktur yang BERBEDA dari empat lainnya:',o:{A:'INV/2024/07/0881',B:'INV/2024/07/0881',C:'INV/2024/07/0881',D:'INV/2024/07/0818',E:'INV/2024/07/0881'},a:'D'},
  {s:'Pilih nama yang BERBEDA dari empat lainnya:',o:{A:'SUSANTO, Heri W.',B:'SUSANTO, Heri W.',C:'SUSANTO, Heri W.',D:'SUSANTO, Heri W.',E:'SUSANTO, Heri W,'},a:'E'},
  {s:'Pilih kode yang BERBEDA dari empat lainnya:',o:{A:'TR-9920-CF',B:'TR-9920-CF',C:'TR-9920-FC',D:'TR-9920-CF',E:'TR-9920-CF'},a:'C'},
  {s:'Pilih nomor yang BERBEDA dari empat lainnya:',o:{A:'3311-2294-5567',B:'3311-2294-5567',C:'3311-2294-5567',D:'3311-2294-5567',E:'3311-2294-5576'},a:'E'},
  {s:'Pilih kode produk yang BERBEDA dari empat lainnya:',o:{A:'SKU-FG-88-010',B:'SKU-FG-88-001',C:'SKU-FG-88-001',D:'SKU-FG-88-001',E:'SKU-FG-88-001'},a:'A'},
  {s:'Pilih tanggal yang BERBEDA dari empat lainnya:',o:{A:'2024-09-15',B:'2024-09-15',C:'2024-09-15',D:'2024-09-51',E:'2024-09-15'},a:'D'},
  {s:'Pilih nama kota yang BERBEDA dari empat lainnya:',o:{A:'Bandung, Jawa Barat',B:'Bandung, Jawa Barat',C:'Bandung, Jawa Barat',D:'Bandung, Jawa Barat',E:'Bandung, Jawa Baret'},a:'E'},
  {s:'Pilih kode rekening yang BERBEDA dari empat lainnya:',o:{A:'1234-5678-9012',B:'1234-5678-9012',C:'1234-5678-9012',D:'1234-5687-9012',E:'1234-5678-9012'},a:'D'},
  {s:'Pilih kode departemen yang BERBEDA dari empat lainnya:',o:{A:'HR/MGT/001',B:'HR/MGT/001',C:'HR/MGT/001',D:'HR/MGT/001',E:'HR/MKT/001'},a:'E'},
  {s:'Pilih nomor faktur yang BERBEDA dari empat lainnya:',o:{A:'FK-2024-0033-B',B:'FK-2024-0330-B',C:'FK-2024-0033-B',D:'FK-2024-0033-B',E:'FK-2024-0033-B'},a:'B'},
  {s:'Pilih kode item yang BERBEDA dari empat lainnya:',o:{A:'PRD-9912-AA',B:'PRD-9912-AA',C:'PRD-9921-AA',D:'PRD-9912-AA',E:'PRD-9912-AA'},a:'C'},
  {s:'Pilih data karyawan yang BERBEDA dari empat lainnya:',o:{A:'NUGROHO, Sigit — HR — Lv.3',B:'NUGROHO, Sigit — HR — Lv.3',C:'NUGROHO, Sigit — HR — Lv.3',D:'NUGROHO, Sigit — HR — Lv.3',E:'NUGROHO, Sigit — HH — Lv.3'},a:'E'},
],
};
