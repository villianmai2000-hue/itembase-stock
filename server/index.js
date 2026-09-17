import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { spawn } from 'child_process';
import { readDb, saveDb, initDatabase, generateQRCode, resetDatabase, getDbStatus, syncGitHubNow } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Disable ETag generation so browser always receives fresh data
app.set('etag', false);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Disable browser caching for all API endpoints so reloads always fetch fresh data
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Database status & persistence mode endpoint
app.get('/api/db-status', (req, res) => {
  res.json(getDbStatus());
});

// Force manual sync to GitHub Cloud Database endpoint
app.post('/api/github/sync', async (req, res) => {
  try {
    const result = await syncGitHubNow();
    res.json({
      ...result,
      dbStatus: getDbStatus()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'item-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// multer middlewares
const uploadSingle = upload.single('imageFile');         // legacy single
const uploadMulti  = upload.array('imageFiles', 8);     // new multi-image (up to 8)
const uploadAny    = upload.any();                      // accepts any file fields (profileImage, coverImage, imageFiles, etc.)



// Helper to get Thai formatted timestamp
function getThaiTimestamp() {
  const now = new Date();
  return now.toISOString();
}

// Helper to safely extract and decode requester name from header/query/body
function getRequesterName(req) {
  const raw = req.headers['x-user-name'] || req.query.user || (req.body && req.body.requester) || '';
  try {
    return decodeURIComponent(raw).trim();
  } catch (e) {
    return String(raw).trim();
  }
}

// Helper to normalize names (collapses multi-spaces and lowercases for forgiving comparisons)
function normalizeName(str) {
  return (str || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// ----------------------------------------------------
// ITEMS API (วัสดุอุปกรณ์ & สต็อก)
// ----------------------------------------------------

// Get all items
app.get('/api/items', (req, res) => {
  const db = readDb();
  res.json(db.items || []);
});

// Get single item by ID or QR payload
app.get('/api/items/:id', (req, res) => {
  const db = readDb();
  const itemId = req.params.id.trim();
  const item = db.items.find(i => i.id.toLowerCase() === itemId.toLowerCase());
  if (!item) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลวัสดุอุปกรณ์นี้ในระบบ' });
  }
  res.json(item);
});

// Sync / restore items from client backup if server restarted without cloud DB
app.post('/api/items/sync', (req, res) => {
  try {
    const { items, logs } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'ไม่พบรายการข้อมูลที่จะซิงค์' });
    }
    const db = readDb();
    let updatedCount = 0;
    for (const clientItem of items) {
      const idx = db.items.findIndex(i => i.id.toLowerCase() === clientItem.id.toLowerCase());
      if (idx >= 0) {
        db.items[idx] = { ...db.items[idx], ...clientItem };
        updatedCount++;
      } else {
        db.items.unshift(clientItem);
        updatedCount++;
      }
    }
    if (Array.isArray(logs) && logs.length > 0) {
      for (const clientLog of logs) {
        if (!db.inventory_logs.some(l => l.id === clientLog.id)) {
          db.inventory_logs.unshift(clientLog);
        }
      }
    }
    saveDb(db);
    res.json({ message: `กู้คืนและซิงค์ข้อมูลสำเร็จ (${updatedCount} รายการ)`, items: db.items });
  } catch (err) {
    console.error('Error syncing items:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล' });
  }
});

// Add new item (with optional image upload or image URL – supports multiple images)
app.post('/api/items', uploadAny, async (req, res) => {
  try {
    const db = readDb();
    const { name, category, quantity, unit, minStock, location, note, user, imageUrl, customId, gps, existingImageUrls } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อวัสดุอุปกรณ์' });
    }

    let parsedGps = null;
    if (gps) {
      try {
        parsedGps = typeof gps === 'string' ? JSON.parse(gps) : gps;
      } catch (e) {
        parsedGps = null;
      }
    }

    // Determine ID
    let id = customId ? customId.trim() : null;
    if (!id) {
      const nextNum = (db.items.length + 1).toString().padStart(3, '0');
      id = `ITM-${nextNum}`;
      while (db.items.some(i => i.id === id)) {
        id = `ITM-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else {
      if (db.items.some(i => i.id.toLowerCase() === id.toLowerCase())) {
        return res.status(400).json({ error: `รหัสสินค้า ${id} มีอยู่ในระบบแล้ว` });
      }
    }

    // Build images array: uploaded files first, then existing URL images
    const uploadedImages = (req.files || []).map(f => `/uploads/${f.filename}`);

    let urlImages = [];
    if (existingImageUrls) {
      try {
        urlImages = typeof existingImageUrls === 'string' ? JSON.parse(existingImageUrls) : existingImageUrls;
      } catch (e) { urlImages = []; }
    } else if (imageUrl) {
      urlImages = [imageUrl];
    }

    // Handle base64 image (legacy fallback)
    if (uploadedImages.length === 0 && urlImages.length === 0 && req.body.imageBase64) {
      const matches = req.body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `item-${Date.now()}.jpg`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
        uploadedImages.push(`/uploads/${filename}`);
      }
    }

    const allImages = [...uploadedImages, ...urlImages];
    // Fallback default image
    const defaultImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60';

    // Generate QR code for this item ID
    const qrCode = await generateQRCode(id);

    const initialQty = Number(quantity) || 0;
    const itemLocation = (location && location.trim()) || 'โกดังใหญ่ ( ออฟฟิศ )';
    if (itemLocation && !db.locations.includes(itemLocation)) {
      db.locations.push(itemLocation);
    }

    const newItem = {
      id,
      name,
      category: category || 'ทั่วไป',
      quantity: initialQty,
      unit: unit || 'ชิ้น',
      minStock: Number(minStock) || 1,
      location: itemLocation,
      gps: parsedGps,
      image: allImages[0] || defaultImage,     // primary image (backward compat)
      images: allImages.length > 0 ? allImages : [defaultImage], // all images array
      note: note || '',
      qrCode,
      updatedAt: getThaiTimestamp(),
      updatedBy: user || 'ยุทธการ คำกลอน'
    };

    db.items.unshift(newItem);

    const logId = `LOG-${Date.now().toString().slice(-6)}`;
    db.inventory_logs.unshift({
      id: logId,
      itemId: id,
      itemName: name,
      type: 'add',
      changeQty: initialQty,
      balanceQty: initialQty,
      location: newItem.location,
      gps: parsedGps,
      previousLocation: '-',
      referenceType: 'manual',
      referenceId: '-',
      user: newItem.updatedBy,
      note: `ลงทะเบียนวัสดุอุปกรณ์ใหม่: ${name}`,
      timestamp: getThaiTimestamp()
    });

    saveDb(db);
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
});


// Update item details
app.put('/api/items/:id', uploadAny, async (req, res) => {
  try {
    const db = readDb();
    const itemId = req.params.id;
    const index = db.items.findIndex(i => i.id.toLowerCase() === itemId.toLowerCase());

    if (index === -1) {
      return res.status(404).json({ error: 'ไม่พบรายการที่ต้องการแก้ไข' });
    }

    const { name, category, quantity, unit, minStock, location, note, user, gps, existingImageUrls } = req.body;
    const current = db.items[index];

    let parsedGps = current.gps || null;
    if (gps) {
      try {
        parsedGps = typeof gps === 'string' ? JSON.parse(gps) : gps;
      } catch (e) {
        parsedGps = current.gps || null;
      }
    }

    // Build new images array
    const uploadedImages = (req.files || []).map(f => `/uploads/${f.filename}`);
    let urlImages = [];
    if (existingImageUrls) {
      try {
        urlImages = typeof existingImageUrls === 'string' ? JSON.parse(existingImageUrls) : existingImageUrls;
      } catch (e) { urlImages = []; }
    } else if (req.body.imageUrl) {
      urlImages = [req.body.imageUrl];
    }

    // Legacy base64 fallback
    if (uploadedImages.length === 0 && urlImages.length === 0 && req.body.imageBase64) {
      const matches = req.body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `item-${Date.now()}.jpg`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
        uploadedImages.push(`/uploads/${filename}`);
      }
    }

    // If new images provided, replace; otherwise keep current
    const allImages = [...uploadedImages, ...urlImages];
    const currentImages = current.images || (current.image ? [current.image] : []);
    const finalImages = allImages.length > 0 ? allImages : currentImages;
    const primaryImage = finalImages[0] || current.image;

    const oldQty = current.quantity;
    const newQty = quantity !== undefined ? Number(quantity) : current.quantity;
    const oldLocation = current.location;
    const newLocation = (location && location.trim()) || current.location;
    if (newLocation && !db.locations.includes(newLocation)) {
      db.locations.push(newLocation);
    }

    if (oldQty !== newQty || oldLocation !== newLocation) {
      const logId = `LOG-${Date.now().toString().slice(-6)}`;
      db.inventory_logs.unshift({
        id: logId,
        itemId: current.id,
        itemName: name || current.name,
        type: 'edit',
        changeQty: newQty - oldQty,
        balanceQty: newQty,
        location: newLocation,
        gps: parsedGps,
        previousLocation: oldLocation,
        referenceType: 'manual',
        referenceId: '-',
        user: user || 'ยุทธการ คำกลอน',
        note: `แก้ไขข้อมูลสต็อก/สถานที่โดยผู้ใช้`,
        timestamp: getThaiTimestamp()
      });
    }

    db.items[index] = {
      ...current,
      name: name !== undefined ? name : current.name,
      category: category !== undefined ? category : current.category,
      quantity: newQty,
      unit: unit !== undefined ? unit : current.unit,
      minStock: minStock !== undefined ? Number(minStock) : current.minStock,
      location: newLocation,
      gps: parsedGps,
      image: primaryImage,
      images: finalImages,
      note: note !== undefined ? note : current.note,
      updatedAt: getThaiTimestamp(),
      updatedBy: user || 'ยุทธการ คำกลอน'
    };

    saveDb(db);
    res.json(db.items[index]);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไข' });
  }
});


// Delete item
app.delete('/api/items/:id', (req, res) => {
  const db = readDb();
  const itemId = req.params.id;
  const index = db.items.findIndex(i => i.id.toLowerCase() === itemId.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบรายการที่ต้องการลบ' });
  }

  const removed = db.items.splice(index, 1)[0];
  saveDb(db);
  res.json({ message: 'ลบรายการเรียบร้อยแล้ว', item: removed });
});

// Stock Audit / Check-in via QR Scan
app.post('/api/items/:id/audit', (req, res) => {
  try {
    const db = readDb();
    const itemId = req.params.id;
    const item = db.items.find(i => i.id.toLowerCase() === itemId.toLowerCase());

    if (!item) {
      return res.status(404).json({ error: 'ไม่พบสินค้าในระบบ' });
    }

    const { actualQuantity, location, user, note, gps } = req.body;
    if (actualQuantity === undefined || actualQuantity === null) {
      return res.status(400).json({ error: 'กรุณาระบุจำนวนที่นับได้จริง' });
    }

    let parsedGps = null;
    if (gps) {
      try {
        parsedGps = typeof gps === 'string' ? JSON.parse(gps) : gps;
      } catch (e) {
        parsedGps = null;
      }
    }

    const count = Number(actualQuantity);
    const oldQty = item.quantity;
    const oldLocation = item.location;
    const newLocation = (location && location.trim()) || oldLocation;
    if (newLocation && !db.locations.includes(newLocation)) {
      db.locations.push(newLocation);
    }
    const diff = count - oldQty;

    item.quantity = count;
    item.location = newLocation;
    if (parsedGps) {
      item.gps = parsedGps;
    }
    item.updatedAt = getThaiTimestamp();
    item.updatedBy = user || 'ยุทธการ คำกลอน';

    const logId = `LOG-${Date.now().toString().slice(-6)}`;
    db.inventory_logs.unshift({
      id: logId,
      itemId: item.id,
      itemName: item.name,
      type: 'audit',
      changeQty: diff,
      balanceQty: count,
      location: newLocation,
      gps: parsedGps || item.gps,
      previousLocation: oldLocation,
      referenceType: 'qr_audit',
      referenceId: item.id,
      user: user || 'ยุทธการ คำกลอน',
      note: note || `สแกนตรวจนับสต็อกหน้างาน (เดิม ${oldQty} -> เป็น ${count} ${item.unit})`,
      timestamp: getThaiTimestamp()
    });

    saveDb(db);
    res.json({ message: 'บันทึกการตรวจนับสต็อกสำเร็จ', item });
  } catch (err) {
    console.error('Error in /api/items/:id/audit:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกผลตรวจนับสต็อก' });
  }
});

// Stock Transaction: In / Out / Move
app.post('/api/items/:id/transaction', (req, res) => {
  try {
    const db = readDb();
    const itemId = req.params.id;
    const item = db.items.find(i => i.id.toLowerCase() === itemId.toLowerCase());

    if (!item) {
      return res.status(404).json({ error: 'ไม่พบสินค้าในระบบ' });
    }

    const { type, amount, targetLocation, user, note, gps } = req.body;
    // type: 'in' (รับเข้า), 'out' (เบิกออก), 'move' (ย้ายสถานที่)
    const qty = Number(amount) || 0;
    const oldQty = item.quantity;
    const oldLocation = item.location;

    let parsedGps = null;
    if (gps) {
      try {
        parsedGps = typeof gps === 'string' ? JSON.parse(gps) : gps;
      } catch (e) {
        parsedGps = null;
      }
    }

    if (type === 'in') {
      item.quantity += qty;
    } else if (type === 'out') {
      if (item.quantity < qty) {
        return res.status(400).json({ error: `ยอดคงเหลือไม่พอ (มีอยู่ ${item.quantity} ${item.unit})` });
      }
      item.quantity -= qty;
    } else if (type === 'move') {
      if (!targetLocation || !targetLocation.trim()) {
        return res.status(400).json({ error: 'กรุณาระบุสถานที่ปลายทาง' });
      }
      const moveLoc = targetLocation.trim();
      item.location = moveLoc;
      if (parsedGps) {
        item.gps = parsedGps;
      }
      if (moveLoc && !db.locations.includes(moveLoc)) {
        db.locations.push(moveLoc);
      }
    }

    item.updatedAt = getThaiTimestamp();
    item.updatedBy = user || 'ยุทธการ คำกลอน';

    const logId = `LOG-${Date.now().toString().slice(-6)}`;
    db.inventory_logs.unshift({
      id: logId,
      itemId: item.id,
      itemName: item.name,
      type: type,
      changeQty: type === 'in' ? qty : (type === 'out' ? -qty : 0),
      balanceQty: item.quantity,
      location: item.location,
      gps: parsedGps || item.gps,
      previousLocation: oldLocation,
      referenceType: 'transaction',
      referenceId: item.id,
      user: user || 'ยุทธการ คำกลอน',
      note: note || (type === 'in' ? 'รับของเข้าสต็อก' : type === 'out' ? 'เบิกของออก' : `ย้ายจาก ${oldLocation} ไป ${item.location}`),
      timestamp: getThaiTimestamp()
    });

    saveDb(db);
    res.json({ message: 'ทำรายการสำเร็จ', item });
  } catch (err) {
    console.error('Error in /api/items/:id/transaction:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการทำรายการสต็อก' });
  }
});

// Get all logs
app.get('/api/logs', (req, res) => {
  const db = readDb();
  res.json(db.inventory_logs || []);
});

// Delete a single log entry (admin only)
app.delete('/api/logs/:id', (req, res) => {
  const requester = req.headers['x-user-name'] ? decodeURIComponent(req.headers['x-user-name']) : '';
  if (requester !== 'ยุทธการ คำกลอน') {
    return res.status(403).json({ error: 'เฉพาะผู้ควบคุมระบบเท่านั้นที่ลบรายการได้' });
  }
  const db = readDb();
  const logId = req.params.id;
  const index = db.inventory_logs.findIndex(l => l.id === logId);
  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบรายการที่ต้องการลบ' });
  }
  db.inventory_logs.splice(index, 1);
  saveDb(db);
  res.json({ message: 'ลบรายการประวัติเรียบร้อย' });
});

// ----------------------------------------------------
// TASKS API (งานทีม Todo / Kanban & ผูกการเบิก-คืน)
// ----------------------------------------------------


// Get all tasks
app.get('/api/tasks', (req, res) => {
  const db = readDb();
  res.json(db.tasks || []);
});

// Create new task
app.post('/api/tasks', (req, res) => {
  const db = readDb();
  const { title, description, priority, assignee, dueDate, materials, attachments, user } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'กรุณาระบุชื่องาน' });
  }

  // Validate assignee is in organization (whitespace and case-insensitive)
  let matchedAssignee = null;
  if (assignee) {
    matchedAssignee = (db.team_members || []).find(m => normalizeName(m.name) === normalizeName(assignee));
    if (!matchedAssignee) {
      return res.status(400).json({ error: `ผู้รับผิดชอบ "${assignee}" ไม่มีอยู่ในรายชื่อขององค์กร` });
    }
  }

  const nextNum = (db.tasks.length + 1).toString().padStart(3, '0');
  const id = `TSK-${nextNum}`;

  const formattedMaterials = (materials || []).map(m => ({
    itemId: m.itemId,
    itemName: m.itemName,
    quantity: Number(m.quantity) || 1,
    unit: m.unit || 'ชิ้น',
    status: 'pending', // pending, issued, returned
    issuedAt: null,
    issuedBy: null,
    returnedQuantity: 0,
    returnedAt: null
  }));

  const newTask = {
    id,
    title,
    description: description || '',
    status: 'todo',
    priority: priority || 'normal',
    assignee: matchedAssignee ? matchedAssignee.name : (assignee || (db.team_members[0] ? db.team_members[0].name : 'ยุทธการ คำกลอน')),
    dueDate: dueDate || '',
    createdAt: getThaiTimestamp(),
    createdBy: user || 'ยุทธการ คำกลอน',
    materials: formattedMaterials,
    attachments: Array.isArray(attachments) ? attachments : []
  };

  db.tasks.unshift(newTask);
  saveDb(db);
  res.status(201).json(newTask);
});

// Update task details or move status
app.put('/api/tasks/:id', (req, res) => {
  const db = readDb();
  const taskId = req.params.id;
  const index = db.tasks.findIndex(t => t.id.toLowerCase() === taskId.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบงานที่ต้องการแก้ไข' });
  }

  const { title, description, status, priority, assignee, dueDate, materials, attachments } = req.body;

  // Validate assignee if provided
  let matchedAssignee = null;
  if (assignee !== undefined && assignee) {
    matchedAssignee = (db.team_members || []).find(m => normalizeName(m.name) === normalizeName(assignee));
    if (!matchedAssignee) {
      return res.status(400).json({ error: `ผู้รับผิดชอบ "${assignee}" ไม่มีอยู่ในรายชื่อขององค์กร` });
    }
  }

  const current = db.tasks[index];
  db.tasks[index] = {
    ...current,
    title: title !== undefined ? title : current.title,
    description: description !== undefined ? description : current.description,
    status: status !== undefined ? status : current.status,
    priority: priority !== undefined ? priority : current.priority,
    assignee: matchedAssignee ? matchedAssignee.name : (assignee !== undefined ? assignee : current.assignee),
    dueDate: dueDate !== undefined ? dueDate : current.dueDate,
    materials: materials !== undefined ? materials : current.materials,
    attachments: attachments !== undefined ? (Array.isArray(attachments) ? attachments : []) : (current.attachments || [])
  };

  saveDb(db);
  res.json(db.tasks[index]);
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const db = readDb();
  const taskId = req.params.id;
  const index = db.tasks.findIndex(t => t.id.toLowerCase() === taskId.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบงานที่ต้องการลบ' });
  }

  const removed = db.tasks.splice(index, 1)[0];
  saveDb(db);
  res.json({ message: 'ลบงานเรียบร้อยแล้ว', task: removed });
});

// Issue Material (เบิกของตัดสต็อกสำหรับ Task)
app.post('/api/tasks/:id/issue-materials', (req, res) => {
  const db = readDb();
  const taskId = req.params.id;
  const { materialIndex, user } = req.body;

  const task = db.tasks.find(t => t.id.toLowerCase() === taskId.toLowerCase());
  if (!task) {
    return res.status(404).json({ error: 'ไม่พบงาน' });
  }

  if (materialIndex === undefined || !task.materials[materialIndex]) {
    return res.status(400).json({ error: 'ไม่พบรายการวัสดุที่ระบุ' });
  }

  const mat = task.materials[materialIndex];
  if (mat.status === 'issued') {
    return res.status(400).json({ error: 'รายการนี้ได้รับการเบิกตัดสต็อกไปแล้ว' });
  }

  const item = db.items.find(i => i.id.toLowerCase() === mat.itemId.toLowerCase());
  if (!item) {
    return res.status(404).json({ error: `ไม่พบสินค้า "${mat.itemName}" ในสต็อก` });
  }

  if (item.quantity < mat.quantity) {
    return res.status(400).json({
      error: `สต็อกคงเหลือไม่พอตัดเบิก! (ต้องการ ${mat.quantity} แต่ในคลังมีเพียง ${item.quantity} ${item.unit})`
    });
  }

  // Deduct stock
  item.quantity -= mat.quantity;
  item.updatedAt = getThaiTimestamp();
  item.updatedBy = user || 'ยุทธการ คำกลอน';

  // Update material status in task
  mat.status = 'issued';
  mat.issuedAt = getThaiTimestamp();
  mat.issuedBy = user || 'ยุทธการ คำกลอน';

  // Log inventory deduction
  const logId = `LOG-${Date.now().toString().slice(-6)}`;
  db.inventory_logs.unshift({
    id: logId,
    itemId: item.id,
    itemName: item.name,
    type: 'issue',
    changeQty: -mat.quantity,
    balanceQty: item.quantity,
    location: item.location,
    previousLocation: item.location,
    referenceType: 'task',
    referenceId: task.id,
    user: user || 'ยุทธการ คำกลอน',
    note: `เบิกตัดสต็อกสำหรับงาน [${task.id}] ${task.title} (ผู้รับผิดชอบ: ${task.assignee})`,
    timestamp: getThaiTimestamp()
  });

  saveDb(db);
  res.json({ message: 'เบิกของและตัดสต็อกสำเร็จ', task, item });
});

// Return Material (ส่งคืนของเข้าสต็อก)
app.post('/api/tasks/:id/return-materials', (req, res) => {
  const db = readDb();
  const taskId = req.params.id;
  const { materialIndex, returnQty, user, note } = req.body;

  const task = db.tasks.find(t => t.id.toLowerCase() === taskId.toLowerCase());
  if (!task) {
    return res.status(404).json({ error: 'ไม่พบงาน' });
  }

  if (materialIndex === undefined || !task.materials[materialIndex]) {
    return res.status(400).json({ error: 'ไม่พบรายการวัสดุที่ระบุ' });
  }

  const mat = task.materials[materialIndex];
  if (mat.status !== 'issued') {
    return res.status(400).json({ error: 'รายการนี้ยังไม่ได้เบิกออกไป จึงไม่สามารถส่งคืนได้' });
  }

  const item = db.items.find(i => i.id.toLowerCase() === mat.itemId.toLowerCase());
  if (!item) {
    return res.status(404).json({ error: `ไม่พบสินค้า "${mat.itemName}" ในสต็อก` });
  }

  const qtyToReturn = Number(returnQty) || mat.quantity;
  if (qtyToReturn <= 0 || qtyToReturn > mat.quantity) {
    return res.status(400).json({ error: `จำนวนที่ส่งคืนต้องอยู่ระหว่าง 1 ถึง ${mat.quantity}` });
  }

  // Restore stock
  item.quantity += qtyToReturn;
  item.updatedAt = getThaiTimestamp();
  item.updatedBy = user || 'ยุทธการ คำกลอน';

  mat.returnedQuantity = (mat.returnedQuantity || 0) + qtyToReturn;
  mat.returnedAt = getThaiTimestamp();
  if (mat.returnedQuantity >= mat.quantity) {
    mat.status = 'returned';
  }

  // Log inventory return
  const logId = `LOG-${Date.now().toString().slice(-6)}`;
  db.inventory_logs.unshift({
    id: logId,
    itemId: item.id,
    itemName: item.name,
    type: 'return',
    changeQty: qtyToReturn,
    balanceQty: item.quantity,
    location: item.location,
    previousLocation: item.location,
    referenceType: 'task_return',
    referenceId: task.id,
    user: user || 'ยุทธการ คำกลอน',
    note: note || `ส่งคืนของจากงาน [${task.id}] ${task.title} คืนจำนวน ${qtyToReturn} ${item.unit}`,
    timestamp: getThaiTimestamp()
  });

  saveDb(db);
  res.json({ message: 'ส่งคืนของและรวมเข้าสต็อกเรียบร้อยแล้ว', task, item });
});

// ----------------------------------------------------
// AUTHENTICATION API (ระบบล็อคอินเข้าสู่ระบบ ItemBase)
// ----------------------------------------------------
// ANTI-HACK & SECURITY RATE LIMITER
// ----------------------------------------------------
// In-memory security tracker for failed logins
// Key: normalized name -> { count: number, lockedUntil: timestamp | null, lastAttempt: timestamp }
const loginSecurityTracker = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

function getSecurityStatus(name) {
  const norm = normalizeName(name);
  const info = loginSecurityTracker.get(norm);
  if (!info) return { isLocked: false, attempts: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };

  const now = Date.now();
  if (info.lockedUntil && now < info.lockedUntil) {
    const remainingMs = info.lockedUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return { isLocked: true, remainingMinutes, attempts: info.count, attemptsLeft: 0 };
  }

  // Lockout expired, auto reset
  if (info.lockedUntil && now >= info.lockedUntil) {
    loginSecurityTracker.delete(norm);
    return { isLocked: false, attempts: 0, attemptsLeft: MAX_FAILED_ATTEMPTS };
  }

  return {
    isLocked: false,
    attempts: info.count,
    attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - info.count)
  };
}

function recordFailedLogin(name) {
  const norm = normalizeName(name);
  const now = Date.now();
  const info = loginSecurityTracker.get(norm) || { count: 0, lockedUntil: null, lastAttempt: now };

  info.count += 1;
  info.lastAttempt = now;

  if (info.count >= MAX_FAILED_ATTEMPTS) {
    info.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  loginSecurityTracker.set(norm, info);
  return getSecurityStatus(name);
}

function recordSuccessfulLogin(name) {
  loginSecurityTracker.delete(normalizeName(name));
}

function unlockAccount(name) {
  loginSecurityTracker.delete(normalizeName(name));
}

// Masking helpers for security display (e.g. 064-***-2859, m***0@gmail.com)
function maskPhone(phone) {
  if (!phone || phone === '-') return 'ยังไม่ได้ระบุ';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 8) return phone;
  const start = clean.slice(0, 3);
  const end = clean.slice(-4);
  return `${start}-***-${end}`;
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return 'ยังไม่ได้ระบุ';
  const parts = email.split('@');
  const user = parts[0];
  const domain = parts[1];
  const maskedUser = user.length > 2 ? `${user[0]}***${user.slice(-1)}` : `${user[0]}***`;
  return `${maskedUser}@${domain}`;
}

// ----------------------------------------------------
// AUTH & LOGIN API
// ----------------------------------------------------

// Safe member list for login screen (names and roles only, no passwords)
app.get('/api/auth/members', (req, res) => {
  const db = readDb();
  const safeList = (db.team_members || [])
    .filter(m => m.status !== 'inactive')
    .map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      isAdmin: m.id === 'TM-01' || normalizeName(m.name) === normalizeName('ยุทธการ คำกลอน')
    }));
  res.json(safeList);
});

// Login endpoint with Anti-Hack protection
app.post('/api/auth/login', (req, res) => {
  const db = readDb();
  const { name, password } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อผู้ใช้งาน' });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านเข้าสู่ระบบ' });
  }

  const cleanName = name.trim();
  const cleanPassword = password.trim();

  // Check Anti-Hack lockout status first
  const secStatus = getSecurityStatus(cleanName);
  if (secStatus.isLocked) {
    return res.status(423).json({
      error: `⚠️ ตรวจพบการพยายามสุ่มรหัสผ่านผิดเกิน 5 ครั้ง บัญชีนี้ถูกล็อกชั่วคราว ${secStatus.remainingMinutes} นาที เพื่อป้องกันการแฮกข้อมูล หากลืมรหัสผ่าน กรุณากด "ลืมรหัสผ่าน / กู้คืนบัญชี" ด้านล่าง เพื่อยืนยันตัวตนด้วยเบอร์หรืออีเมลที่ผูกไว้`,
      isLocked: true,
      remainingMinutes: secStatus.remainingMinutes
    });
  }

  // Find member in database with forgiving whitespace & case normalization
  const member = (db.team_members || []).find(
    m => m.name && normalizeName(m.name) === normalizeName(cleanName)
  );

  if (!member) {
    return res.status(404).json({ 
      error: `ไม่พบรายชื่อ "${cleanName}" ในระบบ ItemBase กรุณาตรวจสอบชื่อ หรือติดต่อผู้ควบคุมระบบ (ยุทธการ คำกลอน)` 
    });
  }

  if (member.status === 'inactive') {
    return res.status(403).json({ error: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ควบคุมระบบ' });
  }

  const isSuperAdmin = member.id === 'TM-01' || normalizeName(member.name) === normalizeName('ยุทธการ คำกลอน');

  let isValidPassword = false;
  if (isSuperAdmin) {
    // Check against configured Super Admin password, with fallback to initial master password
    const adminPass = (member.password || '0962033005Maiiam2000').trim();
    isValidPassword = (cleanPassword === adminPass || cleanPassword === '0962033005Maiiam2000');
  } else {
    const memberPass = (member.password || '1234').trim();
    isValidPassword = (cleanPassword === memberPass);
  }

  if (!isValidPassword) {
    const newSec = recordFailedLogin(cleanName);
    if (newSec.isLocked) {
      return res.status(423).json({
        error: `⚠️ ป้อนรหัสผ่านผิดครบ 5 ครั้งแล้ว! ระบบได้ทำการระงับการเข้าสู่ระบบชั่วคราว 15 นาที เพื่อป้องกันการแฮกข้อมูล หากคุณเป็นเจ้าของบัญชีจริง กรุณากด "ลืมรหัสผ่าน / กู้คืนบัญชี" เพื่อยืนยันตัวตนด้วยเบอร์โทรศัพท์หรืออีเมลที่ผูกไว้`,
        isLocked: true,
        remainingMinutes: 15
      });
    }

    return res.status(401).json({ 
      error: isSuperAdmin 
        ? `รหัสผ่านไม่ถูกต้องสำหรับผู้ควบคุมระบบ (ผิดครั้งที่ ${newSec.attempts}/${MAX_FAILED_ATTEMPTS}) หากผิดครบ 5 ครั้งระบบจะล็อกบัญชีเพื่อความปลอดภัย` 
        : `รหัสผ่านไม่ถูกต้อง (ผิดครั้งที่ ${newSec.attempts}/${MAX_FAILED_ATTEMPTS}) กรุณาตรวจสอบหรือติดต่อผู้ควบคุมระบบ`,
      attemptsLeft: newSec.attemptsLeft
    });
  }

  // Password correct: clear security lockout
  recordSuccessfulLogin(cleanName);

  const userSession = {
    id: member.id,
    name: member.name,
    role: member.role,
    phone: member.phone || '-',
    recoveryPhone: member.recoveryPhone || member.phone || '0962033005',
    email: member.email || 'admin@itembase.local',
    isAdmin: isSuperAdmin,
    loginAt: new Date().toISOString()
  };

  res.json({
    message: isSuperAdmin ? '👑 ยินดีต้อนรับผู้ควบคุมระบบสูงสุด ยุทธการ คำกลอน' : 'เข้าสู่ระบบสำเร็จ',
    user: userSession
  });
});

// ----------------------------------------------------
// FORGOT PASSWORD & ACCOUNT RECOVERY API (OTP & Security)
// ----------------------------------------------------

// In-memory OTP storage for password recovery
// Key: normalized name -> { otp: string, target: string, channel: 'phone'|'email', expiresAt: number }
const recoveryOtpStore = new Map();

// Send OTP code to bound phone or email
app.post('/api/auth/recovery/send-otp', (req, res) => {
  const db = readDb();
  const { name, channel, target } = req.body;

  if (!name || normalizeName(name) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'ระบบกู้คืนรหัสผ่านด้วย OTP สงวนสิทธิ์เฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  const admin = (db.team_members || []).find(
    m => m.id === 'TM-01' || normalizeName(m.name) === normalizeName('ยุทธการ คำกลอน')
  );
  if (!admin) {
    return res.status(404).json({ error: 'ไม่พบบัญชีผู้ควบคุมระบบในระบบ ItemBase' });
  }

  const boundPhone1 = String(admin.phone || '0643032859').replace(/\D/g, '');
  const boundPhone2 = String(admin.recoveryPhone || '0962033005').replace(/\D/g, '');
  const boundEmail = String(admin.email || 'mai2000@gmail.com').trim().toLowerCase();

  const inputTarget = String(target || '').trim();
  let isValidTarget = false;
  let targetDisplay = '';

  if (channel === 'phone') {
    const inputDigits = inputTarget.replace(/\D/g, '');
    if (inputDigits === boundPhone1 || inputDigits === boundPhone2 || inputDigits === '0643032859' || inputDigits === '0962033005') {
      isValidTarget = true;
      targetDisplay = maskPhone(inputTarget);
    }
  } else if (channel === 'email') {
    const cleanEmail = inputTarget.toLowerCase();
    if (cleanEmail === boundEmail || cleanEmail === 'mai2000@gmail.com' || cleanEmail === 'admin@itembase.local') {
      isValidTarget = true;
      targetDisplay = maskEmail(inputTarget);
    }
  }

  if (!isValidTarget) {
    return res.status(400).json({ 
      error: `${channel === 'phone' ? 'เบอร์โทรศัพท์' : 'อีเมล'} ที่กรอกไม่ตรงกับที่ตั้งค่าไว้ในระบบ กรุณาตรวจสอบ` 
    });
  }

  // Generate 6-digit OTP code (e.g. 583920)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  recoveryOtpStore.set(normalizeName(name), {
    otp,
    target: inputTarget,
    channel,
    expiresAt
  });

  console.log(`[OTP] ส่งรหัส OTP ${otp} ไปยัง ${channel} (${targetDisplay}) สำหรับผู้ควบคุมระบบ`);

  res.json({
    success: true,
    message: `ส่งรหัส OTP เรียบร้อยแล้ว`,
    channel,
    targetDisplay,
    otpCode: otp, // Displayed in alert/toast for smooth verification without third-party SMS fees
    expiresInMinutes: 10
  });
});

// Verify OTP and reset password
app.post('/api/auth/recovery/verify-otp-and-reset', (req, res) => {
  const db = readDb();
  const { name, otp, newPassword } = req.body;

  if (!name || normalizeName(name) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'สงวนสิทธิ์เฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }
  if (!otp || !String(otp).trim()) {
    return res.status(400).json({ error: 'กรุณากรอกรหัส OTP 6 หลัก' });
  }
  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
  }

  const normName = normalizeName(name);
  const stored = recoveryOtpStore.get(normName);

  if (!stored || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'รหัส OTP หมดอายุหรือไม่ถูกต้อง กรุณากดขอรหัสใหม่' });
  }

  if (String(stored.otp).trim() !== String(otp).trim()) {
    return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบและกรอกใหม่อีกครั้ง' });
  }

  // Update password in database
  const adminIndex = (db.team_members || []).findIndex(
    m => m.id === 'TM-01' || normalizeName(m.name) === normalizeName('ยุทธการ คำกลอน')
  );

  if (adminIndex !== -1) {
    db.team_members[adminIndex].password = newPassword.trim();
    db.team_members[adminIndex].updatedAt = new Date().toISOString();
    saveDb(db);
  }

  // Clear OTP and unlock account
  recoveryOtpStore.delete(normName);
  unlockAccount(name);

  res.json({
    success: true,
    message: '✅ ยืนยันรหัส OTP และตั้งรหัสผ่านใหม่สำเร็จแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'
  });
});

// Get masked recovery info for an account
app.post('/api/auth/recovery/info', (req, res) => {
  const db = readDb();
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อผู้ใช้งาน' });
  }

  const cleanName = name.trim();
  const member = (db.team_members || []).find(
    m => m.name && normalizeName(m.name) === normalizeName(cleanName)
  );

  if (!member) {
    return res.status(404).json({ error: `ไม่พบรายชื่อ "${cleanName}" ในระบบ ItemBase` });
  }

  const isSuperAdmin = member.id === 'TM-01' || normalizeName(member.name) === normalizeName('ยุทธการ คำกลอน');
  const secStatus = getSecurityStatus(cleanName);

  // Defaults & live values for Super Admin
  const primaryPhone = (member.phone && member.phone !== '-') ? member.phone.trim() : '0643032859';
  const backupPhone = (member.recoveryPhone && member.recoveryPhone !== '-') ? member.recoveryPhone.trim() : '0962033005';
  const recoveryEmail = (member.email && member.email !== '-') ? member.email.trim() : 'mai2000@gmail.com';

  res.json({
    name: member.name,
    role: member.role,
    isSuperAdmin,
    isLocked: secStatus.isLocked,
    remainingMinutes: secStatus.remainingMinutes || 0,
    phone: primaryPhone,
    recoveryPhone: backupPhone,
    email: recoveryEmail,
    maskedPhone: maskPhone(primaryPhone),
    maskedBackupPhone: maskPhone(backupPhone),
    maskedEmail: maskEmail(recoveryEmail),
    hasSecurityPin: !!(member.securityPin || '2000'),
    methods: isSuperAdmin 
      ? ['phone', 'email', 'pin'] 
      : (member.phone && member.phone !== '-' ? ['phone'] : ['admin_contact'])
  });
});

// Verify phone/email/PIN and reset password
app.post('/api/auth/recovery/verify-and-reset', (req, res) => {
  const db = readDb();
  const { name, verifyType, verifyValue, newPassword } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อผู้ใช้งาน' });
  }
  if (!verifyType || !verifyValue) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลสำหรับยืนยันตัวตน' });
  }
  if (!newPassword || newPassword.trim().length < 6) {
    return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
  }

  const cleanName = name.trim();
  const index = (db.team_members || []).findIndex(
    m => m.name && normalizeName(m.name) === normalizeName(cleanName)
  );

  if (index === -1) {
    return res.status(404).json({ error: `ไม่พบรายชื่อ "${cleanName}" ในระบบ` });
  }

  const member = db.team_members[index];
  const isSuperAdmin = member.id === 'TM-01' || normalizeName(member.name) === normalizeName('ยุทธการ คำกลอน');

  if (!isSuperAdmin) {
    // For regular members, only verify by exact phone
    const cleanInputPhone = String(verifyValue).replace(/\D/g, '');
    const registeredPhone = String(member.phone || '').replace(/\D/g, '');
    if (!registeredPhone || cleanInputPhone !== registeredPhone) {
      return res.status(400).json({ error: 'เบอร์โทรศัพท์ไม่ตรงกับที่ลงทะเบียนไว้ในระบบ กรุณาติดต่อผู้ควบคุมระบบ' });
    }
  } else {
    // Super Admin verification
    const boundPrimaryPhone = String(member.phone || '0643032859').replace(/\D/g, '');
    const boundBackupPhone = String(member.recoveryPhone || '0962033005').replace(/\D/g, '');
    const boundEmail = String(member.email || 'mai2000@gmail.com').trim().toLowerCase();
    const boundPin = String(member.securityPin || '2000').trim();

    let verified = false;

    if (verifyType === 'phone') {
      const cleanDigits = String(verifyValue).replace(/\D/g, '');
      if (cleanDigits === boundPrimaryPhone || cleanDigits === boundBackupPhone || cleanDigits === '0643032859' || cleanDigits === '0962033005') {
        verified = true;
      }
    } else if (verifyType === 'email') {
      const cleanInputEmail = String(verifyValue).trim().toLowerCase();
      if (cleanInputEmail === boundEmail || cleanInputEmail === 'mai2000@gmail.com' || cleanInputEmail === 'admin@itembase.local') {
        verified = true;
      }
    } else if (verifyType === 'pin') {
      const cleanInputPin = String(verifyValue).trim();
      if (cleanInputPin === boundPin || cleanInputPin === '2000') {
        verified = true;
      }
    }

    if (!verified) {
      return res.status(400).json({ 
        error: `ข้อมูลยืนยันตัวตน (${verifyType === 'phone' ? 'เบอร์โทรศัพท์' : verifyType === 'email' ? 'อีเมล' : 'รหัส PIN'}) ไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง` 
      });
    }
  }

  // Update password & unlock account
  const cleanNewPass = newPassword.trim();
  member.password = cleanNewPass;
  member.updatedAt = new Date().toISOString();
  db.team_members[index] = member;

  saveDb(db);
  unlockAccount(cleanName);

  res.json({
    success: true,
    message: `✅ ยืนยันตัวตนสำเร็จ! รีเซ็ตรหัสผ่านของ "${member.name}" เรียบร้อยแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที`,
    name: member.name
  });
});

// ----------------------------------------------------
// SUPER ADMIN SECURITY & PROFILE API
// ----------------------------------------------------

// Get Super Admin security profile
app.get('/api/auth/security-profile', (req, res) => {
  const db = readDb();
  const requester = getRequesterName(req);
  if (normalizeName(requester) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'สงวนสิทธิ์เฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  const admin = (db.team_members || []).find(
    m => m.id === 'TM-01' || normalizeName(m.name) === normalizeName('ยุทธการ คำกลอน')
  ) || {};

  const secStatus = getSecurityStatus('ยุทธการ คำกลอน');

  res.json({
    name: admin.name || 'ยุทธการ คำกลอน',
    phone: admin.phone || '0643032859',
    recoveryPhone: admin.recoveryPhone || '0962033005',
    email: admin.email || 'mai2000@gmail.com',
    securityPin: admin.securityPin || '2000',
    antiHackActive: true,
    maxFailedAttempts: MAX_FAILED_ATTEMPTS,
    lockoutDurationMinutes: 15,
    currentSecurityStatus: secStatus
  });
});

// Update Super Admin security profile (Phone, Backup Phone, Email, PIN, Password)
app.put('/api/auth/security-profile', (req, res) => {
  const db = readDb();
  const requester = getRequesterName(req);
  if (normalizeName(requester) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'สงวนสิทธิ์เฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  let adminIndex = (db.team_members || []).findIndex(
    m => m.id === 'TM-01' || normalizeName(m.name) === normalizeName('ยุทธการ คำกลอน')
  );

  if (adminIndex === -1) {
    db.team_members = db.team_members || [];
    db.team_members.unshift({
      id: 'TM-01',
      name: 'ยุทธการ คำกลอน',
      role: 'ผู้ควบคุมระบบ / เขียนแบบโครงการ',
      phone: '0643032859',
      recoveryPhone: '0962033005',
      email: 'mai2000@gmail.com',
      securityPin: '2000',
      password: '0962033005Maiiam2000',
      isAdmin: true,
      status: 'active'
    });
    adminIndex = 0;
  }

  const current = db.team_members[adminIndex];
  const { phone, recoveryPhone, email, securityPin, currentPassword, newPassword } = req.body;

  // If changing password, verify current password or current PIN first
  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }
    const adminPass = (current.password || '0962033005Maiiam2000').trim();
    const adminPin = (current.securityPin || '2000').trim();
    const inputCurrent = (currentPassword || '').trim();

    if (inputCurrent !== adminPass && inputCurrent !== adminPin && inputCurrent !== '0962033005Maiiam2000') {
      return res.status(401).json({ error: 'รหัสผ่านปัจจุบันหรือรหัส PIN ไม่ถูกต้อง ไม่สามารถเปลี่ยนรหัสผ่านได้' });
    }
    current.password = newPassword.trim();
  }

  if (phone !== undefined) current.phone = phone.trim() || current.phone;
  if (recoveryPhone !== undefined) current.recoveryPhone = recoveryPhone.trim() || current.recoveryPhone;
  if (email !== undefined) current.email = email.trim() || current.email;
  if (securityPin !== undefined) current.securityPin = securityPin.trim() || current.securityPin;
  current.updatedAt = new Date().toISOString();

  db.team_members[adminIndex] = current;
  saveDb(db);

  res.json({
    message: '✅ บันทึกข้อมูลความปลอดภัยและการผูกบัญชีเรียบร้อยแล้ว',
    securityProfile: {
      name: current.name,
      phone: current.phone,
      recoveryPhone: current.recoveryPhone,
      email: current.email,
      securityPin: current.securityPin
    }
  });
});

// Emergency unlock all or specific account
app.post('/api/auth/security-profile/unlock', (req, res) => {
  const requester = getRequesterName(req);
  if (normalizeName(requester) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'สงวนสิทธิ์เฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  const { name } = req.body;
  if (name) {
    unlockAccount(name);
  } else {
    loginSecurityTracker.clear();
  }

  res.json({ message: '✅ ปลดล็อกสถานะความปลอดภัยของบัญชีเรียบร้อยแล้ว' });
});

// ----------------------------------------------------
// SETTINGS & TEAM MEMBERS API (หน้าต่างตั้งค่าละเอียด)
// ----------------------------------------------------

// Get settings
app.get('/api/settings', (req, res) => {
  const db = readDb();
  const requester = getRequesterName(req);
  const isSuperAdmin = normalizeName(requester) === normalizeName('ยุทธการ คำกลอน');

  const sanitizedMembers = (db.team_members || []).map(m => {
    if (isSuperAdmin) {
      return m; // Super admin can see/manage passwords
    }
    const { password, ...rest } = m;
    return rest;
  });

  res.json({
    team_members: sanitizedMembers,
    locations: db.locations || [],
    categories: db.categories || []
  });
});

// Add new team member
app.post('/api/settings/members', (req, res) => {
  const db = readDb();
  const requester = getRequesterName(req);
  if (normalizeName(requester) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'สงวนสิทธิ์การตั้งค่าและเพิ่มสมาชิกเฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  const { name, role, phone, password } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อ-นามสกุลพนักงาน' });
  }

  const cleanName = name.replace(/\s+/g, ' ').trim();
  const existing = (db.team_members || []).find(m => normalizeName(m.name) === normalizeName(cleanName));
  if (existing) {
    return res.status(400).json({ error: `มีรายชื่อ "${cleanName}" อยู่ในระบบแล้ว (${existing.id})` });
  }

  // Calculate guaranteed unique next ID by finding maximum numeric ID in DB
  const maxIdNum = (db.team_members || []).reduce((max, m) => {
    const num = parseInt((m.id || '').replace(/\D/g, ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const newId = `TM-${(maxIdNum + 1).toString().padStart(2, '0')}`;

  const isSuper = newId === 'TM-01' || normalizeName(cleanName) === normalizeName('ยุทธการ คำกลอน');
  const newMember = {
    id: newId,
    name: cleanName,
    role: (role || '').replace(/\s+/g, ' ').trim() || 'ช่างหน้างาน',
    phone: (phone || '-').trim(),
    password: isSuper ? '0962033005Maiiam2000' : ((password || '').trim() || '1234'),
    isAdmin: isSuper,
    status: 'active'
  };

  if (!Array.isArray(db.team_members)) {
    db.team_members = [];
  }
  db.team_members.push(newMember);
  saveDb(db);

  res.status(201).json({
    message: `เพิ่มสมาชิก "${cleanName}" (${newId}) เรียบร้อยแล้ว`,
    member: newMember,
    team_members: db.team_members
  });
});

// Update single team member
app.put('/api/settings/members/:id', (req, res) => {
  const db = readDb();
  const requester = getRequesterName(req);
  if (normalizeName(requester) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'สงวนสิทธิ์การแก้ไขสมาชิกเฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  const targetId = req.params.id;
  const index = (db.team_members || []).findIndex(m => m.id.toLowerCase() === targetId.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลพนักงานที่ต้องการแก้ไข' });
  }

  const current = db.team_members[index];
  const { name, role, phone, password, status } = req.body;

  const isSuper = current.id === 'TM-01' || normalizeName(current.name) === normalizeName('ยุทธการ คำกลอน');
  const newCleanName = isSuper ? 'ยุทธการ คำกลอน' : ((name || current.name).replace(/\s+/g, ' ').trim());

  if (!newCleanName) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อพนักงาน' });
  }

  // Check if renaming to someone else's name
  if (normalizeName(newCleanName) !== normalizeName(current.name)) {
    const duplicate = db.team_members.find((m, i) => i !== index && normalizeName(m.name) === normalizeName(newCleanName));
    if (duplicate) {
      return res.status(400).json({ error: `มีรายชื่อ "${newCleanName}" ซ้ำกับสมาชิกอื่นในระบบแล้ว (${duplicate.id})` });
    }
  }

  const oldName = current.name;
  let newPass = current.password || '1234';
  if (password !== undefined && password.trim()) {
    newPass = password.trim();
  } else if (isSuper && !current.password) {
    newPass = '0962033005Maiiam2000';
  }

  const updatedMember = {
    ...current,
    name: newCleanName,
    role: role !== undefined ? role.replace(/\s+/g, ' ').trim() : current.role,
    phone: phone !== undefined ? phone.trim() : current.phone,
    recoveryPhone: req.body.recoveryPhone !== undefined ? req.body.recoveryPhone.trim() : (current.recoveryPhone || current.phone || '0962033005'),
    email: req.body.email !== undefined ? req.body.email.trim() : (current.email || 'mai2000@gmail.com'),
    securityPin: req.body.securityPin !== undefined ? req.body.securityPin.trim() : (current.securityPin || '2000'),
    password: newPass,
    status: status !== undefined ? status : current.status,
    isAdmin: isSuper
  };

  db.team_members[index] = updatedMember;

  // Cascade rename tasks
  if (normalizeName(oldName) !== normalizeName(newCleanName) && Array.isArray(db.tasks)) {
    for (const task of db.tasks) {
      if (task.assignee && normalizeName(task.assignee) === normalizeName(oldName)) {
        task.assignee = newCleanName;
      }
      if (task.createdBy && normalizeName(task.createdBy) === normalizeName(oldName)) {
        task.createdBy = newCleanName;
      }
    }
  }

  saveDb(db);
  res.json({
    message: 'บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว',
    member: updatedMember,
    team_members: db.team_members
  });
});

// Delete single team member
app.delete('/api/settings/members/:id', (req, res) => {
  const db = readDb();
  const requester = getRequesterName(req);
  if (normalizeName(requester) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'สงวนสิทธิ์การลบสมาชิกเฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  const targetId = req.params.id;
  const index = (db.team_members || []).findIndex(m => m.id.toLowerCase() === targetId.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: 'ไม่พบข้อมูลพนักงานที่ต้องการลบ' });
  }

  const target = db.team_members[index];
  if (target.id === 'TM-01' || normalizeName(target.name) === normalizeName('ยุทธการ คำกลอน')) {
    return res.status(400).json({ error: 'ไม่สามารถลบผู้ควบคุมระบบหลัก ยุทธการ คำกลอน ได้' });
  }

  if (db.team_members.length <= 1) {
    return res.status(400).json({ error: 'ต้องมีรายชื่อสมาชิกในองค์กรอย่างน้อย 1 คน' });
  }

  const removed = db.team_members.splice(index, 1)[0];
  saveDb(db);

  res.json({
    message: `ลบรายชื่อ "${removed.name}" เรียบร้อยแล้ว`,
    member: removed,
    team_members: db.team_members
  });
});

// Batch update team members (Sync fallback)
app.put('/api/settings/members', (req, res) => {
  const db = readDb();
  const requester = getRequesterName(req);
  if (normalizeName(requester) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'สงวนสิทธิ์การตั้งค่าและแก้ไขสมาชิกเฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  let { members } = req.body;
  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง หรือไม่มีรายการข้อมูล' });
  }

  const oldMembers = db.team_members || [];

  // Track renamed members: map oldName -> newName
  const renameMap = new Map();
  for (const newM of members) {
    if (!newM.id) continue;
    const oldM = oldMembers.find(o => o.id === newM.id);
    if (oldM && oldM.name && newM.name) {
      const oldClean = oldM.name.replace(/\s+/g, ' ').trim();
      const newClean = newM.name.replace(/\s+/g, ' ').trim();
      if (oldClean !== newClean) {
        renameMap.set(oldClean, newClean);
        renameMap.set(oldM.name.trim(), newClean);
      }
    }
  }

  // Ensure 'ยุทธการ คำกลอน' always exists
  let adminIndex = members.findIndex(m => m.id === 'TM-01' || normalizeName(m.name) === normalizeName('ยุทธการ คำกลอน'));
  const existingAdmin = oldMembers.find(o => o.id === 'TM-01' || normalizeName(o.name) === normalizeName('ยุทธการ คำกลอน'));
  if (adminIndex === -1) {
    members.unshift({
      id: 'TM-01',
      name: 'ยุทธการ คำกลอน',
      role: 'ผู้ควบคุมระบบ / เขียนแบบโครงการ',
      phone: existingAdmin?.phone || '0643032859',
      recoveryPhone: existingAdmin?.recoveryPhone || '0962033005',
      email: existingAdmin?.email || 'mai2000@gmail.com',
      securityPin: existingAdmin?.securityPin || '2000',
      password: existingAdmin?.password || '0962033005Maiiam2000',
      isAdmin: true,
      status: 'active'
    });
    adminIndex = 0;
  } else {
    members[adminIndex].id = 'TM-01';
    members[adminIndex].name = 'ยุทธการ คำกลอน';
    members[adminIndex].isAdmin = true;
    if (existingAdmin) {
      members[adminIndex].password = members[adminIndex].password || existingAdmin.password || '0962033005Maiiam2000';
      members[adminIndex].recoveryPhone = members[adminIndex].recoveryPhone || existingAdmin.recoveryPhone || '0962033005';
      members[adminIndex].email = members[adminIndex].email || existingAdmin.email || 'mai2000@gmail.com';
      members[adminIndex].securityPin = members[adminIndex].securityPin || existingAdmin.securityPin || '2000';
    }
  }

  // Ensure all members have clean formatted names, guaranteed unique IDs, and preserve passwords
  const seenIds = new Set(['TM-01']);
  let maxIdNum = 10;
  members.forEach(m => {
    const num = parseInt((m.id || '').replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > maxIdNum) maxIdNum = num;
  });

  members = members.map(m => {
    const cleanName = (m.name || '').replace(/\s+/g, ' ').trim();
    const isSuper = m.id === 'TM-01' || normalizeName(cleanName) === normalizeName('ยุทธการ คำกลอน');

    let assignedId = m.id;
    if (!assignedId || seenIds.has(assignedId)) {
      if (!isSuper) {
        maxIdNum++;
        assignedId = `TM-${maxIdNum.toString().padStart(2, '0')}`;
      } else {
        assignedId = 'TM-01';
      }
    }
    seenIds.add(assignedId);

    const existingM = oldMembers.find(o => o.id === assignedId || normalizeName(o.name) === normalizeName(cleanName));
    let pwd = (m.password || '').trim();
    if (!pwd) {
      pwd = (existingM && existingM.password) ? existingM.password : (isSuper ? '0962033005Maiiam2000' : '1234');
    }

    return {
      id: assignedId,
      name: cleanName,
      role: (m.role || '').replace(/\s+/g, ' ').trim(),
      phone: (m.phone || '-').trim(),
      recoveryPhone: m.recoveryPhone || existingM?.recoveryPhone || (isSuper ? '0962033005' : undefined),
      email: m.email || existingM?.email || (isSuper ? 'mai2000@gmail.com' : undefined),
      securityPin: m.securityPin || existingM?.securityPin || (isSuper ? '2000' : undefined),
      password: pwd,
      isAdmin: isSuper,
      status: m.status || 'active'
    };
  });

  // Cascade rename to tasks (assignee, createdBy)
  if (renameMap.size > 0 && Array.isArray(db.tasks)) {
    for (const task of db.tasks) {
      if (task.assignee && renameMap.has(task.assignee.trim())) {
        task.assignee = renameMap.get(task.assignee.trim());
      }
      if (task.createdBy && renameMap.has(task.createdBy.trim())) {
        task.createdBy = renameMap.get(task.createdBy.trim());
      }
    }
  }

  db.team_members = members;
  saveDb(db);
  res.json({ message: 'บันทึกรายชื่อพนักงานเรียบร้อยแล้ว', team_members: db.team_members });
});

// Update locations
app.put('/api/settings/locations', (req, res) => {
  const db = readDb();
  const requester = getRequesterName(req);
  if (requester !== 'ยุทธการ คำกลอน') {
    return res.status(403).json({ error: 'สงวนสิทธิ์การตั้งค่าระบบเฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  const { locations } = req.body;
  if (!Array.isArray(locations)) {
    return res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' });
  }
  db.locations = locations;
  saveDb(db);
  res.json({ message: 'บันทึกสถานที่จัดเก็บเรียบร้อยแล้ว', locations: db.locations });
});

// Update categories
app.put('/api/settings/categories', (req, res) => {
  const db = readDb();
  const requester = getRequesterName(req);
  if (requester !== 'ยุทธการ คำกลอน') {
    return res.status(403).json({ error: 'สงวนสิทธิ์การตั้งค่าระบบเฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  const { categories } = req.body;
  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' });
  }
  db.categories = categories;
  saveDb(db);
  res.json({ message: 'บันทึกหมวดหมู่เรียบร้อยแล้ว', categories: db.categories });
});

// ----------------------------------------------------
// BRANDING API (ตั้งค่าหน้าตาเว็บไซต์ – Admin Only)
// ----------------------------------------------------

// Get branding
app.get('/api/settings/branding', (req, res) => {
  const db = readDb();
  res.json(db.branding || { siteTitle: 'ItemBase', profileImage: '', coverImage: '' });
});

// Update branding (admin only) – supports file upload for profileImage and coverImage
app.put('/api/settings/branding', uploadAny, (req, res) => {
  const requester = getRequesterName(req);
  if (normalizeName(requester) !== normalizeName('ยุทธการ คำกลอน')) {
    return res.status(403).json({ error: 'สงวนสิทธิ์เฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }
  const db = readDb();
  const { 
    siteTitle, 
    profileImageUrl, 
    coverImageUrl,
    bannerHeight,
    phone,
    recoveryPhone,
    email,
    securityPin,
    masterPassword,
    currentPassword
  } = req.body;

  const files = {};
  (req.files || []).forEach(f => {
    const filePath = path.join(UPLOAD_DIR, f.filename);
    if (fs.existsSync(filePath)) {
      try {
        const b64 = fs.readFileSync(filePath).toString('base64');
        const ext = path.extname(f.filename).replace('.', '').toLowerCase() || 'jpeg';
        const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        files[f.fieldname] = `data:${mime};base64,${b64}`;
      } catch (e) {
        files[f.fieldname] = `/uploads/${f.filename}`;
      }
    } else {
      files[f.fieldname] = `/uploads/${f.filename}`;
    }
  });

  db.branding = db.branding || {};
  if (siteTitle !== undefined) db.branding.siteTitle = siteTitle.trim() || 'ItemBase';
  if (bannerHeight !== undefined) db.branding.bannerHeight = bannerHeight;
  if (files.profileImage) db.branding.profileImage = files.profileImage;
  else if (profileImageUrl !== undefined) db.branding.profileImage = profileImageUrl;
  if (files.coverImage) db.branding.coverImage = files.coverImage;
  else if (coverImageUrl !== undefined) db.branding.coverImage = coverImageUrl;

  // Update Super Admin account binding (Phone, Email, PIN, Password)
  let adminIndex = (db.team_members || []).findIndex(
    m => m.id === 'TM-01' || normalizeName(m.name) === normalizeName('ยุทธการ คำกลอน')
  );
  if (adminIndex !== -1) {
    const admin = db.team_members[adminIndex];

    // If changing password, verify current password or PIN
    if (masterPassword && masterPassword.trim()) {
      if (masterPassword.trim().length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      }
      const adminPass = (admin.password || '0962033005Maiiam2000').trim();
      const adminPin = (admin.securityPin || '2000').trim();
      const inputCurrent = (currentPassword || '').trim();

      if (inputCurrent && inputCurrent !== adminPass && inputCurrent !== adminPin && inputCurrent !== '0962033005Maiiam2000') {
        return res.status(401).json({ error: 'รหัสผ่านปัจจุบันหรือรหัส PIN ไม่ถูกต้อง ไม่สามารถเปลี่ยนรหัสผ่านได้' });
      }
      admin.password = masterPassword.trim();
    }

    if (phone !== undefined) admin.phone = phone.trim() || admin.phone;
    if (recoveryPhone !== undefined) admin.recoveryPhone = recoveryPhone.trim() || admin.recoveryPhone;
    if (email !== undefined) admin.email = email.trim() || admin.email;
    if (securityPin !== undefined) admin.securityPin = securityPin.trim() || admin.securityPin;
    admin.updatedAt = new Date().toISOString();
    db.team_members[adminIndex] = admin;
  }

  saveDb(db);
  res.json({ 
    success: true,
    message: '✅ บันทึกการตั้งค่าเว็บไซต์และผูกบัญชีผู้ควบคุมระบบเรียบร้อยแล้ว', 
    branding: db.branding,
    adminProfile: adminIndex !== -1 ? {
      name: db.team_members[adminIndex].name,
      phone: db.team_members[adminIndex].phone,
      recoveryPhone: db.team_members[adminIndex].recoveryPhone,
      email: db.team_members[adminIndex].email,
      securityPin: db.team_members[adminIndex].securityPin
    } : null
  });
});

// ----------------------------------------------------
// LOGS & BACKUP API (ประวัติและการสำรองข้อมูล)
// ----------------------------------------------------


// Get all logs
app.get('/api/logs', (req, res) => {
  const db = readDb();
  res.json(db.inventory_logs || []);
});

// Export full backup JSON
app.get('/api/export', (req, res) => {
  const db = readDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=stock-backup-${Date.now()}.json`);
  res.send(JSON.stringify(db, null, 2));
});

// Import backup JSON
app.post('/api/import', (req, res) => {
  const requester = getRequesterName(req);
  if (requester !== 'ยุทธการ คำกลอน') {
    return res.status(403).json({ error: 'สงวนสิทธิ์การนำเข้าข้อมูลสำรองเฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  try {
    const data = req.body;
    if (!data.items || !data.team_members) {
      return res.status(400).json({ error: 'ไฟล์ข้อมูลสำรองไม่ถูกต้อง' });
    }
    saveDb(data);
    res.json({ message: 'นำเข้าข้อมูลสำรองสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' });
  }
});

// Reset database
app.post('/api/reset', async (req, res) => {
  const requester = getRequesterName(req);
  if (requester !== 'ยุทธการ คำกลอน') {
    return res.status(403).json({ error: 'สงวนสิทธิ์การรีเซ็ตระบบเฉพาะผู้ควบคุมระบบ ยุทธการ คำกลอน เท่านั้น' });
  }

  try {
    const fresh = await resetDatabase();
    res.json({ message: 'รีเซ็ตข้อมูลเริ่มต้นเรียบร้อยแล้ว', data: fresh });
  } catch (err) {
    res.status(500).json({ error: 'รีเซ็ตข้อมูลไม่สำเร็จ' });
  }
});

// Serve built frontend if dist directory exists
const DIST_DIR = path.join(__dirname, '..', 'dist');
// Also serve public dir (sw.js, manifest.json, icons)
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, { maxAge: 0 })); // no-cache for sw.js
}
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}



// ----------------------------------------------------
// PUBLIC TUNNEL FOR MOBILE / TABLET (Cloudflare Tunnel)
// ----------------------------------------------------
let publicTunnelUrl = null;
let tunnelQrCode = null;

function startCloudflareTunnel(port) {
  const binaryPath = path.join(__dirname, '..', 'cloudflared.exe');
  if (!fs.existsSync(binaryPath)) {
    console.log('[Tunnel] cloudflared.exe not found at:', binaryPath);
    return;
  }

  console.log('[Tunnel] กำลังเริ่มต้นสร้างลิงก์เว็บไซต์ HTTPS สำหรับเปิดบนมือถือและแท็บเล็ต...');
  const tunnelProcess = spawn(binaryPath, ['tunnel', '--url', `http://localhost:${port}`], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const handleOutput = async (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !publicTunnelUrl) {
      publicTunnelUrl = match[0];
      try {
        tunnelQrCode = await generateQRCode(publicTunnelUrl);
      } catch (e) {
        console.error('Failed to generate tunnel QR code:', e);
      }
      const urlFilePath = path.join(__dirname, '..', 'public-url.txt');
      try {
        fs.writeFileSync(urlFilePath, publicTunnelUrl, 'utf8');
      } catch (e) {}

      console.log('\n===============================================================');
      console.log('  🌟 ITEMBASE - ลิงก์เข้าใช้งานระบบพร้อมแล้ว!');
      console.log(`  💻 บนคอมพิวเตอร์: http://localhost:${port}`);
      console.log(`  📱 บนมือถือ / แท็บเล็ต (เปิดได้ทุกที่): ${publicTunnelUrl}`);
      console.log('  (เปิดผ่านลิงก์นี้จากมือถือเครื่องใดก็ได้ รองรับกล้องสแกน QR 100%)');
      console.log('===============================================================\n');
    }
  };

  tunnelProcess.stdout.on('data', handleOutput);
  tunnelProcess.stderr.on('data', handleOutput);

  tunnelProcess.on('error', (err) => {
    console.warn('[Tunnel] Error starting cloudflared:', err.message);
  });

  tunnelProcess.on('close', (code) => {
    console.log(`[Tunnel] Process exited with code ${code}`);
    publicTunnelUrl = null;
  });

  const cleanup = () => {
    try {
      tunnelProcess.kill();
    } catch (e) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
}

// Endpoint to get tunnel info for mobile access
app.get('/api/tunnel-info', async (req, res) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = forwardedProto || req.protocol || 'http';
  const host = req.get('host');
  const currentOrigin = `${proto}://${host}`;
  const isCloudHost = host && !host.includes('localhost') && !host.includes('127.0.0.1');

  const effectivePublicUrl = publicTunnelUrl || (isCloudHost ? currentOrigin : null);
  let effectiveQrCode = tunnelQrCode;

  if (effectivePublicUrl && (!effectiveQrCode || effectivePublicUrl !== publicTunnelUrl)) {
    try {
      effectiveQrCode = await generateQRCode(effectivePublicUrl);
    } catch (e) {}
  }

  res.json({
    publicUrl: effectivePublicUrl,
    qrCode: effectiveQrCode,
    localUrl: `http://localhost:${PORT}`,
    ready: !!effectivePublicUrl
  });
});


// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  await initDatabase();
  console.log(`Backend API Server running at http://0.0.0.0:${PORT}`);
  startCloudflareTunnel(PORT);
});

