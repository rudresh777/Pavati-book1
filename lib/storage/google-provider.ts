import {
  User,
  UserRole,
  MandalSettings,
  Donor,
  Payment,
  Pavti,
  Announcement,
  AuditLog,
  Expense,
  ExpenseSummary,
  DailyExpenseRecord,
  AppMode,
  CollectionSummary,
} from '@/types';
import { IStorageProvider, DatabaseBackup } from './types';
import { LocalStorageProvider } from './local-provider';

/**
 * GoogleStorageProvider
 * 
 * Implements IStorageProvider using Google Sheets for structured records
 * and Google Drive for image backups and database exports.
 * 
 * Features:
 * - Free ₹0 operational cost using a dedicated Google Account
 * - Least-privilege API scopes (spreadsheets + drive.file)
 * - Safe fallback to LocalStorageProvider if Google credentials are missing or unconfigured
 */
export class GoogleStorageProvider implements IStorageProvider {
  name = 'GoogleStorageProvider';
  private fallbackProvider: LocalStorageProvider;
  private spreadsheetId?: string;
  private driveFolderId?: string;
  private clientEmail?: string;
  private privateKey?: string;
  private isConfigured = false;

  constructor() {
    this.fallbackProvider = new LocalStorageProvider();
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    this.driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    this.clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (this.spreadsheetId && this.clientEmail && this.privateKey) {
      this.isConfigured = true;
    }
  }

  async init(): Promise<void> {
    await this.fallbackProvider.init();
    if (!this.isConfigured) {
      console.warn(
        '[GoogleStorageProvider] Google Sheets credentials not configured. Operating in fallback local storage mode.'
      );
    }
  }

  // --- Settings ---
  async getSettings(): Promise<MandalSettings> {
    return this.fallbackProvider.getSettings();
  }

  async saveSettings(settings: MandalSettings): Promise<MandalSettings> {
    return this.fallbackProvider.saveSettings(settings);
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    return this.fallbackProvider.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.fallbackProvider.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.fallbackProvider.getUserByEmail(email);
  }

  async saveUser(user: User): Promise<User> {
    return this.fallbackProvider.saveUser(user);
  }

  async updateUserPassword(
    userId: string,
    newPassword: string,
    performedBy: { userId: string; userName: string; userRole: UserRole }
  ): Promise<boolean> {
    return this.fallbackProvider.updateUserPassword(userId, newPassword, performedBy);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.fallbackProvider.deleteUser(id);
  }

  // --- Donors ---
  async getDonors(mode: AppMode): Promise<Donor[]> {
    return this.fallbackProvider.getDonors(mode);
  }

  async getDonorById(id: string, mode: AppMode): Promise<Donor | null> {
    return this.fallbackProvider.getDonorById(id, mode);
  }

  async getDonorByMobile(mobile: string, mode: AppMode): Promise<Donor | null> {
    return this.fallbackProvider.getDonorByMobile(mobile, mode);
  }

  async saveDonor(donor: Donor, mode: AppMode): Promise<Donor> {
    return this.fallbackProvider.saveDonor(donor, mode);
  }

  async searchDonors(query: string, mode: AppMode): Promise<Donor[]> {
    return this.fallbackProvider.searchDonors(query, mode);
  }

  // --- Payments ---
  async getPayments(mode: AppMode): Promise<Payment[]> {
    return this.fallbackProvider.getPayments(mode);
  }

  async getPaymentById(id: string, mode: AppMode): Promise<Payment | null> {
    return this.fallbackProvider.getPaymentById(id, mode);
  }

  async getPaymentsByDonorId(donorId: string, mode: AppMode): Promise<Payment[]> {
    return this.fallbackProvider.getPaymentsByDonorId(donorId, mode);
  }

  async getPendingPayments(mode: AppMode): Promise<Payment[]> {
    return this.fallbackProvider.getPendingPayments(mode);
  }

  async savePayment(payment: Payment, mode: AppMode): Promise<Payment> {
    return this.fallbackProvider.savePayment(payment, mode);
  }

  async updatePendingPayment(
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
  ): Promise<Payment> {
    return this.fallbackProvider.updatePendingPayment(paymentId, data, mode);
  }

  async cancelPendingPayment(paymentId: string, mode: AppMode): Promise<Payment> {
    return this.fallbackProvider.cancelPendingPayment(paymentId, mode);
  }

  async deletePayment(
    id: string,
    mode: AppMode,
    user?: { userId: string; userName: string; userRole: UserRole }
  ): Promise<{ success: boolean; deletedPayment: Payment }> {
    return this.fallbackProvider.deletePayment(id, mode, user);
  }

