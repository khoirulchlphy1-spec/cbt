import { Question } from '../types';

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    text: "GELANGGANG = ...",
    options: [
      "Stadion",
      "Arena",
      "Panggung",
      "Lapangan",
      "Ruangan"
    ],
    answer: 1
  },
  {
    id: 'q-2',
    text: "PEDAGOGI = ...",
    options: [
      "Ilmu jiwa",
      "Ilmu pendidikan",
      "Ilmu komunikasi",
      "Ilmu sosial",
      "Ilmu mengajar anak"
    ],
    answer: 1
  },
  {
    id: 'q-3',
    text: "EPILOG < > ...",
    options: [
      "Prolog",
      "Monolog",
      "Dialog",
      "Analog",
      "Katalog"
    ],
    answer: 0
  },
  {
    id: 'q-4',
    text: "KONKAF < > ...",
    options: [
      "Konveks",
      "Rata",
      "Cekung",
      "Bulat",
      "Panjang"
    ],
    answer: 0
  },
  {
    id: 'q-5',
    text: "HUTAN : POHON = TEMBOK : ...",
    options: [
      "Semen",
      "Batu bata",
      "Pasir",
      "Cat",
      "Rumah"
    ],
    answer: 1
  },
  {
    id: 'q-6',
    text: "HAKIM : VONIS = DOKTER : ...",
    options: [
      "Obat",
      "Pasien",
      "Resep",
      "Suntik",
      "Rumah sakit"
    ],
    answer: 2
  },
  {
    id: 'q-7',
    text: "Semua peserta ujian CPNS membawa kartu ujian.\nSebagian peserta ujian CPNS membawa pensil 2B.\n\nKesimpulan yang tepat adalah...",
    options: [
      "Semua peserta ujian CPNS membawa pensil 2B",
      "Sebagian peserta ujian CPNS yang membawa kartu ujian juga membawa pensil 2B",
      "Semua yang membawa pensil 2B tidak membawa kartu ujian",
      "Sebagian peserta ujian CPNS tidak membawa kartu ujian",
      "Peserta yang tidak membawa pensil 2B tidak boleh mengikuti ujian"
    ],
    answer: 1
  },
  {
    id: 'q-8',
    text: "Semua tanaman membutuhkan air.\nSemua pohon kelapa adalah tanaman.\n\nKesimpulan yang tepat adalah...",
    options: [
      "Sebagian pohon kelapa membutuhkan air",
      "Semua pohon kelapa membutuhkan air",
      "Tidak semua pohon kelapa membutuhkan air",
      "Pohon kelapa yang tidak membutuhkan air akan mati",
      "Tanaman yang membutuhkan air hanyalah pohon kelapa"
    ],
    answer: 1
  },
  {
    id: 'q-9',
    text: "Lima orang siswa (A, B, C, D, E) mengikuti tes. Nilai A lebih tinggi dari B, tetapi lebih rendah dari C. Nilai D lebih tinggi dari C, dan nilai E paling rendah di antara semuanya.\n\nUrutan siswa dari yang memperoleh nilai tertinggi ke terendah adalah...",
    options: [
      "D - C - A - B - E",
      "C - D - A - B - E",
      "D - A - C - B - E",
      "E - B - A - C - D",
      "D - C - B - A - E"
    ],
    answer: 0
  },
  {
    id: 'q-10',
    text: "Hasil dari (0,75 × 12) + (1/4 × 24) adalah...",
    options: [
      "12",
      "15",
      "18",
      "21",
      "24"
    ],
    answer: 1
  },
  {
    id: 'q-11',
    text: "Jika 35% dari suatu bilangan X adalah 140, maka nilai dari 60% dari bilangan X tersebut adalah...",
    options: [
      "200",
      "220",
      "240",
      "260",
      "280"
    ],
    answer: 2
  },
  {
    id: 'q-12',
    text: "3, 6, 11, 18, 27, 38, ...\n\nAngka selanjutnya pada deret di atas adalah...",
    options: [
      "49",
      "51",
      "53",
      "55",
      "57"
    ],
    answer: 1
  },
  {
    id: 'q-13',
    text: "2, 3, 5, 8, 13, 21, 34, ...\n\nAngka berikutnya dalam deret Fibonacci di atas adalah...",
    options: [
      "45",
      "48",
      "55",
      "58",
      "65"
    ],
    answer: 2
  },
  {
    id: 'q-14',
    text: "4, 18, 8, 15, 12, 12, 16, ...\n\nAngka yang tepat untuk mengisi titik-titik tersebut adalah...",
    options: [
      "8",
      "9",
      "10",
      "11",
      "20"
    ],
    answer: 1
  },
  {
    id: 'q-15',
    text: "Jika x = 2³ + 3² dan y = 4² + 1, maka hubungan antara x dan y yang tepat adalah...",
    options: [
      "x > y",
      "x < y",
      "x = y",
      "x = 2y",
      "Hubungan x dan y tidak dapat ditentukan"
    ],
    answer: 2
  },
  {
    id: 'q-16',
    text: "Jika x adalah harga 1 kg apel dari paket 3 kg apel seharga Rp75.000, dan y adalah harga 1 kg jeruk dari paket 5 kg jeruk seharga Rp100.000, maka...",
    options: [
      "x > y",
      "x < y",
      "x = y",
      "2x = y",
      "Hubungan x dan y tidak dapat ditentukan"
    ],
    answer: 0
  },
  {
    id: 'q-17',
    text: "Seorang pedagang membeli sepotong baju dengan harga Rp120.000. Baju tersebut kemudian dijual kembali dengan memperoleh keuntungan sebesar 20%. Harga jual baju tersebut adalah...",
    options: [
      "Rp132.000",
      "Rp140.000",
      "Rp144.000",
      "Rp150.000",
      "Rp160.000"
    ],
    answer: 2
  },
  {
    id: 'q-18',
    text: "Sebuah mobil berangkat dari Kota A menuju Kota B yang berjarak 180 km dengan kecepatan rata-rata 60 km/jam. Jika mobil tersebut berangkat pukul 08.00 WIB dan sempat beristirahat di jalan selama 30 menit, pukul berapakah mobil tersebut tiba di Kota B?",
    options: [
      "10.30 WIB",
      "11.00 WIB",
      "11.30 WIB",
      "12.00 WIB",
      "12.30 WIB"
    ],
    answer: 2
  },
  {
    id: 'q-19',
    text: "Pekerjaan membangun pagar dapat diselesaikan oleh Budi sendirian dalam waktu 6 hari, sedangkan oleh Candra sendirian dapat selesai dalam waktu 12 hari. Jika Budi dan Candra bekerja bersama-sama, pekerjaan tersebut dapat selesai dalam waktu...",
    options: [
      "2 hari",
      "3 hari",
      "4 hari",
      "5 hari",
      "6 hari"
    ],
    answer: 2
  },
  {
    id: 'q-20',
    text: "Rata-rata nilai ujian Matematika dari 15 siswa adalah 70. Jika nilai 5 siswa lain digabungkan, rata-rata nilainya menjadi 75. Berapakah nilai rata-rata dari 5 siswa yang baru bergabung tersebut?",
    options: [
      "80",
      "85",
      "90",
      "95",
      "100"
    ],
    answer: 2
  },
  {
    id: 'q-21',
    text: "Jika hari hujan, maka jalanan licin.\nJika jalanan licin, maka pengendara kendaraan melaju lambat.\n\nHari ini jalanan tidak licin.\nKesimpulan yang tepat berdasarkan premis di atas adalah...",
    options: [
      "Hari ini pasti hujan",
      "Hari ini tidak hujan",
      "Pengendara melaju sangat cepat",
      "Jalanan licin tetapi pengendara melaju cepat",
      "Tidak dapat ditarik kesimpulan tentang hari hujan"
    ],
    answer: 1
  },
  {
    id: 'q-22',
    text: "MATA : MENGELIP = JANTUNG : ...",
    options: [
      "Berdetak",
      "Darah",
      "Dada",
      "Bernapas",
      "Kencang"
    ],
    answer: 0
  },
  {
    id: 'q-23',
    text: "Di sebuah perpustakaan, lima buku (A, B, C, D, dan E) disusun berderet dari kiri ke kanan.\n- Buku C terletak tepat di tengah-tengah.\n- Buku A terletak di sebelah kanan buku C.\n- Buku B terletak tepat di antara buku D dan C.\n- Buku E berada di ujung paling kanan.\n\nBuku yang terletak di posisi paling kiri adalah...",
    options: [
      "Buku A",
      "Buku B",
      "Buku C",
      "Buku D",
      "Buku E"
    ],
    answer: 3
  },
  {
    id: 'q-24',
    text: "Sebuah toko memberikan diskon sebesar 20% untuk semua barang. Jika seorang pembeli membayar Rp160.000 setelah dipotong diskon, berapakah harga asli barang tersebut sebelum diskon?",
    options: [
      "Rp180.000",
      "Rp190.000",
      "Rp200.000",
      "Rp210.000",
      "Rp220.000"
    ],
    answer: 2
  },
  {
    id: 'q-25',
    text: "A, C, F, J, O, ...\n\nHuruf selanjutnya dalam urutan alfabet di atas adalah...",
    options: [
      "P",
      "Q",
      "R",
      "S",
      "U"
    ],
    answer: 4
  },
  {
    id: 'q-26',
    text: "AUTENTIK = ...",
    options: [
      "Kuno",
      "Asli",
      "Palsu",
      "Resmi",
      "Klasik"
    ],
    answer: 1
  },
  {
    id: 'q-27',
    text: "NOMADEN < > ...",
    options: [
      "Pindah",
      "Tetap",
      "Berkelana",
      "Subur",
      "Menetap"
    ],
    answer: 4
  },
  {
    id: 'q-28',
    text: "Jika 2a + 3b = 18 dan a - b = 4, maka nilai dari a + b adalah...",
    options: [
      "5",
      "6",
      "7",
      "8",
      "9"
    ],
    answer: 3
  },
  {
    id: 'q-29',
    text: "Sebuah taman berbentuk persegi panjang memiliki ukuran panjang 24 meter dan lebar 18 meter. Di sekeliling taman tersebut akan ditanami pohon dengan jarak antar pohon 3 meter. Banyaknya pohon yang dibutuhkan adalah...",
    options: [
      "24 pohon",
      "28 pohon",
      "32 pohon",
      "36 pohon",
      "40 pohon"
    ],
    answer: 1
  },
  {
    id: 'q-30',
    text: "Semua pegawai negeri sipil mengenakan seragam pada hari Senin.\nPak Ahmad adalah seorang pegawai negeri sipil.\n\nKesimpulan yang tepat adalah...",
    options: [
      "Pak Ahmad mengenakan seragam setiap hari",
      "Pak Ahmad mengenakan seragam pada hari Senin",
      "Pak Ahmad tidak mengenakan seragam selain hari Senin",
      "Semua orang yang mengenakan seragam pada hari Senin adalah Pak Ahmad",
      "Pak Ahmad hanya memakai seragam jika diminta"
    ],
    answer: 1
  }
];
