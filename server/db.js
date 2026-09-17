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
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ? process.env.GITHUB_TOKEN.trim() : null;
const GITHUB_REPO = process.env.GITHUB_REPO ? process.env.GITHUB_REPO.trim() : 'villianmai2000-hue/itembase-stock';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH ? process.env.GITHUB_BRANCH.trim() : 'data';
const GITHUB_FILE_PATH = 'server/data/store.json';

let isGitHubConnected = false;
let gitHubSha = null;
let gitHubLastSync = null;
let gitHubSyncError = null;
let syncTimer = null;
let isSyncingToGitHub = false;
let pendingGitHubSync = false;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Initial Seed Data
const defaultSeed = {
  team_members: [
    { id: "TM-01", name: "ยุทธการ คำกลอน", role: "ผู้ควบคุมระบบ / เขียนแบบโครงการ", phone: "0643032859", password: "0962033005Maiiam2000", isAdmin: true, status: "active" },
    { id: "TM-10", name: "สมโภช สุทินธุ์", role: "ช่างประสานงานและฝ่ายจัดส่งสินค้า", phone: "-", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-04", name: "นายวีรศักดิ์ อนุพันธ์", role: "ผู้จัดการโครงการ", phone: "-", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-05", name: "Leena", role: "เจ้าหน้าที่นับและตรวจสต็อก", phone: "-", password: "1234", isAdmin: false, status: "active" },
    { id: "TM-06", name: "คุณอำภาพร สำลีม่วง", role: "งานสโตร์", phone: "-", password: "1234", isAdmin: false, status: "active" }
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

// ====================================================
// GitHub Cloud Database Integration
// ====================================================

// Fetch store.json from GitHub branch (defaults to 'data' branch)
export async function fetchFromGitHub() {
  try {
    const headers = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'itembase-stock-app'
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    console.log(`[GitHub DB] กำลังดึงข้อมูลจาก GitHub (${GITHUB_REPO}, branch: ${GITHUB_BRANCH})...`);
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`, {
      headers
    });

    if (res.status === 200) {
      const data = await res.json();
      gitHubSha = data.sha;
      const rawContent = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');
      const parsed = JSON.parse(rawContent);
      if (parsed && Array.isArray(parsed.items)) {
        isGitHubConnected = !!GITHUB_TOKEN;
        gitHubSyncError = null;
        gitHubLastSync = new Date().toISOString();
        console.log(`✅ [GitHub DB] โหลดข้อมูล ${parsed.items.length} รายการจาก GitHub สำเร็จ! (SHA: ${gitHubSha.slice(0, 7)})`);
        return parsed;
      }
    } else if (res.status === 404) {
      console.log(`ℹ️ [GitHub DB] ยังไม่พบไฟล์บน branch "${GITHUB_BRANCH}" (จะสร้างให้อัตโนมัติเมื่อบันทึก)`);
      return null;
    } else {
      const errText = await res.text();
      console.warn(`⚠️ [GitHub DB] ดึงข้อมูลไม่สำเร็จ (HTTP ${res.status}):`, errText);
      gitHubSyncError = `HTTP ${res.status}`;
      return null;
    }
  } catch (err) {
    console.error('⚠️ [GitHub DB] เกิดข้อผิดพลาดในการเชื่อมต่อ GitHub:', err.message);
    gitHubSyncError = err.message;
    return null;
  }
}

// Push store.json to GitHub branch
export async function pushToGitHub(data) {
  if (!GITHUB_TOKEN) {
    return { success: false, error: 'ไม่มี GITHUB_TOKEN' };
  }

  if (isSyncingToGitHub) {
    pendingGitHubSync = true;
    return { success: false, pending: true };
  }

  isSyncingToGitHub = true;
  pendingGitHubSync = false;

  try {
    // If SHA is missing, fetch current SHA first
    if (!gitHubSha) {
      try {
        const checkRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`, {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'itembase-stock-app'
          }
        });
        if (checkRes.status === 200) {
          const fileInfo = await checkRes.json();
          gitHubSha = fileInfo.sha;
        }
      } catch (e) {
        console.warn('[GitHub DB] ไม่สามารถดึง SHA ล่าสุดได้:', e.message);
      }
    }

    const jsonStr = JSON.stringify(data, null, 2);
    const contentBase64 = Buffer.from(jsonStr, 'utf-8').toString('base64');

    const body = {
      message: `Update stock via web app [skip ci] (${new Date().toLocaleString('th-TH')})`,
      content: contentBase64,
      branch: GITHUB_BRANCH
    };
    if (gitHubSha) {
      body.sha = gitHubSha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'itembase-stock-app',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (putRes.status === 200 || putRes.status === 201) {
      const resData = await putRes.json();
      gitHubSha = resData.content?.sha || gitHubSha;
      gitHubLastSync = new Date().toISOString();
      isGitHubConnected = true;
      gitHubSyncError = null;
      console.log(`✅ [GitHub DB] บันทึกข้อมูลขึ้น GitHub สำเร็จ! (Commit SHA: ${resData.commit?.sha?.slice(0, 7) || 'ok'})`);
      return { success: true, sha: gitHubSha };
    } else if (putRes.status === 409) {
      // 409 Conflict: Refresh SHA and retry once
      console.warn('[GitHub DB] เกิดข้อขัดแย้ง SHA (409 Conflict) กำลังดึง SHA ล่าสุดและลองใหม่อีกครั้ง...');
      const checkRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'itembase-stock-app'
        }
      });
      if (checkRes.status === 200) {
        const fileInfo = await checkRes.json();
        gitHubSha = fileInfo.sha;
        body.sha = gitHubSha;

        const retryRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'itembase-stock-app',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (retryRes.status === 200 || retryRes.status === 201) {
          const resData = await retryRes.json();
          gitHubSha = resData.content?.sha || gitHubSha;
          gitHubLastSync = new Date().toISOString();
          isGitHubConnected = true;
          gitHubSyncError = null;
          console.log(`✅ [GitHub DB Retry] บันทึกข้อมูลขึ้น GitHub สำเร็จหลังลองใหม่!`);
          return { success: true, sha: gitHubSha };
        }
      }
      return { success: false, error: 'SHA conflict retry failed' };
    } else {
      const errText = await putRes.text();
      console.error(`⚠️ [GitHub DB] บันทึกขึ้น GitHub ไม่สำเร็จ (HTTP ${putRes.status}):`, errText);
      gitHubSyncError = `HTTP ${putRes.status}`;
      return { success: false, error: `HTTP ${putRes.status}` };
    }
  } catch (err) {
    console.error('⚠️ [GitHub DB] ข้อยกเว้นในการบันทึกขึ้น GitHub:', err.message);
    gitHubSyncError = err.message;
    return { success: false, error: err.message };
  } finally {
    isSyncingToGitHub = false;
    if (pendingGitHubSync) {
      pendingGitHubSync = false;
      setTimeout(() => pushToGitHub(cachedDb || readLocalDb()), 500);
    }
  }
}

