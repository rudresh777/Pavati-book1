# 🪔 डिजिटल पावती पुस्तक (Digital Pavti Book)

> **A Private Donation & Collection Management Web Application for Indian Ganpati Mandals**  
> Built with **Next.js (App Router), TypeScript, Tailwind CSS**, and a **₹0 Operational Cost Architecture**.

---

## 🌟 Key Features

1. **Digital Pavti Book Engine**:
   - Traditional printed receipt book digital aesthetic with Devanagari typography ("॥ श्री गणेशाय नमः ॥", "॥ गणपती बाप्पा मोरया ॥").
   - Real-time **Devanagari Marathi and English** amount-in-words converter (e.g. ₹ 501 $\rightarrow$ *"पाचशे एक रुपये फक्त"*).
   - High-resolution **real JPEG/JPG photo export** for instant mobile downloads and clipboard sharing.
   - **No fake or physical signatures** — uses an authentic digital "PAID / जमा" stamp and collector name.

2. **Sequential Transaction-Safe Receipt Numbering**:
   - Guaranteed unique, sequential receipt numbers (e.g. `000001`, `000002`).
   - Only confirmed **PAID** donations consume a receipt number.
   - Pending donations never consume numbers or artificially inflate collection totals.

3. **Pending Payment Management**:
   - Record promised donations on a pending list with expected amounts.
   - One-click **"Mark as Paid"** workflow with automatic receipt generation.

4. **Zero-Cost Compliance & WhatsApp Sharing**:
   - **₹0 Cost**: No paid databases, no paid servers, no paid WhatsApp Business APIs.
   - User-controlled **Web Share API** (native mobile sharing) and click-to-chat with respectful Marathi message formatting and optional Mandal WhatsApp Group invite link.
   - **Zero unofficial bots / zero spamming / 100% compliant**.

5. **Test Mode vs Live Mode Isolation**:
   - Prominent Test Mode warning banner.
   - Separate test database counters.
   - **"Clear All Test Data"** tool for Super Admin with dual-confirmation modal.

6. **Storage Abstraction (`StorageProvider`)**:
   - **LocalStorageProvider**: Works out-of-the-box with zero configuration using local file-backed JSON database.
   - **GoogleStorageProvider**: Connect to Google Sheets & Google Drive for ₹0 cloud backups (see [GOOGLE_SHEETS_SETUP.md](file:///GOOGLE_SHEETS_SETUP.md)).

---

## 🚀 Quick Start (Local Run)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Initial Login Credentials

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@mandal.org` | `admin123` | Full Access (Settings, Users, Backup, Logs, Collections) |
| **Host (प्रतिनिधी)** | `host@mandal.org` | `host123` | Receipts, Pending list, Donors, Sharing |

---

## 📁 Project Architecture

```
├── app/
│   ├── page.tsx                  # Public Mandal Homepage
│   ├── announcements/page.tsx    # Public Announcements
│   ├── login/page.tsx            # Secure Role-based Sign In
│   ├── dashboard/page.tsx        # Collection KPIs & Dashboard
│   ├── pavti/
│   │   ├── new/page.tsx          # Rapid Pavti Generation Form
│   │   └── [id]/page.tsx         # Single Pavti View & Download
│   ├── pending/page.tsx          # Pending Payments & Mark as Paid
│   ├── donors/
│   │   ├── page.tsx              # Donors Directory & Search
│   │   └── [id]/page.tsx         # Donor Profile & Pavti History
│   ├── payments/page.tsx         # Complete Collection Ledger & CSV Export
│   ├── settings/
│   │   ├── mandal/page.tsx       # Mandal Info & Designation Toggles
│   │   ├── users/page.tsx        # Host & Admin Management
│   │   ├── storage/page.tsx      # Storage Architecture & Docs
│   │   └── backup/page.tsx       # JSON Backup & Clear Test Data
│   ├── announcements/manage/     # Announcement CMS
│   ├── audit-log/page.tsx        # Activity Trail
│   ├── api/                      # Backend REST API Routes
│   ├── layout.tsx                # Root layout with Devanagari fonts
│   └── globals.css               # Mandal theme tokens & Pavti borders
├── components/
│   ├── ui/                       # Accessible Button, Input, Modal, Card, Badge
│   ├── pavti/
│   │   ├── PavtiCard.tsx         # Traditional printed receipt component
│   │   └── PavtiShareModal.tsx   # JPEG Generator & WhatsApp share
│   └── layout/
│       ├── Navbar.tsx            # Responsive navigation & mobile drawer
│       ├── Footer.tsx            # Public & Private footer
│       └── TestModeBanner.tsx    # Test mode indicator
├── lib/
│   ├── auth/                     # JWT session cookies & guards
│   ├── storage/                  # Storage abstraction (Local & Google)
│   ├── utils/                    # Marathi Number-to-Words & currency
│   └── context/                  # React AppMode & Session Context
├── types/index.ts                # TypeScript Domain Interfaces
└── GOOGLE_SHEETS_SETUP.md        # Google Cloud zero-cost guide
```

---

## 🌐 Production Deployment (Free)

1. Push your repository to **GitHub**.
2. Go to [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/) and import the repository.
3. Configure the environment variables in your deployment dashboard:
   - `AUTH_SECRET`: A secure 32+ character random string.
   - `STORAGE_PROVIDER`: `local` or `google`.
4. Deploy! Your Mandal Pavti Book will be live at a free `https://*.vercel.app` URL.
