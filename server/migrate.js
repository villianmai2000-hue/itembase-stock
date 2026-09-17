import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'store.json');

async function run() {
  const uri = process.argv[2] || process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ กรุณาระบุ MongoDB Connection String:');
    console.error('   node server/migrate.js "mongodb+srv://user:pass@cluster..."');
    process.exit(1);
  }

  console.log('📦 กำลังอ่านข้อมูลสต็อกและพนักงานจาก store.json...');
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  const store = JSON.parse(raw);
  console.log(`- รายการสินค้า: ${store.items?.length || 0} รายการ`);
  console.log(`- สมาชิกในทีม: ${store.team_members?.length || 0} คน`);
  console.log(`- สถานที่: ${store.locations?.length || 0} แห่ง`);
  console.log(`- หมวดหมู่: ${store.categories?.length || 0} หมวด`);

  console.log('🔄 กำลังเชื่อมต่อกับ MongoDB Atlas...');
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB || 'itembase';
  const col = client.db(dbName).collection('store');

  console.log('🚀 กำลังบันทึกข้อมูลทั้งหมดขึ้น MongoDB Atlas...');
  await col.replaceOne(
    { _id: 'main_store' },
    { _id: 'main_store', ...store, migratedAt: new Date().toISOString() },
    { upsert: true }
  );

  console.log('✅ ย้ายข้อมูลทั้งหมดขึ้น MongoDB Atlas สำเร็จ 100%!');
  await client.close();
}

run().catch(err => {
  console.error('❌ เกิดข้อผิดพลาด:', err.message);
  process.exit(1);
});