// Manual force sync to GitHub
export async function syncGitHubNow() {
  const data = cachedDb || readLocalDb();
  return await pushToGitHub(data);
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
      console.warn('⚠️ [MongoDB] เชื่อมต่อ MongoDB ไม่สำเร็จ:', err.message);
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

// Save DB (Memory + Local File + Cloud MongoDB Atlas / GitHub)
export function saveDb(data) {
  cachedDb = data;
  saveLocalDb(data);

  // 1. Primary: Save to MongoDB Atlas (Instant, high-performance real-time cloud database)
  if (mongoCollection && isMongoConnected) {
    mongoCollection.replaceOne(
      { _id: 'main_store' },
      { _id: 'main_store', ...data, savedAt: new Date().toISOString() },
      { upsert: true }
    ).catch(err => {
      console.error('⚠️ [MongoDB Atlas] Async save error:', err.message);
    });
  } else if (MONGODB_URI) {
    connectMongo().then(col => {
      if (col) {
        col.replaceOne(
          { _id: 'main_store' },
          { _id: 'main_store', ...data, savedAt: new Date().toISOString() },
          { upsert: true }
        ).catch(err => {
          console.error('⚠️ [MongoDB Atlas] Async save error:', err.message);
        });
      }
    });
  }

  // 2. Secondary/Fallback: Debounced async sync to GitHub (branch 'data') only when MongoDB is not active
  if (!MONGODB_URI && GITHUB_TOKEN) {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      pushToGitHub(data);
    }, 1500);
  }
}

