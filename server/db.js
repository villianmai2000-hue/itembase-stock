import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

let cachedDb = null;
let mongoClient = null;
let mongoCollection = null;
let isMongoConnected = false;
let mongoConnectingPromise = null;

const MONGODB_URI = process.env.MONGODB_URI;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initial Seed Data
const defaultSeed = {
  team_members: [
    { id: "TM-01", name: "ยุทธการ คำกลอน", role: "ผู้ควบคุมระบบ / หัวหน้างาน", phone: "081-234-5678", password: "0962033005Maiiam2000", isAdmin: true, status: "active" },
    { id: "TM-02", name: "สมชาย ใจดี", role: "หัวหน้าช่างโครงสร้าง", phone: "082-345-6789", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-03", name: "อนุชา มั่นคง", role: "ช่างเชื่อมและเหล็ก", phone: "083-456-7890", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-04", name: "วิชาญ รุ่งเรือง", role: "ช่างไฟฟ้าหน้างาน", phone: "084-567-8901", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-05", name: "ประเสริฐ สุขสม", role: "ช่างปูนและฉาบ", phone: "085-678-9012", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-06", name: "ธนกร ก่อเกียรติ", role: "ช่างไม้และแบบหล่อ", phone: "086-789-0123", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-07", name: "มานพ วงศ์วิวัฒน์", role: "ช่างทั่วไป / ตรวจรับของ", phone: "087-890-1234", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-08", name: "นพพร กล้าหาญ", role: "ผู้ควบคุมความปลอดภัย (จป.)", phone: "088-901-2345", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-09", name: "ธีรพล พงษ์ศิริ", role: "ฝ่ายประสานงานและจัดซื้อ", phone: "089-012-3456", password: "1234", isAdmin: false, status: "active" }
  ],
  locations: [
    "โกดังใหญ่ ( ออฟฟิศ )",
    "ไซต์งาน อาคาร A",
    "ไซต์งาน อาคาร B",
    "ตู้เก็บเครื่องมือช่าง (Tool Locker)",
    "รถกระบะขนส่งอุปกรณ์ (Service Truck)"
  ],
  categories: [
    "หมวดเครื่องมือไฟฟ้าและอุปกรณ์มูลค่าสูง (High-Value Power Tools)",
    "หมวดอุปกรณ์นั่งร้านและโครงสร้างชั่วคราว (Scaffolding & Temporary Structures)",
    "หมวดเครื่องมือช่างพื้นฐานประจำกาย (Hand Tools & Consumables)",
    "หมวดวัสดุเหลือใช้และเคมีภัณฑ์ (Leftover Materials & Chemicals)",
    "หมวดอุปกรณ์ความปลอดภัยและอำนวยความสะดวก (Safety & Site Amenities)"
  ],
  items: [
    {
      id: "ITM-001",
      name: "สว่านโรตารี่ 3 ระบบ 800W",
      category: "หมวดเครื่องมือไฟฟ้าและอุปกรณ์มูลค่าสูง (High-Value Power Tools)",
      quantity: 4,
      unit: "ตัว",
      minStock: 2,
      location: "ตู้เก็บเครื่องมือช่าง (Tool Locker)",
      image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop&q=60",
      note: "สว่านเจาะคอนกรีต พร้อมชุดดอกสว่าน SDS-Plus",
      updatedAt: new Date().toISOString(),
      updatedBy: "ยุทธการ คำกลอน"
    },
    {
      id: "ITM-002",
      name: "หมวกนิรภัยสีขาว มอก. (Safety Helmet)",
      category: "หมวดอุปกรณ์ความปลอดภัยและอำนวยความสะดวก (Safety & Site Amenities)",
      quantity: 15,
      unit: "ใบ",
      minStock: 5,
      location: "คลังพัสดุหลัก (Main Warehouse)",
      image: "https://images.unsplash.com/photo-1578873375969-d65274944d18?w=500&auto=format&fit=crop&q=60",
      note: "สำหรับวิศวกรและผู้ควบคุมงาน",
      updatedAt: new Date().toISOString(),
      updatedBy: "ยุทธการ คำกลอน"
    },
    {
      id: "ITM-003",
      name: "ลวดผูกเหล็ก เบอร์ 18",
      category: "หมวดเครื่องมือช่างพื้นฐานประจำกาย (Hand Tools & Consumables)",
      quantity: 8,
      unit: "ม้วน",
      minStock: 3,
      location: "คลังพัสดุหลัก (Main Warehouse)",
      image: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=500&auto=format&fit=crop&q=60",
      note: "ม้วนละประมาณ 2.5 - 3.0 กก.",
      updatedAt: new Date().toISOString(),
      updatedBy: "ยุทธการ คำกลอน"
    },
    {
      id: "ITM-004",
      name: "ไฟสปอร์ตไลท์ LED 100W สนาม",
      category: "หมวดเครื่องมือไฟฟ้าและอุปกรณ์มูลค่าสูง (High-Value Power Tools)",
      quantity: 2,
      unit: "ชุด",
      minStock: 3,
      location: "ไซต์งานก่อสร้าง อาคาร A",
      image: "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=500&auto=format&fit=crop&q=60",
      note: "สำหรับส่องสว่างเวลางานกลางคืนหรือชั้นใต้ดิน",
      updatedAt: new Date().toISOString(),
      updatedBy: "ยุทธการ คำกลอน"
    },
    {
      id: "ITM-005",
      name: "บันไดอลูมิเนียมทรง A ยืดหดได้ 2 เมตร",
      category: "หมวดอุปกรณ์นั่งร้านและโครงสร้างชั่วคราว (Scaffolding & Temporary Structures)",
      quantity: 3,
      unit: "ตัว",
      minStock: 1,
      location: "ตู้เก็บเครื่องมือช่าง (Tool Locker)",
      image: "https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=500&auto=format&fit=crop&q=60",
      note: "รับน้ำหนักได้สูงสุด 150 กิโลกรัม",
      updatedAt: new Date().toISOString(),
      updatedBy: "ยุทธการ คำกลอน"
    }
  ],
  tasks: [
    {
      id: "TSK-001",
      title: "เทคานชั้น 2 อาคาร A และตรวจการเข้าแบบ",
      description: "ผูกเหล็กเสริมและเข้าแบบหล่อคานชั้น 2 พร้อมเทคอนกรีตผสมเสร็จ",
      status: "in_progress",
      priority: "high",
      assignee: "สมชาย ใจดี",
      dueDate: "2026-09-15",
      createdAt: new Date().toISOString(),
      createdBy: "ยุทธการ คำกลอน",
      materials: [
        {
          itemId: "ITM-003",
          itemName: "ลวดผูกเหล็ก เบอร์ 18",
          quantity: 2,
          unit: "ม้วน",
          status: "issued", // pending, issued, returned
          issuedAt: new Date().toISOString(),
          issuedBy: "ยุทธการ คำกลอน",
          returnedQuantity: 0,
          returnedAt: null
        }
      ]
    },
    {
      id: "TSK-002",
      title: "ติดตั้งระบบส่องสว่างชั่วคราวทางเดินอาคาร B",
      description: "เดินสายไฟพ่วงและติดตั้งไฟสปอร์ตไลท์ให้สว่างทั่วบริเวณ",
      status: "todo",
      priority: "urgent",
      assignee: "วิชาญ รุ่งเรือง",
      dueDate: "2026-09-12",
      createdAt: new Date().toISOString(),
      createdBy: "ยุทธการ คำกลอน",
      materials: [
        {
          itemId: "ITM-004",
          itemName: "ไฟสปอร์ตไลท์ LED 100W สนาม",
          quantity: 1,
          unit: "ชุด",
          status: "pending",
          issuedAt: null,
          issuedBy: null,
          returnedQuantity: 0,
          returnedAt: null
        }
      ]
    },
    {
      id: "TSK-003",
      title: "ตรวจเช็คอุปกรณ์ความปลอดภัยหน้างานประจำสัปดาห์",
      description: "ตรวจสอบหมวกนิรภัยและรองเท้าเซฟตี้ของคนงานทุกคนก่อนเข้าพื้นที่",
      status: "review",
      priority: "normal",
      assignee: "นพพร กล้าหาญ",
      dueDate: "2026-09-10",
      createdAt: new Date().toISOString(),
      createdBy: "ยุทธการ คำกลอน",
      materials: []
    }
  ],
  inventory_logs: [
    {
      id: "LOG-001",
      itemId: "ITM-003",
      itemName: "ลวดผูกเหล็ก เบอร์ 18",
      type: "issue",
      changeQty: -2,
      balanceQty: 8,
      location: "ไซต์งานก่อสร้าง อาคาร A",
      previousLocation: "คลังพัสดุหลัก (Main Warehouse)",
      referenceType: "task",
      referenceId: "TSK-001",
      user: "ยุทธการ คำกลอน",
      note: "เบิกไปใช้ในงาน: เทคานชั้น 2 อาคาร A และตรวจการเข้าแบบ",
      timestamp: new Date().toISOString()
    }
  ]
};

// Generate QR Code data URL
export async function generateQRCode(text) {
  try {
    return await QRCode.toDataURL(text, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return null;
  }
}

// Connect to MongoDB Atlas (if MONGODB_URI configured)
export async function connectMongo() {
  if (!MONGODB_URI) return null;
  if (mongoCollection && isMongoConnected) return mongoCollection;
  if (mongoConnectingPromise) return mongoConnectingPromise;

  mongoConnectingPromise = (async () => {
    try {
      console.log('[MongoDB] กำลังเชื่อมต่อกับ MongoDB Atlas Cloud Database...');
      mongoClient = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000
      });
      await mongoClient.connect();
      const dbName = process.env.MONGODB_DB || 'itembase';
      const db = mongoClient.db(dbName);
      mongoCollection = db.collection('store');
      isMongoConnected = true;
      console.log('✅ [MongoDB] เชื่อมต่อ MongoDB Atlas สำเร็จ! ฐานข้อมูลคลาวด์ถาวรพร้อมใช้งานตลอด 24 ชม.');
      return mongoCollection;
    } catch (err) {
      console.warn('⚠️ [MongoDB] เชื่อมต่อ MongoDB ไม่สำเร็จ กำลังใช้ไฟล์บนเครื่องแทน:', err.message);
      isMongoConnected = false;
      mongoCollection = null;
      return null;
    } finally {
      mongoConnectingPromise = null;
    }
  })();

  return mongoConnectingPromise;
}

