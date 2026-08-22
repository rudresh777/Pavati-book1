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
  Expense,
  ExpenseSummary,
  DailyExpenseRecord,
  AppMode,
  CollectionSummary,
  DailyCollectionRecord,
  PaymentInstallment,
  UserRole,
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
    expenseCounter?: number;
    donors: Donor[];
    payments: Payment[];
    pavtis: Pavti[];
    expenses?: Expense[];
    auditLogs: AuditLog[];
  };
  testData: {
    receiptCounter: number;
    expenseCounter?: number;
    donors: Donor[];
    payments: Payment[];
    pavtis: Pavti[];
    expenses?: Expense[];
    auditLogs: AuditLog[];
  };
}

const DEFAULT_SETTINGS: MandalSettings = {
  id: 'mandal-settings-default',
  mandalNameMarathi: 'मोरया गणेशोत्सव मंडळ',
  mandalNameEnglish: 'Morya Ganeshotsav Mandal',
  regNumber: 'महा/१२३/२०२६/अकोला',
  locationMarathi: 'अकोला, महाराष्ट्र',
  locationEnglish: 'Akola, Maharashtra',
  addressMarathi: 'तापडिया नगर अकोला 444001',
  addressEnglish: 'Tapadia Nagar Akola 444001',
  contactNumber: '',
  alternateContact: '',
  whatsappGroupLink: 'https://chat.whatsapp.com/EOO3qPs2WJXF3vcvHtmCaL',
  year: '२०२६',
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
            status: 'PUBLISHED',
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
    const db = JSON.parse(raw) as DatabaseSchema;
    if (db.liveData) {
      db.liveData.expenses = db.liveData.expenses || [];
    }
    if (db.testData) {
      db.testData.expenses = db.testData.expenses || [];
    }
    return db;
  }

  private async writeDb(data: DatabaseSchema): Promise<void> {
    await this.init();
    try {
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      if (err.code === 'EPERM' || err.code === 'EBUSY') {
        // Retry once after brief delay for Windows/OneDrive file locks
        await new Promise((resolve) => setTimeout(resolve, 50));
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
      } else {
        throw err;
      }
    }
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

  async updateUserPassword(
    userId: string,
    newPassword: string,
    performedBy: { userId: string; userName: string; userRole: UserRole }
  ): Promise<boolean> {
    if (performedBy.userRole !== 'SUPER_ADMIN') {
      throw new Error('अनधिकृत: फक्त सुपर ॲडमिन पासवर्ड बदलू शकतात (Only Super Admin can change passwords).');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('पासवर्ड किमान ६ अक्षरांचा असावा (Password must be at least 6 characters).');
    }

    const db = await this.readDb();
    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex < 0) {
      throw new Error('वापरकर्ता सापडला नाही (User not found).');
    }

    const targetUser = db.users[userIndex];
    const passwordHash = await bcrypt.hash(newPassword, 10);

    db.users[userIndex] = {
      ...targetUser,
      passwordHash,
      updatedAt: new Date().toISOString(),
    };

    await this.writeDb(db);

    await this.addAuditLog({
      userId: performedBy.userId,
      userName: performedBy.userName,
      userRole: performedBy.userRole,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: targetUser.id,
      details: `Super Admin (${performedBy.userName}) changed password for ${targetUser.role} account "${targetUser.name}" (${targetUser.email}).`,
      mode: 'LIVE',
    });

    return true;
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
      .filter((p) => p.status === 'DUE' || p.status === 'PENDING' || p.status === 'PARTIALLY_PAID')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deleteOrArchiveDonor(
    donorId: string,
    mode: AppMode
  ): Promise<{ success: boolean; action: 'DELETED' | 'ARCHIVED' }> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const donorIndex = scope.donors.findIndex((d) => d.id === donorId);
    if (donorIndex === -1) {
      throw new Error('देणगीदार सापडला नाही.');
    }

    const hasFinancialHistory =
      scope.payments.some((p) => p.donorId === donorId) ||
      scope.pavtis.some((pav) => pav.donorId === donorId);

    if (hasFinancialHistory) {
      scope.donors[donorIndex].isArchived = true;
      scope.donors[donorIndex].updatedAt = new Date().toISOString();
      await this.writeDb(db);
      return { success: true, action: 'ARCHIVED' };
    } else {
      scope.donors.splice(donorIndex, 1);
      await this.writeDb(db);
      return { success: true, action: 'DELETED' };
    }
  }

  async getNextReceiptNumber(mode: AppMode): Promise<{ formatted: string; numeric: number }> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const settings = db.settings;

    let maxNumber = Math.max(
      scope.receiptCounter || 0,
      (scope as any).lastReceiptNumber || 0,
      (settings.startingReceiptNumber || 1) - 1
    );

    for (const p of (scope.payments || [])) {
      if (p.numericReceiptNumber && p.numericReceiptNumber > maxNumber) {
        maxNumber = p.numericReceiptNumber;
      } else if (p.receiptNumber) {
        const num = parseInt(p.receiptNumber.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    for (const pav of (scope.pavtis || [])) {
      if (pav.numericReceiptNumber && pav.numericReceiptNumber > maxNumber) {
        maxNumber = pav.numericReceiptNumber;
      } else if (pav.receiptNumber) {
        const num = parseInt(pav.receiptNumber.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    const nextNumber = maxNumber + 1;
    const prefix = settings.receiptPrefix || '';
    const formatted = `${prefix}${String(nextNumber).padStart(6, '0')}`;

    return { formatted, numeric: nextNumber };
  }

  async savePayment(payment: Payment, mode: AppMode): Promise<Payment> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const index = scope.payments.findIndex((p) => p.id === payment.id);

    const isDue = payment.status === 'DUE' || payment.status === 'PENDING';

    const receivedAmt = payment.receivedAmount || 0;
    let installments = payment.installments;
    if (!installments && receivedAmt > 0 && (payment.status === 'PAID' || payment.status === 'PARTIALLY_PAID')) {
      const pDate = payment.date ? (payment.date.includes('T') ? payment.date.split('T')[0] : payment.date) : new Date().toISOString().split('T')[0];
      installments = [
        {
          id: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          amount: receivedAmt,
          paymentMethod: payment.paymentMethod === 'UPI' ? 'UPI' : 'CASH',
          transactionReference: payment.transactionReference,
          date: pDate,
          hostId: payment.hostId,
          hostName: payment.hostName,
          createdAt: payment.createdAt || new Date().toISOString(),
        },
      ];
    }

    const updatedPayment: Payment = {
      ...payment,
      installments,
      mode,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      scope.payments[index] = updatedPayment;
    } else {
      scope.payments.push(updatedPayment);
    }

    // Update receiptCounter if numeric receipt number is present
    if (updatedPayment.numericReceiptNumber) {
      scope.receiptCounter = Math.max(scope.receiptCounter || 0, updatedPayment.numericReceiptNumber);
      (scope as any).lastReceiptNumber = scope.receiptCounter;
    }

    // Auto-create/sync Pavti Record for both DUE and PAID
    const existingPavtiIndex = scope.pavtis.findIndex(
      (p) => p.paymentId === updatedPayment.id || (updatedPayment.receiptNumber && p.receiptNumber === updatedPayment.receiptNumber)
    );
    const amountVal = isDue ? updatedPayment.expectedAmount : updatedPayment.receivedAmount;
    
    const pavtiRecord: Pavti = {
      id: existingPavtiIndex >= 0 ? scope.pavtis[existingPavtiIndex].id : `pavti-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber: updatedPayment.receiptNumber || '',
      numericReceiptNumber: updatedPayment.numericReceiptNumber,
      paymentId: updatedPayment.id,
      donorId: updatedPayment.donorId,
      donorName: updatedPayment.donorName,
      donorMobile: updatedPayment.donorMobile,
      donorAddress: updatedPayment.donorAddress,
      amount: amountVal,
      amountInWordsMarathi: numberToWordsMarathi(amountVal),
      amountInWordsEnglish: numberToWordsEnglish(amountVal),
      paymentMethod: updatedPayment.paymentMethod,
      status: isDue ? 'DUE' : 'PAID',
      transactionReference: updatedPayment.transactionReference,
      date: updatedPayment.date,
      hostName: updatedPayment.hostName,
      mode,
      generatedAt: new Date().toISOString(),
    };

    if (existingPavtiIndex >= 0) {
      scope.pavtis[existingPavtiIndex] = pavtiRecord;
    } else {
      scope.pavtis.push(pavtiRecord);
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
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const payment = scope.payments.find((p) => p.id === paymentId);

    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found.`);
    }

    if (payment.status === 'PAID') {
      throw new Error('Paid payments cannot be modified via pending editor.');
    }

    if (data.donorName !== undefined) payment.donorName = data.donorName.trim();
    if (data.donorMobile !== undefined) payment.donorMobile = data.donorMobile.trim();
    if (data.donorAddress !== undefined) payment.donorAddress = data.donorAddress.trim();
    if (data.expectedAmount !== undefined) {
      payment.expectedAmount = data.expectedAmount;
      payment.remainingAmount = Math.max(0, data.expectedAmount - (payment.receivedAmount || 0));
    }
    if (data.notes !== undefined) payment.notes = data.notes.trim();
    if (data.date !== undefined) payment.date = data.date;
    payment.updatedAt = new Date().toISOString();

    // Also update donor if donorId exists
    if (payment.donorId) {
      const donor = scope.donors.find((d) => d.id === payment.donorId);
      if (donor) {
        if (data.donorName) donor.name = data.donorName.trim();
        if (data.donorMobile !== undefined) donor.mobile = data.donorMobile.trim();
        if (data.donorAddress !== undefined) donor.address = data.donorAddress.trim();
        donor.updatedAt = new Date().toISOString();
      }
    }

    // Sync Pavti record
    const pavtiIndex = scope.pavtis.findIndex((p) => p.paymentId === payment.id);
    if (pavtiIndex >= 0) {
      scope.pavtis[pavtiIndex].donorName = payment.donorName;
      scope.pavtis[pavtiIndex].donorMobile = payment.donorMobile;
      scope.pavtis[pavtiIndex].donorAddress = payment.donorAddress;
      scope.pavtis[pavtiIndex].amount = payment.expectedAmount;
      scope.pavtis[pavtiIndex].amountInWordsMarathi = numberToWordsMarathi(payment.expectedAmount);
      scope.pavtis[pavtiIndex].amountInWordsEnglish = numberToWordsEnglish(payment.expectedAmount);
      if (data.date) scope.pavtis[pavtiIndex].date = data.date;
    }

    await this.writeDb(db);
    return payment;
  }

  async cancelPendingPayment(paymentId: string, mode: AppMode): Promise<Payment> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const payment = scope.payments.find((p) => p.id === paymentId);

    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found.`);
    }

    payment.status = 'CANCELLED';
    payment.updatedAt = new Date().toISOString();

    scope.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: payment.hostId || 'system',
      userName: payment.hostName || 'Host',
      userRole: 'HOST',
      action: 'PAYMENT_CANCELLED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      details: `Pending payment for ${payment.donorName} (₹${payment.expectedAmount}) was cancelled.`,
      mode,
      timestamp: new Date().toISOString(),
    });

    await this.writeDb(db);
    return payment;
  }

  async deletePayment(
    id: string,
    mode: AppMode,
    user?: { userId: string; userName: string; userRole: UserRole }
  ): Promise<{ success: boolean; deletedPayment: Payment }> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const paymentIndex = scope.payments.findIndex((p) => p.id === id);
    if (paymentIndex === -1) {
      throw new Error('पावती / देणगी नोंद सापडली नाही.');
    }

    const deletedPayment = scope.payments[paymentIndex];
    scope.payments.splice(paymentIndex, 1);

    // Also delete associated Pavti
    scope.pavtis = scope.pavtis.filter(
      (pav) =>
        pav.paymentId !== id &&
        (!deletedPayment.receiptNumber || pav.receiptNumber !== deletedPayment.receiptNumber)
    );

    // Update Donor summary stats if donorId is linked
    if (deletedPayment.donorId) {
      const donorIndex = scope.donors.findIndex((d) => d.id === deletedPayment.donorId);
      if (donorIndex >= 0) {
        const remainingPaid = scope.payments.filter(
          (p) => p.donorId === deletedPayment.donorId && p.status === 'PAID'
        );
        scope.donors[donorIndex].totalContributed = remainingPaid.reduce(
          (sum, p) => sum + p.receivedAmount,
          0
        );
        scope.donors[donorIndex].pavtiCount = remainingPaid.length;
        scope.donors[donorIndex].updatedAt = new Date().toISOString();
      }
    }

    // Add Audit Log
    scope.auditLogs.push({
      id: `audit-${Date.now()}`,
      userId: user?.userId || 'system',
      userName: user?.userName || 'Admin',
      userRole: user?.userRole || 'HOST',
      action: 'PAYMENT_DELETED',
      entityType: 'PAYMENT',
      entityId: id,
      details: `Payment #${deletedPayment.receiptNumber || id} for ${deletedPayment.donorName} (₹${deletedPayment.receivedAmount || deletedPayment.expectedAmount}) was permanently deleted.`,
      mode,
      timestamp: new Date().toISOString(),
    });

    await this.writeDb(db);
    return { success: true, deletedPayment };
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
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const payment = scope.payments.find((p) => p.id === paymentId);

    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found.`);
    }

    // CRITICAL: Retain the EXACT SAME receipt number already assigned to this receipt.
    // Do NOT generate a new receipt number when paying an existing Due receipt.
    let formattedReceiptNumber = payment.receiptNumber;
    let nextNumber = payment.numericReceiptNumber;

    if (!formattedReceiptNumber) {
      // Legacy fallback only
      const nextObj = await this.getNextReceiptNumber(mode);
      formattedReceiptNumber = nextObj.formatted;
      nextNumber = nextObj.numeric;
      scope.receiptCounter = Math.max(scope.receiptCounter || 0, nextNumber);
      (scope as any).lastReceiptNumber = scope.receiptCounter;
    }

    // Update payment record
    const effectivePaymentDate = paymentDetails.paymentDate || new Date().toISOString().split('T')[0];
    const prevReceived = payment.receivedAmount || 0;
    const increment = paymentDetails.receivedAmount > prevReceived && prevReceived > 0
      ? (paymentDetails.receivedAmount - prevReceived)
      : paymentDetails.receivedAmount;

    const newInstallment: PaymentInstallment = {
      id: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amount: increment,
      paymentMethod: paymentDetails.paymentMethod,
      transactionReference: paymentDetails.transactionReference,
      date: effectivePaymentDate,
      hostId: paymentDetails.hostId,
      hostName: paymentDetails.hostName,
      createdAt: new Date().toISOString(),
    };

    if (!payment.installments) {
      payment.installments = [];
      if (prevReceived > 0) {
        payment.installments.push({
          id: `inst-${Date.now() - 1000}`,
          amount: prevReceived,
          paymentMethod: payment.paymentMethod === 'UPI' ? 'UPI' : 'CASH',
          transactionReference: payment.transactionReference,
          date: payment.date ? (payment.date.includes('T') ? payment.date.split('T')[0] : payment.date) : effectivePaymentDate,
          hostId: payment.hostId,
          hostName: payment.hostName,
          createdAt: payment.createdAt || new Date().toISOString(),
        });
      }
    }
    payment.installments.push(newInstallment);

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
    payment.date = effectivePaymentDate;
    payment.updatedAt = new Date().toISOString();

    // Update or Generate Pavti Record with SAME receipt number
    const existingPavtiIndex = scope.pavtis.findIndex(
      (p) =>
        p.paymentId === payment.id ||
        (payment.receiptNumber && p.receiptNumber === payment.receiptNumber)
    );
    const pavti: Pavti = {
      id:
        existingPavtiIndex >= 0
          ? scope.pavtis[existingPavtiIndex].id
          : `pavti-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receiptNumber: formattedReceiptNumber,
      numericReceiptNumber: nextNumber,
      paymentId: payment.id,
      donorId: payment.donorId,
      donorName: payment.donorName,
      donorMobile: payment.donorMobile,
      donorAddress: payment.donorAddress,
      amount: payment.receivedAmount,
      amountInWordsMarathi: numberToWordsMarathi(payment.receivedAmount),
      amountInWordsEnglish: numberToWordsEnglish(payment.receivedAmount),
      paymentMethod: payment.paymentMethod,
      status: 'PAID',
      transactionReference: payment.transactionReference,
      date: payment.date,
      hostName: paymentDetails.hostName,
      mode,
      generatedAt: new Date().toISOString(),
    };

    if (existingPavtiIndex >= 0) {
      scope.pavtis[existingPavtiIndex] = pavti;
    } else {
      scope.pavtis.push(pavti);
    }

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
      details: `Payment marked PAID for ${payment.donorName}. Pavti #${formattedReceiptNumber} (₹${payment.receivedAmount}, ${paymentDetails.paymentMethod}) updated.`,
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
    const index = scope.pavtis.findIndex(
      (p) => p.id === pavti.id || (pavti.paymentId && p.paymentId === pavti.paymentId)
    );

    if (index >= 0) {
      scope.pavtis[index] = pavti;
    } else {
      scope.pavtis.push(pavti);
    }

    if (pavti.numericReceiptNumber) {
      scope.receiptCounter = Math.max(scope.receiptCounter || 0, pavti.numericReceiptNumber);
      (scope as any).lastReceiptNumber = scope.receiptCounter;
    }

    await this.writeDb(db);
    return pavti;
  }

  // --- Expenses (निधी व खर्च व्यवस्थापन) ---
  async getExpenses(mode: AppMode, filterDate?: string): Promise<Expense[]> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    let list = scope.expenses || [];
    if (filterDate) {
      const cleanFilter = filterDate.includes('T') ? filterDate.split('T')[0] : filterDate;
      list = list.filter((e) => e.date === cleanFilter);
    }
    return list.sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date);
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getExpenseById(id: string, mode: AppMode): Promise<Expense | null> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    return (scope.expenses || []).find((e) => e.id === id) || null;
  }

  async saveExpense(expense: Expense, mode: AppMode): Promise<Expense> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    if (!scope.expenses) scope.expenses = [];

    // Ensure sequential numeric numbering if missing
    if (!expense.numericExpenseNumber) {
      const maxNum = scope.expenses.reduce(
        (max, e) => Math.max(max, e.numericExpenseNumber || 0),
        0
      );
      expense.numericExpenseNumber = maxNum + 1;
      expense.expenseNumber = `EXP-${String(expense.numericExpenseNumber).padStart(3, '0')}`;
    } else if (!expense.expenseNumber) {
      expense.expenseNumber = `EXP-${String(expense.numericExpenseNumber).padStart(3, '0')}`;
    }

    const index = scope.expenses.findIndex((e) => e.id === expense.id);
    const updated: Expense = {
      ...expense,
      mode,
      updatedAt: new Date().toISOString(),
      createdAt: expense.createdAt || new Date().toISOString(),
    };

    if (index >= 0) {
      scope.expenses[index] = updated;
    } else {
      scope.expenses.push(updated);
    }

    if (!scope.auditLogs) scope.auditLogs = [];
    scope.auditLogs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: expense.addedById || 'user-admin',
      userName: expense.addedBy || 'Admin',
      userRole: expense.userRole || 'HOST',
      action: index >= 0 ? 'EXPENSE_UPDATED' : 'EXPENSE_ADDED',
      entityType: 'EXPENSE',
      entityId: updated.id,
      details: `खर्च नोंद: ${updated.expenseNumber} (${updated.spentFor} - ₹${updated.amount}) दिनांक ${updated.date} नोंदवण्यात आला.`,
      mode,
      timestamp: new Date().toISOString(),
    });

    await this.writeDb(db);
    return updated;
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
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    if (!scope.expenses) scope.expenses = [];
    const index = scope.expenses.findIndex((e) => e.id === id);
    if (index < 0) {
      throw new Error('खर्च नोंद सापडली नाही.');
    }

    const existing = scope.expenses[index];
    const updated: Expense = {
      ...existing,
      date: data.date ?? existing.date,
      spentFor: data.spentFor ?? existing.spentFor,
      description: data.description !== undefined ? data.description : existing.description,
      amount: data.amount !== undefined ? Number(data.amount) : existing.amount,
      vendorPerson: data.vendorPerson !== undefined ? data.vendorPerson : existing.vendorPerson,
      note: data.note !== undefined ? data.note : existing.note,
      updatedAt: new Date().toISOString(),
    };

    scope.expenses[index] = updated;

    if (!scope.auditLogs) scope.auditLogs = [];
    scope.auditLogs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.userId || 'user-admin',
      userName: user?.userName || 'Admin',
      userRole: user?.userRole || 'HOST',
      action: 'EXPENSE_UPDATED',
      entityType: 'EXPENSE',
      entityId: updated.id,
      details: `खर्च बदल: ${updated.expenseNumber} (${updated.spentFor} - ₹${updated.amount}) दिनांक ${updated.date}.`,
      mode,
      timestamp: new Date().toISOString(),
    });

    await this.writeDb(db);
    return updated;
  }

  async deleteExpense(
    id: string,
    mode: AppMode,
    user?: { userId: string; userName: string; userRole: UserRole }
  ): Promise<{ success: boolean; deletedExpense: Expense }> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    if (!scope.expenses) scope.expenses = [];
    const index = scope.expenses.findIndex((e) => e.id === id);
    if (index < 0) {
      throw new Error('खर्च नोंद सापडली नाही.');
    }

    const deletedExpense = scope.expenses[index];
    scope.expenses.splice(index, 1);

    if (!scope.auditLogs) scope.auditLogs = [];
    scope.auditLogs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.userId || 'user-admin',
      userName: user?.userName || 'Admin',
      userRole: user?.userRole || 'HOST',
      action: 'EXPENSE_DELETED',
      entityType: 'EXPENSE',
      entityId: id,
      details: `खर्च हटवला: ${deletedExpense.expenseNumber || id} (${deletedExpense.spentFor} - ₹${deletedExpense.amount}) दिनांक ${deletedExpense.date}.`,
      mode,
      timestamp: new Date().toISOString(),
    });

    await this.writeDb(db);
    return { success: true, deletedExpense };
  }

  async getExpenseSummary(mode: AppMode, targetDate?: string): Promise<ExpenseSummary> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;
    const expenses = scope.expenses || [];

    const formatYYYYMMDD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const formatDDMMYYYY = (dateStr: string) => {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [y, m, d] = clean.split('-');
        return `${d}/${m}/${y}`;
      }
      return clean;
    };

    const normalizeDateStr = (dateStr?: string): string => {
      if (!dateStr) return formatYYYYMMDD(new Date());
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
        const [d, m, y] = clean.split('/');
        return `${y}-${m}-${d}`;
      }
      return clean;
    };

    const now = new Date();
    const todayStr = targetDate ? normalizeDateStr(targetDate) : formatYYYYMMDD(now);
    const baseDate = targetDate ? new Date(`${todayStr}T12:00:00.000Z`) : now;

    const yesterday = new Date(baseDate);
    yesterday.setDate(baseDate.getDate() - 1);
    const yesterdayStr = formatYYYYMMDD(yesterday);

    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    let totalExpense = 0;
    let todayExpense = 0;
    let yesterdayExpense = 0;
    let thisMonthExpense = 0;

    const dailyMap: Record<string, DailyExpenseRecord> = {};

    for (const exp of expenses) {
      const normDate = normalizeDateStr(exp.date);
      const amt = Number(exp.amount) || 0;
      totalExpense += amt;

      if (!dailyMap[normDate]) {
        dailyMap[normDate] = {
          date: normDate,
          formattedDate: formatDDMMYYYY(normDate),
          totalExpense: 0,
          expenseCount: 0,
        };
      }
      dailyMap[normDate].totalExpense += amt;
      dailyMap[normDate].expenseCount++;

      if (normDate === todayStr) {
        todayExpense += amt;
      }
      if (normDate === yesterdayStr) {
        yesterdayExpense += amt;
      }
      const expDateObj = new Date(normDate);
      if (!isNaN(expDateObj.getTime()) && expDateObj >= monthAgo) {
        thisMonthExpense += amt;
      }
    }

    const dailyHistory = Object.values(dailyMap).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    return {
      todayExpense,
      totalExpense,
      yesterdayExpense,
      thisMonthExpense,
      mode,
      dailyHistory,
    };
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
  async getCollectionSummary(mode: AppMode, targetDate?: string): Promise<CollectionSummary> {
    const db = await this.readDb();
    const scope = mode === 'LIVE' ? db.liveData : db.testData;

    const formatYYYYMMDD = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const formatDDMMYYYY = (dateStr: string) => {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        const [y, m, d] = clean.split('-');
        return `${d}/${m}/${y}`;
      }
      return clean;
    };

    const normalizeDateStr = (dateStr?: string): string => {
      if (!dateStr) return formatYYYYMMDD(new Date());
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
        const [d, m, y] = clean.split('/');
        return `${y}-${m}-${d}`;
      }
      return clean;
    };

    const now = new Date();
    const todayStr = targetDate ? normalizeDateStr(targetDate) : formatYYYYMMDD(now);
    const baseDate = targetDate ? new Date(`${todayStr}T12:00:00.000Z`) : now;
    
    const yesterday = new Date(baseDate);
    yesterday.setDate(baseDate.getDate() - 1);
    const yesterdayStr = formatYYYYMMDD(yesterday);

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    const currentYear = now.getFullYear();

    let totalCollection = 0;
    let paidPavtisCount = 0;
    let cashCollection = 0;
    let upiCollection = 0;
    let otherCollection = 0;

    // Daily Collection Map: Group actual collections by date
    const dailyMap: Record<
      string,
      {
        date: string;
        formattedDate: string;
        cashCollection: number;
        upiCollection: number;
        totalCollection: number;
        receiptCount: number;
      }
    > = {};

    const addCollectionToMap = (
      pDate: string,
      amt: number,
      method: 'CASH' | 'UPI' | 'DUE' | string
    ) => {
      if (amt <= 0) return;
      const normalizedDate = normalizeDateStr(pDate);

      if (!dailyMap[normalizedDate]) {
        dailyMap[normalizedDate] = {
          date: normalizedDate,
          formattedDate: formatDDMMYYYY(normalizedDate),
          cashCollection: 0,
          upiCollection: 0,
          totalCollection: 0,
          receiptCount: 0,
        };
      }

      if (method === 'CASH') {
        dailyMap[normalizedDate].cashCollection += amt;
        cashCollection += amt;
      } else if (method === 'UPI') {
        dailyMap[normalizedDate].upiCollection += amt;
        upiCollection += amt;
      } else {
        dailyMap[normalizedDate].cashCollection += amt;
        otherCollection += amt;
      }

      dailyMap[normalizedDate].totalCollection += amt;
      dailyMap[normalizedDate].receiptCount++;
      totalCollection += amt;
      paidPavtisCount++;
    };

    for (const payment of scope.payments) {
      if (payment.installments && payment.installments.length > 0) {
        for (const inst of payment.installments) {
          addCollectionToMap(inst.date, inst.amount, inst.paymentMethod);
        }
      } else if (
        (payment.status === 'PAID' || payment.status === 'PARTIALLY_PAID') &&
        (payment.receivedAmount || 0) > 0
      ) {
        addCollectionToMap(payment.date, payment.receivedAmount, payment.paymentMethod);
      }
      // NOTE: DUE / PENDING amounts with receivedAmount === 0 are NEVER added to daily collection!
    }

    // Calculate Today's and Yesterday's collection strictly from dailyMap
    const todayRecord = dailyMap[todayStr];
    const todayCollection = todayRecord ? todayRecord.totalCollection : 0;

    const yesterdayRecord = dailyMap[yesterdayStr];
    const yesterdayCollection = yesterdayRecord ? yesterdayRecord.totalCollection : 0;

    // Date range calculations
    let thisWeekCollection = 0;
    let thisMonthCollection = 0;
    let currentYearCollection = 0;

    for (const [dStr, record] of Object.entries(dailyMap)) {
      const dObj = new Date(dStr);
      if (!isNaN(dObj.getTime())) {
        if (dObj >= weekAgo) thisWeekCollection += record.totalCollection;
        if (dObj >= monthAgo) thisMonthCollection += record.totalCollection;
        if (dObj.getFullYear() === currentYear) currentYearCollection += record.totalCollection;
      }
    }

    // Sort Daily Collection History: newest date first
    const dailyHistory = Object.values(dailyMap).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    // Pending / Due calculations (CRITICAL: Due amounts are NEVER in totalCollection)
    const pendingPayments = scope.payments.filter(
      (p) => p.status === 'DUE' || p.status === 'PENDING' || p.status === 'PARTIALLY_PAID'
    );
    const pendingAmount = pendingPayments.reduce(
      (sum, p) => sum + (p.expectedAmount - (p.receivedAmount || 0)),
      0
    );
    const partiallyPaidAmount = pendingPayments
      .filter((p) => p.status === 'PARTIALLY_PAID')
      .reduce((sum, p) => sum + (p.receivedAmount || 0), 0);

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
      dailyHistory,
    };
  }

  // --- Data Reset Operations ---
  async clearTestData(): Promise<{ deletedPayments: number; deletedDonors: number; deletedPavtis: number; deletedExpenses: number }> {
    const db = await this.readDb();
    const deletedPayments = db.testData.payments.length;
    const deletedDonors = db.testData.donors.length;
    const deletedPavtis = db.testData.pavtis.length;
    const deletedExpenses = db.testData.expenses?.length || 0;

    db.testData = {
      receiptCounter: 0,
      donors: [],
      payments: [],
      pavtis: [],
      expenses: [],
      auditLogs: [
        {
          id: `audit-clear-${Date.now()}`,
          userId: 'user-admin-1',
          userName: 'Super Admin',
          userRole: 'SUPER_ADMIN',
          action: 'CLEAR_TEST_DATA',
          entityType: 'SYSTEM',
          details: `Cleared all test data (${deletedPayments} payments, ${deletedDonors} donors, ${deletedPavtis} pavtis, ${deletedExpenses} expenses). Live data untouched.`,
          mode: 'TEST',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await this.writeDb(db);
    return { deletedPayments, deletedDonors, deletedPavtis, deletedExpenses };
  }

  async resetAllData(
    confirmation: string,
    mode: AppMode,
    user: { userId: string; userName: string; userRole: UserRole }
  ): Promise<boolean> {
    if (user.userRole !== 'SUPER_ADMIN') {
      throw new Error('अनधिकृत: फक्त सुपर ॲडमिन संपूर्ण डेटा रीसेट करू शकतात.');
    }
    if (confirmation !== 'RESET' && confirmation !== 'DELETE ALL DATA') {
      throw new Error('अवैध पुष्टीकरण: कृपया अचूक "DELETE ALL DATA" टाईप करा.');
    }

    const db = await this.readDb();

    if (mode === 'LIVE') {
      db.liveData = {
        receiptCounter: 0,
        donors: [],
        payments: [],
        pavtis: [],
        expenses: [],
        auditLogs: [
          {
            id: `audit-reset-${Date.now()}`,
            userId: user.userId,
            userName: user.userName,
            userRole: user.userRole,
            action: 'DATA_RESET',
            entityType: 'SYSTEM',
            details: `Full LIVE database reset performed by ${user.userName}.`,
            mode: 'LIVE',
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } else {
      db.testData = {
        receiptCounter: 0,
        donors: [],
        payments: [],
        pavtis: [],
        expenses: [],
        auditLogs: [],
      };
    }

    await this.writeDb(db);
    return true;
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
        expenses: db.liveData.expenses || [],
        auditLogs: db.liveData.auditLogs,
      },
      testData: {
        donors: db.testData.donors,
        payments: db.testData.payments,
        pavtis: db.testData.pavtis,
        expenses: db.testData.expenses || [],
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
        expenses: backupData.liveData.expenses || [],
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
        expenses: backupData.testData?.expenses || [],
        auditLogs: backupData.testData?.auditLogs || [],
      },
    };

    await this.writeDb(newDb);
    return true;
  }
}
