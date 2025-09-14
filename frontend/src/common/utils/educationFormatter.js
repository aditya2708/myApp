export const formatEducationDisplay = (anakPendidikan) => {
  if (!anakPendidikan) return 'Belum diisi';
  
  const { jenjang, kelas, semester, nama_sekolah, nama_pt } = anakPendidikan;
  
  if (!jenjang) return 'Belum diisi';
  
  if (jenjang === 'SD' || jenjang === 'SMP' || jenjang === 'SMA' || jenjang === 'SMK') {
    if (kelas) {
      return `Kelas ${kelas} ${jenjang}`;
    }
    return jenjang;
  }
  
  if (jenjang === 'D3' || jenjang === 'S1' || jenjang === 'S2' || jenjang === 'S3') {
    if (semester) {
      return `Semester ${semester} ${jenjang}`;
    }
    return jenjang;
  }
  
  return jenjang;
};

export const formatEducationDetail = (anakPendidikan) => {
  if (!anakPendidikan) return null;
  
  const { jenjang, kelas, semester, nama_sekolah, nama_pt, jurusan } = anakPendidikan;
  
  let detail = {
    jenjang: jenjang ? jenjang.toUpperCase() : '-',
    tingkat: '-',
    institusi: '-',
    jurusan: jurusan || '-'
  };
  
  const upperJenjang = jenjang ? jenjang.toUpperCase() : '';
  
  if (['SD', 'SMP', 'SMA', 'SMK'].includes(upperJenjang)) {
    detail.tingkat = kelas ? (kelas.includes('Kelas') ? kelas : `Kelas ${kelas}`) : '-';
    detail.institusi = nama_sekolah || '-';
  } else if (['D3', 'S1', 'S2', 'S3'].includes(upperJenjang)) {
    detail.tingkat = semester ? (semester.includes('Semester') ? semester : `Semester ${semester}`) : '-';
    detail.institusi = nama_pt || '-';
  }
  
  return detail;
};

export const getEducationIcon = (jenjang) => {
  if (!jenjang) return 'school-outline';
  
  switch (jenjang.toUpperCase()) {
    case 'SD':
      return 'library-outline';
    case 'SMP':
    case 'SMA':
    case 'SMK':
      return 'school-outline';
    case 'D3':
    case 'S1':
    case 'S2':
    case 'S3':
      return 'business-outline';
    default:
      return 'book-outline';
  }
};