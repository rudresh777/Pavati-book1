# ⚡ Supabase Database & Backend Setup Guide (सुपाबेस डेटाबेस सेटअप)

This guide walks you through connecting your **Digital Pavti Book (डिजिटल पावती पुस्तक)** application to **Supabase** (PostgreSQL cloud database) for real-time synchronization across multiple devices, automatic atomic receipt numbering, and multi-user access.

---

## 🎯 What You Get With Supabase
- 🌐 **Multi-Device Sync**: Multiple Mandal volunteers/hosts can create receipts at the same time without conflicts.
- 🔢 **Atomic Sequential Numbers**: Guaranteed sequential receipt numbering (`000001`, `000002`, etc.) even under heavy concurrent load.
- 🔒 **Secure Cloud Storage**: Data is safely stored in PostgreSQL with automated backups.
- 💸 **100% Free Tier**: Supabase includes generous free limits (500 MB database, 50,000 monthly active users, 2 GB storage).

---

## 🚀 Step-by-Step Setup (सोप्या पायऱ्या)

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **Start your project** (or **Sign in** with GitHub / Email).
2. Click **New Project**.
3. Fill in the project details:
   - **Name**: `Digital-Pavti-Book` (or your Mandal name e.g., `Morya-Mandal-Akola`)
   - **Database Password**: Set a strong password (save it safely).
   - **Region**: Select **South Asia (Mumbai - ap-south-1)** for the fastest speed in India.
4. Click **Create new project** and wait ~1 minute for Supabase to provision your database.

---

### Step 2: Run the Database Schema (SQL Script)
1. In the Supabase Dashboard, click on **SQL Editor** (icon `>_` in the left sidebar).
2. Click **New Query**.
3. Open the file [`supabase/schema.sql`](supabase/schema.sql) from this project repository, copy all the SQL content, and paste it into the Supabase SQL Editor.
4. Click **Run** (or press `Ctrl + Enter`).
5. You should see `Success. No rows returned`. All tables (`mandal_settings`, `users`, `donors`, `payments`, `pavtis`, `announcements`, `audit_logs`, `receipt_counters`) and functions are now created!

---

### Step 3: Get Your API Keys
1. In the Supabase Dashboard, go to **Project Settings** (gear icon ⚙️ in the left sidebar) $\rightarrow$ **API**.
2. Copy the following 3 values:
   - **Project URL**: (e.g. `https://xyzcompany.supabase.co`)
   - **anon / public key**: (starts with `eyJhbGci...`)
   - **service_role key**: (Click **Reveal** on `service_role` secret key $\rightarrow$ starts with `eyJhbGci...`)

---

### Step 4: Configure `.env.local`
In the root directory of your project, open or create `.env.local` and paste your keys:

```env
# Storage Provider
STORAGE_PROVIDER=supabase

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key-here
```

---

### Step 5: Migrate Existing Data (One-Click Migration)
To port all your existing data (settings, users, donors, payments, and receipts) from `data/mandal_database.json` to Supabase:

Run the following command in your terminal:

```powershell
npm run migrate:supabase
```

Output:
```
================================================================
🚀 Digital Pavti Book - Supabase Data Migration Tool
================================================================

📂 Read data from: data/mandal_database.json

⚙️  Migrating Mandal Settings...
  ✅ Mandal Settings migrated successfully.

👥 Migrating 2 Users...
  ✅ Migrated 2 users.

🙏 Migrating Donors...
  ✅ Migrated donors.

💳 Migrating Payments...
  ✅ Migrated payments.

🧾 Migrating Pavtis...
  ✅ Migrated pavtis.

📢 Migrating Announcements...
  ✅ Migrated announcements.

🔢 Syncing Sequential Receipt Counters...
  ✅ Receipt Counters synchronized.

================================================================
🎉 Migration Completed Successfully!
================================================================
```

---

### Step 6: Start Your Application
Start your Next.js development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will now read and write directly to Supabase!

---

## 🛡️ Default Login Credentials
After running the SQL schema / migration, default logins are:

| Role | Email | Default Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@mandal.org` | `admin123` |
| **Field Host** | `host@mandal.org` | `host123` |

*(You can change passwords and add new volunteers/hosts anytime in Settings / User Management).*
