import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
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
} from '@/types';
import { IStorageProvider, DatabaseBackup } from './types';
import { numberToWordsMarathi, numberToWordsEnglish } from '@/lib/utils/number-to-words';

interface DatabaseSchema {
  version: string;
  settings: MandalSettings;
  users: User[];
  announcements: Announcement[];
  liveData: {
    receiptCounter: number;
    donors: Donor[];
    payments: Payment[];
    pavtis: Pavti[];
    auditLogs: AuditLog[];
  };
  testData: {
    receiptCounter: number;
    donors: Donor[];
    payments: Payment[];
    pavtis: Pavti[];
    auditLogs: AuditLog[];
  };
}

const DEFAULT_SETTINGS: MandalSettings = {
  id: 'mandal-settings-default',
  mandalNameMarathi: 'मोरया गणेशोत्सव मंडळ',
  mandalNameEnglish: 'Morya Ganeshotsav Mandal',
  regNumber: 'महा/१२३/२०२६/पुणे',
  locationMarathi: 'पुणे, महाराष्ट्र',
  locationEnglish: 'Pune, Maharashtra',
  addressMarathi: 'लक्ष्मी रोड, गणपती चौक, पुणे - ४११००२',
  addressEnglish: 'Laxmi Road, Ganpati Chowk, Pune - 411002',
  contactNumber: '9876543210',
  alternateContact: '9123456789',
  whatsappGroupLink: 'https://chat.whatsapp.com/sample-ganesh-mandal-group',
  year: '२०२६-२०२७',
  taglineMarathi: '॥ श्री गणेशाय नमः ॥',
  sloganMarathi: '॥ गणपती बाप्पा मोरया ॥',
  receiptPrefix: '',
  startingReceiptNumber: 1,
  enablePartialPayments: true,
  enableWhatsAppGroupInvite: true,
  designations: [
    {
      id: 'desig-1',
      titleMarathi: 'अध्यक्ष',
      titleEnglish: 'President',
      name: 'श्री. रमेश पाटील',
      enabled: true,
    },
    {
      id: 'desig-2',
      titleMarathi: 'सचिव',
      titleEnglish: 'Secretary',
      name: 'श्री. सुरेश जोशी',
      enabled: true,
    },
    {
      id: 'desig-3',
      titleMarathi: 'खजिनदार',
      titleEnglish: 'Treasurer',
      name: 'श्री. सचिन शिंदे',
      enabled: true,
    },
  ],
  updatedAt: new Date().toISOString(),
};

export class LocalStorageProvider implements IStorageProvider {
  name = 'LocalStorageProvider';
  private filePath: string;
  private isInitialized = false;

