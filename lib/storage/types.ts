import {
  User,
  MandalSettings,
  Donor,
  Payment,
  Pavti,
  Announcement,
  AuditLog,
  AppMode,
  CollectionSummary,
  UserRole,
} from '@/types';

export interface DatabaseBackup {
  version: string;
  exportedAt: string;
  settings: MandalSettings;
  users: User[];
  announcements: Announcement[];
  liveData: {
    donors: Donor[];
    payments: Payment[];
    pavtis: Pavti[];
    auditLogs: AuditLog[];
  };
  testData: {
    donors: Donor[];
    payments: Payment[];
    pavtis: Pavti[];
    auditLogs: AuditLog[];
  };
}

export interface IStorageProvider {
  name: string;

  // Initialize storage (folders, seed data if empty)
  init(): Promise<void>;

  // Settings
  getSettings(): Promise<MandalSettings>;
  saveSettings(settings: MandalSettings): Promise<MandalSettings>;

  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  saveUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<boolean>;

  // Donors
  getDonors(mode: AppMode): Promise<Donor[]>;
  getDonorById(id: string, mode: AppMode): Promise<Donor | null>;
  getDonorByMobile(mobile: string, mode: AppMode): Promise<Donor | null>;
  saveDonor(donor: Donor, mode: AppMode): Promise<Donor>;
  deleteOrArchiveDonor(donorId: string, mode: AppMode): Promise<{ success: boolean; action: 'DELETED' | 'ARCHIVED' }>;
  searchDonors(query: string, mode: AppMode): Promise<Donor[]>;

  // Payments
  getPayments(mode: AppMode): Promise<Payment[]>;
  getPaymentById(id: string, mode: AppMode): Promise<Payment | null>;
  getPaymentsByDonorId(donorId: string, mode: AppMode): Promise<Payment[]>;
  getPendingPayments(mode: AppMode): Promise<Payment[]>;
  savePayment(payment: Payment, mode: AppMode): Promise<Payment>;
  updatePendingPayment(
    paymentId: string,
    data: {
      donorName?: string;
      donorMobile?: string;
      donorAddress?: string;
      expectedAmount?: number;
      notes?: string;
      date?: string;
    },
    mode: AppMode
  ): Promise<Payment>;
  cancelPendingPayment(paymentId: string, mode: AppMode): Promise<Payment>;
  getNextReceiptNumber(mode: AppMode): Promise<{ formatted: string; numeric: number }>;
  markPaymentAsPaid(
    paymentId: string,
    paymentDetails: {
      receivedAmount: number;
      paymentMethod: 'CASH' | 'UPI';
      transactionReference?: string;
      notes?: string;
      paymentDate?: string;
      hostId: string;
      hostName: string;
    },
    mode: AppMode
  ): Promise<{ payment: Payment; pavti: Pavti }>;

  // Pavtis
  getPavtis(mode: AppMode): Promise<Pavti[]>;
  getPavtiById(id: string, mode: AppMode): Promise<Pavti | null>;
  getPavtiByReceiptNumber(receiptNumber: string, mode: AppMode): Promise<Pavti | null>;
  getPavtiByPaymentId(paymentId: string, mode: AppMode): Promise<Pavti | null>;
  savePavti(pavti: Pavti, mode: AppMode): Promise<Pavti>;

  // Announcements
  getAnnouncements(onlyActive?: boolean): Promise<Announcement[]>;
  getAnnouncementById(id: string): Promise<Announcement | null>;
  saveAnnouncement(announcement: Announcement): Promise<Announcement>;
  deleteAnnouncement(id: string): Promise<boolean>;

  // Audit Logs
  getAuditLogs(mode?: AppMode, limit?: number): Promise<AuditLog[]>;
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog>;

  // Analytics
  getCollectionSummary(mode: AppMode): Promise<CollectionSummary>;

  // Data Reset & Test Operations
  clearTestData(): Promise<{ deletedPayments: number; deletedDonors: number; deletedPavtis: number }>;
  resetAllData(confirmation: string, mode: AppMode, user: { userId: string; userName: string; userRole: UserRole }): Promise<boolean>;

  // Backup & Restore
  exportBackup(): Promise<DatabaseBackup>;
  importBackup(backupData: DatabaseBackup): Promise<boolean>;
}