// Read local file fallback
function readLocalDb() {
  if (!fs.existsSync(DB_FILE)) {
    saveLocalDb(defaultSeed);
    return defaultSeed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local db:', err);
    return defaultSeed;
  }
}

// Save local file
function saveLocalDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local db:', err);
  }
}

// Read DB (Memory -> Cloud/Local)
export function readDb() {
  if (cachedDb) {
    return cachedDb;
  }
  cachedDb = readLocalDb();
  return cachedDb;
}

// Save DB (Memory + Local File + Cloud MongoDB)
export function saveDb(data) {
  cachedDb = data;
  saveLocalDb(data);

  // Sync to MongoDB Atlas asynchronously
  if (mongoCollection && isMongoConnected) {
    mongoCollection.replaceOne(
      { _id: 'main_store' },
      { _id: 'main_store', ...data, savedAt: new Date().toISOString() },
      { upsert: true }
    ).catch(err => {
      console.error('⚠️ [MongoDB] Async save error:', err.message);
    });
  } else if (MONGODB_URI) {
    // Try reconnecting in background and save
    connectMongo().then(col => {
      if (col) {
        col.replaceOne(
          { _id: 'main_store' },
          { _id: 'main_store', ...data, savedAt: new Date().toISOString() },
          { upsert: true }
        ).catch(() => {});
      }
    });
  }
}