  constructor(dataDir?: string) {
    const root = dataDir || process.cwd();
    this.filePath = path.join(root, 'data', 'mandal_database.json');
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      // File does not exist, seed initial database
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      const hostPasswordHash = await bcrypt.hash('host123', 10);

      const initialDb: DatabaseSchema = {
        version: '1.0.0',
        settings: DEFAULT_SETTINGS,
        users: [
          {
            id: 'user-admin-1',
            name: 'Super Admin',
            email: 'admin@mandal.org',
            passwordHash: adminPasswordHash,
            role: 'SUPER_ADMIN',
            phone: '9876543210',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'user-host-1',
            name: 'Rahul Kadam (Host)',
            email: 'host@mandal.org',
            passwordHash: hostPasswordHash,
            role: 'HOST',
            phone: '9876543211',
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        announcements: [
          {
            id: 'ann-1',
            titleMarathi: 'गणेशोत्सव २०२६ वर्गणी संकलन सुरू',
            titleEnglish: 'Ganeshotsav 2026 Collection Started',
            contentMarathi:
              'सर्व भाविक भक्तांना नम्र विनंती आहे की यंदाच्या गणेशोत्सवासाठी आपली देणगी / वर्गणी मंडळाच्या अधिकृत प्रतिनिधींकडे जमा करून डिजिटल पावती प्राप्त करावी.',
            contentEnglish:
              'All devotees are requested to deposit their contribution/donation for this year Ganeshotsav with the authorized Mandal representatives and obtain a digital receipt.',
            date: new Date().toISOString().split('T')[0],
            active: true,
            priority: 'HIGH',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        liveData: {
          receiptCounter: 0,
          donors: [],
          payments: [],
          pavtis: [],
          auditLogs: [
            {
              id: 'audit-init',
              userId: 'user-admin-1',
              userName: 'System',
              userRole: 'SUPER_ADMIN',
              action: 'SYSTEM_INITIALIZED',
              entityType: 'SYSTEM',
              details: 'Digital Pavti Book database initialized successfully.',
              mode: 'LIVE',
              timestamp: new Date().toISOString(),
            },
          ],
        },
        testData: {
          receiptCounter: 0,
          donors: [],
          payments: [],
          pavtis: [],
          auditLogs: [],
        },
      };

      await fs.writeFile(this.filePath, JSON.stringify(initialDb, null, 2), 'utf-8');
    }

    this.isInitialized = true;
  }

  private async readDb(): Promise<DatabaseSchema> {
    await this.init();
    const raw = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  }

  private async writeDb(data: DatabaseSchema): Promise<void> {
    await this.init();
    const tempPath = `${this.filePath}.tmp.${Date.now()}`;
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempPath, this.filePath);
  }

  // --- Settings ---
  async getSettings(): Promise<MandalSettings> {
    const db = await this.readDb();
    return db.settings;
  }

  async saveSettings(settings: MandalSettings): Promise<MandalSettings> {
    const db = await this.readDb();
    db.settings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await this.writeDb(db);
    return db.settings;
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    const db = await this.readDb();
    return db.users;
  }

  async getUserById(id: string): Promise<User | null> {
    const db = await this.readDb();
    return db.users.find((u) => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await this.readDb();
    const normalized = email.trim().toLowerCase();
    return db.users.find((u) => u.email.toLowerCase() === normalized) || null;
  }

  async saveUser(user: User): Promise<User> {
    const db = await this.readDb();
    const index = db.users.findIndex((u) => u.id === user.id);
    const updatedUser = {
      ...user,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      db.users[index] = updatedUser;
    } else {
      db.users.push(updatedUser);
    }

    await this.writeDb(db);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const db = await this.readDb();
    const initialLen = db.users.length;
    db.users = db.users.filter((u) => u.id !== id);
    if (db.users.length !== initialLen) {
      await this.writeDb(db);
      return true;
    }
    return false;
  }

  // --- Donors ---
  async getDonors(mode: AppMode): Promise<Donor[]> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.donors;
  }

  async getDonorById(id: string, mode: AppMode): Promise<Donor | null> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.donors.find((d) => d.id === id) || null;
  }

  async getDonorByMobile(mobile: string, mode: AppMode): Promise<Donor | null> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const cleanMobile = mobile.replace(/\D/g, '');
    return scope.donors.find((d) => d.mobile.replace(/\D/g, '') === cleanMobile) || null;
  }

  async saveDonor(donor: Donor, mode: AppMode): Promise<Donor> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const index = scope.donors.findIndex((d) => d.id === donor.id);
    const updated = {
      ...donor,
      mode,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      scope.donors[index] = updated;
    } else {
      scope.donors.push(updated);
    }

