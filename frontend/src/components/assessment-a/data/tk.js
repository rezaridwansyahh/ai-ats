// TK (Kemampuan Kognitif) — Battery A uses two subtests: GI + KA.
// Items ported verbatim from Myralix_Battery_A_Candidate_Card_v10.html.
export const SUBS = {
  GI: {
    code: 'GI', name: 'Kemampuan Umum', nameID: 'Kemampuan Umum', icon: '🧠',
    color: '#0A6E5C', bg: '#F0F8F6',
    time: 12 * 60, items: 50, weight: 0.30,
    function: 'Mengukur kecepatan belajar, kapasitas pemecahan masalah, dan kemampuan berpikir lintas domain — verbal, numerik, logis, dan spasial secara terpadu.',
    instruction: 'Kerjakan 50 soal beragam (verbal, numerik, logika, spasial) semampu mungkin dalam 12 menit. Lewati soal sulit dan lanjutkan ke soal berikutnya.',
    sample: { q: 'PANAS adalah lawan kata dari: (1) dingin (2) hangat (3) terik', a: '1 (Dingin)', explain: 'Lawan kata panas adalah dingin.' },
    career: 'Semua jabatan — GI adalah prediktor umum performa kerja.',
  },
  KA: {
    code: 'KA', name: 'Kecepatan & Akurasi', nameID: 'Kecepatan & Akurasi Klerikal', icon: '📋',
    color: '#DB2777', bg: '#FDF2F8',
    time: 8 * 60, items: 40, weight: 0.175,
    function: 'Kemampuan memindai dan membandingkan informasi (kode, nama, angka) dengan cepat dan akurat.',
    instruction: 'Pilih jawaban yang IDENTIK dengan referensi, atau yang BERBEDA dari empat lainnya. Kerjakan secepat dan setepat mungkin.',
    sample: { q: 'Ref: AB-1234-XY. Identik: (A) AB-1243-XY (B) AB-1234-XY (C) AB-1234-YX', a: 'B', explain: 'Hanya B yang persis sama.' },
    career: 'Administrasi, Audit, Perbankan, Data Entry, Akuntansi, Logistik.',
  },
};

export const TK_ORDER = ['GI', 'KA'];

// GI answer key — 50 items
export const KEYS = {
  1:'3',2:'1',3:'4',4:'ya',5:'4',6:'1',7:'3',8:'11',9:'1',10:'4',
  11:'3',12:'6000',13:'1',14:'2',15:'20',16:'2',17:'a',18:'13',19:'3',20:'1',
  21:'20',22:'s',23:'2,5',24:'2',25:'3',26:'1',27:'1/30',28:'3',29:'6',30:'10',
  31:'1/9',32:'ya',33:'3',34:'20',35:'0.25',36:'24',37:'0.0625',38:'4,6',39:'2',40:'1',
  41:'1,4',42:'5,13',43:'0.33',44:'2',45:'24',46:'2',47:'3',48:'175',49:'1,2,4,5',50:'12',
};

export const GI_QS = [
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
<text x="18" y="16" font-size="11" fill="#888" font-family="Arial,sans-serif">Sumber:</text>
<text x="18" y="82" class="br">{</text>
<rect x="40" y="42" width="34" height="50" class="sh"/>
<polygon points="103,40 75,90 131,90" class="sh"/>
<text x="122" y="82" class="br">}</text>
<line x1="164" y1="10" x2="164" y2="142" stroke="#ddd" stroke-width="1.5"/>
<text x="210" y="16" class="lb">1</text>
<rect x="182" y="30" width="56" height="90" class="sh"/>
<text x="310" y="16" class="lb">2</text>
<polygon points="280,120 340,120 340,30" class="sh"/>
<text x="420" y="16" class="lb">3</text>
<rect x="385" y="72" width="70" height="58" class="sh"/>
<polygon points="385,72 420,28 455,72" class="sh"/>
<text x="530" y="16" class="lb">4</text>
<rect x="498" y="55" width="32" height="65" class="sh"/>
<polygon points="536,55 536,120 563,120" class="sh"/>
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
<polygon points="18,142 102,14 102,142" class="sp"/>
<text x="68" y="110" class="nm">1</text>
<polygon points="148,142 148,36 218,36 218,76 196,76 196,142" class="sp"/>
<text x="173" y="112" class="nm">2</text>
<rect x="258" y="22" width="108" height="108" class="sp"/>
<text x="312" y="76" class="nm">3</text>
<polygon points="408,142 560,142 408,44" class="sp"/>
<text x="444" y="118" class="nm">4</text>
<rect x="596" y="50" width="100" height="60" class="sp"/>
<text x="646" y="80" class="nm">5</text>
</svg>`},
  {n:50,type:'input',text:'Untuk mencetak artikel berisi 30.000 kata, percetakan memakai dua ukuran jenis. Tipe besar: 1.200 kata/halaman. Tipe kecil: 1.500 kata/halaman. Artikel masuk dalam 22 halaman. Berapa banyak halaman untuk tipe yang lebih kecil?',hint:'Masukkan angka'},
];

// KA: 40 items (25 identity-match + 15 spot-difference)
export const KA_QS = [
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
];