// Initialize database with QR codes & Cloud Sync (MongoDB Atlas primary, GitHub fallback)
export async function initDatabase() {
  // 1. Read local file as base
  let data = readLocalDb();

  // 2. If MONGODB_URI is configured, prioritize MongoDB Atlas Cloud Database
  if (MONGODB_URI) {
    try {
      const col = await connectMongo();
      if (col) {
        const doc = await col.findOne({ _id: 'main_store' });
        if (doc && Array.isArray(doc.items) && doc.items.length > 0) {
          const { _id, ...cleanData } = doc;
          data = cleanData;
          saveLocalDb(data);
          console.log(`✅ [MongoDB Atlas] ซิงค์และโหลดข้อมูลล่าสุด ${data.items.length} รายการจาก MongoDB Atlas เรียบร้อย!`);
        } else {
          console.log('[MongoDB Atlas] ฐานข้อมูลคลาวด์ยังว่างอยู่ กำลังอัปโหลดข้อมูลเริ่มต้นและรายชื่อพนักงานขึ้น MongoDB...');
          await col.replaceOne(
            { _id: 'main_store' },
            { _id: 'main_store', ...data, updatedAt: new Date().toISOString() },
            { upsert: true }
          );
          console.log(`✅ [MongoDB Atlas] บันทึกข้อมูลเริ่มต้น ${data.items.length} รายการขึ้น MongoDB Atlas สำเร็จ!`);
        }
      }
    } catch (err) {
      console.error('⚠️ [MongoDB Atlas] ไม่สามารถเชื่อมต่อหรือดึงข้อมูลเริ่มต้นได้:', err.message);
    }
  } else if (GITHUB_TOKEN) {
    // 3. Fallback: If no MongoDB URI, sync with GitHub Cloud Database
    try {
      const remoteData = await fetchFromGitHub();
      if (remoteData && Array.isArray(remoteData.items) && remoteData.items.length > 0) {
        data = remoteData;
        saveLocalDb(data);
        console.log(`✅ [GitHub Cloud DB] ซิงค์และโหลดข้อมูลล่าสุด ${data.items.length} รายการจาก GitHub สำเร็จ!`);
      } else {
        console.log(`[GitHub Cloud DB] ยังไม่มีข้อมูลบน branch "${GITHUB_BRANCH}" กำลังอัปโหลดข้อมูลเริ่มต้นขึ้น GitHub...`);
        await pushToGitHub(data);
      }
    } catch (err) {
      console.error('⚠️ [GitHub Cloud DB] ซิงค์เริ่มต้นไม่สำเร็จ:', err.message);
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
  const isCloud = isMongoConnected || isGitHubConnected;
  let mode = 'local_file';
  let provider = 'Local File';

  if (isMongoConnected) {
    mode = 'mongodb_atlas';
    provider = 'MongoDB Atlas';
  } else if (isGitHubConnected) {
    mode = 'github_cloud';
    provider = 'GitHub';
  } else if (MONGODB_URI) {
    mode = 'connecting_mongodb';
    provider = 'MongoDB Atlas';
  } else if (GITHUB_TOKEN) {
    mode = 'connecting_github';
    provider = 'GitHub';
  }

  return {
    isCloud,
    mode,
    provider,
    persistent: isCloud,
    itemCount: cachedDb ? (cachedDb.items?.length || 0) : 0,
    hasMongoUri: !!MONGODB_URI,
    hasGitHubToken: !!GITHUB_TOKEN,
    gitHubRepo: GITHUB_REPO,
    gitHubBranch: GITHUB_BRANCH,
    gitHubLastSync,
    gitHubSyncError
  };
}