    await this.writeDb(db);
    return updated;
  }

  async searchDonors(query: string, mode: AppMode): Promise<Donor[]> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const q = query.trim().toLowerCase();
    if (!q) return scope.donors;

    return scope.donors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.mobile.includes(q) ||
        (d.address && d.address.toLowerCase().includes(q))
    );
  }

  // --- Payments ---
  async getPayments(mode: AppMode): Promise<Payment[]> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPaymentById(id: string, mode: AppMode): Promise<Payment | null> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.payments.find((p) => p.id === id) || null;
  }

  async getPaymentsByDonorId(donorId: string, mode: AppMode): Promise<Payment[]> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.payments
      .filter((p) => p.donorId === donorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPendingPayments(mode: AppMode): Promise<Payment[]> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.payments
      .filter((p) => p.status === 'PENDING' || p.status === 'PARTIALLY_PAID')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getNextReceiptNumber(mode: AppMode): Promise<{ formatted: string; numeric: number }> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const settings = db.settings;

    const baseCounter = scope.receiptCounter || 0;
    const nextNumber = Math.max(baseCounter + 1, settings.startingReceiptNumber || 1);
    
    // Format as 6-digit padded number: 000001, 000002
    const prefix = settings.receiptPrefix || '';
    const formatted = `${prefix}${String(nextNumber).padStart(6, '0')}`;

    return { formatted, numeric: nextNumber };
  }

  async savePayment(payment: Payment, mode: AppMode): Promise<Payment> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const index = scope.payments.findIndex((p) => p.id === payment.id);

    const updatedPayment: Payment = {
      ...payment,
      mode,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      scope.payments[index] = updatedPayment;
    } else {
      scope.payments.push(updatedPayment);
    }

    // Update Donor summary stats if donorId is linked
    if (updatedPayment.donorId) {
      const donorIndex = scope.donors.findIndex((d) => d.id === updatedPayment.donorId);
      if (donorIndex >= 0) {
        const donorPayments = scope.payments.filter(
          (p) => p.donorId === updatedPayment.donorId && p.status === 'PAID'
        );
        const total = donorPayments.reduce((sum, p) => sum + p.receivedAmount, 0);
        scope.donors[donorIndex].totalContributed = total;
        scope.donors[donorIndex].pavtiCount = donorPayments.length;
        if (updatedPayment.status === 'PAID') {
          scope.donors[donorIndex].lastPaymentDate = updatedPayment.date;
        }
        scope.donors[donorIndex].updatedAt = new Date().toISOString();
      }
    }

    await this.writeDb(db);
    return updatedPayment;
  }

  async markPaymentAsPaid(
    paymentId: string,
    paymentDetails: {
      receivedAmount: number;
      paymentMethod: 'CASH' | 'UPI' | 'OTHER';
      transactionReference?: string;
      notes?: string;
      hostId: string;
      hostName: string;
    },
    mode: AppMode
  ): Promise<{ payment: Payment; pavti: Pavti }> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const payment = scope.payments.find((p) => p.id === paymentId);

    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found.`);
    }

    // Assign next atomic receipt number
    const baseCounter = scope.receiptCounter || 0;
    const nextNumber = Math.max(baseCounter + 1, db.settings.startingReceiptNumber || 1);
    scope.receiptCounter = nextNumber;

    const prefix = db.settings.receiptPrefix || '';
    const formattedReceiptNumber = `${prefix}${String(nextNumber).padStart(6, '0')}`;

    // Update payment record
    payment.status = 'PAID';
    payment.receiptNumber = formattedReceiptNumber;
    payment.numericReceiptNumber = nextNumber;
    payment.receivedAmount = paymentDetails.receivedAmount;
    payment.remainingAmount = Math.max(0, payment.expectedAmount - paymentDetails.receivedAmount);
    payment.paymentMethod = paymentDetails.paymentMethod;
    payment.transactionReference = paymentDetails.transactionReference;
    payment.hostId = paymentDetails.hostId;
    payment.hostName = paymentDetails.hostName;
    if (paymentDetails.notes) {
      payment.notes = payment.notes
        ? `${payment.notes} | ${paymentDetails.notes}`
        : paymentDetails.notes;
    }
    payment.date = new Date().toISOString().split('T')[0];
    payment.updatedAt = new Date().toISOString();

    // Generate Pavti Record
    const pavti: Pavti = {
      id: `pavti-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receiptNumber: formattedReceiptNumber,
      paymentId: payment.id,
      donorId: payment.donorId,
      donorName: payment.donorName,
      donorMobile: payment.donorMobile,
      amount: payment.receivedAmount,
      amountInWordsMarathi: numberToWordsMarathi(payment.receivedAmount),
      amountInWordsEnglish: numberToWordsEnglish(payment.receivedAmount),
      paymentMethod: payment.paymentMethod,
      transactionReference: payment.transactionReference,
      date: payment.date,
      hostName: paymentDetails.hostName,
      mode,
      generatedAt: new Date().toISOString(),
    };

    scope.pavtis.push(pavti);

    // Update Donor Stats
    const donor = scope.donors.find((d) => d.id === payment.donorId);
    if (donor) {
      const allPaid = scope.payments.filter((p) => p.donorId === donor.id && p.status === 'PAID');
      donor.totalContributed = allPaid.reduce((sum, p) => sum + p.receivedAmount, 0);
      donor.pavtiCount = allPaid.length;
      donor.lastPaymentDate = payment.date;
      donor.updatedAt = new Date().toISOString();
    }

    // Add Audit Log
    scope.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: paymentDetails.hostId,
      userName: paymentDetails.hostName,
      userRole: 'HOST',
      action: 'PAYMENT_MARKED_PAID',
      entityType: 'PAYMENT',
      entityId: payment.id,
      details: `Payment marked PAID for ${payment.donorName}. Pavti #${formattedReceiptNumber} (₹${payment.receivedAmount}) generated.`,
      mode,
      timestamp: new Date().toISOString(),
    });

    await this.writeDb(db);
    return { payment, pavti };
  }

  // --- Pavtis ---
  async getPavtis(mode: AppMode): Promise<Pavti[]> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.pavtis.sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }

  async getPavtiById(id: string, mode: AppMode): Promise<Pavti | null> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.pavtis.find((p) => p.id === id) || null;
  }

  async getPavtiByReceiptNumber(receiptNumber: string, mode: AppMode): Promise<Pavti | null> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.pavtis.find((p) => p.receiptNumber === receiptNumber) || null;
  }

  async getPavtiByPaymentId(paymentId: string, mode: AppMode): Promise<Pavti | null> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return scope.pavtis.find((p) => p.paymentId === paymentId) || null;
  }

  async savePavti(pavti: Pavti, mode: AppMode): Promise<Pavti> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const index = scope.pavtis.findIndex((p) => p.id === pavti.id);

    if (index >= 0) {
      scope.pavtis[index] = pavti;
    } else {
      scope.pavtis.push(pavti);
    }

    await this.writeDb(db);
    return pavti;
  }

  // --- Announcements ---
  async getAnnouncements(onlyActive = false): Promise<Announcement[]> {
    const db = await this.readDb();
    let list = db.announcements || [];
    if (onlyActive) {
      list = list.filter((a) => a.active);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    const db = await this.readDb();
    return (db.announcements || []).find((a) => a.id === id) || null;
  }

  async saveAnnouncement(announcement: Announcement): Promise<Announcement> {
    const db = await this.readDb();
    if (!db.announcements) db.announcements = [];
    const index = db.announcements.findIndex((a) => a.id === announcement.id);
    const updated = {
      ...announcement,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      db.announcements[index] = updated;
    } else {
      db.announcements.push(updated);
    }

    await this.writeDb(db);
    return updated;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const db = await this.readDb();
    if (!db.announcements) return false;
    const initialLen = db.announcements.length;
    db.announcements = db.announcements.filter((a) => a.id !== id);
    if (db.announcements.length !== initialLen) {
      await this.writeDb(db);
      return true;
    }
    return false;
  }

  // --- Audit Logs ---
  async getAuditLogs(mode?: AppMode, limit = 100): Promise<AuditLog[]> {
    const db = await this.readDb();
    const liveLogs = db.liveData?.auditLogs || [];
    const testLogs = db.testData?.auditLogs || [];
    let logs: AuditLog[] = [];

    if (!mode) {
      logs = [...liveLogs, ...testLogs];
    } else if (mode === 'LIVE') {
      logs = liveLogs;
    } else {
      logs = testLogs;
    }

    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const db = await this.readDb();
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    const scope = log.mode === 'LIVE' ? db.liveData : db.testData;
    if (scope) {
      if (!scope.auditLogs) {
        scope.auditLogs = [];
      }
      scope.auditLogs.push(newLog);
    }

    await this.writeDb(db);
    return newLog;
  }

  // --- Analytics ---
  async getCollectionSummary(mode: AppMode): Promise<CollectionSummary> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    const currentYear = now.getFullYear();

    let totalCollection = 0;
    let todayCollection = 0;
    let yesterdayCollection = 0;
    let thisWeekCollection = 0;
    let thisMonthCollection = 0;
    let currentYearCollection = 0;
    let paidPavtisCount = 0;
    let cashCollection = 0;
    let upiCollection = 0;
    let otherCollection = 0;

    for (const payment of scope.payments) {
      if (payment.status === 'PAID') {
        const amt = payment.receivedAmount || 0;
        totalCollection += amt;
        paidPavtisCount++;

        if (payment.paymentMethod === 'CASH') cashCollection += amt;
        else if (payment.paymentMethod === 'UPI') upiCollection += amt;
        else otherCollection += amt;

        const pDate = new Date(payment.date);
        const pDateStr = payment.date;

        if (pDateStr === todayStr) todayCollection += amt;
        if (pDateStr === yesterdayStr) yesterdayCollection += amt;
        if (pDate >= weekAgo) thisWeekCollection += amt;
        if (pDate >= monthAgo) thisMonthCollection += amt;
        if (pDate.getFullYear() === currentYear) currentYearCollection += amt;
      }
    }

    // Pending calculations (CRITICAL: Pending amounts are NEVER in totalCollection)
    const pendingPayments = scope.payments.filter((p) => p.status === 'PENDING' || p.status === 'PARTIALLY_PAID');
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.expectedAmount - p.receivedAmount), 0);
    const partiallyPaidAmount = pendingPayments
      .filter((p) => p.status === 'PARTIALLY_PAID')
      .reduce((sum, p) => sum + p.receivedAmount, 0);

    return {
      totalCollection,
      todayCollection,
      yesterdayCollection,
      thisWeekCollection,
      thisMonthCollection,
      currentYearCollection,
      paidPavtisCount,
      pendingAmount,
      pendingDonorsCount: pendingPayments.length,
      partiallyPaidAmount,
      cashCollection,
      upiCollection,
      otherCollection,
      mode,
    };
  }

  // --- Test Mode Operations ---
  async clearTestData(): Promise<{ deletedPayments: number; deletedDonors: number; deletedPavtis: number }> {
    const db = await this.readDb();
    const deletedPayments = db.testData.payments.length;
    const deletedDonors = db.testData.donors.length;
    const deletedPavtis = db.testData.pavtis.length;

    db.testData = {
      receiptCounter: 0,
      donors: [],
      payments: [],
      pavtis: [],
      auditLogs: [
        {
          id: `audit-clear-${Date.now()}`,
          userId: 'user-admin-1',
          userName: 'Super Admin',
          userRole: 'SUPER_ADMIN',
          action: 'CLEAR_TEST_DATA',
          entityType: 'SYSTEM',
          details: `Cleared all test data (${deletedPayments} payments, ${deletedDonors} donors, ${deletedPavtis} pavtis). Live data untouched.`,
          mode: 'TEST',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await this.writeDb(db);
    return { deletedPayments, deletedDonors, deletedPavtis };
  }

  // --- Backup & Restore ---
  async exportBackup(): Promise<DatabaseBackup> {
    const db = await this.readDb();
    return {
      version: db.version,
      exportedAt: new Date().toISOString(),
      settings: db.settings,
      users: db.users,
      announcements: db.announcements,
      liveData: {
        donors: db.liveData.donors,
        payments: db.liveData.payments,
        pavtis: db.liveData.pavtis,
        auditLogs: db.liveData.auditLogs,
      },
      testData: {
        donors: db.testData.donors,
        payments: db.testData.payments,
        pavtis: db.testData.pavtis,
        auditLogs: db.testData.auditLogs,
      },
    };
  }

  async importBackup(backupData: DatabaseBackup): Promise<boolean> {
    if (!backupData.settings || !backupData.users || !backupData.liveData) {
      throw new Error('Invalid backup file format.');
    }

    const currentDb = await this.readDb();
    const newDb: DatabaseSchema = {
      version: backupData.version || currentDb.version,
      settings: backupData.settings,
      users: backupData.users,
      announcements: backupData.announcements || [],
      liveData: {
        receiptCounter: backupData.liveData.payments
          .filter((p) => p.numericReceiptNumber)
          .reduce((max, p) => Math.max(max, p.numericReceiptNumber || 0), 0),
        donors: backupData.liveData.donors || [],
        payments: backupData.liveData.payments || [],
        pavtis: backupData.liveData.pavtis || [],
        auditLogs: [
          ...(backupData.liveData.auditLogs || []),
          {
            id: `audit-restore-${Date.now()}`,
            userId: 'system',
            userName: 'Super Admin',
            userRole: 'SUPER_ADMIN',
            action: 'BACKUP_RESTORED',
            entityType: 'SYSTEM',
            details: `Database restored from backup dated ${backupData.exportedAt}.`,
            mode: 'LIVE',
            timestamp: new Date().toISOString(),
          },
        ],
      },
      testData: {
        receiptCounter: (backupData.testData?.payments || [])
          .filter((p) => p.numericReceiptNumber)
          .reduce((max, p) => Math.max(max, p.numericReceiptNumber || 0), 0),
        donors: backupData.testData?.donors || [],
        payments: backupData.testData?.payments || [],
        pavtis: backupData.testData?.pavtis || [],
        auditLogs: backupData.testData?.auditLogs || [],
      },
    };

    await this.writeDb(newDb);
    return true;
  }
}
