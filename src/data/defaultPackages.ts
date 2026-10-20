import { QuestionPackage, ExamPackage } from '../types';
import { DEFAULT_QUESTIONS } from './defaultQuestions';

export const INITIAL_QUESTION_PACKAGES: QuestionPackage[] = [
  {
    id: 'pkg-tiu-1',
    title: 'Paket Soal Tes Intelegensi Umum (TIU) - CPNS & Kedinasan',
    subject: 'Tes Intelegensi Umum (TIU)',
    targetClass: 'ALL',
    description: '30 soal kemampuan verbal, numerik, dan penalaran logis untuk uji kompetensi umum.',
    createdAt: '2026-08-01T08:00:00.000Z',
    questions: DEFAULT_QUESTIONS
  },
  {
    id: 'pkg-fisika-1',
    title: 'Paket Soal Fisika Kelas X - Hukum Newton & Dinamika Gerak',
    subject: 'Fisika',
    targetClass: 'X MIPA',
    description: 'Materi Hukum Newton I, II, III, gaya gesek, dan aplikasi pada bidang miring serta katrol.',
    createdAt: '2026-08-02T09:00:00.000Z',
    questions: [
      {
        id: 'pf-1',
        text: 'Sebuah benda bermassa 5 kg ditarik dengan gaya tetap 20 N pada lantai licin. Percepatan yang dialami benda tersebut adalah...',
        options: ['2 m/s²', '4 m/s²', '5 m/s²', '10 m/s²', '100 m/s²'],
        answer: 1
      },
      {
        id: 'pf-2',
        text: 'Hukum I Newton sering disebut juga sebagai Hukum...',
        options: ['Aksi-Reaksi', 'Kelembaman (Inersia)', 'Gravitasi', 'Kekekalan Energi', 'Gaya Gesek'],
        answer: 1
      },
      {
        id: 'pf-3',
        text: 'Apabila gaya aksi dan reaksi bekerja pada dua benda yang berbeda, maka pernyataan berikut yang BENAR adalah...',
        options: [
          'Kedua gaya saling meniadakan',
          'Besar kedua gaya berbeda',
          'Arah kedua gaya berlawanan',
          'Kedua gaya bekerja pada benda yang sama',
          'Percepatan benda selalu nol'
        ],
        answer: 2
      },
      {
        id: 'pf-4',
        text: 'Berat sebuah benda bermassa 10 kg di tempat yang memiliki percepatan gravitasi g = 9,8 m/s² adalah...',
        options: ['0,98 N', '9,8 N', '98 N', '980 N', '9800 N'],
        answer: 2
      },
      {
        id: 'pf-5',
        text: 'Sebuah balok bermassa 2 kg berada di atas bidang datar kasar dengan koefisien gesek statis 0,4 dan gravitasi g = 10 m/s². Gaya gesek statis maksimum balok tersebut adalah...',
        options: ['4 N', '8 N', '10 N', '12 N', '20 N'],
        answer: 1
      },
      {
        id: 'pf-6',
        text: 'Gaya tarik gravitasi antara dua benda bermassa m1 dan m2 berbanding terbalik dengan...',
        options: [
          'Jarak kedua benda',
          'Kuadrat jarak kedua benda',
          'Hasil kali kedua massa',
          'Konstanta gravitasi',
          'Massa benda pertama'
        ],
        answer: 1
      },
      {
        id: 'pf-7',
        text: 'Dua buah benda dihubungkan dengan tali ringan melewati katrol licin. Jika m1 = 3 kg dan m2 = 2 kg, serta g = 10 m/s², maka percepatan sistem katrol adalah...',
        options: ['1 m/s²', '2 m/s²', '3 m/s²', '4 m/s²', '5 m/s²'],
        answer: 1
      },
      {
        id: 'pf-8',
        text: 'Seseorang yang berdiri di dalam lift yang sedang bergerak turun dengan percepatan a akan merasakan berat badannya...',
        options: ['Bertambah besar', 'Berkurang (lebih ringan)', 'Tetap', 'Menjadi nol', 'Berubah-ubah secara acak'],
        answer: 1
      },
      {
        id: 'pf-9',
        text: 'Gaya normal yang bekerja pada sebuah balok di atas bidang miring dengan sudut kemiringan θ bernilai...',
        options: ['N = m · g', 'N = m · g · sin θ', 'N = m · g · cos θ', 'N = m · g · tan θ', 'N = m · g / cos θ'],
        answer: 2
      },
      {
        id: 'pf-10',
        text: 'Sebuah mobil bermassa 1000 kg bergerak dari keadaan diam hingga mencapai kecepatan 20 m/s dalam waktu 10 detik. Gaya total yang bekerja pada mobil tersebut adalah...',
        options: ['1000 N', '2000 N', '4000 N', '5000 N', '10000 N'],
        answer: 1
      }
    ]
  },
  {
    id: 'pkg-mtk-1',
    title: 'Paket Soal Matematika XI - Logika & Aljabar Matriks',
    subject: 'Matematika',
    targetClass: 'XI IPA',
    description: 'Materi logika matematika, operasi matriks, determinan, dan invers matriks 2x2.',
    createdAt: '2026-08-03T10:00:00.000Z',
    questions: [
      {
        id: 'pm-1',
        text: 'Negasi dari pernyataan "Semua siswa lulus ujian" adalah...',
        options: [
          'Semua siswa tidak lulus ujian',
          'Ada siswa yang tidak lulus ujian',
          'Tidak ada siswa yang lulus ujian',
          'Beberapa siswa lulus ujian',
          'Semua siswa pintar'
        ],
        answer: 1
      },
      {
        id: 'pm-2',
        text: 'Jika p bernilai Benar dan q bernilai Salah, maka pernyataan implikasi (p → q) bernilai...',
        options: ['Benar', 'Salah', 'Ragu-ragu', 'Sama dengan p', 'Sama dengan q'],
        answer: 1
      },
      {
        id: 'pm-3',
        text: 'Konposisi dari implikasi "Jika p maka q" (p → q) yang setara (ekuivalen) secara logika adalah kontraposisinya, yaitu...',
        options: ['q → p', '~p → ~q', '~q → ~p', 'p ∧ q', 'p ∨ q'],
        answer: 2
      },
      {
        id: 'pm-4',
        text: 'Determinan dari matriks A = [[3, 2], [1, 4]] adalah...',
        options: ['10', '11', '12', '14', '15'],
        answer: 0
      },
      {
        id: 'pm-5',
        text: 'Jika matriks B = [[2, 1], [5, 3]], maka invers dari matriks B (B⁻¹) adalah...',
        options: [
          '[[3, -1], [-5, 2]]',
          '[[-3, 1], [5, -2]]',
          '[[2, -1], [-5, 3]]',
          '[[3, 1], [5, 2]]',
          '[[-2, -1], [-5, -3]]'
        ],
        answer: 0
      }
    ]
  },
  {
    id: 'pkg-fisika-lab-peranan-x',
    title: 'Paket Soal Fisika X - Keselamatan Kerja Laboratorium & Peranan Fisika',
    subject: 'Fisika',
    targetClass: 'X MIPA',
    description: '20 Soal AKM & Kontekstual (C1–C6): Keselamatan Kerja di Laboratorium dan Peranan Fisika dalam Kehidupan Sehari-hari.',
    createdAt: '2026-08-19T08:00:00.000Z',
    questions: [
      {
        id: 'pfl-1',
        text: 'Pada kegiatan praktikum, siswa menggunakan berbagai alat dan bahan. Guru mengingatkan siswa untuk selalu menggunakan alat pelindung diri (APD). Salah satu APD yang umum digunakan ketika melakukan praktikum di laboratorium adalah kacamata keselamatan.\n\nFungsi utama kacamata keselamatan ketika melakukan praktikum adalah ....',
        options: [
          'memperjelas penglihatan ketika membaca skala alat',
          'melindungi mata dari percikan bahan atau benda yang dapat membahayakan',
          'meningkatkan ketelitian pengukuran',
          'mengurangi intensitas cahaya ruangan',
          'mempercepat proses pengamatan'
        ],
        answer: 1
      },
      {
        id: 'pfl-2',
        text: 'Perhatikan beberapa tindakan berikut ketika berada di laboratorium:\n1. Membaca petunjuk praktikum sebelum bekerja.\n2. Berlari di dalam laboratorium.\n3. Menggunakan alat sesuai fungsinya.\n4. Makan dan minum ketika praktikum berlangsung.\n5. Menggunakan alat pelindung diri.\n\nTindakan yang sesuai dengan prinsip keselamatan kerja di laboratorium ditunjukkan oleh nomor ....',
        options: [
          '1, 2, dan 3',
          '1, 3, dan 5',
          '2, 3, dan 4',
          '2, 4, dan 5',
          '1, 2, dan 5'
        ],
        answer: 1
      },
      {
        id: 'pfl-3',
        text: 'Saat praktikum, seorang siswa melihat kabel listrik pada salah satu alat dalam kondisi terkelupas. Temannya mengatakan bahwa alat tersebut masih dapat digunakan karena alat masih menyala ketika dihubungkan dengan sumber listrik.\n\nMengapa alat tersebut sebaiknya tidak digunakan?',
        options: [
          'alat akan menghasilkan pengukuran yang selalu terlalu besar',
          'kabel terkelupas dapat meningkatkan risiko sengatan listrik atau hubungan pendek',
          'alat tersebut pasti mengalami kerusakan permanen',
          'listrik tidak dapat mengalir melalui kabel yang terkelupas',
          'alat akan menggunakan energi listrik lebih sedikit'
        ],
        answer: 1
      },
      {
        id: 'pfl-4',
        text: 'Pada sebuah praktikum, siswa diminta memanaskan suatu benda menggunakan pembakar. Guru mengingatkan siswa agar tidak mengarahkan bagian alat yang panas kepada teman dan menggunakan penjepit ketika mengambil benda yang baru dipanaskan.\n\nTujuan penggunaan penjepit dalam situasi tersebut adalah ....',
        options: [
          'mempercepat pendinginan benda',
          'mengurangi massa benda',
          'mencegah tangan bersentuhan langsung dengan benda panas',
          'meningkatkan suhu benda',
          'meningkatkan ketelitian pengukuran suhu'
        ],
        answer: 2
      },
      {
        id: 'pfl-5',
        text: 'Dalam sebuah praktikum pengukuran, kelompok A menggunakan alat ukur listrik. Sebelum menghubungkan alat ke sumber listrik, mereka melakukan pemeriksaan berikut:\n• Kabel tidak terkelupas.\n• Sakelar dalam kondisi mati.\n• Rentang pengukuran dipilih sesuai petunjuk.\n• Terminal alat terpasang dengan benar.\n\nTindakan kelompok A menunjukkan penerapan prinsip keselamatan berupa ....',
        options: [
          'menggunakan alat tanpa memahami cara kerjanya',
          'melakukan pemeriksaan alat sebelum digunakan',
          'meningkatkan tegangan agar hasil lebih cepat diperoleh',
          'mengabaikan kondisi alat selama alat masih dapat menyala',
          'menggunakan rentang pengukuran secara sembarangan'
        ],
        answer: 1
      },
      {
        id: 'pfl-6',
        text: 'Seorang siswa secara tidak sengaja menjatuhkan larutan ke meja laboratorium. Ia tidak mengetahui apakah larutan tersebut berbahaya atau tidak. Temannya menyarankan agar larutan langsung dibersihkan menggunakan tangan dengan tisu.\n\nTindakan yang paling tepat dilakukan siswa adalah ....',
        options: [
          'langsung menyentuh larutan untuk mengetahui sifatnya',
          'membiarkan larutan sampai mengering',
          'segera melapor kepada guru/laboran dan mengikuti prosedur penanganan tumpahan',
          'meniup larutan agar cepat menguap',
          'menyiram larutan dengan air sebanyak mungkin tanpa mengetahui jenisnya'
        ],
        answer: 2
      },
      {
        id: 'pfl-7',
        text: 'Perhatikan situasi praktikum berikut:\n\n"Kelompok A melakukan praktikum di atas meja yang penuh dengan buku dan tas. Kabel alat ukur melintang di lantai. Salah satu siswa menggunakan sandal, sedangkan siswa lain sedang membawa minuman. Ketika praktikum berlangsung, salah satu kabel hampir tersenggol."\n\nAnalisis yang paling tepat terhadap situasi tersebut adalah ....',
        options: [
          'hanya penggunaan sandal yang menjadi masalah',
          'hanya kabel yang melintang yang menjadi masalah',
          'kondisi tersebut memiliki beberapa potensi bahaya sehingga perlu diperbaiki sebelum praktikum dilanjutkan',
          'praktikum tetap aman selama guru berada di dalam ruangan',
          'minuman tidak menjadi masalah selama diletakkan di atas meja'
        ],
        answer: 2
      },
      {
        id: 'pfl-8',
        text: 'Dalam praktikum, seorang siswa mengukur panjang sebuah benda menggunakan mistar. Ia meletakkan mata jauh di atas skala sehingga posisi mata tidak sejajar dengan ujung benda.\n\nHasil pengukuran siswa tersebut berbeda dengan hasil pengukuran kelompok lain.\n\nSelain faktor ketelitian membaca skala, kondisi tersebut dapat menyebabkan ....',
        options: [
          'kesalahan paralaks',
          'peningkatan massa benda',
          'perubahan suhu benda secara otomatis',
          'perubahan satuan pengukuran',
          'alat ukur menjadi lebih panjang'
        ],
        answer: 0
      },
      {
        id: 'pfl-9',
        text: 'Guru memberikan empat usulan prosedur sebelum praktikum listrik dimulai:\n\n| Usulan | Prosedur |\n|---|---|\n| P | Menghubungkan semua alat ke sumber listrik kemudian memeriksa kabel |\n| Q | Memeriksa kabel dan alat sebelum dihubungkan ke sumber listrik |\n| R | Menggunakan alat meskipun terdapat bagian kabel yang rusak |\n| S | Memilih batas ukur secara sembarang agar dapat mencoba semua skala |\n\nProsedur yang paling tepat berdasarkan prinsip keselamatan kerja adalah ....',
        options: [
          'P',
          'Q',
          'R',
          'S',
          'P dan S'
        ],
        answer: 1
      },
      {
        id: 'pfl-10',
        text: 'Sebuah sekolah ingin meningkatkan budaya keselamatan di laboratorium fisika. Selama ini sebagian siswa masih lupa menggunakan APD, tidak mengembalikan alat pada tempatnya, dan kurang memperhatikan kondisi kabel listrik.\n\nProgram yang paling komprehensif untuk mengatasi permasalahan tersebut adalah ....',
        options: [
          'memberikan hukuman kepada siswa setiap kali melakukan kesalahan',
          'memasang satu poster keselamatan di depan laboratorium',
          'membuat prosedur keselamatan, memberikan pengarahan sebelum praktikum, menyediakan APD, melakukan pemeriksaan alat, dan melakukan evaluasi setelah praktikum',
          'meminta siswa belajar sendiri mengenai keselamatan laboratorium',
          'membatasi semua kegiatan praktikum agar tidak terjadi kecelakaan'
        ],
        answer: 2
      },
      {
        id: 'pfl-11',
        text: 'Ketika seseorang menggunakan kacamata, cahaya dari benda di sekitar mata mengalami pembiasan sebelum mencapai retina.\n\nPrinsip fisika yang dimanfaatkan dalam pembuatan lensa kacamata adalah ....',
        options: [
          'pemantulan cahaya',
          'pembiasan cahaya',
          'efek Doppler',
          'induksi elektromagnetik',
          'gaya gravitasi'
        ],
        answer: 1
      },
      {
        id: 'pfl-12',
        text: 'Sebuah sepeda dapat bergerak ketika pengendara mengayuh pedal. Gerakan kaki diteruskan melalui pedal, rantai, roda gigi, dan akhirnya menyebabkan roda berputar.\n\nKonsep fisika yang paling berkaitan dengan proses tersebut adalah ....',
        options: [
          'gaya dan gerak',
          'perubahan wujud zat',
          'tekanan hidrostatis',
          'kalor laten',
          'gelombang elektromagnetik'
        ],
        answer: 0
      },
      {
        id: 'pfl-13',
        text: 'Pada siang hari yang panas, seseorang lebih nyaman menggunakan pakaian berwarna terang dibandingkan pakaian berwarna gelap. Salah satu alasan yang berkaitan dengan fisika adalah warna gelap cenderung menyerap radiasi lebih banyak dibandingkan warna terang.\n\nFenomena tersebut menunjukkan penerapan konsep ....',
        options: [
          'kalor dan radiasi',
          'gaya gravitasi',
          'tekanan fluida',
          'momentum',
          'listrik statis'
        ],
        answer: 0
      },
      {
        id: 'pfl-14',
        text: 'Di rumah, sebuah kipas angin digunakan untuk membantu memberikan rasa sejuk. Ketika kipas berputar, udara di sekitar tubuh bergerak lebih cepat.\n\nPenjelasan fisika yang paling tepat adalah ....',
        options: [
          'kipas menurunkan suhu ruangan secara langsung dalam semua kondisi',
          'gerakan udara membantu mempercepat penguapan keringat sehingga tubuh kehilangan kalor lebih cepat',
          'kipas menghilangkan seluruh kalor dari tubuh',
          'kipas mengubah kalor menjadi massa',
          'kipas menghentikan perpindahan kalor dari lingkungan ke tubuh'
        ],
        answer: 1
      },
      {
        id: 'pfl-15',
        text: 'Sebuah rumah menggunakan lampu LED sebagai pengganti lampu pijar. Lampu LED menghasilkan pencahayaan yang cukup dengan konsumsi daya listrik yang lebih kecil.\n\nKeuntungan penggunaan lampu LED berdasarkan konsep fisika adalah ....',
        options: [
          'energi listrik tidak pernah berubah menjadi bentuk energi lain',
          'lampu LED menggunakan energi listrik secara lebih efisien untuk menghasilkan cahaya',
          'lampu LED tidak membutuhkan energi',
          'semua energi listrik LED berubah menjadi cahaya tanpa kehilangan energi',
          'lampu LED menghasilkan cahaya tanpa adanya proses fisika'
        ],
        answer: 1
      },
      {
        id: 'pfl-16',
        text: 'Perhatikan data penggunaan beberapa alat listrik berikut:\n\n| Alat | Daya | Lama penggunaan per hari |\n|---|---:|---:|\n| Lampu A | 10 W | 8 jam |\n| Lampu B | 40 W | 8 jam |\n| Kipas C | 50 W | 4 jam |\n| Televisi D | 100 W | 2 jam |\n\nSeseorang ingin mengurangi konsumsi energi listrik tanpa mengurangi waktu penggunaan lampu A dan lampu B.\n\nAlat yang paling tepat menjadi prioritas untuk dikurangi waktu penggunaannya adalah ....',
        options: [
          'Lampu A',
          'Lampu B',
          'Kipas C',
          'Televisi D',
          'semua alat memiliki konsumsi energi yang sama'
        ],
        answer: 1
      },
      {
        id: 'pfl-17',
        text: 'Sebuah kendaraan modern dilengkapi sistem pengereman yang memungkinkan kendaraan berhenti ketika pengemudi menekan pedal rem. Ketika rem bekerja, energi gerak kendaraan berkurang dan sebagian besar berubah menjadi energi termal pada sistem pengereman.\n\nKesimpulan yang paling tepat berdasarkan fenomena tersebut adalah ....',
        options: [
          'energi kendaraan hilang begitu saja',
          'energi gerak berubah menjadi energi lain, terutama energi termal',
          'energi termal berubah seluruhnya menjadi energi gerak',
          'massa kendaraan berubah menjadi nol',
          'gaya gesek tidak berperan dalam proses pengereman'
        ],
        answer: 1
      },
      {
        id: 'pfl-18',
        text: 'Sebuah keluarga ingin mengurangi penggunaan energi listrik di rumah. Mereka mempertimbangkan beberapa tindakan berikut:\n1. Mengganti lampu pijar dengan lampu LED.\n2. Membiarkan televisi menyala meskipun tidak ditonton.\n3. Mematikan lampu ketika ruangan tidak digunakan.\n4. Membuka pintu kulkas terlalu lama.\n5. Menggunakan peralatan listrik sesuai kebutuhan.\n\nTindakan yang paling efektif dan masuk akal untuk meningkatkan efisiensi penggunaan energi adalah ....',
        options: [
          '1, 3, dan 5',
          '1, 2, dan 4',
          '2, 3, dan 4',
          '2 dan 4 saja',
          'semua tindakan sama-sama meningkatkan konsumsi secara efisien'
        ],
        answer: 0
      },
      {
        id: 'pfl-19',
        text: 'Sebuah kota mengalami kemacetan yang cukup parah. Pemerintah mempertimbangkan beberapa solusi:\n• memperbanyak penggunaan kendaraan pribadi\n• meningkatkan transportasi umum\n• membuat jalur sepeda\n• menggunakan sistem lampu lalu lintas yang lebih teratur\n• mendorong masyarakat berjalan kaki untuk jarak yang memungkinkan\n\nSemua kebijakan tersebut berkaitan dengan penerapan konsep fisika mengenai gerak, energi, gaya, dan efisiensi.\n\nKebijakan yang paling berpotensi meningkatkan efisiensi energi sekaligus mengurangi jumlah kendaraan di jalan adalah ....',
        options: [
          'memperbanyak kendaraan pribadi',
          'meningkatkan transportasi umum dan mendorong penggunaan moda transportasi alternatif',
          'memperpanjang waktu perjalanan kendaraan',
          'meningkatkan jumlah kendaraan bermotor di pusat kota',
          'mengurangi seluruh fasilitas pejalan kaki'
        ],
        answer: 1
      },
      {
        id: 'pfl-20',
        text: 'Sebuah sekolah ingin membuat program "Sekolah Hemat Energi". Hasil pengamatan menunjukkan bahwa banyak lampu tetap menyala ketika ruangan kosong, kipas angin tetap beroperasi saat tidak diperlukan, dan sebagian siswa belum memahami hubungan antara penggunaan alat listrik dengan konsumsi energi.\n\nSekolah meminta siswa kelas X merancang solusi berdasarkan konsep fisika.\n\nRancangan program yang paling lengkap dan berbasis konsep fisika adalah ....',
        options: [
          'melarang siswa menggunakan seluruh alat listrik di sekolah',
          'memasang poster hemat energi tanpa melakukan pengukuran',
          'melakukan audit penggunaan energi, mengukur daya dan waktu penggunaan alat, membuat aturan penggunaan, menggunakan perangkat yang lebih efisien, serta mengevaluasi perubahan konsumsi energi',
          'mengganti semua peralatan listrik tanpa mengetahui konsumsi energinya',
          'meminta siswa mengurangi penggunaan listrik tanpa memberikan data atau evaluasi'
        ],
        answer: 2
      }
    ]
  }
];

