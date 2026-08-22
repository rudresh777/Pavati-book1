export type UserRole = 'SUPER_ADMIN' | 'HOST';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MandalDesignation {
  id: string;
  titleMarathi: string;
  titleEnglish: string;
  name: string;
  enabled: boolean;
}

export interface MandalSettings {
  id: string;
  mandalNameMarathi: string;
  mandalNameEnglish: string;
  regNumber?: string;
  locationMarathi: string;
  locationEnglish: string;
  addressMarathi?: string;
  addressEnglish?: string;
  contactNumber: string;
  alternateContact?: string;
  whatsappGroupLink: string;
  defaultWhatsAppMessage?: string;
  year: string; // e.g. "2026-2027" or "2026"
  logoUrl?: string; // Base64 data URL or Google Drive URL
  taglineMarathi: string; // e.g. "॥ श्री गणेशाय नमः ॥"
  sloganMarathi: string; // e.g. "॥ गणपती बाप्पा मोरया ॥"
  receiptPrefix: string; // e.g. "GPB-" or ""
  startingReceiptNumber: number; // e.g. 1 (formats to 000001)
  enablePartialPayments: boolean;
  enableWhatsAppGroupInvite: boolean;
  designations: MandalDesignation[];
  updatedAt: string;
}

export type AppMode = 'TEST' | 'LIVE';

export interface Donor {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  totalContributed: number;
  pavtiCount: number;
  lastPaymentDate?: string;
  mode: AppMode;
  notes?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'DUE' | 'PAID' | 'CANCELLED' | 'PENDING' | 'PARTIALLY_PAID';
export type PaymentMethod = 'CASH' | 'UPI' | 'DUE';

export interface PaymentInstallment {
  id: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI';
  transactionReference?: string;
  date: string; // YYYY-MM-DD
  hostId?: string;
  hostName?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  receiptNumber?: string; // Formatted e.g. "000001" - assigned sequentially for ALL receipts (both PAID and DUE)
  numericReceiptNumber?: number; // 1, 2, 3...
  donorId: string;
  donorName: string;
  donorMobile: string;
  donorAddress?: string;
  expectedAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionReference?: string; // UPI UTR or Ref number
  date: string; // ISO date string or YYYY-MM-DD
  hostId: string;
  hostName: string;
  notes?: string;
  mode: AppMode;
  installments?: PaymentInstallment[];
  createdAt: string;
  updatedAt: string;
}

export interface Pavti {
  id: string;
  receiptNumber: string; // Sequential formatted number e.g. "000001" for both PAID and DUE
  numericReceiptNumber?: number;
  paymentId: string;
  donorId: string;
  donorName: string;
  donorMobile: string;
  donorAddress?: string;
  amount: number;
  amountInWordsMarathi: string;
  amountInWordsEnglish: string;
  paymentMethod: PaymentMethod;
  status?: PaymentStatus; // 'DUE' or 'PAID'
  transactionReference?: string;
  date: string;
  hostName: string;
  mode: AppMode;
  imageFileId?: string;
  generatedAt: string;
}

export interface Announcement {
  id: string;
  titleMarathi: string;
  titleEnglish?: string;
  titleOriginal?: string;
  contentMarathi: string;
  contentEnglish?: string;
  contentOriginal?: string;
  date: string;
  time?: string;
  active: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  eventDate?: string;
  venue?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType?: 'PAYMENT' | 'PAVTI' | 'DONOR' | 'SETTINGS' | 'USER' | 'ANNOUNCEMENT' | 'EXPENSE' | 'SYSTEM';
  entityId?: string;
  details: string;
  mode: AppMode;
  ipAddress?: string;
  timestamp: string;
}

export interface Expense {
  id: string;
  expenseNumber?: string; // Formatted number e.g. "EXP-001" or "EXP-0001"
  numericExpenseNumber?: number; // 1, 2, 3...
  date: string; // YYYY-MM-DD
  spentFor: string; // खर्च कशासाठी (Mandap, Decoration, Lighting, Prasad, Flower, Dhol/Band, Other/Custom)
  description?: string; // तपशील
  amount: number; // रक्कम
  vendorPerson?: string; // Vendor / Person (व्यक्ती / व्यापारी)
  note?: string; // Note / टीप
  addedBy: string; // Name of Admin / Super Admin
  addedById?: string;
  userRole?: UserRole;
  mode: AppMode;
  createdAt: string;
  updatedAt: string;
}

export interface DailyExpenseRecord {
  date: string; // YYYY-MM-DD
  formattedDate: string; // DD/MM/YYYY
  totalExpense: number;
  expenseCount: number;
}

export interface ExpenseSummary {
  todayExpense: number;
  totalExpense: number;
  yesterdayExpense: number;
  thisMonthExpense: number;
  todayBalance?: number; // Today's Collection minus Today's Expenses
  totalBalance?: number; // Total Collection minus Total Expenses
  mode: AppMode;
  dailyHistory?: DailyExpenseRecord[];
}

export interface DailyCollectionRecord {
  date: string; // YYYY-MM-DD
  formattedDate: string; // DD/MM/YYYY
  cashCollection: number;
  upiCollection: number;
  totalCollection: number;
  receiptCount: number;
}

export interface CollectionSummary {
  totalCollection: number | null;
  todayCollection: number | null;
  yesterdayCollection: number | null;
  thisWeekCollection: number | null;
  thisMonthCollection: number | null;
  currentYearCollection: number | null;
  paidPavtisCount: number;
  pendingAmount: number; // Sum of active DUE / PENDING
  pendingDonorsCount: number; // Count of active DUE / PENDING
  partiallyPaidAmount: number;
  cashCollection: number | null;
  upiCollection: number | null;
  otherCollection: number | null;
  mode: AppMode;
  dailyHistory?: DailyCollectionRecord[];
}

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

