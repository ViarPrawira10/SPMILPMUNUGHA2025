
export enum UserRole {
  ADMIN = 'ADMIN',
  AUDITEE = 'AUDITEE',
  AUDITOR = 'AUDITOR'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  prodi?: string; // Untuk Auditee
  assignedProdi?: string[]; // Untuk Auditor (Daftar prodi yang diawasi)
}

export interface Indicator {
  id: string;
  standardId: string;
  name: string;
  baseline: string;
  target: string; // Default target
  targetYear: string; // Default target year
  subject: string;
  // Menyimpan target spesifik per siklus (Contoh: { "2025": { target: "96%", targetYear: "2025" } })
  cycleTargets?: Record<string, { target: string, targetYear: string }>; 
}

export interface Standard {
  id: string;
  code: string;
  title: string;
  indicators: Indicator[];
}

export enum AuditStatus {
  NOT_FILLED = 'NOT_FILLED',
  PENDING = 'PENDING',
  ACHIEVED = 'ACHIEVED',
  NOT_ACHIEVED = 'NOT_ACHIEVED'
}

export interface AuditEntry {
  prodi: string;
  indicatorId: string;
  cycle: string; // Tahun Siklus (e.g., "2025")
  achievementValue: string;
  auditDate: string; // Tanggal Pelaksanaan Audit (YYYY-MM-DD)
  docLink: string;
  status: AuditStatus;
  notes?: string;
  lastUpdated: string;
}

export interface CorrectiveAction {
  id: string;
  prodi: string;
  indicatorId: string;
  cycle: string; // Tahun Siklus saat temuan dibuat
  category: 'MAJOR' | 'MINOR' | 'NONE';
  rootCause: string;
  prevention: string;
  docVerification: 'SUITABLE' | 'NOT_SUITABLE' | 'PENDING';
  plan: string;
  realization: string;
  correctionDocLink: string;
  targetYear: string;
  createdAt: string;
}

export interface AuditSchedule {
  fillingStart: string;
  fillingEnd: string;
  deskEvalStart: string;
  deskEvalEnd: string;
  visitStart: string;
  visitEnd: string;
  rtmStart: string;
  rtmEnd: string;
}

export interface AuditPlan {
  id: string;
  prodi: string;
  cycle: string;
  auditorIds: string[];
  schedule: AuditSchedule;
  isActive: boolean;
}

// Tipe data baru untuk Dokumen PPEPP
export interface SPMIDocument {
  id: string;
  category: 'Kebijakan' | 'Manual' | 'Standar' | 'Formulir' | 'SK' | 'Pengendalian' | 'Peningkatan';
  name: string;
  url: string;
  lastUpdated: string;
}