export const INITIAL_EXAM_PACKAGES: ExamPackage[] = [
  {
    id: 'exam-fisika-lab-x',
    title: 'PENILAIAN HARIAN FISIKA X - KESELAMATAN LAB & PERANAN FISIKA',
    questionPackageId: 'pkg-fisika-lab-peranan-x',
    targetClass: 'ALL',
    token: 'FISIKALAB',
    durationMinutes: 70,
    isActive: true,
    subjectName: 'Fisika',
    createdAt: '2026-08-19T08:00:00.000Z'
  },
  {
    id: 'exam-1',
    title: 'ANBK SIMULASI 1 - TES INTELEGENSI UMUM (TIU)',
    questionPackageId: 'pkg-tiu-1',
    targetClass: 'ALL',
    token: 'TIU2026',
    durationMinutes: 70,
    isActive: true,
    subjectName: 'Tes Intelegensi Umum (TIU)',
    createdAt: '2026-08-05T08:00:00.000Z'
  },
  {
    id: 'exam-2',
    title: 'PTS FISIKA KELAS X IPA 1 & 2',
    questionPackageId: 'pkg-fisika-1',
    targetClass: 'X MIPA 1',
    token: 'FISIKA2026',
    durationMinutes: 60,
    isActive: false,
    subjectName: 'Fisika',
    createdAt: '2026-08-05T09:00:00.000Z'
  },
  {
    id: 'exam-3',
    title: 'ULANGAN HARIAN MATEMATIKA XI IPA',
    questionPackageId: 'pkg-mtk-1',
    targetClass: 'XI IPA 1',
    token: 'MTK2026',
    durationMinutes: 90,
    isActive: false,
    subjectName: 'Matematika',
    createdAt: '2026-08-05T10:00:00.000Z'
  }
];
