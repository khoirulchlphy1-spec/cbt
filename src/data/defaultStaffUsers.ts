import { StaffUser } from '../types';

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'usr-admin-1',
    name: 'Khoirul (Administrator Utama)',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    createdAt: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'usr-guru-1',
    name: 'Drs. Budi Santoso, M.Pd (Guru Fisika)',
    username: 'gurufisika',
    password: 'guru123',
    role: 'guru',
    subject: 'Fisika',
    createdAt: '2026-08-01T08:30:00.000Z'
  },
  {
    id: 'usr-guru-2',
    name: 'Ibu Ratna Dewi, M.Pd (Guru Matematika)',
    username: 'gurumatematika',
    password: 'guru123',
    role: 'guru',
    subject: 'Matematika',
    createdAt: '2026-08-01T09:00:00.000Z'
  },
  {
    id: 'usr-guru-3',
    name: 'Ahmad Fauzi, S.Pd (Guru Biologi)',
    username: 'gurubiologi',
    password: 'guru123',
    role: 'guru',
    subject: 'Biologi',
    createdAt: '2026-08-01T09:15:00.000Z'
  },
  {
    id: 'usr-pengawas-1',
    name: 'Pengawas Ruang 01 (Lab Komputer 1)',
    username: 'pengawas1',
    password: 'pengawas123',
    role: 'pengawas',
    createdAt: '2026-08-01T09:30:00.000Z'
  },
  {
    id: 'usr-pengawas-2',
    name: 'Pengawas Ruang 02 (Lab Komputer 2)',
    username: 'pengawas2',
    password: 'pengawas123',
    role: 'pengawas',
    createdAt: '2026-08-01T09:45:00.000Z'
  }
];
