# 📜 Google Sheets & Google Drive Storage Setup Guide (₹0 Cost)

This guide explains how to connect your **Digital Pavti Book** application to a dedicated Google Account using **Google Sheets** for structured collection records and **Google Drive** for Pavti image backups, at **₹0 operational cost**.

---

## 🎯 Architecture Summary

| Component | Storage Medium | Pricing |
| :--- | :--- | :--- |
| **Donors & Payments** | Google Sheets API v4 | **Free** (Included with Google Account) |
| **Pavti Images / Backups** | Google Drive API v3 | **Free** (15 GB standard Google storage) |
| **Authentication** | Server-side Service Account | **Free** (Secure server-to-server OAuth) |

---

## 🚀 Step-by-Step Configuration

### Step 1: Create a Dedicated Google Cloud Project
1. Log into your Mandal's Google Account and open [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Create Project**, name it **`Mandal-Pavti-Book`**, and click **Create**.

### Step 2: Enable Google Sheets & Drive APIs
1. In Google Cloud Console, navigate to **APIs & Services** $\rightarrow$ **Library**.
2. Search for **`Google Sheets API`** and click **Enable**.
3. Search for **`Google Drive API`** and click **Enable**.

### Step 3: Create Service Account Credentials
1. Go to **APIs & Services** $\rightarrow$ **Credentials**.
2. Click **Create Credentials** $\rightarrow$ **Service Account**.
3. Set Service Account Name: `mandal-pavti-bot`
4. Click **Create and Continue**, and finish the wizard.
5. In the Service Accounts list, click on the newly created service account email.
6. Navigate to the **Keys** tab $\rightarrow$ **Add Key** $\rightarrow$ **Create New Key** $\rightarrow$ choose **JSON** format.
7. Download the JSON key file to your computer.

### Step 4: Create and Share the Google Spreadsheet
1. Open [Google Sheets](https://sheets.google.com/) and create a new blank spreadsheet.
2. Title it: **`Mandal_Pavti_Records_2026`**.
3. Click the **Share** button in the top-right corner.
4. Paste the **Service Account Email** (from Step 3) and grant **Editor** permissions.
5. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`

### Step 5: (Optional) Create a Google Drive Backup Folder
1. Open [Google Drive](https://drive.google.com/) and create a folder named **`Pavti_Image_Backups`**.
2. Click **Share** on this folder and share it with the **Service Account Email** as **Editor**.
3. Copy the **Folder ID** from the URL.

### Step 6: Configure Environment Variables
Open `.env.local` in your project and configure:

```env
STORAGE_PROVIDER=google
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=mandal-pavti-bot@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

---

## 🔒 Security Best Practices
- **Never commit `.env.local` or service account JSON files to Git.**
- **Never expose service account keys or Google API secrets to client-side code.**
- The application automatically uses least-privilege OAuth scopes (`spreadsheets` and `drive.file`).
