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
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'UPI' | 'OTHER';

export interface Payment {
  id: string;
  receiptNumber?: string; // Formatted e.g. "000001" - only set when status is PAID
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
  createdAt: string;
  updatedAt: string;
}

export interface Pavti {
  id: string;
  receiptNumber: string;
  paymentId: string;
  donorId: string;
  donorName: string;
  donorMobile: string;
  amount: number;
  amountInWordsMarathi: string;
  amountInWordsEnglish: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  date: string;
  hostName: string;
  mode: AppMode;
  imageFileId?: string; // Storage reference if backed up to Drive
  generatedAt: string;
}

export interface Announcement {
  id: string;
  titleMarathi: string;
  titleEnglish?: string;
  contentMarathi: string;
  contentEnglish?: string;
  date: string;
  active: boolean;
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
  entityType?: 'PAYMENT' | 'PAVTI' | 'DONOR' | 'SETTINGS' | 'USER' | 'ANNOUNCEMENT' | 'SYSTEM';
  entityId?: string;
  details: string;
  mode: AppMode;
  ipAddress?: string;
  timestamp: string;
}

export interface CollectionSummary {
  totalCollection: number;
  todayCollection: number;
  yesterdayCollection: number;
  thisWeekCollection: number;
  thisMonthCollection: number;
  currentYearCollection: number;
  paidPavtisCount: number;
  pendingAmount: number;
  pendingDonorsCount: number;
  partiallyPaidAmount: number;
  cashCollection: number;
  upiCollection: number;
  otherCollection: number;
  mode: AppMode;
}

export interface AuthSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}
