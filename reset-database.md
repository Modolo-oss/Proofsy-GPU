# Reset Database Data di Vercel

## 🎯 Cara Mengosongkan Data Database

### **1. Via Vercel Dashboard (Recommended)**

1. **Login ke Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Pilih project ProofsyGPU

2. **Akses Database**
   - Klik tab "Storage"
   - Pilih database yang digunakan (Postgres/Neon)

3. **Reset Data**
   - Klik "Settings" pada database
   - Pilih "Reset Database"
   - Konfirmasi reset (akan menghapus semua data tapi tetap struktur table)

### **2. Via SQL Commands (Manual)**

**Connect ke Database:**
```bash
# Install psql jika belum ada
# Windows: Download PostgreSQL installer
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Connect ke database
psql "postgresql://username:password@host:port/database"
```

**Reset Data Commands:**
```sql
-- Hapus semua data dari table JobReceipt
DELETE FROM "JobReceipt";

-- Reset auto-increment ID (jika ada)
-- ALTER SEQUENCE "JobReceipt_id_seq" RESTART WITH 1;

-- Verify data kosong
SELECT COUNT(*) FROM "JobReceipt";
```

### **3. Via Prisma (Programmatic)**

**Buat script reset:**
```javascript
// reset-db.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Delete all JobReceipt records
    const deletedCount = await prisma.jobReceipt.deleteMany();
    
    console.log(`✅ Deleted ${deletedCount.count} records`);
    console.log('🎉 Database reset complete!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
```

**Run script:**
```bash
node reset-db.js
```

### **4. Via Vercel CLI**

**Connect ke database:**
```bash
# Install Vercel CLI jika belum
npm i -g vercel

# Login
vercel login

# Connect ke database
vercel db connect

# Run SQL command
vercel db execute "DELETE FROM \"JobReceipt\";"
```

### **5. Via Neon Dashboard (Jika pakai Neon)**

1. **Login ke Neon Dashboard**
   - Go to: https://console.neon.tech/
   - Pilih project

2. **SQL Editor**
   - Klik "SQL Editor"
   - Run command: `DELETE FROM "JobReceipt";`

3. **Verify**
   - Run: `SELECT COUNT(*) FROM "JobReceipt";`
   - Should return 0

## ⚠️ **Peringatan**

- **Backup Data**: Pastikan backup data penting sebelum reset
- **Production**: Jangan reset database production tanpa persetujuan
- **Dependencies**: Pastikan tidak ada foreign key constraints yang error

## 🔍 **Verifikasi Reset**

```sql
-- Check if data is empty
SELECT COUNT(*) FROM "JobReceipt";

-- Check table structure still exists
\d "JobReceipt"

-- List all tables
\dt
```

## 🚀 **Quick Reset Commands**

**Single Command:**
```bash
# Via psql
psql "postgresql://username:password@host:port/database" -c "DELETE FROM \"JobReceipt\";"

# Via Vercel CLI
vercel db execute "DELETE FROM \"JobReceipt\";"
```

**Multiple Tables (jika ada):**
```sql
-- Reset multiple tables
DELETE FROM "JobReceipt";
DELETE FROM "OtherTable";
-- Add more tables as needed
```
