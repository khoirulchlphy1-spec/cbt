/**
 * Utility to download student upload template CSV
 */
export function downloadStudentTemplate() {
  const headers = ['Nama Lengkap', 'Kelas', 'Username', 'Password'];
  const sampleRows = [
    ['Ahmad Rizky Pratama', 'X MIPA 1', 'siswa101', '123'],
    ['Siti Nurhaliza', 'X MIPA 1', 'siswa102', '123'],
    ['Budi Santoso', 'XI MIPA 1', 'siswa201', '123'],
    ['Dewi Anggraini', 'XI IPS 1', 'siswa202', '123'],
    ['Fajar Prasetyo', 'XII MIPA 1', 'siswa301', '123'],
    ['Putri Rahmadani', 'XII IPS 2', 'siswa302', '123']
  ];

  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  csvContent += headers.join(',') + '\n';
  sampleRows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'Template_Data_Siswa_CBT_SMAN1Toili.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