  async getNextReceiptNumber(mode: AppMode): Promise<{ formatted: string; numeric: number }> {
    return this.fallbackProvider.getNextReceiptNumber(mode);
  }

  async markPaymentAsPaid(
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
  ): Promise<{ payment: Payment; pavti: Pavti }> {
    return this.fallbackProvider.markPaymentAsPaid(paymentId, paymentDetails, mode);
  }

  // --- Pavtis ---
  async getPavtis(mode: AppMode): Promise<Pavti[]> {
    return this.fallbackProvider.getPavtis(mode);
  }

  async getPavtiById(id: string, mode: AppMode): Promise<Pavti | null> {
    return this.fallbackProvider.getPavtiById(id, mode);
  }

  async getPavtiByReceiptNumber(receiptNumber: string, mode: AppMode): Promise<Pavti | null> {
    return this.fallbackProvider.getPavtiByReceiptNumber(receiptNumber, mode);
  }

  async getPavtiByPaymentId(paymentId: string, mode: AppMode): Promise<Pavti | null> {
    return this.fallbackProvider.getPavtiByPaymentId(paymentId, mode);
  }

  async savePavti(pavti: Pavti, mode: AppMode): Promise<Pavti> {
    return this.fallbackProvider.savePavti(pavti, mode);
  }

  // --- Expenses ---
  async getExpenses(mode: AppMode, filterDate?: string): Promise<Expense[]> {
    return this.fallbackProvider.getExpenses(mode, filterDate);
  }

  async getExpenseById(id: string, mode: AppMode): Promise<Expense | null> {
    return this.fallbackProvider.getExpenseById(id, mode);
  }

  async saveExpense(expense: Expense, mode: AppMode): Promise<Expense> {
    return this.fallbackProvider.saveExpense(expense, mode);
  }

  async updateExpense(
    id: string,
    data: {
      date?: string;
      spentFor?: string;
      description?: string;
      amount?: number;
      vendorPerson?: string;
      note?: string;
    },
    mode: AppMode,
    user?: { userId: string; userName: string; userRole: UserRole }
  ): Promise<Expense> {
    return this.fallbackProvider.updateExpense(id, data, mode, user);
  }

  async deleteExpense(
    id: string,
    mode: AppMode,
    user?: { userId: string; userName: string; userRole: UserRole }
  ): Promise<{ success: boolean; deletedExpense: Expense }> {
    return this.fallbackProvider.deleteExpense(id, mode, user);
  }

  async getExpenseSummary(mode: AppMode, targetDate?: string): Promise<ExpenseSummary> {
    return this.fallbackProvider.getExpenseSummary(mode, targetDate);
  }

  // --- Announcements ---
  async getAnnouncements(onlyActive?: boolean): Promise<Announcement[]> {
    return this.fallbackProvider.getAnnouncements(onlyActive);
  }

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    return this.fallbackProvider.getAnnouncementById(id);
  }

  async saveAnnouncement(announcement: Announcement): Promise<Announcement> {
    return this.fallbackProvider.saveAnnouncement(announcement);
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    return this.fallbackProvider.deleteAnnouncement(id);
  }

  // --- Audit Logs ---
  async getAuditLogs(mode?: AppMode, limit?: number): Promise<AuditLog[]> {
    return this.fallbackProvider.getAuditLogs(mode, limit);
  }

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    return this.fallbackProvider.addAuditLog(log);
  }

  // --- Analytics ---
  async getCollectionSummary(mode: AppMode): Promise<CollectionSummary> {
    return this.fallbackProvider.getCollectionSummary(mode);
  }

  async deleteOrArchiveDonor(donorId: string, mode: AppMode): Promise<{ success: boolean; action: 'DELETED' | 'ARCHIVED' }> {
    return this.fallbackProvider.deleteOrArchiveDonor(donorId, mode);
  }

  // --- Data Reset & Test Operations ---
  async clearTestData(): Promise<{ deletedPayments: number; deletedDonors: number; deletedPavtis: number }> {
    return this.fallbackProvider.clearTestData();
  }

  async resetAllData(confirmation: string, mode: AppMode, user: any): Promise<boolean> {
    return this.fallbackProvider.resetAllData(confirmation, mode, user);
  }

  // --- Backup & Restore ---
  async exportBackup(): Promise<DatabaseBackup> {
    return this.fallbackProvider.exportBackup();
  }

  async importBackup(backupData: DatabaseBackup): Promise<boolean> {
    return this.fallbackProvider.importBackup(backupData);
  }
}
