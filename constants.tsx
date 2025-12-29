
import { Standard } from './types';

export const PRODI_LIST = [
  'BK', 'PGSD', 'PIAUD', 'MPI', 'Matematika', 'Informatika', 
  'Sistem Informasi', 'Teknik Kimia', 'Teknik Mesin', 'Teknik Industri', 
  'Manajemen', 'Ekonomi Pembangunan', 'PAI', 'PGMI', 'HKI', 'KPI', 'S2 PAI'
];

export const STANDARDS: Standard[] = [
  {
    id: 'S1',
    code: 'STA/SPMI-01',
    title: 'Standar Kemahasiswaan dan Alumni',
    indicators: [
      /* Renamed target2029 to target and added targetYear to match Indicator interface */
      { id: 'I1-1', standardId: 'S1', name: 'Persentase mahasiswa penerima beasiswa', baseline: '75%', target: '95%', targetYear: '2029', subject: 'Wakil Rektor III' },
      { id: 'I1-2', standardId: 'S1', name: 'Tingkat kepuasan mahasiswa terhadap layanan BK', baseline: '4.0', target: '4.7', targetYear: '2029', subject: 'Unit BK' },
      { id: 'I1-3', standardId: 'S1', name: 'Rata-rata Masa Tunggu Kerja Lulusan', baseline: '7 Bulan', target: '< 3 Bulan', targetYear: '2029', subject: 'CDC' }
    ]
  },
  {
    id: 'S2',
    code: 'STA/SPMI-02',
    title: 'Standar Kerjasama',
    indicators: [
      /* Renamed target2029 to target and added targetYear to match Indicator interface */
      { id: 'I2-1', standardId: 'S2', name: 'Jumlah kerjasama aktif (MoU/MoA/PKS)', baseline: '10', target: '30', targetYear: '2029', subject: 'Lembaga Kerjasama' },
      { id: 'I2-2', standardId: 'S2', name: 'Persentase prodi terlibat kerjasama akademik', baseline: '30%', target: '100%', targetYear: '2029', subject: 'Ketua Prodi' }
    ]
  },
  {
    id: 'S3',
    code: 'STA/SPMI-03',
    title: 'Standar Tata Pamong',
    indicators: [
      /* Renamed target2029 to target and added targetYear to match Indicator interface */
      { id: 'I3-1', standardId: 'S3', name: 'Indeks Kepuasan Pemangku Kepentingan', baseline: '4.0', target: '4.8', targetYear: '2029', subject: 'Rektor' },
      { id: 'I3-2', standardId: 'S3', name: 'Persentase Realisasi Program Kerja Strategis', baseline: '80%', target: '100%', targetYear: '2029', subject: 'Rektor' }
    ]
  },
  {
    id: 'S4',
    code: 'STA/SPMI-04',
    title: 'Standar Visi Misi',
    indicators: [
      /* Renamed target2029 to target and added targetYear to match Indicator interface */
      { id: 'I4-1', standardId: 'S4', name: 'Tingkat keselarasan visi, misi, tujuan & strategi', baseline: '80%', target: '100%', targetYear: '2029', subject: 'Dekan/Kaprodi' }
    ]
  },
  {
    id: 'S5',
    code: 'STA/SPMI-05',
    title: 'Standar Kompetensi Lulusan',
    indicators: [
      /* Renamed target2029 to target and added targetYear to match Indicator interface */
      { id: 'I5-1', standardId: 'S5', name: 'Tingkat Keterserapan Kerja (Employment Rate)', baseline: '70%', target: '>= 90%', targetYear: '2029', subject: 'Unit Tracer Study' },
      { id: 'I5-2', standardId: 'S5', name: 'Sertifikasi Profesi/Industri Lulusan', baseline: '20%', target: '>= 80%', targetYear: '2029', subject: 'Prodi' }
    ]
  },
  {
    id: 'S6',
    code: 'STA/SPMI-06',
    title: 'Standar Proses Pembelajaran',
    indicators: [
      /* Renamed target2029 to target and added targetYear to match Indicator interface */
      { id: 'I6-1', standardId: 'S6', name: 'RPS Berbasis CPL terintegrasi LMS', baseline: '70%', target: '100%', targetYear: '2029', subject: 'Dosen/Kaprodi' },
      { id: 'I6-2', standardId: 'S6', name: 'Pembelajaran Adaptif (Blended Learning)', baseline: '40%', target: '100%', targetYear: '2029', subject: 'Dosen' }
    ]
  },
  {
    id: 'S7',
    code: 'STA/SPMI-07',
    title: 'Standar Penilaian Pembelajaran',
    indicators: [
      /* Renamed target2029 to target and added targetYear to match Indicator interface */
      { id: 'I7-1', standardId: 'S7', name: 'Asesmen Autentik (Portofolio/Proyek)', baseline: '40%', target: '100%', targetYear: '2029', subject: 'Dosen' }
    ]
  },
  {
    id: 'S8',
    code: 'STA/SPMI-08',
    title: 'Standar Pengelolaan Pendidikan',
    indicators: [
      /* Renamed target2029 to target and added targetYear to match Indicator interface */
      { id: 'I8-1', standardId: 'S8', name: 'Implementasi Renop Tahunan Berbasis IKU', baseline: '80%', target: '100%', targetYear: '2029', subject: 'Rektor' }
    ]
  }
];