// Initialize database with QR codes & Cloud Sync
export async function initDatabase() {
  // 1. Read local file as base
  let data = readLocalDb();

  // 2. If MONGODB_URI is provided, sync from MongoDB Atlas
  if (MONGODB_URI) {
    try {
      const col = await connectMongo();
      if (col) {
        const doc = await col.findOne({ _id: 'main_store' });
        if (doc && Array.isArray(doc.items) && doc.items.length > 0) {
          // Cloud MongoDB has data! Use it as source of truth
          const { _id, ...cleanData } = doc;
          data = cleanData;
          saveLocalDb(data);
          console.log(`✅ [MongoDB] โหลดข้อมูล ${data.items.length} รายการจาก MongoDB Atlas เรียบร้อย!`);
        } else {
          // MongoDB is empty: seed it with local data
          console.log('[MongoDB] ฐานข้อมูลคลาวด์ยังว่างอยู่ กำลังอัปโหลดข้อมูลเริ่มต้นขึ้นคลาวด์...');
          await col.replaceOne(
            { _id: 'main_store' },
            { _id: 'main_store', ...data, updatedAt: new Date().toISOString() },
            { upsert: true }
          );
          console.log(`✅ [MongoDB] บันทึกข้อมูลเริ่มต้น ${data.items.length} รายการขึ้น MongoDB Atlas สำเร็จ!`);
        }
      }
    } catch (err) {
      console.error('⚠️ [MongoDB] Init sync failed:', err.message);
    }
  }

  cachedDb = data;

  // Ensure QR codes exist
  let modified = false;
  for (let item of data.items) {
    if (!item.qrCode) {
      item.qrCode = await generateQRCode(item.id);
      modified = true;
    }
  }

  if (modified) {
    saveDb(data);
  }
  return data;
}

// Reset database
export async function resetDatabase() {
  const cloned = JSON.parse(JSON.stringify(defaultSeed));
  for (let item of cloned.items) {
    item.qrCode = await generateQRCode(item.id);
  }
  saveDb(cloned);
  return cloned;
}

// Get DB status (for UI display and diagnostics)
export function getDbStatus() {
  return {
    isCloud: isMongoConnected,
    mode: isMongoConnected ? 'mongodb_atlas' : (MONGODB_URI ? 'connecting_mongodb' : 'local_file'),
    persistent: isMongoConnected,
    itemCount: cachedDb ? (cachedDb.items?.length || 0) : 0,
    hasMongoUri: !!MONGODB_URI
  };
}
